import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface AppShellProps { children: ReactNode; }

export function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const { user } = useAppContext();
    const onAuth = location.pathname === "/login" || location.pathname === "/signup";

    return (
        <div style={{ minHeight: "100vh" }}>
            <header
                style={{
                    position: "sticky", top: 0, zIndex: 40,
                    borderBottom: "1px solid var(--border)",
                    background: "rgba(9,13,20,0.85)",
                    backdropFilter: "blur(16px)",
                }}
            >
                <div
                    style={{
                        margin: "0 auto", display: "flex", alignItems: "center",
                        justifyContent: "space-between", maxWidth: 1180,
                        height: 60, padding: "0 1.25rem",
                    }}
                >
                    <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 14, fontWeight: 800, color: "#fff",
                        }}>S</div>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                            SpotMe
                        </span>
                    </Link>

                    <nav style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem" }}>
                        <Link
                            to="/"
                            style={{
                                padding: "0.4rem 0.75rem", borderRadius: 8,
                                textDecoration: "none",
                                color: location.pathname === "/" ? "#fff" : "var(--text-secondary)",
                                background: location.pathname === "/" ? "var(--surface-elevated)" : "transparent",
                            }}
                        >Home</Link>
                        {user ? (
                            <Link
                                to="/dashboard"
                                style={{
                                    padding: "0.4rem 0.75rem", borderRadius: 8,
                                    textDecoration: "none",
                                    color: (location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/events/"))
                                        ? "#fff" : "var(--text-secondary)",
                                    background: (location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/events/"))
                                        ? "var(--surface-elevated)" : "transparent",
                                }}
                            >Dashboard</Link>
                        ) : null}
                        {!user && !onAuth ? (
                            <Link to="/login" className="btn-secondary" style={{ padding: "0.4rem 0.875rem", textDecoration: "none" }}>
                                Log In
                            </Link>
                        ) : null}
                    </nav>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
}
