import { Link } from "react-router-dom";

export function LandingPage() {
    return (
        <div className="page-wrap flex min-h-[calc(100vh-64px)] items-center">
            <section className="card w-full p-6 sm:p-10">
                <span className="inline-flex rounded-full border border-[#31405d] bg-[#19233a] px-3 py-1 text-xs font-medium text-[#b8c7e6]">
                    Photographer and Guest Workspace
                </span>
                <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#f5f8ff] sm:text-5xl">
                    SpotMe
                </h1>
                <p className="mt-3 max-w-3xl text-lg text-[#d4def2] sm:text-xl">
                    Find people in event photos in seconds.
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#9aa8c3] sm:text-base">
                    SpotMe helps photographers manage events, upload photo sets,
                    and share guest access. Guests can quickly find their own
                    photos by uploading a selfie and viewing their My Photos
                    collection.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                        to="/dashboard"
                        className="btn-primary px-5 py-3 text-center text-sm"
                    >
                        Go to Dashboard
                    </Link>
                    <Link
                        to="/signup"
                        className="btn-primary px-5 py-3 text-center text-sm"
                    >
                        Sign Up
                    </Link>
                    <Link
                        to="/login"
                        className="btn-secondary px-5 py-3 text-center text-sm"
                    >
                        Log In
                    </Link>
                </div>
            </section>
        </div>
    );
}
