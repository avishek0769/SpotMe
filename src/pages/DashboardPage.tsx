import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import type { EventType } from "../types";

function getStatusClass(status: "Uploading" | "Indexing" | "Ready") {
    if (status === "Ready") {
        return "status-pill status-ready";
    }
    if (status === "Indexing") {
        return "status-pill status-indexing";
    }
    return "status-pill status-uploading";
}

function getEventCardStatus(eventItem: {
    status: "Uploading" | "Indexing" | "Ready";
    photos: { id: number; url: string }[];
}) {
    if (eventItem.photos.length === 0) {
        return {
            label: "No Photos",
            className: "status-pill border border-[#3a4a67] bg-[#162137] text-[#b6c5e3]",
        };
    }

    return {
        label: eventItem.status,
        className: getStatusClass(eventItem.status),
    };
}

const sharedDummyCards = [
    {
        id: "dummy-shared-1",
        name: "Nisha & Rohan Reception",
        photographer: "Amit Verma",
        photos: 186,
    },
    {
        id: "dummy-shared-2",
        name: "Startup Summit 2025",
        photographer: "Neha Kapoor",
        photos: 124,
    },
];

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
        <div className="page-wrap">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="mt-1 text-sm muted">
                        Signed in as {currentUser?.name} ({currentUser?.email})
                    </p>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    className="btn-secondary px-4 py-2 text-sm"
                >
                    Log Out
                </button>
            </div>

            <div className="mt-6 inline-flex rounded-xl border border-[#2a364d] bg-[#121a2a] p-1">
                <button
                    type="button"
                    onClick={() => setActiveTab("my-events")}
                    className={`rounded-lg px-4 py-2 text-sm ${
                        activeTab === "my-events"
                            ? "bg-[#1f2e4c] text-[#f6f9ff]"
                            : "text-[#a2b1cd] hover:text-[#dbe6ff]"
                    }`}
                >
                    My Events
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("shared")}
                    className={`rounded-lg px-4 py-2 text-sm ${
                        activeTab === "shared"
                            ? "bg-[#1f2e4c] text-[#f6f9ff]"
                            : "text-[#a2b1cd] hover:text-[#dbe6ff]"
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
                        className="btn-primary w-full px-4 py-2.5 text-sm sm:w-auto"
                    >
                        Create Event
                    </button>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {myEvents.map((eventItem) => (
                            (() => {
                                const cardStatus = getEventCardStatus(eventItem);

                                return (
                            <Link
                                key={eventItem.id}
                                to={`/events/${eventItem.id}`}
                                className="card group block p-5"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <h2 className="line-clamp-2 font-semibold text-[#eef3ff] group-hover:text-white">
                                        {eventItem.name}
                                    </h2>
                                    <span className={cardStatus.className}>{cardStatus.label}</span>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border border-[#2b3954] bg-[#101a2b] p-3 text-xs">
                                    <div>
                                        <p className="muted">Date</p>
                                        <p className="mt-1 text-[#d7e2fa]">{eventItem.date}</p>
                                    </div>
                                    <div>
                                        <p className="muted">Type</p>
                                        <p className="mt-1 text-[#d7e2fa]">{eventItem.type}</p>
                                    </div>
                                    <div>
                                        <p className="muted">Photos</p>
                                        <p className="mt-1 text-[#d7e2fa]">{eventItem.photos.length}</p>
                                    </div>
                                    <div>
                                        <p className="muted">Guests</p>
                                        <p className="mt-1 text-[#d7e2fa]">{eventItem.guests.length}</p>
                                    </div>
                                </div>
                            </Link>
                                );
                            })()
                        ))}
                    </div>
                    {myEvents.length === 0 ? (
                        <div className="card mt-4 p-10 text-center">
                            <p className="text-3xl">📷</p>
                            <p className="mt-2 text-base font-medium">No events yet</p>
                            <p className="mt-1 text-sm muted">Create your first event to start uploading photos.</p>
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="btn-primary mt-4 px-4 py-2"
                            >
                                Create Event
                            </button>
                        </div>
                    ) : null}
                </section>
            ) : (
                <section className="mt-4 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sharedEvents.map((eventItem) => (
                            <article key={eventItem.id} className="card p-5">
                                <h2 className="font-semibold text-[#eef3ff]">{eventItem.name}</h2>
                                <div className="mt-3 rounded-lg border border-[#2b3954] bg-[#101a2b] p-3 text-xs">
                                    <p className="muted">Photographer</p>
                                    <p className="mt-1 text-sm text-[#d7e2fa]">Rahul Sharma</p>
                                    <p className="mt-3 muted">Photos</p>
                                    <p className="mt-1 text-sm text-[#d7e2fa]">{eventItem.photos.length}</p>
                                </div>
                                <Link
                                    to={`/events/${eventItem.id}/guest`}
                                    className="btn-primary mt-4 inline-block px-4 py-2 text-sm"
                                >
                                    View
                                </Link>
                            </article>
                    ))}
                    </div>

                    <div>
                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#93a4c4]">
                            Suggested Shared Events
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {sharedDummyCards.map((card) => (
                                <article key={card.id} className="card p-5">
                                    <h2 className="font-semibold text-[#eef3ff]">{card.name}</h2>
                                    <div className="mt-3 rounded-lg border border-[#2b3954] bg-[#101a2b] p-3 text-xs">
                                        <p className="muted">Photographer</p>
                                        <p className="mt-1 text-sm text-[#d7e2fa]">{card.photographer}</p>
                                        <p className="mt-3 muted">Photos</p>
                                        <p className="mt-1 text-sm text-[#d7e2fa]">{card.photos}</p>
                                    </div>
                                    <button type="button" className="btn-secondary mt-4 px-4 py-2 text-sm">
                                        View
                                    </button>
                                </article>
                            ))}
                        </div>
                    </div>

                    {sharedEvents.length === 0 && sharedDummyCards.length === 0 ? (
                        <div className="card col-span-full p-10 text-center">
                            <p className="text-3xl">🔗</p>
                            <p className="mt-2 text-base font-medium">No shared events yet</p>
                            <p className="mt-1 text-sm muted">Ask a photographer to share an event link.</p>
                        </div>
                    ) : null}
                </section>
            )}

            {showModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="card w-full max-w-md p-5 sm:p-6">
                        <h2 className="text-xl font-semibold">Create Event</h2>
                        <form onSubmit={handleCreateEvent} className="mt-4 space-y-3">
                            <label className="ui-label">
                                Event Name
                                <input
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    className="ui-input"
                                />
                            </label>

                            <label className="ui-label">
                                Event Date
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="ui-input"
                                />
                            </label>

                            <label className="ui-label">
                                Event Type
                                <select
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value as EventType)}
                                    className="ui-input"
                                >
                                    <option value="Wedding">Wedding</option>
                                    <option value="Corporate">Corporate</option>
                                    <option value="Concert">Concert</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>

                            {error ? (
                                <p className="rounded-md border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                    {error}
                                </p>
                            ) : null}

                            <div className="flex flex-col justify-end gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary px-4 py-2 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="btn-primary px-4 py-2 text-sm"
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
