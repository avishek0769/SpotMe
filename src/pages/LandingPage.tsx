import { Link } from "react-router-dom";

/* ─── Premium SVG Icons ─────────────────────────────────────────────── */
const Icons = {
    Camera: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Link: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Scan: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Shield: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    EyeOff: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ),
    Trash: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
    ),
    Lock: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Speed: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Cloud: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
        </svg>
    ),
    Smartphone: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
    ),
    Sparkles: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.32 11.32l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
    ),
    Download: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Check: ({ width = 16, height = 16 }: { width?: number; height?: number }) => (
        <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    ShieldAlert: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
};

/* ─── Shared Layout & Typography Styles ──────────────────────────────── */
const styles = {
    section: {
        padding: "96px 24px",
        width: "100%",
        boxSizing: "border-box" as const,
    },
    inner: {
        maxWidth: "1280px",
        margin: "0 auto",
    },
    taglineBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 500,
        color: "#ff5600",
        background: "rgba(255, 86, 0, 0.08)",
        padding: "6px 12px",
        borderRadius: "9999px",
        marginBottom: "24px",
        textTransform: "uppercase" as const,
        letterSpacing: "0.05em",
    },
    h1: {
        fontSize: "clamp(40px, 6vw, 68px)",
        fontWeight: 500,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
        color: "var(--ink)",
        marginBottom: "24px",
    },
    h2: {
        fontSize: "clamp(30px, 4.5vw, 44px)",
        fontWeight: 500,
        lineHeight: 1.15,
        letterSpacing: "-0.02em",
        color: "var(--ink)",
        marginBottom: "20px",
    },
    subhead: {
        fontSize: "clamp(18px, 2.5vw, 20px)",
        fontWeight: 400,
        lineHeight: 1.45,
        color: "var(--ink-muted)",
        maxWidth: "640px",
        marginBottom: "36px",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginTop: "48px",
    }
};

