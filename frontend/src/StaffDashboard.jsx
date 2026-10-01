import { useEffect, useState } from "react";
import "./StaffDashboard.css";

function StaffDashboard({ user, onLogout }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

const [activePage, setActivePage] = useState("dashboard");

const [selectedTicket, setSelectedTicket] = useState(null);
const [staffList, setStaffList] = useState([]);
const [selectedStaff, setSelectedStaff] = useState("");
const [selectedStatus, setSelectedStatus] = useState("");
const [resolution, setResolution] = useState("");
const [actionMessage, setActionMessage] = useState("");
const [saving, setSaving] = useState(false);

const loadStaff = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            "https://it-support-ticketing-system.onrender.com/api/tickets/staff",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error(data.message || "Failed to load IT staff.");
            return;
        }

        setStaffList(data.staff || []);

    } catch (error) {
        console.error("Load staff error:", error);
    }
};

const openTicket = (ticket) => {
    setSelectedTicket(ticket);
    setSelectedStaff(ticket.assigned_to || "");
    setSelectedStatus(ticket.status || "Pending");
    setResolution(ticket.resolution || "");
    setActionMessage("");
    setActivePage("tickets");
};

const assignTicket = async () => {
    if (!selectedTicket) return;

    if (!selectedStaff) {
        setActionMessage("Please select an IT staff.");
        return;
    }

    try {
        setSaving(true);
        setActionMessage("");

        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://it-support-ticketing-system.onrender.com/api/tickets/${selectedTicket.id}/assign`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    assigned_to: Number(selectedStaff)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setActionMessage(
                data.message || "Failed to assign ticket."
            );
            return;
        }

        setActionMessage("Ticket assigned successfully!");

        setSelectedTicket((prev) => ({
            ...prev,
            assigned_to: Number(selectedStaff)
        }));

        await loadTickets();

    } catch (error) {
        console.error("Assign ticket error:", error);
        setActionMessage("Cannot connect to the server.");

    } finally {
        setSaving(false);
    }
};

