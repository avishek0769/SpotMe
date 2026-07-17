import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";

interface AuthPageProps { mode: "signup" | "login"; }

type SignupStep = "email" | "code" | "details";

export function AuthPage({ mode }: AuthPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, setUser, user } = useAppContext();

    const isSignup = mode === "signup";

    // Login state
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Signup state
    const [signupStep, setSignupStep] = useState<SignupStep>("email");
    const [signupEmail, setSignupEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [fullname, setFullname] = useState("");
    const [username, setUsername] = useState("");
    const [signupPassword, setSignupPassword] = useState("");

    // Password reset state
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetCode, setResetCode] = useState("");
    const [resetNewPw, setResetNewPw] = useState("");
    const [resetStep, setResetStep] = useState<"email" | "code">("email");

    const [error, setError] = useState("");
    const [info, setInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    const from = location.state?.from ?? "/dashboard";

    useEffect(() => {
        if (user) {
            navigate("/dashboard", { replace: true });
            return;
        }

        async function guardAuthPages() {
            try {
                const me = await api.getCurrentUser();
                setUser(me.data);
                navigate("/dashboard", { replace: true });
                return;
            } catch {
                const refreshed = await api.refreshTokens();
                if (refreshed) {
                    try {
                        const me = await api.getCurrentUser();
                        setUser(me.data);
                        navigate("/dashboard", { replace: true });
                        return;
                    } catch {
                        // Login required.
                    }
                }
            } finally {
                setCheckingSession(false);
            }
        }

        void guardAuthPages();
    }, [navigate, setUser, user]);

    if (checkingSession) {
        return (
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
                <div className="spinner" />
            </div>
        );
    }

    async function handleLogin(e: FormEvent) {
        e.preventDefault(); setError("");
        if (!email.trim() || !password.trim()) { setError("Email and password are required"); return; }
        setLoading(true);
        try {
            await login(email.trim(), password.trim());
            navigate(from, { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally { setLoading(false); }
    }

    async function handleSendCode(e: FormEvent) {
        e.preventDefault(); setError(""); setInfo("");
        if (!signupEmail.trim()) { setError("Email is required"); return; }
        setLoading(true);
        try {
            await api.sendVerificationCode(signupEmail.trim());
            setInfo("Verification code sent to your email");
            setSignupStep("code");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to send code");
        } finally { setLoading(false); }
    }

    async function handleVerifyCode(e: FormEvent) {
        e.preventDefault(); setError(""); setInfo("");
        if (!verificationCode.trim()) { setError("Code is required"); return; }
        setLoading(true);
        try {
            await api.verifyEmailApi(signupEmail.trim(), verificationCode.trim());
            setInfo("Email verified! Complete your profile.");
            setSignupStep("details");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid code");
        } finally { setLoading(false); }
    }

    async function handleRegister(e: FormEvent) {
        e.preventDefault(); setError("");
        if (!fullname.trim() || !username.trim() || !signupPassword.trim()) {
            setError("All fields are required"); return;
        }
        setLoading(true);
        try {
            await api.register({
                fullname: fullname.trim(), username: username.trim(),
                email: signupEmail.trim(), password: signupPassword.trim(),
            });
            const me = await api.getCurrentUser();
            setUser(me.data);
            navigate("/dashboard", { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Registration failed");
        } finally { setLoading(false); }
    }

    async function handleResetSend(e: FormEvent) {
        e.preventDefault(); setError(""); setInfo("");
        if (!resetEmail.trim()) { setError("Email is required"); return; }
        setLoading(true);
        try {
            await api.sendResetCode(resetEmail.trim());
            setInfo("Reset code sent to your email");
            setResetStep("code");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally { setLoading(false); }
    }

    async function handleResetPassword(e: FormEvent) {
        e.preventDefault(); setError(""); setInfo("");
        if (!resetCode.trim() || !resetNewPw.trim()) { setError("All fields required"); return; }
        setLoading(true);
        try {
            await api.resetPassword(resetEmail.trim(), resetCode.trim(), resetNewPw.trim());
            setInfo("Password reset! You can now log in.");
            setShowReset(false); setResetStep("email");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Reset failed");
        } finally { setLoading(false); }
    }

    if (showReset) {
        return (
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)", padding: "24px" }} className="fade-up">
                <div className="card card-xl" style={{ width: "100%", maxWidth: 420, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                    <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: "8px" }}>Reset Password</p>
                    <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", marginBottom: "24px", letterSpacing: "-0.5px" }}>
                        {resetStep === "email" ? "Enter your email" : "Enter code & new password"}
                    </h1>
                    {resetStep === "email" ? (
                        <form onSubmit={handleResetSend} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">Email
                                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="ui-input" required />
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            {info && <div className="alert alert-success">{info}</div>}
                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                                {loading ? "Sending..." : "Send Reset Code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">Reset Code
                                <input value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="ui-input" required />
                            </label>
                            <label className="ui-label">New Password
                                <input type="password" value={resetNewPw} onChange={(e) => setResetNewPw(e.target.value)} className="ui-input" required />
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            {info && <div className="alert alert-success">{info}</div>}
                            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    )}
                    <button onClick={() => { setShowReset(false); setError(""); setInfo(""); }} style={{ marginTop: 20, fontSize: "14px", color: "#ff5600", background: "none", border: "none", cursor: "pointer", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        ← Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)", padding: "24px" }} className="fade-up">
            <div className="card card-xl" style={{ width: "100%", maxWidth: 420, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-muted)", marginBottom: "8px" }}>
                    SpotMe
                </p>
                <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", marginBottom: "24px", letterSpacing: "-0.5px" }}>
                    {isSignup
                        ? signupStep === "email" ? "Create your account"
                        : signupStep === "code" ? "Verify your email"
                        : "Complete your profile"
                        : "Welcome back"
                    }
                </h1>

                {!isSignup ? (
                    <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Email
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" placeholder="you@example.com" required />
                        </label>
                        <label className="ui-label">Password
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ui-input" placeholder="••••••" required />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                        <button type="button" onClick={() => { setShowReset(true); setError(""); }} style={{ fontSize: "14px", color: "#ff5600", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, width: "fit-content", fontWeight: 500 }}>
                            Forgot password?
                        </button>
                    </form>
                ) : signupStep === "email" ? (
                    <form onSubmit={handleSendCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Email
                            <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="ui-input" placeholder="you@example.com" required />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        {info && <div className="alert alert-success">{info}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                            {loading ? "Sending..." : "Send Verification Code"}
                        </button>
                    </form>
                ) : signupStep === "code" ? (
                    <form onSubmit={handleVerifyCode} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "8px" }}>
                            We sent a code to <strong style={{ color: "var(--ink)" }}>{signupEmail}</strong>
                        </p>
                        <label className="ui-label">Verification Code
                            <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="ui-input" placeholder="12345" required />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                            {loading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Full Name
                            <input value={fullname} onChange={(e) => setFullname(e.target.value)} className="ui-input" placeholder="John Doe" required />
                        </label>
                        <label className="ui-label">Username
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="ui-input" placeholder="johndoe" required />
                        </label>
                        <label className="ui-label">Password
                            <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="ui-input" placeholder="••••••" required />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "10px" }}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: 24, fontSize: "14px", color: "var(--ink-muted)", borderTop: "1px solid var(--hairline)", paddingTop: "16px" }}>
                    {isSignup ? "Already have an account? " : "Need an account? "}
                    <Link to={isSignup ? "/login" : "/signup"} style={{ color: "#ff5600", textDecoration: "none", fontWeight: 500 }}>
                        {isSignup ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
