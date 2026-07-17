import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface AppShellProps { children: ReactNode; }

/* ── Sun icon ─────────────────────────────────────────────────────────── */
function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

/* ── Moon icon ────────────────────────────────────────────────────────── */
function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAppContext();
    const onAuth = location.pathname === "/login" || location.pathname === "/signup";
    const isHome = location.pathname === "/";
    const isDashboardArea = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/events/");

    async function handleLogout() {
        try { await logout(); navigate("/login"); } catch { /* ignore */ }
    }

    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem("sm-theme") === "dark"; } catch { return false; }
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        try { localStorage.setItem("sm-theme", dark ? "dark" : "light"); } catch { /* noop */ }
    }, [dark]);

    // Derive initials for user avatar
    const userInitial = (user?.fullname || user?.username || user?.email || "?")
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <div style={{ minHeight: "100vh" }}>
            <header className="nav-root">
                <div className="nav-inner">
                    {/* Logo */}
                    <Link to="/" className="nav-logo">
                        <div className="nav-logo-mark">S</div>
                        <span className="nav-logo-text">SpotMe</span>
                    </Link>

                    {/* Nav links */}
                    <nav>
                        <ul className="nav-links">
                            <li>
                                <Link
                                    to="/"
                                    className={`nav-link${isHome ? " active" : ""}`}
                                >
                                    Home
                                </Link>
                            </li>
                            {user && (
                                <li>
                                    <Link
                                        to="/dashboard"
                                        className={`nav-link${isDashboardArea ? " active" : ""}`}
                                    >
                                        Dashboard
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </nav>

                    {/* Actions */}
                    <div className="nav-actions">
                        <button
                            className="theme-toggle"
                            onClick={() => setDark(d => !d)}
                            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                            title={dark ? "Light mode" : "Dark mode"}
                        >
                            {dark ? <SunIcon /> : <MoonIcon />}
                        </button>

                        {/* Logged-in user avatar pill + logout */}
                        {user && (
                            <>
                                <Link
                                    to="/dashboard"
                                    title={user.fullname || user.username || user.email}
                                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                    <span style={{
                                        width: 30, height: 30,
                                        borderRadius: "50%",
                                        background: "var(--ink)",
                                        color: "var(--accent-on)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "13px", fontWeight: 600,
                                        flexShrink: 0,
                                        transition: "opacity 0.15s",
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                                        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                                    >
                                        {userInitial}
                                    </span>
                                    <span style={{
                                        fontSize: "13px", color: "var(--ink-muted)", fontWeight: 500,
                                        maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                    }}>
                                        {user.fullname || user.username}
                                    </span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-secondary btn-sm"
                                    style={{ flexShrink: 0 }}
                                >
                                    Log Out
                                </button>
                            </>
                        )}

                        {/* Guest CTA buttons */}
                        {!user && !onAuth && (
                            <Link to="/login" className="btn btn-secondary btn-sm">
                                Log In
                            </Link>
                        )}
                        {!user && !onAuth && (
                            <Link to="/signup" className="btn btn-primary btn-sm">
                                Get Started
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main>{children}</main>
        </div>
    );
}
