import { useEffect, useState } from "react";
import "./App.css";
import StaffDashboard from "./StaffDashboard";

function App() {
    const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
const [message, setMessage] = useState("");


const [authMode, setAuthMode] = useState("login");
const [fullName, setFullName] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [authSubmitting, setAuthSubmitting] = useState(false);
const [otpOpen, setOtpOpen] = useState(false);
const [otpEmail, setOtpEmail] = useState("");
const [otpCode, setOtpCode] = useState("");
const [otpMessage, setOtpMessage] = useState("");
const [otpSubmitting, setOtpSubmitting] = useState(false);
const [otpExpiresAt, setOtpExpiresAt] = useState(null);
const [otpSeconds, setOtpSeconds] = useState(0);

useEffect(() => {
    if (!otpOpen || !otpExpiresAt) return;
    const updateCountdown = () => {
        setOtpSeconds(Math.max(0, Math.ceil((otpExpiresAt - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
}, [otpOpen, otpExpiresAt]);

const openOtpPopup = (address, notice = "Enter the code sent to your email.") => {
    setOtpEmail(address);
    setOtpCode("");
    setOtpMessage(notice);
    setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
    setOtpOpen(true);
};

const handleVerifyOtp = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
        setOtpMessage("Please enter a valid 6-digit code.");
        return;
    }
    setOtpSubmitting(true);
    setOtpMessage("");
    try {
        const response = await fetch(
            "https://it-support-ticketing-system.onrender.com/api/auth/verify-email",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: otpEmail, otp: otpCode })
            }
        );
        const data = await response.json();
        if (!response.ok) {
            setOtpMessage(data.message || "Verification failed.");
            return;
        }
        setOtpOpen(false);
        setOtpCode("");
        setOtpEmail("");
        setAuthMode("login");
        setFullName("");
        setPassword("");
        setConfirmPassword("");
        setMessage("Email verified successfully! You can now log in.");
    } catch (error) {
        console.error("OTP verification error:", error);
        setOtpMessage("Cannot connect to the server. Please try again.");
    } finally {
        setOtpSubmitting(false);
    }
};

const handleResendOtp = async () => {
    setOtpSubmitting(true);
    setOtpMessage("");
    try {
        const response = await fetch(
            "https://it-support-ticketing-system.onrender.com/api/auth/resend-otp",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: otpEmail })
            }
        );
        const data = await response.json();
        if (!response.ok) {
            setOtpMessage(data.message || "Could not resend the code.");
            return;
        }
        setOtpCode("");
        setOtpExpiresAt(Date.now() + 5 * 60 * 1000);
        setOtpMessage("A new verification code has been requested. Check your email.");
    } catch (error) {
        console.error("Resend OTP error:", error);
        setOtpMessage("Cannot connect to the server. Please try again.");
    } finally {
        setOtpSubmitting(false);
    }
};
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

const [comments, setComments] = useState([]);
const [commentText, setCommentText] = useState("");
const [loadingComments, setLoadingComments] = useState(false);
const [commentMessage, setCommentMessage] = useState("");
const [sendingComment, setSendingComment] = useState(false);


const [notifications, setNotifications] = useState([]);
const [loadingNotifications, setLoadingNotifications] = useState(false);
const [notificationMessage, setNotificationMessage] = useState("");
const [markingReadId, setMarkingReadId] = useState(null);

const unreadCount = notifications.filter(
    (notification) => Number(notification.is_read) === 0
).length;


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
// LOAD COMMENTS
// ========================================

useEffect(() => {
    if (!selectedTicket) {
        setComments([]);
        setCommentText("");
        setCommentMessage("");
        return;
    }

    loadComments(selectedTicket.id);

}, [selectedTicket]);


    // ========================================
// COMMENTS
// ========================================
const loadComments = async (ticketId) => {
    if (!ticketId) {
        return;
    }

    setLoadingComments(true);
    setCommentMessage("");

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://it-support-ticketing-system.onrender.com/api/comments/${ticketId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setCommentMessage(
                data.message || "Failed to load comments."
            );
            return;
        }

        setComments(data.comments || []);

    } catch (error) {
        console.error(
            "Load comments error:",
            error
        );

        setCommentMessage(
            "Cannot connect to the server."
        );

    } finally {
        setLoadingComments(false);
    }
};


