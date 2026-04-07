import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const location = useLocation();
    const { currentUser } = useAppContext();

    const onAuthRoute = location.pathname === "/login" || location.pathname === "/signup";

    return (
        <div className="min-h-screen bg-transparent">
            <header className="sticky top-0 z-40 border-b border-[#2a364d] bg-[#0b0f19]/90 backdrop-blur">
                <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-4">
                    <Link to="/" className="text-base font-semibold tracking-tight text-[#e6edf8]">
                        SpotMe
                    </Link>

                    <nav className="flex items-center gap-2 text-sm">
                        <Link
                            to="/"
                            className={`rounded-md px-3 py-2 ${
                                location.pathname === "/" ? "bg-[#1b2841] text-[#f5f8ff]" : "text-[#9aa8c3]"
                            }`}
                        >
                            Home
                        </Link>
                        <Link
                            to="/dashboard"
                            className={`rounded-md px-3 py-2 ${
                                location.pathname.startsWith("/dashboard") ||
                                location.pathname.startsWith("/events/")
                                    ? "bg-[#1b2841] text-[#f5f8ff]"
                                    : "text-[#9aa8c3]"
                            }`}
                        >
                            Dashboard
                        </Link>
                        {!currentUser && !onAuthRoute ? (
                            <Link to="/login" className="btn-secondary px-3 py-2">
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
