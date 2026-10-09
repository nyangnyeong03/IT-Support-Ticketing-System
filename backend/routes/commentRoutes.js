const express = require("express");
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");
const logActivity = require("../activityLogger");

const router = express.Router();

router.post("/:ticketId", authenticateToken, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const userId = req.user.id;
        const { comment } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({
                message: "Comment is required."
            });
        }

        const [tickets] = await db.promise().query(
            `SELECT id, user_id, status
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
                message: "You can only comment on your own tickets."
            });
        }

        if (ticket.status === "Closed") {
            return res.status(400).json({
                message: "Cannot add a comment to a closed ticket."
            });
        }

        const [result] = await db.promise().query(
    `INSERT INTO ticket_comments
     (ticket_id, user_id, comment)
     VALUES (?, ?, ?)`,
    [ticketId, userId, comment.trim()]
);

await logActivity(
    req.user.id,
    ticketId,
    "ADD_COMMENT",
    `Added a comment to ticket #${ticketId}`
);

res.status(201).json({
    message: "Comment added successfully!",
    comment_id: result.insertId,
    ticket_id: Number(ticketId)
});

    } catch (error) {
        console.error("ADD COMMENT ERROR:", error);

        res.status(500).json({
            message: "Failed to add comment.",
            error: error.message
        });
    }
});

router.get("/:ticketId", authenticateToken, async (req, res) => {
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
                message: "You can only view comments on your own tickets."
            });
        }

        const [comments] = await db.promise().query(
            `SELECT
                tc.id,
                tc.ticket_id,
                tc.user_id,
                u.full_name,
                u.role,
                tc.comment,
                tc.created_at
             FROM ticket_comments tc
             INNER JOIN users u ON tc.user_id = u.id
             WHERE tc.ticket_id = ?
             ORDER BY tc.created_at ASC`,
            [ticketId]
        );

        res.json({
            message: "Comments retrieved successfully!",
            comments: comments
        });

    } catch (error) {
        console.error("GET COMMENTS ERROR:", error);

        res.status(500).json({
            message: "Failed to retrieve comments.",
            error: error.message
        });
    }
});

module.exports = router;