const sendComment = async () => {
    if (!selectedTicket) {
        return;
    }

    if (!commentText.trim()) {
        setCommentMessage(
            "Please enter a comment."
        );
        return;
    }

    setSendingComment(true);
    setCommentMessage("");

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://it-support-ticketing-system.onrender.com/api/comments/${selectedTicket.id}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    comment: commentText.trim()
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            setCommentMessage(
                data.message || "Failed to add comment."
            );
            return;
        }

        setCommentText("");

        await loadComments(
            selectedTicket.id
        );

    } catch (error) {
        console.error(
            "Send comment error:",
            error
        );

        setCommentMessage(
            "Cannot connect to the server."
        );

    } finally {
        setSendingComment(false);
    }
};

    // ========================================
    // LOAD NOTIFICATIONS
    // ========================================
    const loadNotifications = async () => {
        setLoadingNotifications(true);
        setNotificationMessage("");

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                "https://it-support-ticketing-system.onrender.com/api/notifications",
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setNotificationMessage(
                    data.message || "Failed to load notifications."
                );
                return;
            }

            setNotifications(data.notifications || []);
        } catch (error) {
            console.error("Load notifications error:", error);
            setNotificationMessage(
                "Cannot connect to the server while loading notifications."
            );
        } finally {
            setLoadingNotifications(false);
        }
    };

    // ========================================
    // MARK NOTIFICATION AS READ
    // ========================================
    const markNotificationAsRead = async (notificationId) => {
        setMarkingReadId(notificationId);
        setNotificationMessage("");

        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `https://it-support-ticketing-system.onrender.com/api/notifications/${notificationId}/read`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setNotificationMessage(
                    data.message || "Failed to mark notification as read."
                );
                return;
            }

            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) =>
                    String(notification.id) === String(notificationId)
                        ? { ...notification, is_read: 1 }
                        : notification
                )
            );
        } catch (error) {
            console.error("Mark notification as read error:", error);
            setNotificationMessage(
                "Cannot connect to the server."
            );
        } finally {
            setMarkingReadId(null);
        }
    };
    
    // ========================================
    // LOAD NOTIFICATIONS WHEN PAGE OPENS
    // ========================================
    useEffect(() => {
        if (user && activePage === "notifications") {
            loadNotifications();
        }
    }, [user, activePage]);


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

