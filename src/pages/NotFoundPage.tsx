import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div className="page-wrap" style={{ display: "flex", minHeight: "calc(100vh - 60px)", alignItems: "center", justifyContent: "center" }}>
            <div className="card" style={{ maxWidth: 480, padding: "3rem", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 48 }}>🧭</div>
                <h1 style={{ marginTop: 12, fontSize: "1.75rem", fontWeight: 700, color: "#fff" }}>Page not found</h1>
                <p style={{ marginTop: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/" className="btn-primary" style={{ marginTop: 20, padding: "0.625rem 1.25rem", display: "inline-block", textDecoration: "none" }}>
                    Go Home
                </Link>
            </div>
        </div>
    );
}
