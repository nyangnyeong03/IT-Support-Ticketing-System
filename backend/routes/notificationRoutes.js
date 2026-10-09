const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


router.post("/", authenticateToken, authorizeRoles("it_staff", "admin"), async (req, res) => {
    try {
        const { user_id, ticket_id, message } = req.body;

        if (!user_id || !message || !message.trim()) {
            return res.status(400).json({
                message: "User ID and message are required."
            });
        }

        const [users] = await db.promise().query(
            `SELECT id FROM users WHERE id = ?`,
            [user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        if (ticket_id) {
            const [tickets] = await db.promise().query(
                `SELECT id FROM tickets WHERE id = ?`,
                [ticket_id]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    message: "Ticket not found."
                });
            }
        }

        const [result] = await db.promise().query(
            `INSERT INTO notifications
             (user_id, ticket_id, message)
             VALUES (?, ?, ?)`,
            [
                user_id,
                ticket_id || null,
                message.trim()
            ]
        );

        res.status(201).json({
            message: "Notification created successfully!",
            notification_id: result.insertId
        });

    } catch (error) {
        console.error("CREATE NOTIFICATION ERROR:", error);

        res.status(500).json({
            message: "Failed to create notification.",
            error: error.message
        });
    }
});


router.get("/", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const [notifications] = await db.promise().query(
            `SELECT
                id,
                user_id,
                ticket_id,
                message,
                is_read,
                created_at
             FROM notifications
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            message: "Notifications retrieved successfully!",
            notifications: notifications
        });

    } catch (error) {
        console.error("GET NOTIFICATIONS ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve notifications.",
            error: error.message
        });
    }
});


router.put("/:id/read", authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const [notifications] = await db.promise().query(
            `SELECT id, user_id, is_read
             FROM notifications
             WHERE id = ?`,
            [notificationId]
        );

        if (notifications.length === 0) {
            return res.status(404).json({
                message: "Notification not found."
            });
        }

        const notification = notifications[0];

        if (notification.user_id !== userId) {
            return res.status(403).json({
                message: "You can only update your own notifications."
            });
        }

        if (notification.is_read === 1) {
            return res.json({
                message: "Notification is already marked as read.",
                notification_id: Number(notificationId),
                is_read: 1
            });
        }

        await db.promise().query(
            `UPDATE notifications
             SET is_read = 1
             WHERE id = ?`,
            [notificationId]
        );

        res.json({
            message: "Notification marked as read!",
            notification_id: Number(notificationId),
            is_read: 1
        });

    } catch (error) {
        console.error("MARK NOTIFICATION READ ERROR:", error);

        res.status(500).json({
            message: "Failed to mark notification as read.",
            error: error.message
        });
    }
});


module.exports = router;