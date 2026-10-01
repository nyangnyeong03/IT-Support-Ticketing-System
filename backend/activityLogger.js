const db = require("./db");

const logActivity = async (userId, action, description) => {
    try {
        await db.promise().query(
            `INSERT INTO activity_logs
             (user_id, action, description)
             VALUES (?, ?, ?)`,
            [userId, action, description]
        );

        console.log("Activity log created:", action);

    } catch (error) {
        console.error("ACTIVITY LOG ERROR:", error);
    }
};

module.exports = logActivity;