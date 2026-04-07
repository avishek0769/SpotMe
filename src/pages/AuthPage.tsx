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
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-8">
            <h1 className="text-2xl font-semibold">{isSignup ? "Create your account" : "Log in"}</h1>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded border p-4">
                {isSignup ? (
                    <label className="flex flex-col gap-1 text-sm">
                        Name
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded border px-3 py-2"
                        />
                    </label>
                ) : null}

                <label className="flex flex-col gap-1 text-sm">
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded border px-3 py-2"
                    />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded border px-3 py-2"
                    />
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button type="submit" disabled={isLoading} className="w-full rounded border px-4 py-2">
                    {isLoading ? "Please wait..." : isSignup ? "Sign Up" : "Log In"}
                </button>
            </form>

            <p className="mt-4 text-sm">
                {isSignup ? "Already have an account? " : "Need an account? "}
                <Link to={isSignup ? "/login" : "/signup"} className="underline">
                    {isSignup ? "Log In" : "Sign Up"}
                </Link>
            </p>
        </div>
    );
}
