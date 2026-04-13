import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import * as api from "../api";
import type { EventData, PhotoData, GuestData } from "../api";

const PAGE_SIZE = 20;
type Tab = "photos" | "guests" | "access" | "settings";
type ConfirmDialog = {
    title: string;
    message: string;
    action: "delete-selected-photos" | "delete-event";
    confirmLabel: string;
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getFileName(url: string) {
    return url.split("/").pop() || "";
}

export function EventManagementPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const uploadRef = useRef<HTMLInputElement>(null);

    // Core state
    const [event, setEvent] = useState<EventData | null>(null);
    const [photos, setPhotos] = useState<PhotoData[]>([]);
    const [guests, setGuests] = useState<GuestData[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Tab
    const [activeTab, setActiveTab] = useState<Tab>("photos");

    // Photo pagination & selection
    const [photoPage, setPhotoPage] = useState(1);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [selectedPhotos, setSelectedPhotos] = useState<PhotoData[]>([]);

    // Upload state
    const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "done">("idle");
    const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });

    // Guest collection management
    const [expandedGuest, setExpandedGuest] = useState<GuestData | null>(null);
    const [guestCollectionPhotos, setGuestCollectionPhotos] = useState<PhotoData[]>([]);
    const [guestCollectionId, setGuestCollectionId] = useState<string | null>(null);
    const [selectedGuestPhotos, setSelectedGuestPhotos] = useState<string[]>([]);
    const [guestCollectionLoading, setGuestCollectionLoading] = useState(false);
    const [addPhotoModal, setAddPhotoModal] = useState(false);
    const [eventPhotosForAdd, setEventPhotosForAdd] = useState<PhotoData[]>([]);
    const [addPhotoSelections, setAddPhotoSelections] = useState<string[]>([]);
    const [addPhotoPage, setAddPhotoPage] = useState(1);

    // Settings state
    const [settingsName, setSettingsName] = useState("");
    const [settingsDate, setSettingsDate] = useState("");
    const [settingsAccess, setSettingsAccess] = useState<"spot" | "browse">("spot");
    const [copiedLink, setCopiedLink] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [downloadToast, setDownloadToast] = useState("");
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

    // Load event details
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        api.getEventDetails(id)
            .then((res) => {
                setEvent(res.data);
                setSettingsName(res.data.name);
                setSettingsDate(res.data.eventDate?.split("T")[0] || "");
                setSettingsAccess(res.data.accessLevel);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    // Load photos when page changes
    const loadPhotos = useCallback(async () => {
        if (!id) return;
        try {
            const res = await api.getEventPhotos(id, photoPage - 1, PAGE_SIZE);
            setPhotos(res.data);
            // If first page and we got data, also get total count with a big limit
            if (photoPage === 1) {
                const countRes = await api.getEventPhotos(id, 0, 999999);
                setTotalPhotos(countRes.data.length);
            }
        } catch { /* ignore */ }
    }, [id, photoPage]);

    useEffect(() => { loadPhotos(); }, [loadPhotos]);

    // Load guests
    useEffect(() => {
        if (!id || activeTab !== "guests") return;
        api.getEventGuests(id).then((res) => setGuests(res.data)).catch(console.error);
    }, [id, activeTab]);

    // Warn before leaving during upload
    useEffect(() => {
        if (uploadPhase !== "uploading") return;
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "Upload in progress"; };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [uploadPhase]);

    if (loading) {
        return (
            <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (notFound || !event) return <Navigate to="/dashboard" replace />;

    const guestLink = `${window.location.origin}/event/${event._id}`;

    // ─── Upload handler ───
    async function handleFiles(files: FileList | null) {
        if (!files?.length || !id) return;
        const fileArr = Array.from(files);
        setUploadPhase("uploading");
        setUploadProgress({ uploaded: 0, total: fileArr.length });
        try {
            await api.uploadEventPhotos(id, fileArr, (uploaded, total, phase) => {
                setUploadProgress({ uploaded, total });
                if (phase === "done") {
                    setUploadPhase("done");
                    setTimeout(() => setUploadPhase("idle"), 2000);
                    loadPhotos();
                }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setUploadPhase("idle");
        }
    }

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        handleFiles(e.target.files);
        e.target.value = "";
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }

    // ─── Photo selection ───
    function togglePhoto(photo: PhotoData) {
        setSelectedPhotos((prev) =>
            prev.find((p) => p._id === photo._id)
                ? prev.filter((p) => p._id !== photo._id)
                : [...prev, photo],
        );
    }

    async function handleDeleteSelected() {
        if (!selectedPhotos.length || !id) return;
        setConfirmDialog({
            title: "Delete selected photos?",
            message: `This will permanently delete ${selectedPhotos.length} photo(s) from this event.`,
            action: "delete-selected-photos",
            confirmLabel: `Delete ${selectedPhotos.length}`,
        });
    }

    async function confirmDeleteSelected() {
        if (!selectedPhotos.length || !id) return;
        try {
            const fileNames = selectedPhotos.map((p) => getFileName(p.url));
            const photoIds = selectedPhotos.map((p) => p._id);
            await api.deletePhotos(id, fileNames, photoIds);
            setSelectedPhotos([]);
            setSuccess(`Deleted ${photoIds.length} photo(s)`);
            setTimeout(() => setSuccess(""), 3000);
            loadPhotos();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Delete failed");
        }
    }

    function showDownloadStartedToast() {
        setDownloadToast("Download started");
        window.setTimeout(() => setDownloadToast(""), 1800);
    }

    // ─── Guest collection ───
    async function loadGuestCollection(guest: GuestData) {
        if (!id || !guest.userId) return;
        setExpandedGuest(guest);
        setGuestCollectionLoading(true);
        setSelectedGuestPhotos([]);
        try {
            const collectionRes = await api.getGuestCollectionByEvent(id, guest.userId);
            const collection = collectionRes.data;
            if (!collection?._id) {
                setGuestCollectionPhotos([]);
                setGuestCollectionId(null);
                return;
            }

            setGuestCollectionId(collection._id);

            const photosRes = await api.getCollectionPhotos(collection._id, 0, 999999);
            const photos = photosRes.data.length > 0 && Array.isArray(photosRes.data[0].myPhotos)
                ? photosRes.data[0].myPhotos as PhotoData[]
                : [];
            setGuestCollectionPhotos(photos);
        } catch (err) {
            console.error(err);
        } finally {
            setGuestCollectionLoading(false);
        }
    }

    async function handleRemoveFromGuestCollection() {
        if (!guestCollectionId || !selectedGuestPhotos.length) return;
        try {
            await api.removePhotoFromCollection(guestCollectionId, selectedGuestPhotos);
            setGuestCollectionPhotos((prev) => prev.filter((p) => !selectedGuestPhotos.includes(p._id)));
            setSelectedGuestPhotos([]);
            setSuccess("Photos removed from collection");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        }
    }

    async function handleAddToGuestCollection() {
        if (!guestCollectionId || !addPhotoSelections.length || !id) return;
        try {
            await api.addPhotoToCollection(guestCollectionId, addPhotoSelections, id);
            setAddPhotoModal(false);
            setAddPhotoSelections([]);
            setSuccess("Photos added to collection");
            setTimeout(() => setSuccess(""), 3000);
            // Reload collection
            if (guestCollectionId) {
                const res = await api.getCollectionPhotos(guestCollectionId, 0, 999);
                if (res.data.length > 0 && Array.isArray(res.data[0].myPhotos)) {
                    setGuestCollectionPhotos(res.data[0].myPhotos as PhotoData[]);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        }
    }

    async function openAddPhotoModal() {
        if (!id || !guestCollectionId) return;
        setAddPhotoModal(true);
        setAddPhotoSelections([]);
        setAddPhotoPage(1);
        try {
            const res = await api.getEventPhotos(id, 0, PAGE_SIZE);
            setEventPhotosForAdd(res.data);
        } catch { /* ignore */ }
    }

    async function handleDownloadAllPhotos() {
        if (!id) return;
        try {
            showDownloadStartedToast();
            const res = await api.downloadAllEvent(id);
            await api.triggerDownload(res, "event_photos.zip");
        } catch {
            setError("Download failed");
        }
    }

    async function handleDownloadSelectedPhotos() {
        if (!id || selectedPhotos.length === 0) return;
        try {
            showDownloadStartedToast();
            const fileNames = selectedPhotos
                .map((p) => getFileName(p.url))
                .filter(Boolean);
            const res = await api.downloadSelected(id, fileNames);
            await api.triggerDownload(res, "selected_event_photos.zip");
        } catch {
            setError("Download failed");
        }
    }

    // ─── Settings ───
    async function saveSettings() {
        if (!id) return;
        setSettingsSaving(true);
        try {
            const res = await api.editEvent(id, {
                name: settingsName.trim() || undefined,
                eventDate: settingsDate || undefined,
                accessLevel: settingsAccess,
            });
            setEvent(res.data);
            setSuccess("Settings saved");
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        } finally { setSettingsSaving(false); }
    }

    async function handleDelete() {
        if (!id) return;
        setConfirmDialog({
            title: "Delete this event?",
            message: "This will permanently delete the event, all photos, guest data, and face index. This cannot be undone.",
            action: "delete-event",
            confirmLabel: "Delete Event",
        });
    }

    async function confirmDeleteEvent() {
        if (!id) return;
        try {
            await api.deleteEventApi(id);
            navigate("/dashboard");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        }
    }

    function copyLink() {
        navigator.clipboard?.writeText(guestLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
    }

    // ─── Access level update ───
    async function handleAccessChange(level: "spot" | "browse") {
        if (!id) return;
        try {
            const res = await api.editEvent(id, { accessLevel: level });
            setEvent(res.data);
            setSettingsAccess(level);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        }
    }

    const tabs: { key: Tab; label: string }[] = [
        { key: "photos", label: "Photos" },
        { key: "guests", label: "Guests" },
        { key: "access", label: "Access" },
        { key: "settings", label: "Settings" },
    ];

    return (
        <>
            <div className="page-wrap">
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <Link to="/dashboard" style={{ fontSize: "0.8125rem", color: "var(--accent-hover)", textDecoration: "none" }}>
                    ← Dashboard
                </Link>
                <span style={{
                    fontSize: "0.6875rem", padding: "0.25rem 0.75rem", borderRadius: 999,
                    border: "1px solid var(--border)", color: "var(--text-secondary)",
                }}>
                    {event._id.slice(-8)}
                </span>
            </div>

            {/* Event Header */}
            <div className="card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{event.name}</h1>
                        <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{formatDate(event.eventDate)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span className={`status-pill status-${event.accessLevel}`}>
                            {event.accessLevel === "spot" ? "Spot Only" : "Browse & Spot"}
                        </span>
                        <span className={`status-pill status-${event.status}`}>{event.status}</span>
                    </div>
                </div>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
                    <div className="stat-card">
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Photos</p>
                        <p style={{ marginTop: 2, fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{totalPhotos}</p>
                    </div>
                    <div className="stat-card">
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Guests</p>
                        <p style={{ marginTop: 2, fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>{guests.length}</p>
                    </div>
                    <div className="stat-card">
                        <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)" }}>Expires</p>
                        <p style={{ marginTop: 2, fontSize: "0.875rem", fontWeight: 600, color: "#fff" }}>{formatDate(event.expiresAt)}</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error} <button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button></div>}
            {success && <div className="alert alert-success" style={{ marginTop: 12 }}>{success}</div>}

            {/* Tabs */}
            <div style={{ marginTop: 16, overflowX: "auto" }}>
                <div className="tab-bar">
                    {tabs.map((t) => (
                        <button
                            key={t.key} type="button"
                            className={`tab-btn ${activeTab === t.key ? "active" : ""}`}
                            onClick={() => setActiveTab(t.key)}
                        >{t.label}</button>
                    ))}
                </div>
            </div>

            {/* ═══ PHOTOS TAB ═══ */}
            {activeTab === "photos" && (
                <section className="card" style={{ marginTop: 16, padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>Event Photos</h2>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {photos.length > 0 && (
                                <button onClick={handleDownloadAllPhotos} className="btn-secondary" style={{ padding: "0.4rem 0.875rem" }}>
                                    Download All
                                </button>
                            )}
                            {selectedPhotos.length > 0 && (
                                <button onClick={handleDownloadSelectedPhotos} className="btn-secondary" style={{ padding: "0.4rem 0.875rem" }}>
                                    Download {selectedPhotos.length}
                                </button>
                            )}
                            {selectedPhotos.length > 0 && (
                                <button onClick={handleDeleteSelected} className="btn-danger" style={{ padding: "0.4rem 0.875rem" }}>
                                    Delete {selectedPhotos.length}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Upload Zone */}
                    <div
                        onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
                        style={{
                            marginTop: 16, padding: "2rem", borderRadius: 12,
                            border: "2px dashed var(--border)", background: "var(--bg)",
                            textAlign: "center", cursor: "pointer",
                            transition: "border-color 0.2s",
                        }}
                        onClick={() => uploadRef.current?.click()}
                    >
                        <div style={{ fontSize: 32 }}>📁</div>
                        <p style={{ marginTop: 8, fontSize: "0.875rem", color: "var(--text)" }}>
                            Drag & drop photos or <span style={{ color: "var(--accent-hover)", textDecoration: "underline" }}>browse</span>
                        </p>
                        <p style={{ marginTop: 4, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Files are uploaded in batches of 5 and auto-indexed
                        </p>
                        <input ref={uploadRef} type="file" multiple accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                    </div>

                    {/* Upload Progress */}
                    {uploadPhase === "uploading" && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                <span>Uploading {uploadProgress.uploaded} / {uploadProgress.total}</span>
                                <span>{Math.round((uploadProgress.uploaded / uploadProgress.total) * 100)}%</span>
                            </div>
                            <div className="progress-bar" style={{ marginTop: 6 }}>
                                <div className="progress-bar-fill" style={{ width: `${(uploadProgress.uploaded / uploadProgress.total) * 100}%` }} />
                            </div>
                        </div>
                    )}
                    {uploadPhase === "done" && (
                        <div className="alert alert-success" style={{ marginTop: 12 }}>
                            ✓ All photos uploaded and queued for indexing
                        </div>
                    )}

                    {/* Photo Grid */}
                    <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                        {photos.map((photo) => {
                            const isSelected = selectedPhotos.some((p) => p._id === photo._id);
                            return (
                                <div
                                    key={photo._id}
                                    className="photo-tile"
                                    style={{
                                        padding: 6, cursor: "pointer",
                                        border: isSelected ? "2px solid var(--accent)" : undefined,
                                    }}
                                    onClick={() => togglePhoto(photo)}
                                >
                                    <img src={photo.url} alt="" style={{ borderRadius: 8 }} />
                                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                                        <input type="checkbox" checked={isSelected} readOnly />
                                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {getFileName(photo.url).slice(0, 12)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {photos.length === 0 && (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: 40 }}>🖼️</div>
                            <p style={{ marginTop: 8, fontWeight: 500 }}>No photos uploaded yet</p>
                            <p style={{ fontSize: "0.8125rem" }}>Upload event photos to start AI face indexing</p>
                        </div>
                    )}

                    <Pagination totalItems={totalPhotos} currentPage={photoPage} pageSize={PAGE_SIZE} onPageChange={setPhotoPage} />
                </section>
            )}

            {/* ═══ GUESTS TAB ═══ */}
            {activeTab === "guests" && (
                <section className="card" style={{ marginTop: 16, padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>Guest Activity</h2>
                    <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        Guests who accessed the event via the shared link
                    </p>

                    {guests.length === 0 ? (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                            <div style={{ fontSize: 40 }}>👥</div>
                            <p style={{ marginTop: 8, fontWeight: 500 }}>No guest activity yet</p>
                            <p style={{ fontSize: "0.8125rem" }}>Share your event link to start receiving guests</p>
                        </div>
                    ) : (
                        <div style={{ marginTop: 16, overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-secondary)", textAlign: "left" }}>
                                        <th style={{ padding: "0.75rem" }}>Guest ID</th>
                                        <th style={{ padding: "0.75rem" }}>Last Accessed</th>
                                        <th style={{ padding: "0.75rem" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.map((guest) => (
                                        <tr key={guest._id} style={{ borderBottom: "1px solid var(--border)" }}>
                                            <td style={{ padding: "0.75rem", color: "#fff" }}>
                                                {guest.userId?.slice(-8) || "Anonymous"}
                                            </td>
                                            <td style={{ padding: "0.75rem", color: "var(--text-secondary)" }}>
                                                {new Date(guest.accessedAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "0.75rem" }}>
                                                <button
                                                    className="btn-secondary"
                                                    style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}
                                                    onClick={() => loadGuestCollection(guest)}
                                                    disabled={!guest.userId}
                                                >
                                                    {!guest.userId
                                                        ? "No Account"
                                                        : (expandedGuest?._id === guest._id ? "Hide" : "View Collection")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Expanded Guest Collection */}
                    {expandedGuest && (
                        <div className="card" style={{ marginTop: 16, padding: "1.25rem", border: "1px solid var(--accent-glow)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>
                                    Collection — {expandedGuest.userId?.slice(-8)}
                                </h3>
                                <div style={{ display: "flex", gap: 6 }}>
                                    <button onClick={openAddPhotoModal} className="btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                                        + Add Photos
                                    </button>
                                    {selectedGuestPhotos.length > 0 && (
                                        <button onClick={handleRemoveFromGuestCollection} className="btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                                            Remove {selectedGuestPhotos.length}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {guestCollectionLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><div className="spinner" /></div>
                            ) : guestCollectionPhotos.length === 0 ? (
                                <p style={{ marginTop: 12, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                    No photos in this guest's collection. Use "Add Photos" to add from the event.
                                </p>
                            ) : (
                                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                                    {guestCollectionPhotos.map((p) => {
                                        const isSel = selectedGuestPhotos.includes(p._id);
                                        return (
                                            <div key={p._id} className="photo-tile" style={{ padding: 4, border: isSel ? "2px solid var(--accent)" : undefined, cursor: "pointer" }}
                                                onClick={() => setSelectedGuestPhotos((prev) => isSel ? prev.filter((x) => x !== p._id) : [...prev, p._id])}
                                            >
                                                <img src={p.url} alt="" style={{ borderRadius: 6, height: 100 }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* ═══ ACCESS TAB ═══ */}
            {activeTab === "access" && (
                <section className="card" style={{ marginTop: 16, padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>Access Level</h2>
                    <div style={{ marginTop: 16, display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
                        {(["spot", "browse"] as const).map((level) => (
                            <label
                                key={level}
                                style={{
                                    display: "block", padding: "1rem", borderRadius: 12, cursor: "pointer",
                                    border: `1px solid ${event.accessLevel === level ? "var(--accent)" : "var(--border)"}`,
                                    background: event.accessLevel === level ? "var(--accent-glow)" : "var(--bg-soft)",
                                    transition: "all 0.15s",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <input type="radio" checked={event.accessLevel === level} onChange={() => handleAccessChange(level)}
                                        style={{ accentColor: "var(--accent)" }} />
                                    <strong style={{ color: "#fff", fontSize: "0.875rem" }}>
                                        {level === "spot" ? "Spot Only" : "Browse & Spot"}
                                    </strong>
                                </div>
                                <p style={{ marginTop: 6, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                    {level === "spot"
                                        ? "Guests upload a selfie to find their photos. They cannot browse all event photos."
                                        : "Guests can browse all photos AND use face spotting to find themselves."}
                                </p>
                            </label>
                        ))}
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fff" }}>Guest Link</h3>
                        <div style={{
                            marginTop: 8, padding: "0.75rem 1rem", borderRadius: 10,
                            border: "1px solid var(--border)", background: "var(--bg)",
                            fontSize: "0.8125rem", wordBreak: "break-all", color: "var(--accent-hover)",
                        }}>
                            {guestLink}
                        </div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                            <button onClick={copyLink} className="btn-secondary" style={{ padding: "0.4rem 0.875rem" }}>
                                {copiedLink ? "✓ Copied" : "Copy Link"}
                            </button>
                            <a href={guestLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: "0.4rem 0.875rem", textDecoration: "none" }}>
                                Open
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* ═══ SETTINGS TAB ═══ */}
            {activeTab === "settings" && (
                <section className="card" style={{ marginTop: 16, padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>Event Settings</h2>
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
                        <label className="ui-label">
                            Event Name
                            <input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className="ui-input" />
                        </label>
                        <label className="ui-label">
                            Event Date
                            <input type="date" value={settingsDate} onChange={(e) => setSettingsDate(e.target.value)} className="ui-input" />
                        </label>
                        <button onClick={saveSettings} disabled={settingsSaving} className="btn-primary" style={{ padding: "0.5rem 1rem", alignSelf: "flex-start" }}>
                            {settingsSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                    <div style={{
                        marginTop: 32, padding: "1.25rem", borderRadius: 12,
                        border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.05)",
                    }}>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#fca5a5" }}>Danger Zone</h3>
                        <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "rgba(252,165,165,0.7)", lineHeight: 1.5 }}>
                            Permanently delete this event, all photos, guest data, and face index.
                        </p>
                        <button onClick={handleDelete} className="btn-danger" style={{ marginTop: 12, padding: "0.5rem 1rem" }}>
                            Delete Event
                        </button>
                    </div>
                </section>
            )}

            {/* ═══ ADD PHOTO MODAL ═══ */}
            {addPhotoModal && (
                <div className="modal-backdrop">
                    <div className="card" style={{ width: "100%", maxWidth: 640, padding: "1.5rem", maxHeight: "80vh", overflow: "auto" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#fff" }}>Add Photos to Collection</h2>
                            <button onClick={() => setAddPhotoModal(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 18 }}>✕</button>
                        </div>
                        <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                            Select photos from the event to add to this guest's collection
                        </p>
                        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                            {eventPhotosForAdd.map((p) => {
                                const isSel = addPhotoSelections.includes(p._id);
                                return (
                                    <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: isSel ? "2px solid var(--accent)" : undefined }}
                                        onClick={() => setAddPhotoSelections((prev) => isSel ? prev.filter((x) => x !== p._id) : [...prev, p._id])}
                                    >
                                        <img src={p.url} alt="" style={{ borderRadius: 6, height: 80 }} />
                                    </div>
                                );
                            })}
                        </div>
                        <Pagination totalItems={totalPhotos} currentPage={addPhotoPage} pageSize={PAGE_SIZE} onPageChange={async (p) => {
                            setAddPhotoPage(p);
                            if (id) {
                                const res = await api.getEventPhotos(id, p - 1, PAGE_SIZE);
                                setEventPhotosForAdd(res.data);
                            }
                        }} />
                        <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <button onClick={() => setAddPhotoModal(false)} className="btn-secondary" style={{ padding: "0.4rem 0.875rem" }}>Cancel</button>
                            <button onClick={handleAddToGuestCollection} disabled={!addPhotoSelections.length} className="btn-primary" style={{ padding: "0.4rem 0.875rem" }}>
                                Add {addPhotoSelections.length} Photo(s)
                            </button>
                        </div>
                    </div>
                </div>
            )}
            </div>

        {downloadToast && (
            <div style={{
                position: "fixed", right: 16, bottom: 16, zIndex: 70,
                padding: "0.55rem 0.8rem", borderRadius: 10,
                border: "1px solid rgba(16,185,129,0.3)",
                background: "rgba(16,185,129,0.12)", color: "#6ee7b7",
                fontSize: "0.75rem", fontWeight: 600,
            }}>
                {downloadToast}
            </div>
        )}

            {confirmDialog && (
            <div className="modal-backdrop">
                <div className="card" style={{ width: "100%", maxWidth: 420, padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>{confirmDialog.title}</h3>
                    <p style={{ marginTop: 8, fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                        {confirmDialog.message}
                    </p>
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                            onClick={() => setConfirmDialog(null)}
                            className="btn-secondary"
                            style={{ padding: "0.4rem 0.875rem" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                const action = confirmDialog.action;
                                setConfirmDialog(null);
                                if (action === "delete-selected-photos") {
                                    await confirmDeleteSelected();
                                } else {
                                    await confirmDeleteEvent();
                                }
                            }}
                            className="btn-danger"
                            style={{ padding: "0.4rem 0.875rem" }}
                        >
                            {confirmDialog.confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