const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
    }

    if (password.length < 8) {
        setMessage("Password must be at least 8 characters.");
        return;
    }

    setAuthSubmitting(true);

    try {
        const response = await fetch(
            "https://it-support-ticketing-system.onrender.com/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: fullName.trim(),
                    email: email.trim(),
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (data.requires_verification) {
                openOtpPopup(data.email || email.trim(), data.message || "Your account needs email verification. You can resend the code.");
                return;
            }
            setMessage(data.message || "Registration failed.");
            return;
        }

        if (data.requires_verification) {
            openOtpPopup(data.email || email.trim());
            setPassword("");
            setConfirmPassword("");
            return;
        }

        setMessage(data.message || "Account created successfully! You can now log in.");
        setAuthMode("login");
        setFullName("");
        setPassword("");
        setConfirmPassword("");
    } catch (error) {
        console.error("Registration error:", error);
        setMessage("Cannot connect to the server. Please try again.");
    } finally {
        setAuthSubmitting(false);
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
    const isRegister = authMode === "register";

    return (
        <div className="login-page fl-auth-page">
            <div className="fl-orbit fl-orbit-one" aria-hidden="true" />
            <div className="fl-orbit fl-orbit-two" aria-hidden="true" />
            <div className="fl-auth-layout">
                <section className="fl-hero" aria-label="FaultLiNE IT support platform">
                    <div className="fl-hero-eyebrow"><span className="fl-live-dot" /> FAULTLINE SYSTEMS / ONLINE</div>
                    <h2>IT support, <span>reimagined.</span></h2>
                    <p className="fl-hero-description">Report issues. Track requests. Get back to what matters — with one connected support workspace.</p>
                    <div className="fl-robot-scene" aria-hidden="true">
                        <div className="fl-robot-halo" />
                        <div className="fl-robot">
                            <div className="fl-robot-antenna"><i /></div>
                            <div className="fl-robot-head">
                                <div className="fl-robot-face"><span className="fl-eye" /><span className="fl-eye" /><span className="fl-mouth" /></div>
                            </div>
                            <div className="fl-robot-neck" />
                            <div className="fl-robot-body"><span className="fl-robot-core">FL</span><span className="fl-robot-body-line" /></div>
                            <div className="fl-robot-arm fl-robot-arm-left" /><div className="fl-robot-arm fl-robot-arm-right" />
                        </div>
                        <div className="fl-floating-chip fl-chip-left"><span>●</span> SYSTEM SECURE</div>
                        <div className="fl-floating-chip fl-chip-right"><span>✦</span> SUPPORT ACTIVE</div>
                        <div className="fl-robot-shadow" />
                    </div>
                    <div className="fl-hero-features"><span>✧ Real-time tracking</span><span>✧ Secure verification</span><span>✧ Faster resolutions</span></div>
                </section>
                <div className="login-card auth-card" key={authMode}>
                <div className="login-header">
                    <div className="auth-logo">FL</div>
                    <h1>FaultLiNE</h1>
                    <p>IT Support & Ticketing</p>
                    <span>
                        {isRegister
                            ? "Create your account to get started"
                            : "Welcome back. Sign in to continue"}
                    </span>
                </div>

                <div className="auth-toggle">
                    <button
                        type="button"
                        className={!isRegister ? "auth-tab active" : "auth-tab"}
                        onClick={() => {
                            setAuthMode("login");
                            setMessage("");
                        }}
                    >
                        Login
                    </button>

                    <button
                        type="button"
                        className={isRegister ? "auth-tab active" : "auth-tab"}
                        onClick={() => {
                            setAuthMode("register");
                            setMessage("");
                        }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={isRegister ? handleRegister : handleLogin}>
                    {isRegister && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="fl-password">Password</label>
                        <div className="password-wrapper">
                            <input
                                id="fl-password"
                                type={showPassword ? "text" : "password"}
                                placeholder={isRegister ? "At least 8 characters" : "Enter your password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete={isRegister ? "new-password" : "current-password"}
                                minLength={isRegister ? 8 : undefined}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword((current) => !current)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                aria-pressed={showPassword}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {isRegister && (
                        <div className="form-group">
                            <label htmlFor="fl-confirm-password">Confirm Password</label>
                            <div className="password-wrapper">
                                <input
                                    id="fl-confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Re-enter your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword((current) => !current)}
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    aria-pressed={showConfirmPassword}
                                >
                                    {showConfirmPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        className="login-button"
                        type="submit"
                        disabled={authSubmitting}
                    >
                        {authSubmitting
                            ? "Creating account..."
                            : isRegister
                                ? "Create Account"
                                : "Login"}
                    </button>
                </form>

                {message && (
                    <div className="message" role="status">
                        {message}
                    </div>
                )}

                <p className="auth-footer">
                    {isRegister
                        ? "Already have an account?"
                        : "New to FaultLiNE?"}{" "}
                    <button
                        type="button"
                        className="auth-link"
                        onClick={() => {
                            setAuthMode(isRegister ? "login" : "register");
                            setMessage("");
                        }}
                    >
                        {isRegister ? "Login here" : "Create an account"}
                    </button>
                </p>
                </div>
            </div>
            {otpOpen && (
                <div className="otp-overlay" onClick={() => setOtpOpen(false)}>
                    <section
                        className="otp-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="otp-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button className="otp-close" type="button" aria-label="Close verification popup" onClick={() => setOtpOpen(false)}>×</button>
                        <div className="otp-shield">✉</div>
                        <h2 id="otp-title">Verify your email</h2>
                        <p>Enter the 6-digit code sent to <strong>{otpEmail}</strong>.</p>
                        <form onSubmit={handleVerifyOtp}>
                            <input
                                className="otp-input"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="000000"
                                aria-label="6-digit verification code"
                                value={otpCode}
                                onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                                required
                                autoFocus
                            />
                            <p className="otp-timer">{otpSeconds > 0 ? `Expires in ${Math.floor(otpSeconds / 60)}:${String(otpSeconds % 60).padStart(2, "0")}` : "Code may have expired. Request a new one."}</p>
                            <button className="otp-verify" type="submit" disabled={otpSubmitting || otpCode.length !== 6}>
                                {otpSubmitting ? "Please wait..." : "Verify Email"}
                            </button>
                        </form>
                        {otpMessage && <p className="otp-feedback" role="status">{otpMessage}</p>}
                        <button className="otp-resend" type="button" onClick={handleResendOtp} disabled={otpSubmitting}>Resend Code</button>
                    </section>
                </div>
            )}
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
                        <section className="fl-dashboard-welcome">
                            <div>
                                <span className="fl-welcome-tag"><span className="fl-live-dot" /> YOUR SUPPORT HUB</span>
                                <h2>Everything running smoothly?</h2>
                                <p>We're here when you need a hand. Submit a request or check the status of your tickets.</p>
                                <button type="button" className="fl-welcome-action" onClick={() => setActivePage("submit")}>+ Create support ticket <span aria-hidden="true">↗</span></button>
                            </div>
                            <div className="fl-welcome-art" aria-hidden="true"><div className="fl-welcome-ring"><span>FL</span></div><i className="fl-welcome-spark fl-spark-a" /><i className="fl-welcome-spark fl-spark-b" /></div>
                        </section>
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


    <div className="ticket-detail-section">

        <h3>
            Comments
        </h3>

        {loadingComments ? (

            <p>
                Loading comments...
            </p>

        ) : comments.length === 0 ? (

            <p>
                No comments yet.
            </p>

        ) : (

            <div className="comments-list">

                {comments.map((comment) => (

                    <div
                        className="comment-item"
                        key={comment.id}
                    >

                        <div className="comment-header">

                            <strong>
                                {comment.full_name}
                            </strong>

                            <span>
                                {comment.role}
                            </span>

                        </div>

                        <p>
                            {comment.comment}
                        </p>

                        <small>
                            {new Date(
                                comment.created_at
                            ).toLocaleString()}
                        </small>

                    </div>

                ))}

            </div>

        )}

        <div className="comment-form">

            <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) =>
                    setCommentText(
                        e.target.value
                    )
                }
                rows="4"
            />

            <button
                className="submit-button"
                type="button"
                onClick={sendComment}
                disabled={sendingComment}
            >
                {sendingComment
                    ? "Sending..."
                    : "Send Comment"}
            </button>

        </div>


        {commentMessage && (

            <div className="message">
                {commentMessage}
            </div>

        )}

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
                    <h2>Notifications</h2>
                    <p>
                        You have {unreadCount} unread notification(s).
                    </p>
                </div>

                <button
                    type="button"
                    className="quick-action"
                    onClick={loadNotifications}
                    disabled={loadingNotifications}
                >
                    {loadingNotifications ? "Loading..." : "Refresh"}
                </button>
            </div>

            {notificationMessage && (
                <div className="message" role="alert">
                    {notificationMessage}
                </div>
            )}

            {loadingNotifications && notifications.length === 0 ? (
                <div className="empty-state">
                    <h3>Loading Notifications...</h3>
                    <p>Please wait.</p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">N</div>
                    <h3>No Notifications</h3>
                    <p>
                        Notifications will appear here when available.
                    </p>
                </div>
            ) : (
                <div className="notification-list">
                    {notifications.map((notification) => (
                        <article
                            key={notification.id}
                            className="content-card"
                            style={{
                                marginBottom: "12px",
                                borderLeft:
                                    Number(notification.is_read) === 0
                                        ? "4px solid #2563eb"
                                        : "4px solid #d1d5db",
                                opacity:
                                    Number(notification.is_read) === 1
                                        ? 0.75
                                        : 1
                            }}
                        >
                            <p>{notification.message}</p>

                            <small>
                                {notification.created_at
                                    ? new Date(
                                          notification.created_at
                                      ).toLocaleString()
                                    : ""}
                            </small>

                            <div style={{ marginTop: "12px" }}>
                                {Number(notification.is_read) === 0 ? (
                                    <button
                                        type="button"
                                        className="quick-action"
                                        disabled={
                                            markingReadId === notification.id
                                        }
                                        onClick={() =>
                                            markNotificationAsRead(
                                                notification.id
                                            )
                                        }
                                    >
                                        {markingReadId === notification.id
                                            ? "Saving..."
                                            : "Mark as Read"}
                                    </button>
                                ) : (
                                    <span>✓ Read</span>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
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
