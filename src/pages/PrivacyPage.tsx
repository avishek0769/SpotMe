import { Link } from "react-router-dom";

export function PrivacyPage() {
    return (
        <div style={{ background: "var(--canvas)", minHeight: "calc(100vh - 56px)", padding: "64px 24px" }} className="fade-up">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link to="/" style={{ color: "#ff5600", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
                    &larr; Back to Home
                </Link>
                
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: "var(--r-xl)", padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <span style={{ fontSize: "12px", color: "#ff5600", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Security & Trust</span>
                    <h1 style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", marginTop: "8px", marginBottom: "24px" }}>Privacy Policy</h1>
                    <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginBottom: "32px" }}>Last updated: July 17, 2026</p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--ink)", fontSize: "15px", lineHeight: "1.6" }}>
                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>1. Introduction</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                Welcome to SpotMe. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>2. Information We Collect</h2>
                            <p style={{ color: "var(--ink-muted)", marginBottom: "12px" }}>
                                We collect personal information that you voluntarily provide to us when registering, expressing an interest in obtaining information about us, or when participating in activities on our services.
                            </p>
                            <ul style={{ paddingLeft: "20px", color: "var(--ink-muted)" }}>
                                <li style={{ marginBottom: "6px" }}><strong>Account Credentials:</strong> Name, email address, password, and similar credentials.</li>
                                <li style={{ marginBottom: "6px" }}><strong>Event Images:</strong> High-resolution photos uploaded by photographers or event hosts.</li>
                                <li style={{ marginBottom: "6px" }}><strong>Facial Recognition Metadata:</strong> Temporary biometric embeddings generated purely for matching search photos.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>3. How We Process Search Selfies</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                In order to find your photos, you provide a search selfie. We calculate a mathematical facial vector, query our indexing database, and return matching photo URLs. <strong>The selfie image is not saved to any database, is not visible to event organizers, hosts, or other guests, and is discarded from memory immediately after matching.</strong>
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>4. Data Security</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>5. Contact Us</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                If you have questions or comments about this policy, you may email us at privacy@spotme.io.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
