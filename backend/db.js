require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),

    ssl: {
        rejectUnauthorized: false
    },

    multipleStatements: true,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error(
            "MySQL connection failed:",
            err.message
        );
        return;
    }

    console.log(
        "Aiven MySQL database connected successfully!"
    );

    connection.release();
});

module.exports = db;