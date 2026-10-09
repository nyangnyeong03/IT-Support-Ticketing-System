const db = require("./db");

const logActivity = async (
    userId,
    ticketId,
    action,
    description
) => {
    try {
        await db.promise().query(
            `INSERT INTO activity_logs
             (user_id, ticket_id, action, description)
             VALUES (?, ?, ?, ?)`,
            [
                userId,
                ticketId,
                action,
                description
            ]
        );

        console.log(
            "Activity log created:",
            action
        );

    } catch (error) {
        console.error(
            "ACTIVITY LOG ERROR:",
            error
        );
    }
};

module.exports = logActivity;