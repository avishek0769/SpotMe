import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { EventType } from "../types";

export function DashboardPage() {
    const navigate = useNavigate();
    const { currentUser, getMyEvents, getSharedEvents, createEvent, logout } = useAppContext();

    const myEvents = useMemo(() => getMyEvents(), [getMyEvents]);
    const sharedEvents = useMemo(() => getSharedEvents(), [getSharedEvents]);

    const [activeTab, setActiveTab] = useState<"my-events" | "shared">("my-events");
    const [showModal, setShowModal] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventType, setEventType] = useState<EventType>("Wedding");
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState("");

    async function handleCreateEvent(event: FormEvent) {
        event.preventDefault();
        setError("");

        if (!eventName.trim() || !eventDate.trim()) {
            setError("Event name and date are required");
            return;
        }

        setIsCreating(true);
        const created = await createEvent({
            name: eventName.trim(),
            date: eventDate,
            type: eventType,
        });
        setIsCreating(false);
        setShowModal(false);
        setEventName("");
        setEventDate("");
        setEventType("Wedding");
        navigate(`/events/${created.id}`);
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-gray-700">
                        Signed in as {currentUser?.name} ({currentUser?.email})
                    </p>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="rounded border px-3 py-2 text-sm"
                >
                    Log Out
                </button>
            </div>

            <div className="mt-6 flex gap-2">
                <button
                    type="button"
                    onClick={() => setActiveTab("my-events")}
                    className={`rounded border px-3 py-2 text-sm ${
                        activeTab === "my-events" ? "bg-gray-100" : ""
                    }`}
                >
                    My Events
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("shared")}
                    className={`rounded border px-3 py-2 text-sm ${
                        activeTab === "shared" ? "bg-gray-100" : ""
                    }`}
                >
                    Shared With Me
                </button>
            </div>

            {activeTab === "my-events" ? (
                <section className="mt-4">
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="rounded border px-3 py-2 text-sm"
                    >
                        Create Event
                    </button>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {myEvents.map((eventItem) => (
                            <Link
                                key={eventItem.id}
                                to={`/events/${eventItem.id}`}
                                className="rounded border p-4"
                            >
                                <h2 className="font-medium">{eventItem.name}</h2>
                                <p className="mt-1 text-sm">Date: {eventItem.date}</p>
                                <p className="text-sm">Type: {eventItem.type}</p>
                                <p className="text-sm">Photos: {eventItem.photos.length}</p>
                                <p className="text-sm">Guests: {eventItem.guests.length}</p>
                                <span className="mt-2 inline-block rounded border px-2 py-1 text-xs">
                                    {eventItem.status}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            ) : (
                <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sharedEvents.map((eventItem) => (
                        <article key={eventItem.id} className="rounded border p-4">
                            <h2 className="font-medium">{eventItem.name}</h2>
                            <p className="mt-1 text-sm">Photographer: Rahul Sharma</p>
                            <p className="text-sm">Photos: {eventItem.photos.length}</p>
                            <Link
                                to={`/events/${eventItem.id}/guest`}
                                className="mt-3 inline-block rounded border px-3 py-1 text-sm"
                            >
                                View
                            </Link>
                        </article>
                    ))}
                    {sharedEvents.length === 0 ? (
                        <p className="text-sm text-gray-700">No events shared with this account yet.</p>
                    ) : null}
                </section>
            )}

            {showModal ? (
                <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/30 px-4">
                    <div className="w-full max-w-md rounded bg-white p-4">
                        <h2 className="text-lg font-medium">Create Event</h2>
                        <form onSubmit={handleCreateEvent} className="mt-4 space-y-3">
                            <label className="flex flex-col gap-1 text-sm">
                                Event Name
                                <input
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    className="rounded border px-3 py-2"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                Event Date
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="rounded border px-3 py-2"
                                />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                                Event Type
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value as EventType)}
                                    className="rounded border px-3 py-2"
                                >
                                    <option value="Wedding">Wedding</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Concert">Concert</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>

                            {error ? <p className="text-sm text-red-600">{error}</p> : null}

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded border px-3 py-2 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="rounded border px-3 py-2 text-sm"
                                >
                                    {isCreating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
