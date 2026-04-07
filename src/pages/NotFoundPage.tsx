import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 text-sm text-gray-700">The route you requested does not exist.</p>
            <Link to="/" className="mt-4 rounded border px-4 py-2 text-sm">
                Go to Home
            </Link>
        </div>
    );
}
