import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)", padding: "24px" }} className="fade-up">
            <div className="card card-xl" style={{ maxWidth: 480, textAlign: "center", width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <div style={{ color: "#ff5600", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <h1 style={{ fontSize: "24px", fontWeight: 500, color: "var(--ink)", marginBottom: "8px" }}>Page not found</h1>
                <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "24px" }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/" className="btn btn-primary" style={{ padding: "10px 20px" }}>
                    Go Home
                </Link>
            </div>
        </div>
    );
}
