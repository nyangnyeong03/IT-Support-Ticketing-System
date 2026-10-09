const express = require("express");
const cors = require("cors");
const db = require("./db");

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 5000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());

app.use(express.json());


// ========================================
// API ROUTES
// ========================================

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);


// ========================================
// HOME / API STATUS
// ========================================

app.get("/", (req, res) => {

    res.json({
        message: "IT Support Ticketing System API is running!"
    });

});


// ========================================
// SERVER
// ========================================

app.listen(PORT, "0.0.0.0", () => {

    console.log(
        `Server running on port ${PORT}`
    );

});