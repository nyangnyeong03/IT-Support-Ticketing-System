import { useEffect, useState } from "react";
import "./StaffDashboard.css";

function StaffDashboard({ user, onLogout }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [activePage, setActivePage] = useState("dashboard");

    const loadTickets = async () => {
        try {
            setLoading(true);
            setMessage("");

            const token = localStorage.getItem("token");

            const response = await fetch(
                "https://it-support-ticketing-system.onrender.com/api/tickets",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(
                    data.message || "Failed to load tickets."
                );
                return;
            }

            setTickets(data.tickets || []);

        } catch (error) {
            console.error("Load tickets error:", error);

            setMessage(
                "Cannot connect to the server."
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadTickets();
    }, []);


    const pendingCount = tickets.filter(
        (ticket) => ticket.status === "Pending"
    ).length;

    const progressCount = tickets.filter(
        (ticket) => ticket.status === "In Progress"
    ).length;

    const resolvedCount = tickets.filter(
        (ticket) => ticket.status === "Resolved"
    ).length;


    // ========================================
    // DASHBOARD PAGE
    // ========================================

    const renderDashboard = () => {
        return (
            <>
                <section className="staff-stats">

                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            T
                        </div>

                        <div>
                            <p>Total Tickets</p>
                            <h2>{tickets.length}</h2>
                        </div>

                    </div>


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            P
                        </div>

                        <div>
                            <p>Pending</p>
                            <h2>{pendingCount}</h2>
                        </div>

                    </div>


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            I
                        </div>

                        <div>
                            <p>In Progress</p>
                            <h2>{progressCount}</h2>
                        </div>

                    </div>


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            R
                        </div>

                        <div>
                            <p>Resolved</p>
                            <h2>{resolvedCount}</h2>
                        </div>

                    </div>

                </section>


                <section className="staff-card">

                    <div className="staff-card-header">

                        <div>
                            <h2>Recent Support Tickets</h2>

                            <p>
                                Tickets submitted by users and clients.
                            </p>
                        </div>


                        <button
                            className="refresh-button"
                            onClick={loadTickets}
                        >
                            Refresh
                        </button>

                    </div>


                    {loading && (
                        <div className="staff-message">
                            Loading tickets...
                        </div>
                    )}


                    {message && (
                        <div className="staff-error">
                            {message}
                        </div>
                    )}


                    {!loading &&
                        !message &&
                        tickets.length === 0 && (

                            <div className="staff-empty">

                                <div className="empty-ticket-icon">
                                    T
                                </div>

                                <h3>
                                    No Tickets Yet
                                </h3>

                                <p>
                                    New client tickets will appear here.
                                </p>

                            </div>
                        )}


                    {!loading &&
                        !message &&
                        tickets.length > 0 && (

                            <div className="ticket-table-wrapper">

                                <table className="ticket-table">

                                    <thead>

                                        <tr>

                                            <th>ID</th>
                                            <th>Client</th>
                                            <th>Subject</th>
                                            <th>Category</th>
                                            <th>Priority</th>
                                            <th>Status</th>
                                            <th>Date</th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {tickets.map((ticket) => (

                                            <tr
                                                key={ticket.id}
                                                className="clickable-ticket"
                                                onClick={() => {
                                                    setActivePage("tickets");
                                                }}
                                            >

                                                <td>
                                                    #{ticket.id}
                                                </td>


                                                <td>

                                                    <strong>
                                                        {ticket.submitted_by}
                                                    </strong>

                                                    <small>
                                                        {ticket.submitted_by_email}
                                                    </small>

                                                </td>


                                                <td>
                                                    {ticket.subject}
                                                </td>


                                                <td>
                                                    {ticket.category}
                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `priority ${ticket.priority.toLowerCase()}`
                                                        }
                                                    >
                                                        {ticket.priority}
                                                    </span>

                                                </td>


                                                <td>

                                                    <span
                                                        className={
                                                            `ticket-status ${ticket.status
                                                                .toLowerCase()
                                                                .replace(" ", "-")}`
                                                        }
                                                    >
                                                        {ticket.status}
                                                    </span>

                                                </td>


                                                <td>

                                                    {new Date(
                                                        ticket.created_at
                                                    ).toLocaleDateString()}

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        )}

                </section>
            </>
        );
    };


    // ========================================
    // TICKETS PAGE
    // ========================================

    const renderTickets = () => {
        return (
            <section className="staff-card">

                <div className="staff-card-header">

                    <div>

                        <h2>
                            Ticket Management
                        </h2>

                        <p>
                            View and manage all submitted support tickets.
                        </p>

                    </div>


                    <button
                        className="refresh-button"
                        onClick={loadTickets}
                    >
                        Refresh
                    </button>

                </div>


                {loading && (
                    <div className="staff-message">
                        Loading tickets...
                    </div>
                )}


                {message && (
                    <div className="staff-error">
                        {message}
                    </div>
                )}


                {!loading &&
                    !message &&
                    tickets.length === 0 && (

                        <div className="staff-empty">

                            <div className="empty-ticket-icon">
                                T
                            </div>

                            <h3>
                                No Tickets
                            </h3>

                            <p>
                                There are currently no support tickets.
                            </p>

                        </div>

                    )}


                {!loading &&
                    !message &&
                    tickets.length > 0 && (

                        <div className="ticket-table-wrapper">

                            <table className="ticket-table">

                                <thead>

                                    <tr>

                                        <th>ID</th>
                                        <th>Client</th>
                                        <th>Subject</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Date</th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {tickets.map((ticket) => (

                                        <tr key={ticket.id}>

                                            <td>
                                                #{ticket.id}
                                            </td>


                                            <td>

                                                <strong>
                                                    {ticket.submitted_by}
                                                </strong>

                                                <small>
                                                    {ticket.submitted_by_email}
                                                </small>

                                            </td>


                                            <td>
                                                {ticket.subject}
                                            </td>


                                            <td>
                                                {ticket.category}
                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        `priority ${ticket.priority.toLowerCase()}`
                                                    }
                                                >
                                                    {ticket.priority}
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        `ticket-status ${ticket.status
                                                            .toLowerCase()
                                                            .replace(" ", "-")}`
                                                    }
                                                >
                                                    {ticket.status}
                                                </span>

                                            </td>


                                            <td>

                                                {new Date(
                                                    ticket.created_at
                                                ).toLocaleDateString()}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}

            </section>
        );
    };


    // ========================================
    // USERS PAGE
    // ========================================

    const renderUsers = () => {
        return (
            <section className="staff-card">

                <div className="staff-card-header">

                    <div>

                        <h2>
                            User Management
                        </h2>

                        <p>
                            Manage registered system users.
                        </p>

                    </div>

                </div>


                <div className="staff-empty">

                    <div className="empty-ticket-icon">
                        U
                    </div>

                    <h3>
                        User Management
                    </h3>

                    <p>
                        User management will be connected to the API next.
                    </p>

                </div>

            </section>
        );
    };


    // ========================================
    // REPORTS PAGE
    // ========================================

    const renderReports = () => {
        return (
            <section className="staff-card">

                <div className="staff-card-header">

                    <div>

                        <h2>
                            Reports
                        </h2>

                        <p>
                            View ticket statistics and system reports.
                        </p>

                    </div>

                </div>


                <div className="staff-stats">

                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
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


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            P
                        </div>

                        <div>

                            <p>
                                Pending
                            </p>

                            <h2>
                                {pendingCount}
                            </h2>

                        </div>

                    </div>


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            I
                        </div>

                        <div>

                            <p>
                                In Progress
                            </p>

                            <h2>
                                {progressCount}
                            </h2>

                        </div>

                    </div>


                    <div className="staff-stat-card">

                        <div className="staff-stat-icon">
                            R
                        </div>

                        <div>

                            <p>
                                Resolved
                            </p>

                            <h2>
                                {resolvedCount}
                            </h2>

                        </div>

                    </div>

                </div>

            </section>
        );
    };


    // ========================================
    // PAGE TITLE
    // ========================================

    const getPageTitle = () => {

        if (activePage === "dashboard") {
            return user.role === "admin"
                ? "Admin Dashboard"
                : "IT Staff Dashboard";
        }

        if (activePage === "tickets") {
            return "Ticket Management";
        }

        if (activePage === "users") {
            return "User Management";
        }

        if (activePage === "reports") {
            return "Reports";
        }

        return "Dashboard";
    };


    // ========================================
    // MAIN STAFF LAYOUT
    // ========================================

    return (

        <div className="staff-layout">


            {/* SIDEBAR */}

            <aside className="staff-sidebar">


                <div className="staff-brand">

                    <div className="staff-brand-icon">
                        IT
                    </div>

                    <div>

                        <h2>
                            IT Support
                        </h2>

                        <p>
                            Management System
                        </p>

                    </div>

                </div>


                <nav className="staff-nav">


                    <button
                        className={
                            activePage === "dashboard"
                                ? "staff-nav-item active"
                                : "staff-nav-item"
                        }
                        onClick={() =>
                            setActivePage("dashboard")
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
                            activePage === "tickets"
                                ? "staff-nav-item active"
                                : "staff-nav-item"
                        }
                        onClick={() =>
                            setActivePage("tickets")
                        }
                    >

                        <span>
                            ▤
                        </span>

                        <span>
                            Tickets
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "users"
                                ? "staff-nav-item active"
                                : "staff-nav-item"
                        }
                        onClick={() =>
                            setActivePage("users")
                        }
                    >

                        <span>
                            U
                        </span>

                        <span>
                            Users
                        </span>

                    </button>


                    <button
                        className={
                            activePage === "reports"
                                ? "staff-nav-item active"
                                : "staff-nav-item"
                        }
                        onClick={() =>
                            setActivePage("reports")
                        }
                    >

                        <span>
                            R
                        </span>

                        <span>
                            Reports
                        </span>

                    </button>

                </nav>


                <div className="staff-sidebar-bottom">

                    <button
                        onClick={onLogout}
                        className="staff-logout"
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


            {/* MAIN */}

            <main className="staff-main">


                {/* HEADER */}

                <header className="staff-header">

                    <div>

                        <h1>
                            {getPageTitle()}
                        </h1>

                        <p>
                            Monitor and manage IT support tickets.
                        </p>

                    </div>


                    <div className="staff-user">

                        <div className="staff-avatar">

                            {user.full_name
                                .charAt(0)
                                .toUpperCase()}

                        </div>


                        <div>

                            <strong>
                                {user.full_name}
                            </strong>

                            <span>
                                {user.role}
                            </span>

                        </div>

                    </div>

                </header>


                {/* PAGE CONTENT */}

                {activePage === "dashboard" &&
                    renderDashboard()}

                {activePage === "tickets" &&
                    renderTickets()}

                {activePage === "users" &&
                    renderUsers()}

                {activePage === "reports" &&
                    renderReports()}

            </main>

        </div>
    );
}

export default StaffDashboard;
