import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";

interface AuthPageProps { mode: "signup" | "login"; }

type SignupStep = "email" | "code" | "details";

export function AuthPage({ mode }: AuthPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, setUser } = useAppContext();

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

    const from = location.state?.from ?? "/dashboard";

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
            const res = await api.register({
                fullname: fullname.trim(), username: username.trim(),
                email: signupEmail.trim(), password: signupPassword.trim(),
            });
            setUser(res.data);
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
            <div className="page-wrap" style={{ display: "flex", minHeight: "calc(100vh - 60px)", alignItems: "center", justifyContent: "center" }}>
                <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2rem" }}>
                    <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>Reset Password</p>
                    <h1 style={{ marginTop: 8, fontSize: "1.75rem", fontWeight: 700, color: "#fff" }}>
                        {resetStep === "email" ? "Enter your email" : "Enter code & new password"}
                    </h1>
                    {resetStep === "email" ? (
                        <form onSubmit={handleResetSend} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">Email
                                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="ui-input" />
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            {info && <div className="alert alert-success">{info}</div>}
                            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                                {loading ? "Sending..." : "Send Reset Code"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">Reset Code
                                <input value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="ui-input" />
                            </label>
                            <label className="ui-label">New Password
                                <input type="password" value={resetNewPw} onChange={(e) => setResetNewPw(e.target.value)} className="ui-input" />
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            {info && <div className="alert alert-success">{info}</div>}
                            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>
                        </form>
                    )}
                    <button onClick={() => { setShowReset(false); setError(""); setInfo(""); }} style={{ marginTop: 16, fontSize: "0.8125rem", color: "var(--accent-hover)", background: "none", border: "none", cursor: "pointer" }}>
                        ← Back to login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrap" style={{ display: "flex", minHeight: "calc(100vh - 60px)", alignItems: "center", justifyContent: "center" }}>
            <div className="card" style={{ width: "100%", maxWidth: 420, padding: "2rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)" }}>
                    SpotMe
                </p>
                <h1 style={{ marginTop: 8, fontSize: "1.75rem", fontWeight: 700, color: "#fff" }}>
                    {isSignup
                        ? signupStep === "email" ? "Create your account"
                        : signupStep === "code" ? "Verify your email"
                        : "Complete your profile"
                        : "Welcome back"
                    }
                </h1>

                {!isSignup ? (
                    <form onSubmit={handleLogin} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Email
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" placeholder="you@example.com" />
                        </label>
                        <label className="ui-label">Password
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="ui-input" placeholder="••••••" />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                            {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : "Sign In"}
                        </button>
                        <button type="button" onClick={() => { setShowReset(true); setError(""); }} style={{ fontSize: "0.8125rem", color: "var(--accent-hover)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                            Forgot password?
                        </button>
                    </form>
                ) : signupStep === "email" ? (
                    <form onSubmit={handleSendCode} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Email
                            <input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="ui-input" placeholder="you@example.com" />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        {info && <div className="alert alert-success">{info}</div>}
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                            {loading ? "Sending..." : "Send Verification Code"}
                        </button>
                    </form>
                ) : signupStep === "code" ? (
                    <form onSubmit={handleVerifyCode} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                            We sent a code to <strong style={{ color: "#fff" }}>{signupEmail}</strong>
                        </p>
                        <label className="ui-label">Verification Code
                            <input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="ui-input" placeholder="12345" />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                            {loading ? "Verifying..." : "Verify Email"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                        <label className="ui-label">Full Name
                            <input value={fullname} onChange={(e) => setFullname(e.target.value)} className="ui-input" placeholder="John Doe" />
                        </label>
                        <label className="ui-label">Username
                            <input value={username} onChange={(e) => setUsername(e.target.value)} className="ui-input" placeholder="johndoe" />
                        </label>
                        <label className="ui-label">Password
                            <input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="ui-input" placeholder="••••••" />
                        </label>
                        {error && <div className="alert alert-error">{error}</div>}
                        <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "0.625rem" }}>
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                )}

                <p style={{ marginTop: 20, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {isSignup ? "Already have an account? " : "Need an account? "}
                    <Link to={isSignup ? "/login" : "/signup"} style={{ color: "var(--accent-hover)", textDecoration: "none" }}>
                        {isSignup ? "Sign In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
