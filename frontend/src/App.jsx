import { useEffect, useState } from "react";
import "./App.css";
import StaffDashboard from "./StaffDashboard";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const [user, setUser] = useState(
        JSON.parse(localStorage.getItem("user")) || null
    );

    const [activePage, setActivePage] = useState("dashboard");
	const [selectedTicket, setSelectedTicket] = useState(null);

    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Hardware");
    const [priority, setPriority] = useState("Medium");

    const [ticketMessage, setTicketMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);

const [tickets, setTickets] = useState([]);
const [loadingTickets, setLoadingTickets] = useState(false);

// ========================================
// LOAD MY TICKETS
// ========================================

useEffect(() => {
    if (!user) {
        return;
    }

    const loadTickets = async () => {
        setLoadingTickets(true);

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "https://it-support-ticketing-system.onrender.com/api/tickets/my-tickets",
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Failed to load tickets:",
                    data.message
                );

                return;
            }

            setTickets(data.tickets || []);

        } catch (error) {
            console.error(
                "Load tickets error:",
                error
            );
        } finally {
            setLoadingTickets(false);
        }
    };

    loadTickets();

}, [user]);


    // ========================================
    // LOGIN
    // ========================================

    const handleLogin = async (e) => {
        e.preventDefault();

        setMessage("");

        try {
            const response = await fetch(
                "https://it-support-ticketing-system.onrender.com/api/auth/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Login failed."
                );

                return;
            }

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            setUser(data.user);

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            setMessage(
                "Cannot connect to the server. Make sure the backend is running."
            );
        }
    };


    // ========================================
    // LOGOUT
    // ========================================

    const handleLogout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setUser(null);

        setEmail("");
        setPassword("");
        setMessage("");

    };


    // ========================================
    // STAFF / ADMIN DASHBOARD
    // ========================================

    if (
        user &&
        (
            user.role === "admin" ||
            user.role === "it_staff"
        )
    ) {
        return (
            <StaffDashboard
                user={user}
                onLogout={handleLogout}
            />
        );
    }


    // ========================================
    // LOGIN PAGE
    // ========================================

    if (!user) {

        return (
            <div className="login-page">

                <div className="login-card">

                    <div className="login-header">

                        <h1>
                            FaultLiNE
                        </h1>

                        <p>
                            IT Support & Ticketing
                        </p>

                        <span>
                            Sign in to continue
                        </span>

                    </div>


                    <form onSubmit={handleLogin}>

                        <div className="form-group">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>


                        <button
                            className="login-button"
                            type="submit"
                        >
                            Login
                        </button>

                    </form>


                    {message && (

                        <div className="message">
                            {message}
                        </div>

                    )}

                </div>

            </div>
        );
    }


    // ========================================
    // CLIENT DASHBOARD
    // ========================================

    return (

        <div className="app-layout">


            {/* ========================================
                SIDEBAR
            ======================================== */}

            <aside className="sidebar">

                <div className="sidebar-brand">

                    <div className="brand-icon">
                        IT
                    </div>

                    <div>

                        <h2>
                           FaultLiNE
                        </h2>

                        <p>
                            IT Support & Ticketing
                        </p>

                    </div>

                </div>


                <nav className="sidebar-navigation">


                    <button
                        className={
                            activePage === "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            setActivePage(
                                "dashboard"
                            )
                        }
                    >

                        <span>
                            ⌂
                        </span>

                        <span>
                            Dashboard
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "submit"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            setActivePage(
                                "submit"
                            )
                        }
                    >

                        <span>
                            ＋
                        </span>

                        <span>
                            Submit Ticket
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "tickets"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            setActivePage(
                                "tickets"
                            )
                        }
                    >

                        <span>
                            ▤
                        </span>

                        <span>
                            My Tickets
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "notifications"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            setActivePage(
                                "notifications"
                            )
                        }
                    >

                        <span>
                            ♢
                        </span>

                        <span>
                            Notifications
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "profile"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            setActivePage(
                                "profile"
                            )
                        }
                    >

                        <span>
                            ○
                        </span>

                        <span>
                            My Profile
                        </span>

                    </button>

                </nav>


                <div className="sidebar-bottom">

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >

                        <span>
                            ↪
                        </span>

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* ========================================
                MAIN CONTENT
            ======================================== */}

            <main className="main-content">


                {/* HEADER */}

                <header className="top-header">

                    <div>

                        <h1>

                            {activePage === "dashboard"
                                ? "Dashboard"
                                : activePage === "submit"
                                ? "Submit Ticket"
                                : activePage === "tickets"
                                ? "My Tickets"
                                : activePage === "notifications"
                                ? "Notifications"
                                : "My Profile"}

                        </h1>


                        <p>
                            Welcome back,{" "}
                            {user.full_name}
                        </p>

                    </div>


                    <div className="header-user">

                        <div className="avatar">

                            {user.full_name
                                .charAt(0)
                                .toUpperCase()}

                        </div>


                        <div className="header-user-info">

                            <strong>
                                {user.full_name}
                            </strong>

                            <span>
                                {user.role}
                            </span>

                        </div>

                    </div>

                </header>


                {/* ========================================
                    DASHBOARD
                ======================================== */}

                {activePage === "dashboard" && (

                    <div className="page-content">


                        <div className="stats-grid">


                            <div className="stat-card">

                                <div className="stat-icon">
                                    T
                                </div>

                                <div>

                                    <p>
                                        Total Tickets
                                    </p>

                                    <h2>
                                        {tickets.length}
                                    </h2>

                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    P
                                </div>

                                <div>

                                    <p>
                                        Pending
                                    </p>

                                    <h2>
                                        {tickets.filter(
        (ticket) => ticket.status === "Pending"
    ).length}
                                    </h2>

                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    I
                                </div>

                                <div>

                                    <p>
                                        In Progress
                                    </p>

                                    <h2>
                                        {tickets.filter(
    (ticket) => ticket.status === "In Progress"
).length}
                                    </h2>

                                </div>

                            </div>


                            <div className="stat-card">

                                <div className="stat-icon">
                                    R
                                </div>

                                <div>

                                    <p>
                                        Resolved
                                    </p>

                                    <h2>
                                        {tickets.filter(
    (ticket) => ticket.status === "Resolved"
).length}
                                    </h2>

                                </div>

                            </div>

                        </div>


                        <div className="dashboard-grid">


                            {/* QUICK ACTIONS */}

                            <section className="content-card">

                                <div className="card-header">

                                    <div>

                                        <h2>
                                            Quick Actions
                                        </h2>

                                        <p>
                                            Frequently used actions
                                        </p>

                                    </div>

                                </div>


                                <div className="quick-actions">


                                    <button
                                        className="quick-action"
                                        onClick={() =>
                                            setActivePage(
                                                "submit"
                                            )
                                        }
                                    >

                                        <div className="quick-icon">
                                            +
                                        </div>

                                        <div>

                                            <strong>
                                                Submit a Ticket
                                            </strong>

                                            <span>
                                                Report an IT problem
                                            </span>

                                        </div>

                                    </button>


                                    <button
                                        className="quick-action"
                                        onClick={() =>
                                            setActivePage(
                                                "tickets"
                                            )
                                        }
                                    >

                                        <div className="quick-icon">
                                            T
                                        </div>

                                        <div>

                                            <strong>
                                                View My Tickets
                                            </strong>

                                            <span>
                                                Track your requests
                                            </span>

                                        </div>

                                    </button>


                                    <button
                                        className="quick-action"
                                        onClick={() =>
                                            setActivePage(
                                                "profile"
                                            )
                                        }
                                    >

                                        <div className="quick-icon">
                                            U
                                        </div>

                                        <div>

                                            <strong>
                                                My Profile
                                            </strong>

                                            <span>
                                                Manage your account
                                            </span>

                                        </div>

                                    </button>

                                </div>

                            </section>


                            {/* RECENT TICKET */}

                            <section className="content-card">

                                <div className="card-header">

                                    <div>

                                        <h2>
                                            Recent Tickets
                                        </h2>

                                        <p>
                                            Your latest support requests
                                        </p>

                                    </div>


                                    <button
                                        className="view-all-button"
                                        onClick={() =>
                                            setActivePage(
                                                "tickets"
                                            )
                                        }
                                    >
                                        View All
                                    </button>

                                </div>


                                                           {tickets.length > 0 ? (

    <div
        className="recent-ticket"
        onClick={() => {
            setSelectedTicket(tickets[0]);
            setActivePage("tickets");
        }}
        style={{ cursor: "pointer" }}
    >

        <div>

            <strong>
                {tickets[0].subject}
            </strong>

            <span>
                {tickets[0].category} • {tickets[0].priority} Priority
            </span>

        </div>

        <span
            className={`status ${tickets[0].status
                .toLowerCase()
                .replace(" ", "-")}`}
        >
            {tickets[0].status}
        </span>

    </div>

) : (

    <div>

        <strong>
            No tickets yet
        </strong>

        <span>
            Your submitted tickets will appear here.
        </span>

    </div>

)}

                            </section>

                        </div>

                    </div>

                )}

                {/* ========================================
                    SUBMIT TICKET
                ======================================== */}

                {activePage === "submit" && (

                    <div className="page-content">

                        <section className="content-card ticket-card">

                            <div className="card-header">

                                <div>

                                    <h2>
                                        Create New Support Ticket
                                    </h2>

                                    <p>
                                        Describe your IT problem so
                                        the support staff can assist you.
                                    </p>

                                </div>

                            </div>


                            <form
                                className="ticket-form"
                                onSubmit={async (e) => {

                                    e.preventDefault();

                                    setTicketMessage("");
                                    setSubmitting(true);

                                    try {

                                        const token =
                                            localStorage.getItem(
                                                "token"
                                            );

                                        const response =
                                            await fetch(
                                                "https://it-support-ticketing-system.onrender.com/api/tickets",
                                                {
                                                    method: "POST",

                                                    headers: {
                                                        "Content-Type":
                                                            "application/json",

                                                        Authorization:
                                                            `Bearer ${token}`
                                                    },

                                                    body: JSON.stringify({
                                                        subject,
                                                        description,
                                                        category,
                                                        priority
                                                    })
                                                }
                                            );

                                        const data =
                                            await response.json();


                                        if (!response.ok) {

                                            setTicketMessage(
                                                data.message ||
                                                "Failed to submit ticket."
                                            );

                                            setSubmitting(false);

                                            return;
                                        }


                                        setTicketMessage(
                                            `Ticket submitted successfully! Ticket ID: ${data.ticket_id}`
                                        );


                                        setSubject("");
                                        setDescription("");
                                        setCategory(
                                            "Hardware"
                                        );
                                        setPriority(
                                            "Medium"
                                        );

                                    } catch (error) {

                                        console.error(
                                            "Submit ticket error:",
                                            error
                                        );

                                        setTicketMessage(
                                            "Cannot connect to the server."
                                        );

                                    }

                                    setSubmitting(false);

                                }}
                            >


                                <div className="form-group">

                                    <label>
                                        Subject
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Example: Computer is not turning on"
                                        value={subject}
                                        onChange={(e) =>
                                            setSubject(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-group">

                                    <label>
                                        Description
                                    </label>

                                    <textarea
                                        placeholder="Describe the problem in detail..."
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(
                                                e.target.value
                                            )
                                        }
                                        required
                                    />

                                </div>


                                <div className="form-row">


                                    <div className="form-group">

                                        <label>
                                            Category
                                        </label>

                                        <select
                                            value={category}
                                            onChange={(e) =>
                                                setCategory(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option>
                                                Hardware
                                            </option>

                                            <option>
                                                Software
                                            </option>

                                            <option>
                                                Network
                                            </option>

                                            <option>
                                                Account
                                            </option>

                                            <option>
                                                Other
                                            </option>

                                        </select>

                                    </div>


                                    <div className="form-group">

                                        <label>
                                            Priority
                                        </label>

                                        <select
                                            value={priority}
                                            onChange={(e) =>
                                                setPriority(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option>
                                                Low
                                            </option>

                                            <option>
                                                Medium
                                            </option>

                                            <option>
                                                High
                                            </option>

                                            <option>
                                                Urgent
                                            </option>

                                        </select>

                                    </div>

                                </div>


                                <button
                                    className="submit-button"
                                    type="submit"
                                    disabled={submitting}
                                >

                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Ticket"}

                                </button>

                            </form>


                            {ticketMessage && (

                                <div className="ticket-success">

                                    {ticketMessage}

                                </div>

                            )}

                        </section>

                    </div>

                )}


                {/* ========================================
    MY TICKETS
======================================== */}

{activePage === "tickets" && (

    <div className="page-content">

        {selectedTicket ? (

            <section className="content-card">

                <div className="card-header">

                    <div>

                        <h2>
                            Ticket Details
                        </h2>

                        <p>
                            View the complete information of your support ticket.
                        </p>

                    </div>

                    <button
                        className="view-all-button"
                        type="button"
                        onClick={() => setSelectedTicket(null)}
                    >
                        Back to My Tickets
                    </button>

                </div>


                <div className="ticket-details-page">

                    <div className="ticket-detail-header">

                        <div>

                            <h2>
                                {selectedTicket.subject}
                            </h2>

                            <p>
                                Ticket #{selectedTicket.id}
                            </p>

                        </div>

                        <span className="ticket-status">
                            {selectedTicket.status}
                        </span>

                    </div>


                    <div className="ticket-details">

                        <span>
                            Category: {selectedTicket.category}
                        </span>

                        <span>
                            Priority: {selectedTicket.priority}
                        </span>

                    </div>


                    <div className="ticket-detail-section">

                        <h3>
                            Description
                        </h3>

                        <p>
                            {selectedTicket.description}
                        </p>

                    </div>


                    <div className="ticket-detail-section">

                        <h3>
                            Created
                        </h3>

                        <p>
                            {new Date(
                                selectedTicket.created_at
                            ).toLocaleString()}
                        </p>

                    </div>

                </div>

            </section>

        ) : (

            <section className="content-card">

                <div className="card-header">

                    <div>

                        <h2>
                            My Tickets
                        </h2>

                        <p>
                            View and track your submitted support tickets.
                        </p>

                    </div>

                </div>


                <div className="ticket-list">

                    {loadingTickets ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                T
                            </div>

                            <h3>
                                Loading Tickets
                            </h3>

                            <p>
                                Please wait while your tickets are being loaded.
                            </p>

                        </div>

                    ) : tickets.length === 0 ? (

                        <div className="empty-state">

                            <div className="empty-icon">
                                T
                            </div>

                            <h3>
                                No Tickets Yet
                            </h3>

                            <p>
                                You have not submitted any support tickets yet.
                            </p>

                        </div>

                    ) : (

                        tickets.map((ticket) => (

                            <button
                                className="ticket-item"
                                key={ticket.id}
                                type="button"
                                onClick={() => {
                                    setSelectedTicket(ticket);
                                }}
                            >

                                <div className="ticket-item-header">

                                    <div>

                                        <h3>
                                            {ticket.subject}
                                        </h3>

                                        <p>
                                            Ticket #{ticket.id}
                                        </p>

                                    </div>

                                    <span className="ticket-status">
                                        {ticket.status}
                                    </span>

                                </div>


                                <div className="ticket-details">

                                    <span>
                                        Category: {ticket.category}
                                    </span>

                                    <span>
                                        Priority: {ticket.priority}
                                    </span>

                                </div>


                                <p className="ticket-description">
                                    {ticket.description}
                                </p>


                                <div className="ticket-date">

                                    Created:{" "}

                                    {new Date(
                                        ticket.created_at
                                    ).toLocaleDateString()}

                                </div>

                            </button>

                        ))

                    )}

                </div>

            </section>

        )}

    </div>

)}


                {/* ========================================
                    NOTIFICATIONS
                ======================================== */}

                {activePage === "notifications" && (

                    <div className="page-content">

                        <section className="content-card">

                            <div className="card-header">

                                <div>

                                    <h2>
                                        Notifications
                                    </h2>

                                    <p>
                                        View updates about your tickets.
                                    </p>

                                </div>

                            </div>


                            <div className="empty-state">

                                <div className="empty-icon">
                                    N
                                </div>

                                <h3>
                                    No Notifications
                                </h3>

                                <p>
                                    Notifications will appear here.
                                </p>

                            </div>

                        </section>

                    </div>

                )}


                {/* ========================================
                    PROFILE
                ======================================== */}

                {activePage === "profile" && (

                    <div className="page-content">

                        <section className="content-card profile-card">

                            <div className="card-header">

                                <div>

                                    <h2>
                                        My Profile
                                    </h2>

                                    <p>
                                        Your account information.
                                    </p>

                                </div>

                            </div>


                            <div className="profile-details">


                                <div className="profile-row">

                                    <span>
                                        Full Name
                                    </span>

                                    <strong>
                                        {user.full_name}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Email
                                    </span>

                                    <strong>
                                        {user.email}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        Role
                                    </span>

                                    <strong>
                                        {user.role}
                                    </strong>

                                </div>


                                <div className="profile-row">

                                    <span>
                                        User ID
                                    </span>

                                    <strong>
                                        {user.id}
                                    </strong>

                                </div>

                            </div>

                        </section>

                    </div>

                )}

            </main>

        </div>
    );
}

export default App;
