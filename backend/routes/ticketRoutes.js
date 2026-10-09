const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const logActivity = require("../activityLogger");

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

await logActivity(
    req.user.id,
    result.insertId,
    "CREATE_TICKET",
    `Created ticket #${result.insertId}`
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
// GET TICKET DETAILS
// ======================================================

router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.id;

        const [tickets] = await db.promise().query(
            `SELECT
                t.id,
                t.user_id,
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
             WHERE t.id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({
                message: "Ticket not found."
            });
        }

        const ticket = tickets[0];

        // Regular user can only view their own ticket
        if (
            req.user.role === "user" &&
            ticket.user_id !== req.user.id
        ) {
            return res.status(403).json({
                message: "Access denied."
            });
        }

        res.json({
            message: "Ticket retrieved successfully!",
            ticket: ticket
        });

    } catch (error) {
        console.error("Get ticket details error:", error);

        res.status(500).json({
            message: "Server error."
        });
    }
});


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
await logActivity(
    req.user.id,
    ticketId,
    "ASSIGN_TICKET",
    `Assigned ticket #${ticketId} to IT staff #${assigned_to}`
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

            const allowedStatuses = [
                "Pending",
                "In Progress",
                "Resolved",
                "Closed"
            ];

            if (!status) {
                return res.status(400).json({
                    message: "Status is required."
                });
            }

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid ticket status."
                });
            }

            // Get current ticket information
            const [tickets] = await db.promise().query(
                `SELECT
                    id,
                    status,
                    resolution
                 FROM tickets
                 WHERE id = ?`,
                [ticketId]
            );

            if (tickets.length === 0) {
                return res.status(404).json({
                    message: "Ticket not found."
                });
            }

            const currentTicket = tickets[0];

            // Resolution is required when resolving
            if (status === "Resolved" && !resolution) {
                return res.status(400).json({
                    message: "Resolution is required when resolving a ticket."
                });
            }

            // Keep existing resolution if no new resolution is provided
            let newResolution = currentTicket.resolution;

            if (resolution) {
                newResolution = resolution;
            }

            await db.promise().query(
                `UPDATE tickets
                 SET status = ?,
                     resolution = ?
                 WHERE id = ?`,
                [
                    status,
                    newResolution,
                    ticketId
                ]
            );
await logActivity(
    req.user.id,
    ticketId,
    "UPDATE_STATUS",
    `Updated ticket #${ticketId} status to ${status}`
);
            res.json({
                message: "Ticket status updated successfully!",
                ticket_id: Number(ticketId),
                status: status,
                resolution: newResolution
            });

        } catch (error) {
            console.error("Update ticket status error:", error);

            res.status(500).json({
                message: "Server error."
            });
        }
    }
);


// ======================================================
// EXPORT ROUTER
// ======================================================

router.get("/:ticketId/activity", authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const userId = req.user.id;

        const [tickets] = await db.promise().query(
            `SELECT id, user_id
             FROM tickets
             WHERE id = ?`,
            [ticketId]
        );

        if (tickets.length === 0) {
            return res.status(404).json({
                message: "Ticket not found."
            });
        }

        const ticket = tickets[0];

        if (req.user.role === "user" && ticket.user_id !== userId) {
            return res.status(403).json({
                message: "You can only view activity history of your own tickets."
            });
        }

        const [activities] = await db.promise().query(
            `SELECT
                al.id,
                al.ticket_id,
                al.action,
                al.description,
                al.created_at,
                u.full_name,
                u.role
             FROM activity_logs al
             INNER JOIN users u ON al.user_id = u.id
             WHERE al.ticket_id = ?
             ORDER BY al.created_at ASC`,
            [ticketId]
        );

        res.json({
            message: "Activity history retrieved successfully!",
            activities: activities
        });

    } catch (error) {
        console.error("GET ACTIVITY HISTORY ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve activity history.",
            error: error.message
        });
    }
});
module.exports = router;