import { Link } from "react-router-dom";

export function LandingPage() {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-12">
            <h1 className="text-4xl font-bold">SpotMe</h1>
            <p className="mt-2 text-lg">Find people in event photos in seconds.</p>
            <p className="mt-4 max-w-2xl text-sm text-gray-700">
                SpotMe helps photographers share event photo access with guests, and helps guests quickly
                find their own photos by uploading a selfie.
            </p>

            <div className="mt-8 flex gap-3">
                <Link to="/signup" className="rounded border px-4 py-2">
                    Sign Up
                </Link>
                <Link to="/login" className="rounded border px-4 py-2">
                    Log In
                </Link>
            </div>
        </div>
    );
}
