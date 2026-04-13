import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";
import type { EventData } from "../api";

function getStatusPill(status: string) {
    const cls: Record<string, string> = {
        empty: "status-pill status-empty",
        processing: "status-pill status-processing",
        expired: "status-pill status-expired",
    };
    return cls[status] || "status-pill status-empty";
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function EventCard({ ev, linkTo }: { ev: EventData; linkTo: string }) {
    return (
        <Link to={linkTo} style={{ textDecoration: "none", color: "inherit" }}>
            <article className="card" style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{
                    height: 120, borderRadius: 12, overflow: "hidden",
                    background: ev.coverImage
                        ? `url(${ev.coverImage}) center/cover no-repeat`
                        : "linear-gradient(135deg, var(--surface-elevated), var(--bg-soft))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--border)",
                }}>
                    {!ev.coverImage && <span style={{ fontSize: 36 }}>📸</span>}
                </div>
                <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>{ev.name}</h3>
                    <span className={getStatusPill(ev.status)}>{ev.status}</span>
                </div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div className="stat-card">
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Date</p>
                        <p style={{ marginTop: 2, fontSize: "0.8125rem", color: "#fff" }}>{formatDate(ev.eventDate)}</p>
                    </div>
                    <div className="stat-card">
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Access</p>
                        <p style={{ marginTop: 2, fontSize: "0.8125rem", color: "#fff" }}>
                            {ev.accessLevel === "spot" ? "Spot Only" : "Browse & Spot"}
                        </p>
                    </div>
                </div>
            </article>
        </Link>
    );
}

function SkeletonCards({ count = 3 }: { count?: number }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
                    <div className="skeleton" style={{ height: 18, width: "65%", marginTop: 14 }} />
                    <div className="skeleton" style={{ height: 14, width: "40%", marginTop: 8 }} />
                </div>
            ))}
        </div>
    );
}

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout } = useAppContext();

    const [createdEvents, setCreatedEvents] = useState<EventData[]>([]);
    const [sharedEvents, setSharedEvents] = useState<EventData[]>([]);
    const [loadingCreated, setLoadingCreated] = useState(true);
    const [loadingShared, setLoadingShared] = useState(true);
    const [activeEventsTab, setActiveEventsTab] = useState<"my" | "shared">("my");

    // Create Modal
    const [showModal, setShowModal] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [accessLevel, setAccessLevel] = useState<"spot" | "browse">("spot");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api.getAllCreatedEvents()
            .then((res) => setCreatedEvents(res.data))
            .catch(console.error)
            .finally(() => setLoadingCreated(false));
        api.getAllSharedEvents()
            .then((res) => setSharedEvents(res.data))
            .catch(console.error)
            .finally(() => setLoadingShared(false));
    }, []);

    async function handleCreate(e: FormEvent) {
        e.preventDefault(); setError("");
        if (!eventName.trim() || !eventDate) { setError("Name and date are required"); return; }
        setCreating(true);
        try {
            const res = await api.createEvent({ name: eventName.trim(), eventDate, accessLevel });
            setCreatedEvents((prev) => [res.data, ...prev]);
            setShowModal(false); setEventName(""); setEventDate(""); setAccessLevel("spot");
            navigate(`/events/${res.data._id}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally { setCreating(false); }
    }

    async function handleLogout() {
        try { await logout(); navigate("/login"); } catch { /* ignore */ }
    }

    return (
        <div className="page-wrap">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>Dashboard</h1>
                    <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {user?.fullname || user?.username || user?.email}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>
                        + New Event
                    </button>
                    <button onClick={handleLogout} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                        Log Out
                    </button>
                </div>
            </div>

            <section style={{ marginTop: 28 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div className="tab-bar" role="tablist" aria-label="Event sections">
                        <button
                            role="tab"
                            aria-selected={activeEventsTab === "my"}
                            className={`tab-btn ${activeEventsTab === "my" ? "active" : ""}`}
                            onClick={() => setActiveEventsTab("my")}
                        >
                            My Events
                        </button>
                        <button
                            role="tab"
                            aria-selected={activeEventsTab === "shared"}
                            className={`tab-btn ${activeEventsTab === "shared" ? "active" : ""}`}
                            onClick={() => setActiveEventsTab("shared")}
                        >
                            Shared Events
                        </button>
                    </div>
                    <span style={{
                        fontSize: "0.6875rem", fontWeight: 600, padding: "0.2rem 0.6rem",
                        borderRadius: 999,
                        background: activeEventsTab === "my" ? "var(--accent-glow)" : "rgba(16,185,129,0.12)",
                        color: activeEventsTab === "my" ? "var(--accent-hover)" : "#6ee7b7",
                        border: activeEventsTab === "my" ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(16,185,129,0.3)",
                    }}>
                        {activeEventsTab === "my"
                            ? (loadingCreated ? "…" : createdEvents.length)
                            : (loadingShared ? "…" : sharedEvents.length)}
                    </span>
                </div>

                {activeEventsTab === "my" ? (
                    <div style={{ marginTop: 16 }}>
                        {loadingCreated ? (
                            <SkeletonCards count={3} />
                        ) : createdEvents.length === 0 ? (
                            <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: 44 }}>📷</div>
                                <h3 style={{ marginTop: 10, fontSize: "1rem", fontWeight: 600, color: "#fff" }}>No events created yet</h3>
                                <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                    Create your first event to start uploading and sharing photos
                                </p>
                                <button onClick={() => setShowModal(true)} className="btn-primary" style={{ marginTop: 16, padding: "0.5rem 1.25rem" }}>
                                    Create Event
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                                {createdEvents.map((ev) => (
                                    <EventCard key={ev._id} ev={ev} linkTo={`/events/${ev._id}`} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ marginTop: 16 }}>
                        {loadingShared ? (
                            <SkeletonCards count={2} />
                        ) : sharedEvents.length === 0 ? (
                            <div className="card" style={{ padding: "2.5rem", textAlign: "center" }}>
                                <div style={{ fontSize: 44 }}>🔗</div>
                                <h3 style={{ marginTop: 10, fontSize: "1rem", fontWeight: 600, color: "#fff" }}>No shared events</h3>
                                <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                    Events shared with you will appear here when you access a guest link
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                                {sharedEvents.map((ev) => (
                                    <EventCard key={ev._id} ev={ev} linkTo={`/events/${ev._id}/guest/collection`} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* ═══ Create Event Modal ═══ */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="card" style={{ width: "100%", maxWidth: 440, padding: "1.75rem" }}>
                        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff" }}>Create Event</h2>
                        <form onSubmit={handleCreate} style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">
                                Event Name
                                <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="ui-input" placeholder="Wedding, Party..." />
                            </label>
                            <label className="ui-label">
                                Event Date
                                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="ui-input" />
                            </label>
                            <label className="ui-label">
                                Access Level
                                <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as "spot" | "browse")} className="ui-input">
                                    <option value="spot">Spot Only — Guests find their photos via selfie</option>
                                    <option value="browse">Browse & Spot — Guests can also browse all photos</option>
                                </select>
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>Cancel</button>
                                <button type="submit" disabled={creating} className="btn-primary" style={{ padding: "0.5rem 1rem" }}>
                                    {creating ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
