const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ========================================
// REGISTER
// ========================================
router.post("/register", async (req, res) => {
    try {
        const { full_name, email, password } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required."
            });
        }

        const [existingUsers] = await db.promise().query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.promise().query(
            `INSERT INTO users (full_name, email, password, role)
             VALUES (?, ?, ?, 'user')`,
            [full_name, email, hashedPassword]
        );

        res.status(201).json({
            message: "Registration successful!",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

// ========================================
// LOGIN
// ========================================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

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

        if (user.status !== "active") {
            return res.status(403).json({
                message: "Account is inactive."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
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

        res.json({
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

        res.status(500).json({
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

        res.json({
            message: "Profile retrieved successfully!",
            user: users[0]
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
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

// ========================================
// TEMPORARY PASSWORD RESET
// DEVELOPMENT ONLY
// ========================================
router.put("/reset-password", async (req, res) => {
    try {
        const { email, new_password } = req.body;

        if (!email || !new_password) {
            return res.status(400).json({
                message: "Email and new password are required."
            });
        }

        const hashedPassword = await bcrypt.hash(
            new_password,
            10
        );

        const [result] = await db.promise().query(
            `UPDATE users
             SET password = ?
             WHERE email = ?`,
            [hashedPassword, email]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.json({
            message: "Password reset successful!"
        });

    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});

// ========================================
// EXPORT ROUTER
// ========================================
module.exports = router;

