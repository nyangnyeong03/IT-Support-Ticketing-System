
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const { sendOtpEmail } = require("../emailService");

const router = express.Router();

// ========================================
// HELPERS
// ========================================

const normalizeEmail = (email) =>
    String(email || "").trim().toLowerCase();

const createOtp = () =>
    String(crypto.randomInt(100000, 1000000));

const hashOtp = (otp) =>
    crypto.createHash("sha256").update(otp).digest("hex");

const sendOtpEmailWithTimeout = (
    email,
    otp,
    toName = "FaultLiNE User",
    timeoutMs = 30000
) => {
    let timer;

    return Promise.race([
        sendOtpEmail(email, otp, toName),
        new Promise((_, reject) => {
            timer = setTimeout(() => {
                reject(
                    new Error("OTP email sending timed out after 30 seconds")
                );
            }, timeoutMs);
        }),
    ]).finally(() => clearTimeout(timer));
};

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
                message: "Please complete all required fields.",
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address.",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters long.",
            });
        }

        const [existingUsers] = await db.promise().query(
            "SELECT id, email_verified FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (existingUsers.length > 0) {
            if (Number(existingUsers[0].email_verified) === 1) {
                return res.status(409).json({
                    message: "This email is already registered. Please log in.",
                });
            }

            return res.status(409).json({
                message:
                    "This email already has an unverified account. Please use Resend OTP or contact support.",
                requires_verification: true,
                email,
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [userResult] = await db.promise().query(
            `INSERT INTO users
                (full_name, email, password, role, email_verified)
             VALUES (?, ?, ?, 'user', 0)`,
            [fullName, email, hashedPassword]
        );

        const userId = userResult.insertId;
        const otp = createOtp();
        const otpHash = hashOtp(otp);

        // OTP expires after 5 minutes.
        await db.promise().query(
            `INSERT INTO email_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), 0)`,
            [userId, otpHash]
        );

        try {
            await sendOtpEmailWithTimeout(email, otp, fullName);
        } catch (emailError) {
            console.error("Registration OTP email error:", emailError.message);

            return res.status(502).json({
                message:
                    "Your account was created, but the OTP email could not be sent. Please use Resend OTP.",
                requires_verification: true,
                email,
            });
        }

        return res.status(201).json({
            message: "Registration successful. Please check your email for the OTP.",
            user_id: userId,
            email,
            requires_verification: true,
        });
    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Registration failed. Please try again.",
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
                message: "Please provide your email and valid 6-digit OTP.",
            });
        }

        const [users] = await db.promise().query(
            "SELECT id, email_verified FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Account not found. Please register first.",
            });
        }

        const user = users[0];

        if (Number(user.email_verified) === 1) {
            return res.status(200).json({
                message: "Your email is already verified. You can log in.",
            });
        }

        const [otpRows] = await db.promise().query(
            `SELECT
                id,
                otp_hash,
                attempts,
                (expires_at > UTC_TIMESTAMP()) AS not_expired
             FROM email_otps
             WHERE user_id = ?
             ORDER BY id DESC
             LIMIT 1`,
            [user.id]
        );

        if (otpRows.length === 0) {
            return res.status(400).json({
                message: "No OTP found. Please request a new OTP.",
            });
        }

        const savedOtp = otpRows[0];

        if (Number(savedOtp.attempts) >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP.",
            });
        }

        if (Number(savedOtp.not_expired) !== 1) {
            await db.promise().query(
                "DELETE FROM email_otps WHERE user_id = ?",
                [user.id]
            );

            return res.status(400).json({
                message: "Your OTP has expired. Please request a new one.",
            });
        }

        const submittedHash = Buffer.from(hashOtp(otp), "hex");
        const storedHash = Buffer.from(savedOtp.otp_hash, "hex");

        const otpMatches =
            submittedHash.length === storedHash.length &&
            crypto.timingSafeEqual(submittedHash, storedHash);

        if (!otpMatches) {
            await db.promise().query(
                "UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?",
                [savedOtp.id]
            );

            return res.status(400).json({
                message: "Incorrect OTP. Please try again.",
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

        return res.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        console.error("OTP verification error:", error);

        return res.status(500).json({
            message: "Could not verify your email. Please try again.",
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
                message: "Email is required.",
            });
        }

        const [users] = await db.promise().query(
            `SELECT id, full_name, email_verified
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Account not found. Please register first.",
            });
        }

        const user = users[0];

        if (Number(user.email_verified) === 1) {
            return res.status(400).json({
                message: "Your email is already verified. Please log in.",
            });
        }

        // Remove any previous OTP before creating a new one.
        await db.promise().query(
            "DELETE FROM email_otps WHERE user_id = ?",
            [user.id]
        );

        const otp = createOtp();
        const otpHash = hashOtp(otp);

        await db.promise().query(
            `INSERT INTO email_otps
                (user_id, otp_hash, expires_at, attempts)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE), 0)`,
            [user.id, otpHash]
        );

        try {
            await sendOtpEmailWithTimeout(
                email,
                otp,
                user.full_name || "FaultLiNE User"
            );
        } catch (emailError) {
            console.error("Resend OTP email error:", emailError.message);

            return res.status(502).json({
                message: "Could not send a new OTP email. Please try again.",
            });
        }

        return res.status(200).json({
            message: "A new OTP has been sent to your email.",
        });
    } catch (error) {
        console.error("Resend OTP error:", error);

        return res.status(500).json({
            message: "Could not resend OTP. Please try again.",
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
                message: "Email and password are required.",
            });
        }

        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const user = users[0];
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        if (Number(user.email_verified) !== 1) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                requires_verification: true,
                email: user.email,
            });
        }

        if (
            user.status &&
            String(user.status).toLowerCase() !== "active"
        ) {
            return res.status(403).json({
                message: "Your account is inactive. Please contact support.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");

            return res.status(500).json({
                message: "Server authentication configuration is missing.",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const safeUser = {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            status: user.status,
            email_verified: user.email_verified,
        };

        return res.status(200).json({
            message: "Login successful.",
            token,
            user: safeUser,
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Login failed. Please try again.",
        });
    }
});

// ========================================
// PROFILE
// ========================================

router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;

        const [users] = await db.promise().query(
            `SELECT id, full_name, email, role, status, email_verified
             FROM users
             WHERE id = ?
             LIMIT 1`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        return res.status(200).json({ user: users[0] });
    } catch (error) {
        console.error("Profile error:", error);

        return res.status(500).json({
            message: "Could not retrieve profile.",
        });
    }
});

// ========================================
// ROLE TEST ROUTES
// ========================================

router.get("/test", (req, res) => {
    res.json({ message: "Auth routes are working." });
});

router.get("/admin-test", authenticateToken, authorizeRoles("admin"), (req, res) => {
    res.json({ message: "Admin access granted." });
});

router.get("/staff-test", authenticateToken, authorizeRoles("it_staff"), (req, res) => {
    res.json({ message: "IT staff access granted." });
});

router.get("/user-test", authenticateToken, authorizeRoles("user"), (req, res) => {
    res.json({ message: "User access granted." });
});

module.exports = router;
