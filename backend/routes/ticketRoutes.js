const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();


// ======================================================
// CREATE TICKET
// ======================================================

router.post("/", authenticateToken, async (req, res) => {
    try {
        const {
            subject,
            description,
            category,
            priority
        } = req.body;

        if (!subject || !description || !category) {
            return res.status(400).json({
                message: "Subject, description, and category are required."
            });
        }

        const allowedCategories = [
            "Hardware",
            "Software",
            "Network",
            "Account",
            "Other"
        ];

        if (!allowedCategories.includes(category)) {
            return res.status(400).json({
                message: "Invalid category."
            });
        }

        const allowedPriorities = [
            "Low",
            "Medium",
            "High",
            "Urgent"
        ];

        const ticketPriority = priority || "Medium";

        if (!allowedPriorities.includes(ticketPriority)) {
            return res.status(400).json({
                message: "Invalid priority."
            });
        }

        const [result] = await db.promise().query(
            `INSERT INTO tickets
            (user_id, subject, description, category, priority)
            VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                subject,
                description,
                category,
                ticketPriority
            ]
        );

        res.status(201).json({
            message: "Ticket created successfully!",
            ticket_id: result.insertId
        });

    } catch (error) {
        console.error("Create ticket error:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});


// ======================================================
// GET MY TICKETS
// ======================================================

router.get("/my-tickets", authenticateToken, async (req, res) => {
    try {
        const [tickets] = await db.promise().query(
            `SELECT
                id,
                subject,
                description,
                category,
                priority,
                status,
                assigned_to,
                resolution,
                created_at,
                updated_at
             FROM tickets
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [req.user.id]
        );

        res.json({
            message: "Tickets retrieved successfully!",
            tickets: tickets
        });

    } catch (error) {
        console.error("Get my tickets error:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});


// ======================================================
// GET ALL TICKETS
// ======================================================

router.get(
    "/",
    authenticateToken,
    authorizeRoles("it_staff", "admin"),
    async (req, res) => {
        try {
            const [tickets] = await db.promise().query(
                `SELECT
                    t.id,
                    t.subject,
                    t.description,
                    t.category,
                    t.priority,
                    t.status,
                    t.assigned_to,
                    t.resolution,
                    t.created_at,
                    t.updated_at,
                    u.full_name AS submitted_by,
                    u.email AS submitted_by_email
                 FROM tickets t
                 INNER JOIN users u
                    ON t.user_id = u.id
                 ORDER BY t.created_at DESC`
            );

            res.json({
                message: "All tickets retrieved successfully!",
                tickets: tickets
            });

        } catch (error) {
            console.error("Get all tickets error:", error);

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);


// ======================================================
// GET ALL IT STAFF
// ======================================================

router.get(
    "/staff",
    authenticateToken,
    authorizeRoles("it_staff", "admin"),
    async (req, res) => {
        try {
            const [staff] = await db.promise().query(
                `SELECT
                    id,
                    full_name,
                    email,
                    status
                 FROM users
                 WHERE role = 'it_staff'
                 AND status = 'active'
                 ORDER BY full_name ASC`
            );

            res.json({
                message: "IT Staff retrieved successfully!",
                staff: staff
            });

        } catch (error) {
            console.error("Get IT staff error:", error);

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);


// ======================================================
// ASSIGN TICKET
// ======================================================

router.put(
    "/:id/assign",
    authenticateToken,
    authorizeRoles("it_staff", "admin"),
    async (req, res) => {
        try {
            const ticketId = req.params.id;
            const { assigned_to } = req.body;

            if (!assigned_to) {
                return res.status(400).json({
                    message: "assigned_to is required."
                });
            }

            const [staff] = await db.promise().query(
                `SELECT id
                 FROM users
                 WHERE id = ?
                 AND role = 'it_staff'
                 AND status = 'active'`,
                [assigned_to]
            );

            if (staff.length === 0) {
                return res.status(404).json({
                    message: "IT Staff not found or inactive."
                });
            }

            const [tickets] = await db.promise().query(
                `SELECT id
                 FROM tickets
                 WHERE id = ?`,
                [ticketId]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    message: "Ticket not found."
                });
            }

            await db.promise().query(
                `UPDATE tickets
                 SET assigned_to = ?
                 WHERE id = ?`,
                [assigned_to, ticketId]
            );

            res.json({
                message: "Ticket assigned successfully!",
                ticket_id: Number(ticketId),
                assigned_to: Number(assigned_to)
            });

        } catch (error) {
            console.error("Assign ticket error:", error);

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);


// ======================================================
// UPDATE TICKET STATUS
// ======================================================

router.put(
    "/:id/status",
    authenticateToken,
    authorizeRoles("it_staff", "admin"),
    async (req, res) => {
        try {
            const ticketId = req.params.id;
            const { status, resolution } = req.body;

            // Allowed ticket statuses
            const allowedStatuses = [
                "Pending",
                "In Progress",
                "Resolved",
                "Closed"
            ];

            // Check if status was provided
            if (!status) {
                return res.status(400).json({
                    message: "Status is required."
                });
            }

            // Check if status is valid
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid ticket status."
                });
            }

            // Check if ticket exists
            const [tickets] = await db.promise().query(
                `SELECT id
                 FROM tickets
                 WHERE id = ?`,
                [ticketId]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    message: "Ticket not found."
                });
            }

            // Resolution is required when ticket is Resolved
            if (status === "Resolved" && !resolution) {
                return res.status(400).json({
                    message: "Resolution is required when resolving a ticket."
                });
            }

            // Update status and resolution
            await db.promise().query(
                `UPDATE tickets
                 SET status = ?,
                     resolution = ?
                 WHERE id = ?`,
                [
                    status,
                    resolution || null,
                    ticketId
                ]
            );

            res.json({
                message: "Ticket status updated successfully!",
                ticket_id: Number(ticketId),
                status: status,
                resolution: resolution || null
            });

        } catch (error) {
            console.error("Update ticket status error:", error);

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);


module.exports = router;