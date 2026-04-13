import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

interface AuthPageProps {
    mode: "signup" | "login";
}

export function AuthPage({ mode }: AuthPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, signup } = useAppContext();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isSignup = mode === "signup";

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (isSignup && !name.trim()) {
            setError("Name is required");
            return;
        }
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required");
            return;
        }

        setIsLoading(true);

        const success = isSignup
            ? await signup(name.trim(), email.trim(), password.trim())
            : await login(email.trim(), password.trim());

        setIsLoading(false);

        if (!success) {
            setError(
                isSignup
                    ? "Signup failed. Email may already exist."
                    : "Login failed. Try rahul@example.com / 123456",
            );
            return;
        }

        const from = location.state?.from ?? "/dashboard";
        navigate(from, { replace: true });
    }

    return (
        <div className="page-wrap flex min-h-[calc(100vh-64px)] items-center justify-center">
            <div className="card w-full max-w-md p-6 sm:p-7">
                <p className="text-xs font-medium uppercase tracking-wide text-[#9aa8c3]">
                    SpotMe Access
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#f5f8ff]">
                    {isSignup ? "Create your account" : "Log in"}
                </h1>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    {isSignup ? (
                        <label className="ui-label">
                            Name
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="ui-input"
                            />
                        </label>
                    ) : null}

                    <label className="ui-label">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="ui-input"
                        />
                    </label>

                    <label className="ui-label">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="ui-input"
                        />
                    </label>

                    {error ? (
                        <p className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {error}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full px-4 py-2.5"
                    >
                        {isLoading
                            ? "Please wait..."
                            : isSignup
                              ? "Sign Up"
                              : "Log In"}
                    </button>
                </form>

                <p className="mt-5 text-sm text-[#9aa8c3]">
                    {isSignup
                        ? "Already have an account? "
                        : "Need an account? "}
                    <Link
                        to={isSignup ? "/login" : "/signup"}
                        className="text-[#9eb7ff] hover:text-[#bfd0ff]"
                    >
                        {isSignup ? "Log In" : "Sign Up"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
