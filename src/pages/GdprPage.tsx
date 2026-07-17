import { Link } from "react-router-dom";

export function GdprPage() {
    return (
        <div style={{ background: "var(--canvas)", minHeight: "calc(100vh - 56px)", padding: "64px 24px" }} className="fade-up">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link to="/" style={{ color: "#ff5600", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
                    &larr; Back to Home
                </Link>
                
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: "var(--r-xl)", padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <span style={{ fontSize: "12px", color: "#ff5600", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Compliance</span>
                    <h1 style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", marginTop: "8px", marginBottom: "24px" }}>General Data Protection (GDPR)</h1>
                    <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginBottom: "32px" }}>Last updated: July 17, 2026</p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--ink)", fontSize: "15px", lineHeight: "1.6" }}>
                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>1. GDPR Compliance Statement</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                We are committed to GDPR and user sovereignty over their private data. We store personal details inside the European Union and only transfer parameters across cloud nodes using strong end-to-end cryptographic tunnels.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>2. Rights of EU Data Subjects</h2>
                            <p style={{ color: "var(--ink-muted)", marginBottom: "12px" }}>
                                Under the GDPR, you have the following rights:
                            </p>
                            <ul style={{ paddingLeft: "20px", color: "var(--ink-muted)" }}>
                                <li style={{ marginBottom: "6px" }}><strong>Right of Access:</strong> You can query and download all information associated with your account.</li>
                                <li style={{ marginBottom: "6px" }}><strong>Right to Rectification:</strong> You can request updates to inaccurate email records or account details.</li>
                                <li style={{ marginBottom: "6px" }}><strong>Right to Erasure (Right to be Forgotten):</strong> You can completely erase your account, uploaded events, and metadata matches.</li>
                                <li style={{ marginBottom: "6px" }}><strong>Right to Data Portability:</strong> You can ask to export your details in a standard format.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>3. Consent for Biometric Search Processing</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                When search selfies are sent to SpotMe, we explicitly ask for your consent to calculate facial vectors. These vectors are fleeting and are not sold, matched to ads, or cross-shared.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>4. Data Protection Officer (DPO)</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                For any questions regarding your rights or privacy compliance under GDPR, please write to our DPO at dpo@spotme.io.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
