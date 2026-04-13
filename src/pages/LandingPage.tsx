import { Link } from "react-router-dom";

export function LandingPage() {
    return (
        <div className="page-wrap" style={{ display: "flex", alignItems: "center", minHeight: "calc(100vh - 60px)" }}>
            <div style={{ width: "100%" }}>
                <div style={{ maxWidth: 640 }}>
                    <span style={{
                        display: "inline-block", fontSize: "0.6875rem", fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        padding: "0.3rem 0.75rem", borderRadius: 999,
                        border: "1px solid var(--border)", background: "var(--surface)",
                        color: "var(--text-secondary)",
                    }}>
                        AI-Powered Photo Matching
                    </span>

                    <h1 style={{
                        marginTop: 20, fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                        fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em",
                        color: "#fff",
                    }}>
                        Find yourself in
                        <br />
                        <span style={{ color: "var(--accent-hover)" }}>event photos</span>
                    </h1>

                    <p style={{
                        marginTop: 16, fontSize: "1.125rem", lineHeight: 1.6,
                        color: "var(--text-secondary)", maxWidth: 520,
                    }}>
                        Upload a selfie, let AI match your face across hundreds of event photos. 
                        Photographers manage events, guests find their moments — instantly.
                    </p>

                    <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <Link to="/signup" className="btn-primary" style={{ padding: "0.75rem 1.5rem", textDecoration: "none", fontSize: "0.9375rem" }}>
                            Get Started
                        </Link>
                        <Link to="/login" className="btn-secondary" style={{ padding: "0.75rem 1.5rem", textDecoration: "none", fontSize: "0.9375rem" }}>
                            Sign In
                        </Link>
                    </div>
                </div>

                <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    {[
                        { icon: "📸", title: "Upload Photos", desc: "Drag & drop event photos with S3-powered uploads" },
                        { icon: "🤖", title: "AI Face Matching", desc: "Vector-based facial recognition powered by Qdrant" },
                        { icon: "🔗", title: "Share Access", desc: "Generate guest links with configurable access levels" },
                        { icon: "📥", title: "Download", desc: "Download your matched collection as a zip" },
                    ].map((f) => (
                        <div key={f.title} className="card" style={{ padding: "1.25rem" }}>
                            <div style={{ fontSize: 24 }}>{f.icon}</div>
                            <h3 style={{ marginTop: 8, fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>{f.title}</h3>
                            <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
