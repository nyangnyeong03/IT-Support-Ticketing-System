const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { sendOtpEmail } = require("../emailService");

const router = express.Router();

const normalizeEmail = (email) =>
    String(email || "").trim().toLowerCase();

const createOtp = () =>
    String(crypto.randomInt(100000, 1000000));

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

// ========================================
// REGISTER + SEND EMAIL OTP
// ========================================
router.post("/register", async (req, res) => {
    try {
        const fullName = String(req.body.full_name || "").trim();
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        if (!fullName || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters."
            });
        }

        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already exists. Please log in or use another email."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().query(
            `INSERT INTO users
                (full_name, email, password, role, email_verified)
             VALUES (?, ?, ?, 'user', 0)`,
            [fullName, email, hashedPassword]
        );

        const userId = result.insertId;
        const otp = createOtp();
        const otpHash = hashOtp(otp);

        await db.promise().query(
            `INSERT INTO email_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), 0)`,
            [userId, otpHash]
        );

        try {
            await sendOtpEmail(email, otp);

            return res.status(201).json({
                message: "Account created. Check your email for the verification code.",
                user_id: userId,
                email: email,
                requires_verification: true
            });
        } catch (emailError) {
            console.error("OTP email sending error:", emailError.message);

            return res.status(502).json({
                message: "Account created, but the OTP email could not be sent. Please use the resend OTP option.",
                user_id: userId,
                email: email,
                requires_verification: true
            });
        }
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed due to a server error."
        });
    }
});

// ========================================
// VERIFY EMAIL OTP
// ========================================
router.post("/verify-email", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Enter your email and the 6-digit verification code."
            });
        }

        const [users] = await db.promise().query(
            "SELECT id, email_verified FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Account not found."
            });
        }

        const user = users[0];

        if (Number(user.email_verified) === 1) {
            return res.json({
                message: "Email is already verified. You can log in."
            });
        }

        const [otpRows] = await db.promise().query(
            `SELECT id, otp_hash, attempts,
                    (expires_at > UTC_TIMESTAMP()) AS not_expired
             FROM email_otps
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT 1`,
            [user.id]
        );

        if (otpRows.length === 0) {
            return res.status(400).json({
                message: "No verification code found. Please request a new one."
            });
        }

        const savedOtp = otpRows[0];

        if (Number(savedOtp.attempts) >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new code."
            });
        }

        if (!Number(savedOtp.not_expired)) {
            return res.status(400).json({
                message: "Verification code expired. Please request a new one."
            });
        }

        const submittedHash = Buffer.from(hashOtp(otp), "hex");
        const savedHash = Buffer.from(savedOtp.otp_hash, "hex");

        const matches =
            submittedHash.length === savedHash.length &&
            crypto.timingSafeEqual(submittedHash, savedHash);

        if (!matches) {
            await db.promise().query(
                "UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?",
                [savedOtp.id]
            );

            return res.status(400).json({
                message: "Incorrect verification code."
            });
        }

        await db.promise().query(
            "UPDATE users SET email_verified = 1 WHERE id = ?",
            [user.id]
        );

        await db.promise().query(
            "DELETE FROM email_otps WHERE user_id = ?",
            [user.id]
        );

        return res.json({
            message: "Email verified successfully. You can now log in."
        });
    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).json({
            message: "Email verification failed due to a server error."
        });
    }
});

// ========================================
// RESEND OTP
// ========================================
router.post("/resend-otp", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({
                message: "Email is required."
            });
        }

        const [users] = await db.promise().query(
            "SELECT id, email_verified FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Account not found."
            });
        }

        const user = users[0];

        if (Number(user.email_verified) === 1) {
            return res.json({
                message: "Email is already verified. You can log in."
            });
        }

        const otp = createOtp();

        await db.promise().query(
            "DELETE FROM email_otps WHERE user_id = ?",
            [user.id]
        );

        await db.promise().query(
            `INSERT INTO email_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), 0)`,
            [user.id, hashOtp(otp)]
        );

        try {
            await sendOtpEmail(email, otp);
        } catch (emailError) {
            console.error("Resend OTP email error:", emailError.message);

            return res.status(502).json({
                message: "Could not send the email. Please try again later."
            });
        }

        return res.json({
            message: "A new verification code has been sent to your email."
        });
    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(500).json({
            message: "Could not resend the verification code."
        });
    }
});

// ========================================
// LOGIN
// ========================================
router.post("/login", async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = String(req.body.password || "");

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        if (Number(user.email_verified) !== 1) {
            return res.status(403).json({
                message: "Please verify your email before logging in."
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                message: "Account is inactive."
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.json({
            message: "Login successful!",
            token: token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
});

// ========================================
// TEST ROUTE
// ========================================
router.get("/test", (req, res) => {
    res.json({
        message: "Auth route is working!"
    });
});

// ========================================
// PROTECTED PROFILE
// ========================================
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const [users] = await db.promise().query(
            `SELECT id, full_name, email, role, status
             FROM users
             WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.json({
            message: "Profile retrieved successfully!",
            user: users[0]
        });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Server error."
        });
    }
});

// ========================================
// RBAC TEST ROUTE - ADMIN ONLY
// ========================================
router.get(
    "/admin-test",
    authenticateToken,
    authorizeRoles("admin"),
    (req, res) => {
        res.json({
            message: "Admin access granted!"
        });
    }
);

// ========================================
// RBAC TEST ROUTE - IT STAFF ONLY
// ========================================
router.get(
    "/staff-test",
    authenticateToken,
    authorizeRoles("it_staff"),
    (req, res) => {
        res.json({
            message: "IT Staff access granted!"
        });
    }
);

// ========================================
// RBAC TEST ROUTE - USER ONLY
// ========================================
router.get(
    "/user-test",
    authenticateToken,
    authorizeRoles("user"),
    (req, res) => {
        res.json({
            message: "User access granted!"
        });
    }
);
module.exports = router;
