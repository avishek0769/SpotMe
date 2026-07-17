import { Link } from "react-router-dom";

export function TermsPage() {
    return (
        <div style={{ background: "var(--canvas)", minHeight: "calc(100vh - 56px)", padding: "64px 24px" }} className="fade-up">
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Link to="/" style={{ color: "#ff5600", textDecoration: "none", fontSize: "14px", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "32px" }}>
                    &larr; Back to Home
                </Link>
                
                <div style={{ background: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: "var(--r-xl)", padding: "48px", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <span style={{ fontSize: "12px", color: "#ff5600", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal Terms</span>
                    <h1 style={{ fontSize: "36px", fontWeight: 500, color: "var(--ink)", marginTop: "8px", marginBottom: "24px" }}>Terms & Services</h1>
                    <p style={{ color: "var(--ink-muted)", fontSize: "14px", marginBottom: "32px" }}>Last updated: July 17, 2026</p>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px", color: "var(--ink)", fontSize: "15px", lineHeight: "1.6" }}>
                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>1. Agreement to Terms</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to all the terms and conditions, then you are expressly prohibited from using the services and must discontinue use immediately.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>2. Intellectual Property Rights</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                Unless otherwise indicated, the Site and Services are our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site are owned or controlled by us.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>3. User Representations & Photo Uploads</h2>
                            <p style={{ color: "var(--ink-muted)", marginBottom: "12px" }}>
                                By using the Services, you represent and warrant that:
                            </p>
                            <ul style={{ paddingLeft: "20px", color: "var(--ink-muted)" }}>
                                <li style={{ marginBottom: "6px" }}>You have the legal capacity and agree to comply with these Terms.</li>
                                <li style={{ marginBottom: "6px" }}>You will not upload photos containing explicit, harmful, illegal, or harassing material.</li>
                                <li style={{ marginBottom: "6px" }}>If you are a photographer, you warrant that you have obtained appropriate consent from subjects or clients before uploading event photos.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>4. Limitation of Liability</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                In no event will we or our directors, employees, or agents be liable to you or any third party for any direct, indirect, consequential, exemplary, incidental, special, or punitive damages arising from your use of the site.
                            </p>
                        </section>

                        <section>
                            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>5. Termination</h2>
                            <p style={{ color: "var(--ink-muted)" }}>
                                We reserve the right to terminate, block, or limit accounts that violate these terms, or engage in suspicious facial searching actions.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
