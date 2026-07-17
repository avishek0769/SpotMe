import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";
import type { EventData } from "../api";

/* ─── Custom SVG Icons ──────────────────────────────────────────────── */
const DashboardIcons = {
    Camera: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Link: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    ),
    Empty: () => (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
};

function getStatusPill(status: string) {
    const cls: Record<string, string> = {
        empty: "status-pill status-empty",
        processing: "status-pill status-processing",
        expired: "status-pill status-expired",
    };
    return cls[status] || "status-pill status-ready";
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getCoverImageUrl(coverImage: EventData["coverImage"]) {
    if (!coverImage) return null;
    if (typeof coverImage === "string") return coverImage;
    return coverImage.url || null;
}

function EventCard({ ev, linkTo }: { ev: EventData; linkTo: string }) {
    const coverImageUrl = getCoverImageUrl(ev.coverImage);

    return (
        <Link to={linkTo} style={{ textDecoration: "none", color: "inherit" }}>
            <article className="card" style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", transition: "transform 0.15s ease, border-color 0.15s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--ink-subtle)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.borderColor = "var(--hairline)";
                }}
            >
                <div style={{
                    height: 140, borderRadius: "var(--r-md)", overflow: "hidden",
                    background: coverImageUrl
                        ? `url(${coverImageUrl}) center/cover no-repeat`
                        : "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: "1px solid var(--hairline)",
                    color: "var(--ink-tertiary)"
                }}>
                    {!coverImageUrl && <DashboardIcons.Camera />}
                </div>
                
                <div style={{ marginTop: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, margin: 0 }}>{ev.name}</h3>
                    <span className={getStatusPill(ev.status)}>{ev.status}</span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: "auto" }}>
                    <div className="stat-card" style={{ background: "var(--canvas)", border: "1px solid var(--hairline-soft)" }}>
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>Date</p>
                        <p style={{ marginTop: 2, fontSize: "13px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>{formatDate(ev.eventDate)}</p>
                    </div>
                    <div className="stat-card" style={{ background: "var(--canvas)", border: "1px solid var(--hairline-soft)" }}>
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>Access</p>
                        <p style={{ marginTop: 2, fontSize: "13px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="card" style={{ padding: 20 }}>
                    <div className="skeleton" style={{ height: 140, borderRadius: "var(--r-md)" }} />
                    <div className="skeleton" style={{ height: 18, width: "65%", marginTop: 16 }} />
                    <div className="skeleton" style={{ height: 14, width: "40%", marginTop: 8 }} />
                </div>
            ))}
        </div>
    );
}

export function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAppContext();

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


    return (
        <>
        <div className="page-wrap fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--hairline)", paddingBottom: "24px", marginBottom: "32px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.5px", margin: 0 }}>Dashboard</h1>
                    <p style={{ marginTop: 4, fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                        {user?.fullname || user?.username || user?.email}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">
                        + New Event
                    </button>
                </div>
            </div>

            <section>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: "20px" }}>
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
                        fontSize: "12px", fontWeight: 500, padding: "4px 10px",
                        borderRadius: "999px",
                        background: "var(--surface-2)",
                        color: "var(--ink-muted)",
                        border: "1px solid var(--hairline)"
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
                            <div className="card" style={{ padding: "48px 24px", textAlign: "center", maxWidth: "560px", margin: "40px auto 0" }}>
                                <div style={{ color: "var(--ink-tertiary)", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                    <DashboardIcons.Empty />
                                </div>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0" }}>No events created yet</h3>
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                                    Create your first event to start uploading and sharing photos with your guests.
                                </p>
                                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                                    Create Event
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
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
                            <div className="card" style={{ padding: "48px 24px", textAlign: "center", maxWidth: "560px", margin: "40px auto 0" }}>
                                <div style={{ color: "var(--ink-tertiary)", display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                    <DashboardIcons.Link />
                                </div>
                                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--ink)", margin: "0 0 8px 0" }}>No shared events</h3>
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "0 0 24px 0", lineHeight: 1.5 }}>
                                    Events shared with you will appear here when you scan yourself using a guest selfie link.
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
                                {sharedEvents.map((ev) => (
                                    <EventCard key={ev._id} ev={ev} linkTo={`/events/${ev._id}/guest/collection`} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>

            {showModal && (
                <div className="modal-backdrop">
                    <div className="card card-xl" style={{ width: "100%", maxWidth: 460, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", border: "1px solid var(--hairline)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "22px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>Create Event</h2>
                            <button type="button" onClick={() => setShowModal(false)} style={{ background: "none", border: "none", color: "var(--ink-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
                        </div>
                        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <label className="ui-label">
                                Event Name
                                <input value={eventName} onChange={(e) => setEventName(e.target.value)} className="ui-input" placeholder="Wedding, Party..." required />
                            </label>
                            <label className="ui-label">
                                Event Date
                                <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="ui-input" required />
                            </label>
                            <label className="ui-label">
                                Access Level
                                <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as "spot" | "browse")} className="ui-input" style={{ width: "100%" }}>
                                    <option value="spot">Spot Only — Guests scan via selfie only</option>
                                    <option value="browse">Browse &amp; Spot — View all photos or scan selfie</option>
                                </select>
                            </label>
                            {error && <div className="alert alert-error">{error}</div>}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" disabled={creating} className="btn btn-primary">
                                    {creating ? "Creating..." : "Create Event"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
