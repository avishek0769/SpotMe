import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface AppShellProps { children: ReactNode; }

/* ── Sun icon ────────────────────────────────────────────────────────── */
function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}

/* ── Moon icon ───────────────────────────────────────────────────────── */
function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
    );
}

export function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const { user } = useAppContext();
    const onAuth = location.pathname === "/login" || location.pathname === "/signup";
    const isHome = location.pathname === "/";

    const [dark, setDark] = useState<boolean>(() => {
        try { return localStorage.getItem("sm-theme") === "dark"; } catch { return false; }
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        try { localStorage.setItem("sm-theme", dark ? "dark" : "light"); } catch { /* noop */ }
    }, [dark]);

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
                                        className={`nav-link${location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/events/") ? " active" : ""}`}
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