export function LandingPage() {
    return (
        <div style={{ width: "100%", overflow: "hidden" }} className="fade-up">

            {/* ── HERO SECTION ─────────────────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--canvas)", paddingTop: "80px", paddingBottom: "80px" }}>
                <div style={{ ...styles.inner, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "48px", alignItems: "center" }}>
                    
                    {/* Left: Text & Action */}
                    <div>
                        <div style={styles.taglineBadge}>
                            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff5600", display: "inline-block" }}></span>
                            AI Face Recognition
                        </div>
                        <h1 style={styles.h1}>
                            Find yourself in event photos instantly.
                        </h1>
                        <p style={styles.subhead}>
                            Stop scrolling through thousands of photos to find your moments. SpotMe scans galleries using secure AI face-matching, delivering your photos directly to you.
                        </p>
                        
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: "12px 24px" }}>
                                Get Started Free
                            </Link>
                            <Link to="/login" className="btn btn-secondary" style={{ padding: "12px 24px" }}>
                                Sign In
                            </Link>
                        </div>
                        
                        <p style={{ marginTop: "20px", fontSize: "13px", color: "var(--ink-subtle)" }}>
                            No app download required · Secure & private matching
                        </p>
                    </div>

                    {/* Right: Interactive High-Fidelity UI Mockup */}
                    <div style={{
                        background: "var(--surface-1)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-xl)",
                        padding: "24px",
                        boxShadow: "0 8px 30px rgba(0,0,0,0.04)"
                    }}>
                        {/* Mock App Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--hairline-soft)", paddingBottom: "16px", marginBottom: "20px" }}>
                            <div>
                                <span style={{ fontSize: "12px", color: "var(--ink-subtle)", fontWeight: 500 }}>EVENT STREAM</span>
                                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>Summer Festival Gala</h3>
                            </div>
                            <span className="status-pill status-ready">1,420 Photos</span>
                        </div>

                        {/* Interactive Scan Preview Area */}
                        <div style={{
                            background: "var(--canvas)",
                            border: "1px dashed var(--hairline)",
                            borderRadius: "var(--r-lg)",
                            padding: "32px 16px",
                            textAlign: "center",
                            position: "relative",
                            overflow: "hidden",
                            marginBottom: "20px"
                        }}>
                            {/* Scanning Animation Circle */}
                            <div style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                border: "2px solid #ff5600",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                margin: "0 auto 16px",
                                position: "relative",
                                background: "var(--surface-1)",
                                color: "#ff5600"
                            }}>
                                <Icons.Scan />
                                <div style={{
                                    position: "absolute",
                                    inset: "-4px",
                                    border: "2px solid #ff5600",
                                    borderRadius: "50%",
                                    opacity: 0.3,
                                    animation: "spin 4s linear infinite"
                                }} />
                            </div>

                            <h4 style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink)", marginBottom: "6px" }}>
                                Match using a selfie
                            </h4>
                            <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0, padding: "0 24px" }}>
                                Upload a photo of yourself to find every picture you are in.
                            </p>
                        </div>

                        {/* Matched Preview Strip */}
                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>Match Results</span>
                                <span style={{ fontSize: "12px", color: "#ff5600", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Icons.Check width={12} height={12} /> Found 8 Matches
                                </span>
                            </div>

                            {/* Simulated Photo Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                                {[
                                    { src: "/hero-1.avif", alt: "Match 1" },
                                    { src: "/hero-2.jpg", alt: "Match 2" },
                                    { src: "/hero-3.jpg", alt: "Match 3" },
                                    { src: "/hero-4.avif", alt: "Match 4" },
                                ].map((img, idx) => (
                                    <div key={idx} style={{
                                        aspectRatio: "1",
                                        background: "var(--surface-2)",
                                        borderRadius: "var(--r-md)",
                                        position: "relative",
                                        overflow: "hidden",
                                        border: "1px solid var(--hairline)"
                                    }}>
                                        {/* Mock picture elements */}
                                        <div style={{
                                            position: "absolute",
                                            bottom: "4px",
                                            right: "4px",
                                            background: "#ff5600",
                                            color: "#fff",
                                            borderRadius: "50%",
                                            width: "14px",
                                            height: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "8px",
                                            fontWeight: "bold",
                                            zIndex: 2
                                        }}>
                                            ✓
                                        </div>
                                        <img 
                                            src={img.src} 
                                            alt={img.alt} 
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                display: "block"
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS SECTION ─────────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--surface-1)", borderTop: "1px solid var(--hairline)" }}>
                <div style={styles.inner}>
                    <div style={{ textAlign: "center", marginBottom: "64px" }}>
                        <span style={styles.taglineBadge}>Seamless Flow</span>
                        <h2 style={styles.h2}>How it works in three simple steps</h2>
                        <p style={{ ...styles.subhead, margin: "0 auto" }}>
                            We have eliminated all complexity. There are no passwords to remember and no app to install.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
                        
                        {/* Step 1 */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "var(--r-md)",
                                background: "var(--ink)", color: "var(--accent-on)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "16px", fontWeight: 600, marginBottom: "20px"
                            }}>
                                1
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "var(--ink)" }}>Photographer Uploads</h3>
                            <p style={{ fontSize: "15px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Photographers upload full resolution event images directly. SpotMe immediately processes and structures face embeddings.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "var(--r-md)",
                                background: "var(--ink)", color: "var(--accent-on)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "16px", fontWeight: 600, marginBottom: "20px"
                            }}>
                                2
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "var(--ink)" }}>Share One Link</h3>
                            <p style={{ fontSize: "15px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Share the custom event URL or QR code with guests. They simply open it in their browser on any device.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <div style={{
                                width: "40px", height: "40px", borderRadius: "var(--r-md)",
                                background: "#ff5600", color: "#ffffff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "16px", fontWeight: 600, marginBottom: "20px"
                            }}>
                                3
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "12px", color: "var(--ink)" }}>Selfie Discovery</h3>
                            <p style={{ fontSize: "15px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Guests upload a quick selfie. SpotMe instantly matches their face and retrieves all event photos.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── KEY FEATURES & BENEFITS ──────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--canvas)", borderTop: "1px solid var(--hairline)" }}>
                <div style={styles.inner}>
                    
                    <div style={{ textAlign: "center", marginBottom: "64px" }}>
                        <span style={styles.taglineBadge}>Platform Benefits</span>
                        <h2 style={styles.h2}>Designed for speed and accuracy</h2>
                        <p style={{ ...styles.subhead, margin: "0 auto" }}>
                            SpotMe is built on enterprise photo indexing infrastructure to ensure you find every single photo.
                        </p>
                    </div>

                    <div className="grid-3-col">
                        
                        {/* Benefit 1 */}
                        <div className="card">
                            <div style={{ color: "#ff5600", marginBottom: "16px" }}>
                                <Icons.Speed />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>Instant Processing</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                High-precision face scanning returns matching photo records in milliseconds, eliminating manual searches.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="card">
                            <div style={{ color: "var(--ink)", marginBottom: "16px" }}>
                                <Icons.Shield />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>Privacy First</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Selfies uploaded by guests are purely used for match computing, and are never saved or shared with others.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="card">
                            <div style={{ color: "var(--ink)", marginBottom: "16px" }}>
                                <Icons.Smartphone />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>No Installation Needed</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Works on any mobile browser. Zero app fatigue, giving you maximum guest engagement.
                            </p>
                        </div>

                        {/* Benefit 4 */}
                        <div className="card">
                            <div style={{ color: "var(--ink)", marginBottom: "16px" }}>
                                <Icons.Sparkles />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>High Match Rate</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Sophisticated vector recognition matches faces even in challenging lighting, group crowds, or side profiles.
                            </p>
                        </div>

                        {/* Benefit 5 */}
                        <div className="card">
                            <div style={{ color: "var(--ink)", marginBottom: "16px" }}>
                                <Icons.Cloud />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>Robust Storage</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Supported by secure cloud bucket object storage. Upload large batches of full-resolution RAW or JPEG files.
                            </p>
                        </div>

                        {/* Benefit 6 */}
                        <div className="card">
                            <div style={{ color: "var(--ink)", marginBottom: "16px" }}>
                                <Icons.Download />
                            </div>
                            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "10px", color: "var(--ink)" }}>Batch Zip Downloads</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                                Select your matched photos and download them directly as a high-resolution zip archive.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── PRIVACY & SECURITY SECTION ───────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--inverse-canvas)", color: "var(--inverse-ink)" }}>
                <div style={{ ...styles.inner, maxWidth: "960px" }}>
                    
                    <div style={{ textAlign: "center", marginBottom: "56px" }}>
                        <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--inverse-ink)",
                            border: "1px solid var(--inverse-muted)",
                            padding: "6px 12px",
                            borderRadius: "9999px",
                            marginBottom: "20px"
                        }}>
                            Security Guarantee
                        </span>
                        <h2 style={{ ...styles.h2, color: "var(--inverse-ink)" }}>Your privacy is our priority</h2>
                        <p style={{ ...styles.subhead, color: "var(--inverse-muted)", margin: "0 auto" }}>
                            Unlike other galleries, we do not expose your face search files to anyone else.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "32px", marginTop: "40px" }}>
                        
                        {/* Privacy Item 1 */}
                        <div style={{ borderLeft: "2px solid #ff5600", paddingLeft: "20px" }}>
                            <div style={{ color: "#ff5600", marginBottom: "12px" }}>
                                <Icons.EyeOff />
                            </div>
                            <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "var(--inverse-ink)" }}>Invisible to others</h4>
                            <p style={{ fontSize: "14px", color: "var(--inverse-muted)", lineHeight: 1.45 }}>
                                Your uploaded selfies are never visible to the photographer, event host, or other guests.
                            </p>
                        </div>

                        {/* Privacy Item 2 */}
                        <div style={{ borderLeft: "2px solid #ff5600", paddingLeft: "20px" }}>
                            <div style={{ color: "#ff5600", marginBottom: "12px" }}>
                                <Icons.Trash />
                            </div>
                            <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "var(--inverse-ink)" }}>Deleted immediately</h4>
                            <p style={{ fontSize: "14px", color: "var(--inverse-muted)", lineHeight: 1.45 }}>
                                Once the matching operation completes, search selfie images are cleared from volatile memory.
                            </p>
                        </div>

                        {/* Privacy Item 3 */}
                        <div style={{ borderLeft: "2px solid #ff5600", paddingLeft: "20px" }}>
                            <div style={{ color: "#ff5600", marginBottom: "12px" }}>
                                <Icons.Lock />
                            </div>
                            <h4 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px", color: "var(--inverse-ink)" }}>Full Encryption</h4>
                            <p style={{ fontSize: "14px", color: "var(--inverse-muted)", lineHeight: 1.45 }}>
                                All photos are stored in secure S3 buckets and transferred via secure SSL/TLS.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── USE CASES SECTION ────────────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--canvas)", borderTop: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
                <div style={styles.inner}>
                    <div style={{ textAlign: "center", marginBottom: "48px" }}>
                        <span style={styles.taglineBadge}>Versatility</span>
                        <h2 style={styles.h2}>Perfect for any gathering</h2>
                        <p style={{ ...styles.subhead, margin: "0 auto" }}>
                            From small private parties to large outdoor festivals, SpotMe matches faces accurately.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", maxWidth: "800px", margin: "0 auto" }}>
                        {[
                            { name: "Weddings & Ceremonies", icon: "💍" },
                            { name: "College & Campus Fests", icon: "🎓" },
                            { name: "Music Festivals & Concerts", icon: "🎤" },
                            { name: "Corporate Conferences", icon: "🏢" },
                            { name: "Athletic Meets & Sports", icon: "⚽" },
                            { name: "Birthday Celebrations", icon: "🎂" },
                            { name: "Marathons & Races", icon: "🏃" },
                            { name: "Theater & Performing Arts", icon: "🎭" }
                        ].map((item, idx) => (
                            <div key={idx} style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                background: "var(--surface-1)",
                                border: "1px solid var(--hairline)",
                                borderRadius: "9999px",
                                padding: "10px 20px",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "var(--ink)",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                            }}>
                                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                                <span>{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TARGET AUDIENCE SECTION ──────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--surface-1)" }}>
                <div style={styles.inner}>
                    <div style={{ textAlign: "center", marginBottom: "56px" }}>
                        <span style={styles.taglineBadge}>Audience</span>
                        <h2 style={styles.h2}>Built for everyone at the event</h2>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
                        
                        {/* For Photographers */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>Photographers</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
                                Deliver premium results to clients instantly. Skip hours of manual sorting, sorting folders, or email link delivery back-and-forth.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)", fontSize: "14px", fontWeight: 500 }}>
                                <Icons.Check /> Speed up client delivery
                            </div>
                        </div>

                        {/* For Event Organizers */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>Event Organizers</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
                                Elevate guest engagement and satisfaction levels. Provide a high-tech modern AI search amenity that delights attendees.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)", fontSize: "14px", fontWeight: 500 }}>
                                <Icons.Check /> Boost event interaction
                            </div>
                        </div>

                        {/* For Guests */}
                        <div style={{ background: "var(--canvas)", padding: "32px", borderRadius: "var(--r-lg)", border: "1px solid var(--hairline)" }}>
                            <h3 style={{ fontSize: "20px", fontWeight: 600, color: "var(--ink)", marginBottom: "12px" }}>Event Guests</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "20px" }}>
                                Easily find your personal event pictures. Download high-resolution files immediately without looking at thousands of other pictures.
                            </p>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--ink)", fontSize: "14px", fontWeight: 500 }}>
                                <Icons.Check /> Zero manual scroll time
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── FINAL CALL TO ACTION ─────────────────────────────────── */}
            <section style={{ ...styles.section, background: "var(--canvas)", borderTop: "1px solid var(--hairline)" }}>
                <div style={{ ...styles.inner, maxWidth: "720px", textAlign: "center" }}>
                    <h2 style={{ ...styles.h1, fontSize: "clamp(30px, 5vw, 48px)" }}>Ready to find your moments?</h2>
                    <p style={styles.subhead}>
                        Register an account and start managing your events. Instant setups, unlimited gallery support.
                    </p>
                    
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                        <Link to="/signup" className="btn btn-primary" style={{ padding: "12px 28px" }}>
                            Create Free Account
                        </Link>
                        <Link to="/login" className="btn btn-secondary" style={{ padding: "12px 28px" }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────────── */}
            <footer style={{ background: "var(--canvas)", borderTop: "1px solid var(--hairline)", padding: "64px 24px" }}>
                <div style={{ ...styles.inner, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "40px" }}>
                    
                    {/* Brand */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                            <div className="nav-logo-mark">S</div>
                            <span className="nav-logo-text" style={{ fontSize: "16px" }}>SpotMe</span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5 }}>
                            AI-powered event photo discovery. Match your moments securely in seconds.
                        </p>
                    </div>

                    {/* Columns */}
                    {/* <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>Product</h4>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                            <li><a href="#" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>AI Search Engine</a></li>
                            <li><a href="#" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Bulk Photo S3 Upload</a></li>
                            <li><a href="#" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Security Protocol</a></li>
                        </ul>
                    </div> */}

                    <div>
                        <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)", marginBottom: "16px" }}>Legal</h4>
                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
                            <li><Link to="/privacy" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Privacy Policy</Link></li>
                            <li><Link to="/terms" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>Terms & Services</Link></li>
                            <li><Link to="/gdpr" style={{ color: "var(--ink-muted)", textDecoration: "none" }}>General Data Protection</Link></li>
                        </ul>
                    </div>

                </div>

                <div style={{ ...styles.inner, marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--hairline-soft)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", fontSize: "12px", color: "var(--ink-subtle)" }}>
                    <span>&copy; {new Date().getFullYear()} SpotMe. All rights reserved.</span>
                </div>
            </footer>

        </div>
    );
}