const updateTicketStatus = async () => {
    if (!selectedTicket) return;

    if (
        selectedStatus === "Resolved" &&
        !resolution.trim()
    ) {
        setActionMessage(
            "Resolution is required when resolving a ticket."
        );
        return;
    }

    try {
        setSaving(true);
        setActionMessage("");

        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://it-support-ticketing-system.onrender.com/api/tickets/${selectedTicket.id}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: selectedStatus,
                    resolution: resolution.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setActionMessage(
                data.message || "Failed to update ticket."
            );
            return;
        }

        setActionMessage("Ticket updated successfully!");

        setSelectedTicket((prev) => ({
            ...prev,
            status: selectedStatus,
            resolution: resolution.trim()
        }));

        await loadTickets();

    } catch (error) {
        console.error("Update ticket error:", error);
        setActionMessage("Cannot connect to the server.");

    } finally {
        setSaving(false);
    }
};
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
    loadStaff();
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
    if (selectedTicket) {
        const assignedStaff = staffList.find(
            (staff) =>
                Number(staff.id) === Number(selectedTicket.assigned_to)
        );

        return (
            <section className="staff-card">

                <div className="staff-card-header">

                    <div>
                        <h2>
                            Ticket #{selectedTicket.id}
                        </h2>

                        <p>
                            Ticket details and management
                        </p>
                    </div>

                    <button
                        className="refresh-button"
                        onClick={() => {
                            setSelectedTicket(null);
                            setActionMessage("");
                        }}
                    >
                        Back to Tickets
                    </button>

                </div>


                <div style={{ padding: "20px" }}>

                    <div style={{ marginBottom: "25px" }}>

                        <h2 style={{ marginBottom: "8px" }}>
                            {selectedTicket.subject}
                        </h2>

                        <p>
                            Submitted by:{" "}
                            <strong>
                                {selectedTicket.submitted_by}
                            </strong>
                        </p>

                        <p>
                            Email:{" "}
                            {selectedTicket.submitted_by_email}
                        </p>

                    </div>


                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "15px",
                            marginBottom: "25px"
                        }}
                    >

                        <div>
                            <strong>Category</strong>
                            <p>
                                {selectedTicket.category}
                            </p>
                        </div>


                        <div>
                            <strong>Priority</strong>
                            <p>
                                {selectedTicket.priority}
                            </p>
                        </div>


                        <div>
                            <strong>Status</strong>
                            <p>
                                {selectedTicket.status}
                            </p>
                        </div>


                        <div>
                            <strong>Date Submitted</strong>
                            <p>
                                {new Date(
                                    selectedTicket.created_at
                                ).toLocaleString()}
                            </p>
                        </div>

                    </div>


                    <div style={{ marginBottom: "25px" }}>

                        <h3>
                            Description
                        </h3>

                        <p
                            style={{
                                marginTop: "8px",
                                whiteSpace: "pre-wrap"
                            }}
                        >
                            {selectedTicket.description}
                        </p>

                    </div>


                    <div
                        style={{
                            marginBottom: "25px"
                        }}
                    >

                        <h3>
                            Assignment
                        </h3>

                        <p style={{ marginTop: "8px" }}>
                            Currently assigned to:{" "}

                            <strong>
                                {assignedStaff
                                    ? assignedStaff.full_name
                                    : "Not assigned"}
                            </strong>
                        </p>


                        <select
                            value={selectedStaff}
                            onChange={(e) =>
                                setSelectedStaff(e.target.value)
                            }
                            style={{
                                marginTop: "12px",
                                width: "100%",
                                maxWidth: "400px",
                                padding: "10px"
                            }}
                        >

                            <option value="">
                                Select IT Staff
                            </option>

                            {staffList.map((staff) => (
                                <option
                                    key={staff.id}
                                    value={staff.id}
                                >
                                    {staff.full_name} - {staff.email}
                                </option>
                            ))}

                        </select>


                        <br />
                        <br />

                        <button
                            className="refresh-button"
                            onClick={assignTicket}
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Assign Ticket"}
                        </button>

                    </div>


                    <div
                        style={{
                            marginBottom: "25px"
                        }}
                    >

                        <h3>
                            Update Ticket
                        </h3>


                        <label
                            style={{
                                display: "block",
                                marginTop: "12px",
                                marginBottom: "6px"
                            }}
                        >
                            Status
                        </label>


                        <select
                            value={selectedStatus}
                            onChange={(e) =>
                                setSelectedStatus(e.target.value)
                            }
                            style={{
                                width: "100%",
                                maxWidth: "400px",
                                padding: "10px"
                            }}
                        >

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Resolved">
                                Resolved
                            </option>

                            <option value="Closed">
                                Closed
                            </option>

                        </select>


                        <label
                            style={{
                                display: "block",
                                marginTop: "15px",
                                marginBottom: "6px"
                            }}
                        >
                            Resolution
                        </label>


                        <textarea
                            value={resolution}
                            onChange={(e) =>
                                setResolution(e.target.value)
                            }
                            placeholder="Enter resolution or action taken..."
                            rows="5"
                            style={{
                                width: "100%",
                                maxWidth: "600px",
                                padding: "10px",
                                resize: "vertical"
                            }}
                        />


                        <br />
                        <br />


                        <button
                            className="refresh-button"
                            onClick={updateTicketStatus}
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Update"}
                        </button>

                    </div>


                    {actionMessage && (
                        <div
                            style={{
                                marginTop: "15px",
                                padding: "12px",
                                borderRadius: "6px"
                            }}
                        >
                            {actionMessage}
                        </div>
                    )}

                </div>

            </section>
        );
    }


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

        <th>
            ID
        </th>

        <th>
            Client
        </th>

        <th>
            Subject
        </th>

        <th>
            Category
        </th>

        <th>
            Priority
        </th>

        <th>
            Status
        </th>

        <th>
            Date
        </th>

        <th>
            Action
        </th>

    </tr>

</thead>


                            <tbody>

                                {tickets.map((ticket) => (

                                    <tr
                                        key={ticket.id}
                                        className="clickable-ticket"
                                        onClick={() =>
                                            openTicket(ticket)
                                        }
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
                                                className={`priority ${ticket.priority.toLowerCase()}`}
                                            >
                                                {ticket.priority}
                                            </span>

                                        </td>


                                        <td>

                                            <span
                                                className={`ticket-status ${ticket.status
                                                    .toLowerCase()
                                                    .replace(" ", "-")}`}
                                            >
                                                {ticket.status}
                                            </span>

                                        </td>


                                        <td>

                                            {new Date(
                                                ticket.created_at
                                            ).toLocaleDateString()}

                                        </td>
<td>
    <button
        className="refresh-button"
        onClick={(e) => {
            e.stopPropagation();
            openTicket(ticket);
        }}
    >
        View
    </button>
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
                            FaultLiNE
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
