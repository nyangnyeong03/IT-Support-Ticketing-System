
import { useEffect, useState } from "react";
import "./StaffDashboard.css";

const API_URL = "https://it-support-ticketing-system.onrender.com";

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

    // Admin Panel states
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userMessage, setUserMessage] = useState("");
    const [updatingUserId, setUpdatingUserId] = useState(null);

    const [adminStats, setAdminStats] = useState({
        users: {},
        tickets: {},
    });
    const [loadingAdminStats, setLoadingAdminStats] = useState(false);

    const isAdmin = user?.role === "admin";
    const token = localStorage.getItem("token");

    const requestHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };

    // Load tickets
    const loadTickets = async () => {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(`${API_URL}/api/tickets`, {
                headers: requestHeaders,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load tickets.");
            }

            setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        } catch (error) {
            setMessage(error.message || "Unable to load tickets.");
        } finally {
            setLoading(false);
        }
    };

    // Load IT staff for ticket assignment
    const loadStaff = async () => {
        try {
            const response = await fetch(`${API_URL}/api/tickets/staff`, {
                headers: requestHeaders,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load IT staff.");
            }

            setStaffList(Array.isArray(data.staff) ? data.staff : []);
        } catch (error) {
            console.error("LOAD STAFF ERROR:", error);
        }
    };

    // Load users — admin only
    const loadUsers = async () => {
        if (!isAdmin) return;

        setLoadingUsers(true);
        setUserMessage("");

        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: requestHeaders,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load users.");
            }

            setUsers(Array.isArray(data.users) ? data.users : []);
        } catch (error) {
            setUserMessage(error.message || "Unable to load users.");
        } finally {
            setLoadingUsers(false);
        }
    };

    // Load admin dashboard statistics
    const loadAdminStats = async () => {
        if (!isAdmin) return;

        setLoadingAdminStats(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/dashboard`, {
                headers: requestHeaders,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load statistics.");
            }

            setAdminStats({
                users: data.users || {},
                tickets: data.tickets || {},
            });
        } catch (error) {
            setUserMessage(error.message || "Unable to load statistics.");
        } finally {
            setLoadingAdminStats(false);
        }
    };

    useEffect(() => {
        loadTickets();
        loadStaff();

        if (user?.role === "admin") {
            loadUsers();
            loadAdminStats();
        }
        // Load initial data when the logged-in role is established.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.role]);

    // Open ticket details
    const openTicket = (ticket) => {
        setSelectedTicket(ticket);
        setSelectedStaff(ticket.assigned_to ? String(ticket.assigned_to) : "");
        setSelectedStatus(ticket.status || "Pending");
        setResolution(ticket.resolution || "");
        setActionMessage("");
        setActivePage("tickets");
    };

    // Assign ticket
    const assignTicket = async () => {
        if (!selectedTicket || !selectedStaff) {
            setActionMessage("Please select an IT staff member.");
            return;
        }

        setSaving(true);
        setActionMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/tickets/${selectedTicket.id}/assign`,
                {
                    method: "PUT",
                    headers: requestHeaders,
                    body: JSON.stringify({
                        assigned_to: Number(selectedStaff),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to assign ticket.");
            }

            setActionMessage(data.message || "Ticket assigned successfully.");
            await loadTickets();

            setSelectedTicket((previous) =>
                previous
                    ? { ...previous, assigned_to: Number(selectedStaff) }
                    : previous
            );
        } catch (error) {
            setActionMessage(error.message || "Unable to assign ticket.");
        } finally {
            setSaving(false);
        }
    };

    // Update ticket status
    const updateTicketStatus = async () => {
        if (!selectedTicket || !selectedStatus) return;

        setSaving(true);
        setActionMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/tickets/${selectedTicket.id}/status`,
                {
                    method: "PUT",
                    headers: requestHeaders,
                    body: JSON.stringify({
                        status: selectedStatus,
                        resolution: resolution.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update ticket.");
            }

            setActionMessage(data.message || "Ticket status updated.");
            await loadTickets();

            setSelectedTicket((previous) =>
                previous
                    ? {
                          ...previous,
                          status: selectedStatus,
                          resolution: resolution.trim(),
                      }
                    : previous
            );
        } catch (error) {
            setActionMessage(error.message || "Unable to update ticket.");
        } finally {
            setSaving(false);
        }
    };

    // Change account status
    const updateUserStatus = async (account) => {
        if (!isAdmin) return;

        const nextStatus =
            account.status === "active" ? "inactive" : "active";

        if (
            Number(account.id) === Number(user.id) &&
            nextStatus !== account.status
        ) {
            setUserMessage("You cannot change your own account status.");
            return;
        }

        setUpdatingUserId(account.id);
        setUserMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users/${account.id}/status`,
                {
                    method: "PUT",
                    headers: requestHeaders,
                    body: JSON.stringify({ status: nextStatus }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update status.");
            }

            setUserMessage(data.message || "Account status updated.");
            await loadUsers();
            await loadAdminStats();
        } catch (error) {
            setUserMessage(error.message || "Unable to update status.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Change account role
    const updateUserRole = async (account, nextRole) => {
        if (!isAdmin) return;

        if (Number(account.id) === Number(user.id)) {
            setUserMessage("You cannot change your own role.");
            return;
        }

        if (account.role === nextRole) return;

        setUpdatingUserId(account.id);
        setUserMessage("");

        try {
            const response = await fetch(
                `${API_URL}/api/admin/users/${account.id}/role`,
                {
                    method: "PUT",
                    headers: requestHeaders,
                    body: JSON.stringify({ role: nextRole }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update role.");
            }

            setUserMessage(data.message || "User role updated.");
            await loadUsers();
        } catch (error) {
            setUserMessage(error.message || "Unable to update role.");
        } finally {
            setUpdatingUserId(null);
        }
    };

    // Ticket counts
    const pendingCount = tickets.filter(
        (ticket) => ticket.status === "Pending"
    ).length;

    const inProgressCount = tickets.filter(
        (ticket) => ticket.status === "In Progress"
    ).length;

    const resolvedCount = tickets.filter(
        (ticket) => ticket.status === "Resolved"
    ).length;

    const closedCount = tickets.filter(
        (ticket) => ticket.status === "Closed"
    ).length;

    const getPageTitle = () => {
        if (activePage === "dashboard") {
            return isAdmin ? "Admin Dashboard" : "IT Staff Dashboard";
        }

        if (activePage === "tickets") return "Ticket Management";
        if (activePage === "users") return "User Management";
        if (activePage === "reports") return "Reports";

        return "Dashboard";
    };

    const renderDashboard = () => (
        <>
            {isAdmin && (
                <section className="staff-card">
                    <div className="staff-card-header">
                        <div>
                            <h2>System Overview</h2>
                            <p>Overview of users and support tickets.</p>
                        </div>

                        <button
                            type="button"
                            className="staff-primary-button"
                            onClick={() => {
                                loadAdminStats();
                                loadTickets();
                            }}
                        >
                            Refresh
                        </button>
                    </div>

                    {loadingAdminStats ? (
                        <p>Loading system statistics...</p>
                    ) : (
                        <div className="staff-stats-grid">
                            <div className="staff-stat-card">
                                <span>Total Users</span>
                                <strong>
                                    {Number(adminStats.users.total_users || 0)}
                                </strong>
                            </div>

                            <div className="staff-stat-card">
                                <span>Active Users</span>
                                <strong>
                                    {Number(adminStats.users.active_users || 0)}
                                </strong>
                            </div>

                            <div className="staff-stat-card">
                                <span>Inactive Users</span>
                                <strong>
                                    {Number(adminStats.users.inactive_users || 0)}
                                </strong>
                            </div>

                            <div className="staff-stat-card">
                                <span>Total Tickets</span>
                                <strong>
                                    {Number(adminStats.tickets.total_tickets || 0)}
                                </strong>
                            </div>
                        </div>
                    )}
                </section>
            )}

            <section className="staff-card">
                <div className="staff-card-header">
                    <div>
                        <h2>Ticket Overview</h2>
                        <p>Current support ticket statistics.</p>
                    </div>
                </div>

                <div className="staff-stats-grid">
                    <div className="staff-stat-card">
                        <span>Total Tickets</span>
                        <strong>{tickets.length}</strong>
                    </div>

                    <div className="staff-stat-card">
                        <span>Pending</span>
                        <strong>{pendingCount}</strong>
                    </div>

                    <div className="staff-stat-card">
                        <span>In Progress</span>
                        <strong>{inProgressCount}</strong>
                    </div>

                    <div className="staff-stat-card">
                        <span>Resolved</span>
                        <strong>{resolvedCount}</strong>
                    </div>
                </div>
            </section>

            <section className="staff-card">
                <div className="staff-card-header">
                    <div>
                        <h2>Recent Tickets</h2>
                        <p>Select a ticket to view its details.</p>
                    </div>

                    <button
                        type="button"
                        className="staff-primary-button"
                        onClick={() => {
                            setActivePage("tickets");
                            loadTickets();
                        }}
                    >
                        View All
                    </button>
                </div>

                {loading ? (
                    <p>Loading tickets...</p>
                ) : tickets.length === 0 ? (
                    <div className="staff-empty">
                        <h3>No tickets yet</h3>
                    </div>
                ) : (
                    <div className="staff-table-wrapper">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Subject</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickets.slice(0, 5).map((ticket) => (
                                    <tr
                                        key={ticket.id}
                                        onClick={() => openTicket(ticket)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td>{ticket.id}</td>
                                        <td>
                                            {ticket.subject ||
                                                ticket.title ||
                                                ticket.ticket_title ||
                                                ticket.description ||
                                                `Ticket #${ticket.id}`}
                                        </td>
                                        <td>{ticket.priority || "—"}</td>
                                        <td>{ticket.status || "—"}</td>
                                        <td>
                                            {ticket.created_at
                                                ? new Date(
                                                      ticket.created_at
                                                  ).toLocaleDateString()
                                                : "—"}
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

    const renderTickets = () => (
        <section className="staff-card">
            {selectedTicket ? (
                <>
                    <div className="staff-card-header">
                        <div>
                            <h2>Ticket #{selectedTicket.id}</h2>
                            <p>
                                {selectedTicket.subject ||
                                    selectedTicket.title ||
                                    selectedTicket.description ||
                                    "Ticket details"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedTicket(null)}
                        >
                            Back to Tickets
                        </button>
                    </div>

                    <div className="staff-ticket-details">
                        <p>
                            <strong>Requester:</strong>{" "}
                            {selectedTicket.full_name ||
                                selectedTicket.requester_name ||
                                selectedTicket.user_name ||
                                "—"}
                        </p>
                        <p>
                            <strong>Category:</strong>{" "}
                            {selectedTicket.category || "—"}
                        </p>
                        <p>
                            <strong>Priority:</strong>{" "}
                            {selectedTicket.priority || "—"}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            {selectedTicket.status || "—"}
                        </p>
                        <p>
                            <strong>Description:</strong>{" "}
                            {selectedTicket.description || "No description."}
                        </p>
                    </div>

                    <div className="staff-form-group">
                        <label htmlFor="assignStaff">Assign IT Staff</label>
                        <select
                            id="assignStaff"
                            value={selectedStaff}
                            onChange={(event) =>
                                setSelectedStaff(event.target.value)
                            }
                        >
                            <option value="">Select IT staff</option>
                            {staffList.map((staff) => (
                                <option key={staff.id} value={staff.id}>
                                    {staff.full_name || staff.name || staff.email}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            disabled={saving || !selectedStaff}
                            onClick={assignTicket}
                        >
                            {saving ? "Saving..." : "Assign Ticket"}
                        </button>
                    </div>

                    <div className="staff-form-group">
                        <label htmlFor="ticketStatus">Update Status</label>
                        <select
                            id="ticketStatus"
                            value={selectedStatus}
                            onChange={(event) =>
                                setSelectedStatus(event.target.value)
                            }
                        >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                        </select>

                        <label htmlFor="resolution">Resolution Notes</label>
                        <textarea
                            id="resolution"
                            rows="4"
                            value={resolution}
                            onChange={(event) =>
                                setResolution(event.target.value)
                            }
                            placeholder="Enter resolution details..."
                        />

                        <button
                            type="button"
                            disabled={saving}
                            onClick={updateTicketStatus}
                        >
                            {saving ? "Saving..." : "Update Ticket"}
                        </button>
                    </div>

                    {actionMessage && (
                        <p role="status" aria-live="polite">
                            {actionMessage}
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div className="staff-card-header">
                        <div>
                            <h2>Ticket Management</h2>
                            <p>Review, assign, and update support tickets.</p>
                        </div>

                        <button
                            type="button"
                            className="staff-primary-button"
                            onClick={loadTickets}
                        >
                            Refresh
                        </button>
                    </div>

                    {message && (
                        <p role="alert">
                            {message}
                        </p>
                    )}

                    {loading ? (
                        <p>Loading tickets...</p>
                    ) : tickets.length === 0 ? (
                        <div className="staff-empty">
                            <h3>No tickets found</h3>
                        </div>
                    ) : (
                        <div className="staff-table-wrapper">
                            <table className="staff-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Subject</th>
                                        <th>Requester</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>{ticket.id}</td>
                                            <td>
                                                {ticket.subject ||
                                                    ticket.title ||
                                                    ticket.ticket_title ||
                                                    `Ticket #${ticket.id}`}
                                            </td>
                                            <td>
                                                {ticket.full_name ||
                                                    ticket.requester_name ||
                                                    ticket.user_name ||
                                                    "—"}
                                            </td>
                                            <td>{ticket.priority || "—"}</td>
                                            <td>{ticket.status || "—"}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openTicket(ticket)
                                                    }
                                                >
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </section>
    );

    const renderUsers = () => {
        if (!isAdmin) {
            return (
                <section className="staff-card">
                    <h2>Access Denied</h2>
                    <p>Only administrators can manage users.</p>
                </section>
            );
        }

        return (
            <section className="staff-card">
                <div className="staff-card-header">
                    <div>
                        <h2>User Management</h2>
                        <p>Manage registered accounts, roles, and status.</p>
                    </div>

                    <button
                        type="button"
                        className="staff-primary-button"
                        onClick={loadUsers}
                        disabled={loadingUsers}
                    >
                        {loadingUsers ? "Loading..." : "Refresh Users"}
                    </button>
                </div>

                {userMessage && (
                    <p role="status" aria-live="polite">
                        {userMessage}
                    </p>
                )}

                {loadingUsers ? (
                    <p>Loading users...</p>
                ) : users.length === 0 ? (
                    <div className="staff-empty">
                        <h3>No users found</h3>
                        <p>Refresh to try loading users again.</p>
                    </div>
                ) : (
                    <div className="staff-table-wrapper">
                        <table className="staff-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Account Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((account) => {
                                    const isSelf =
                                        Number(account.id) === Number(user.id);
                                    const isUpdating =
                                        updatingUserId === account.id;

                                    return (
                                        <tr key={account.id}>
                                            <td>{account.id}</td>
                                            <td>{account.full_name}</td>
                                            <td>{account.email}</td>

                                            <td>
                                                <select
                                                    value={account.role}
                                                    disabled={isSelf || isUpdating}
                                                    onChange={(event) =>
                                                        updateUserRole(
                                                            account,
                                                            event.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="user">
                                                        User
                                                    </option>
                                                    <option value="it_staff">
                                                        IT Staff
                                                    </option>
                                                    <option value="admin">
                                                        Admin
                                                    </option>
                                                </select>
                                            </td>

                                            <td>{account.status}</td>

                                            <td>
                                                <button
                                                    type="button"
                                                    disabled={isSelf || isUpdating}
                                                    onClick={() =>
                                                        updateUserStatus(account)
                                                    }
                                                >
                                                    {isUpdating
                                                        ? "Saving..."
                                                        : account.status === "active"
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        );
    };

    const renderReports = () => (
        <section className="staff-card">
            <div className="staff-card-header">
                <div>
                    <h2>Reports</h2>
                    <p>Current ticket summary.</p>
                </div>

                <button
                    type="button"
                    className="staff-primary-button"
                    onClick={() => {
                        loadTickets();
                        if (isAdmin) loadAdminStats();
                    }}
                >
                    Refresh Reports
                </button>
            </div>

            <div className="staff-stats-grid">
                <div className="staff-stat-card">
                    <span>Total Tickets</span>
                    <strong>
                        {isAdmin
                            ? Number(
                                  adminStats.tickets.total_tickets ??
                                      tickets.length
                              )
                            : tickets.length}
                    </strong>
                </div>

                <div className="staff-stat-card">
                    <span>Pending</span>
                    <strong>
                        {isAdmin
                            ? Number(
                                  adminStats.tickets.pending_tickets ??
                                      pendingCount
                              )
                            : pendingCount}
                    </strong>
                </div>

                <div className="staff-stat-card">
                    <span>In Progress</span>
                    <strong>
                        {isAdmin
                            ? Number(
                                  adminStats.tickets.in_progress_tickets ??
                                      inProgressCount
                              )
                            : inProgressCount}
                    </strong>
                </div>

                <div className="staff-stat-card">
                    <span>Resolved</span>
                    <strong>
                        {isAdmin
                            ? Number(
                                  adminStats.tickets.resolved_tickets ??
                                      resolvedCount
                              )
                            : resolvedCount}
                    </strong>
                </div>

                <div className="staff-stat-card">
                    <span>Closed</span>
                    <strong>
                        {isAdmin
                            ? Number(
                                  adminStats.tickets.closed_tickets ??
                                      closedCount
                              )
                            : closedCount}
                    </strong>
                </div>
            </div>

            {isAdmin && (
                <div className="staff-stats-grid">
                    <div className="staff-stat-card">
                        <span>Total Users</span>
                        <strong>
                            {Number(adminStats.users.total_users || 0)}
                        </strong>
                    </div>

                    <div className="staff-stat-card">
                        <span>Active Users</span>
                        <strong>
                            {Number(adminStats.users.active_users || 0)}
                        </strong>
                    </div>

                    <div className="staff-stat-card">
                        <span>Inactive Users</span>
                        <strong>
                            {Number(adminStats.users.inactive_users || 0)}
                        </strong>
                    </div>
                </div>
            )}
        </section>
    );

    return (
        <div className="staff-dashboard">
            <aside className="staff-sidebar">
                <div className="staff-sidebar-brand">
                    <h2>FaultLiNE</h2>
                    <p>Support Management</p>
                </div>

                <nav className="staff-sidebar-nav">
                    <button
                        type="button"
                        className={
                            activePage === "dashboard" ? "active" : ""
                        }
                        onClick={() => setActivePage("dashboard")}
                    >
                        Dashboard
                    </button>

                    <button
                        type="button"
                        className={activePage === "tickets" ? "active" : ""}
                        onClick={() => {
                            setActivePage("tickets");
                            setSelectedTicket(null);
                            loadTickets();
                        }}
                    >
                        Tickets
                    </button>

                    {isAdmin && (
                        <button
                            type="button"
                            className={activePage === "users" ? "active" : ""}
                            onClick={() => {
                                setActivePage("users");
                                loadUsers();
                            }}
                        >
                            Users
                        </button>
                    )}

                    <button
                        type="button"
                        className={activePage === "reports" ? "active" : ""}
                        onClick={() => setActivePage("reports")}
                    >
                        Reports
                    </button>
                </nav>

                <div className="staff-sidebar-footer">
                    <p>{user?.full_name || user?.email || "Account"}</p>
                    <small>
                        {isAdmin ? "Administrator" : "IT Staff"}
                    </small>

                    <button
                        type="button"
                        className="staff-logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            <main className="staff-main">
                <header className="staff-topbar">
                    <div>
                        <h1>{getPageTitle()}</h1>
                        <p>
                            Welcome back,{" "}
                            {user?.full_name || user?.email || "User"}.
                        </p>
                    </div>
                </header>

                <div className="staff-content">
                    {activePage === "dashboard" && renderDashboard()}
                    {activePage === "tickets" && renderTickets()}
                    {activePage === "users" && renderUsers()}
                    {activePage === "reports" && renderReports()}
                </div>
            </main>
        </div>
    );
}

export default StaffDashboard;
