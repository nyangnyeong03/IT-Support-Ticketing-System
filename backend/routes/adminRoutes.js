const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/users",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const [users] = await db.promise().query(
                `SELECT
                    id,
                    full_name,
                    email,
                    role,
                    status,
                    created_at,
                    updated_at
                 FROM users
                 ORDER BY id ASC`
            );

            res.json({
                message: "Users retrieved successfully!",
                users: users
            });

        } catch (error) {
            console.error("GET USERS ERROR:", error);

            res.status(500).json({
                message: "Failed to retrieve users.",
                error: error.message
            });
        }
    }
);
router.put(
    "/users/:id/status",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const userId = req.params.id;
            const { status } = req.body;

            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    message: "Status must be active or inactive."
                });
            }

            const [users] = await db.promise().query(
                `SELECT id, full_name, email, role, status
                 FROM users
                 WHERE id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            if (Number(userId) === req.user.id) {
                return res.status(400).json({
                    message: "Admin cannot change their own status."
                });
            }

            await db.promise().query(
                `UPDATE users
                 SET status = ?
                 WHERE id = ?`,
                [status, userId]
            );

            res.json({
                message: "User status updated successfully!",
                user_id: Number(userId),
                status: status
            });

        } catch (error) {
            console.error("UPDATE USER STATUS ERROR:", error);

            res.status(500).json({
                message: "Failed to update user status.",
                error: error.message
            });
        }
    }
);
router.put(
    "/users/:id/role",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const userId = req.params.id;
            const { role } = req.body;

            if (!["user", "it_staff", "admin"].includes(role)) {
                return res.status(400).json({
                    message: "Role must be user, it_staff, or admin."
                });
            }

            const [users] = await db.promise().query(
                `SELECT id, full_name, email, role, status
                 FROM users
                 WHERE id = ?`,
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    message: "User not found."
                });
            }

            if (Number(userId) === req.user.id) {
                return res.status(400).json({
                    message: "Admin cannot change their own role."
                });
            }

            await db.promise().query(
                `UPDATE users
                 SET role = ?
                 WHERE id = ?`,
                [role, userId]
            );

            res.json({
                message: "User role updated successfully!",
                user_id: Number(userId),
                role: role
            });

        } catch (error) {
            console.error("UPDATE USER ROLE ERROR:", error);

            res.status(500).json({
                message: "Failed to update user role.",
                error: error.message
            });
        }
    }
);

router.get(
    "/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const [userStats] = await db.promise().query(
                `SELECT
                    COUNT(*) AS total_users,
                    SUM(status = 'active') AS active_users,
                    SUM(status = 'inactive') AS inactive_users
                 FROM users`
            );

            const [ticketStats] = await db.promise().query(
                `SELECT
                    COUNT(*) AS total_tickets,
                    SUM(status = 'Pending') AS pending_tickets,
                    SUM(status = 'In Progress') AS in_progress_tickets,
                    SUM(status = 'Resolved') AS resolved_tickets,
                    SUM(status = 'Closed') AS closed_tickets
                 FROM tickets`
            );

            res.json({
                message: "Dashboard statistics retrieved successfully!",
                users: userStats[0],
                tickets: ticketStats[0]
            });

        } catch (error) {
            console.error("GET DASHBOARD ERROR:", error);

            res.status(500).json({
                message: "Failed to retrieve dashboard statistics.",
                error: error.message
            });
        }
    }
);

module.exports = router;