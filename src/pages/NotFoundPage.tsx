import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div className="page-wrap flex min-h-[calc(100vh-64px)] items-center justify-center">
            <div className="card w-full max-w-xl p-10 text-center">
                <p className="text-4xl">🧭</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight">
                    Page not found
                </h1>
                <p className="mt-2 text-sm muted">
                    The route you requested does not exist.
                </p>
                <Link
                    to="/"
                    className="btn-primary mt-6 inline-block px-4 py-2 text-sm"
                >
                    Go to Home
                </Link>
            </div>
        </div>
    );
}
