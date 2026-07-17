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

/* ─── Custom SVG Icons ──────────────────────────────────────────────── */
const MgrIcons = {
    Camera: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Settings: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    Users: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Image: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    Upload: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    Link: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )
};

function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getFileName(url: string) {
    return url.split("/").pop() || "";
}

async function countEventPhotosWithPagination(eventId: string) {
    let total = 0;
    let page = 0;

    while (true) {
        const res = await api.getEventPhotos(eventId, page, PAGE_SIZE);
        total += res.data.length;
        if (res.data.length < PAGE_SIZE) break;
        page += 1;
    }

    return total;
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
    const [guestCollectionPage, setGuestCollectionPage] = useState(1);
    const [guestCollectionTotal, setGuestCollectionTotal] = useState(0);
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
            if (photoPage === 1) {
                const total = await countEventPhotosWithPagination(id);
                setTotalPhotos(total);
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
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (notFound || !event) return <Navigate to="/dashboard" replace />;

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
                }
            });
            await api.completeEventUpload(id);
            const eventRes = await api.getEventDetails(id);
            setEvent(eventRes.data);
            loadPhotos();
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

    async function loadGuestCollection(guest: GuestData) {
        if (expandedGuest?._id === guest._id) {
            setExpandedGuest(null);
            setGuestCollectionPhotos([]);
            setGuestCollectionId(null);
            setGuestCollectionPage(1);
            setGuestCollectionTotal(0);
            setSelectedGuestPhotos([]);
            return;
        }

        if (!id || !guest.userId) return;
        setExpandedGuest(guest);
        setGuestCollectionLoading(true);
        setSelectedGuestPhotos([]);
        setGuestCollectionPage(1);
        try {
            const collectionRes = await api.getGuestCollectionByEvent(id, guest.userId);
            const collection = collectionRes.data;
            if (!collection?._id) {
                setGuestCollectionPhotos([]);
                setGuestCollectionId(null);
                setGuestCollectionTotal(0);
                return;
            }

            setGuestCollectionId(collection._id);
            const total = Array.isArray(collection.myPhotos) ? collection.myPhotos.length : 0;
            setGuestCollectionTotal(total);

            const photosRes = await api.getCollectionPhotos(collection._id, 0, PAGE_SIZE);
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
            setGuestCollectionTotal((prev) => Math.max(0, prev - selectedGuestPhotos.length));
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
            if (guestCollectionId) {
                const res = await api.getCollectionPhotos(guestCollectionId, guestCollectionPage - 1, PAGE_SIZE);
                if (res.data.length > 0 && Array.isArray(res.data[0].myPhotos)) {
                    setGuestCollectionPhotos(res.data[0].myPhotos as PhotoData[]);
                }
                if (expandedGuest?.userId) {
                    const collectionRes = await api.getGuestCollectionByEvent(id, expandedGuest.userId);
                    if (collectionRes.data && Array.isArray(collectionRes.data.myPhotos)) {
                        setGuestCollectionTotal(collectionRes.data.myPhotos.length);
                    }
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
        navigator.clipboard?.writeText(event?.sharableLink || "");
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1500);
    }

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
        { key: "access", label: "Access Control" },
        { key: "settings", label: "Settings" },
    ];

    return (
        <>
        <div className="page-wrap fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header section with back navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <Link to="/dashboard" style={{ fontSize: "14px", color: "#ff5600", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    &larr; Back to Dashboard
                </Link>
                <span style={{
                    fontSize: "12px", padding: "4px 10px", borderRadius: "999px",
                    border: "1px solid var(--hairline)", color: "var(--ink-muted)", background: "var(--surface-2)"
                }}>
                    ID: {event._id.slice(-8).toUpperCase()}
                </span>
            </div>

            {/* Event Summary Card */}
            <div className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", borderBottom: "1px solid var(--hairline)", paddingBottom: "20px", marginBottom: "20px" }}>
                    <div>
                        <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.5px", margin: 0 }}>{event.name}</h1>
                        <p style={{ marginTop: 6, fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>{formatDate(event.eventDate)}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <span className="status-pill status-ready">
                            {event.accessLevel === "spot" ? "Spot Only" : "Browse & Spot"}
                        </span>
                        <span className="status-pill status-processing">{event.status}</span>
                    </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
                    <div className="stat-card" style={{ background: "var(--canvas)", border: "1px solid var(--hairline-soft)" }}>
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>Photos</p>
                        <p style={{ marginTop: 4, fontSize: "22px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{totalPhotos}</p>
                    </div>
                    <div className="stat-card" style={{ background: "var(--canvas)", border: "1px solid var(--hairline-soft)" }}>
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>Registered Guests</p>
                        <p style={{ marginTop: 4, fontSize: "22px", fontWeight: 600, color: "var(--ink)", margin: 0 }}>{guests.length}</p>
                    </div>
                    <div className="stat-card" style={{ background: "var(--canvas)", border: "1px solid var(--hairline-soft)" }}>
                        <p style={{ fontSize: "11px", color: "var(--ink-muted)", margin: 0 }}>Expires On</p>
                        <p style={{ marginTop: 6, fontSize: "14px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>{formatDate(event.expiresAt)}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{error}</span>
                    <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>✕</button>
                </div>
            )}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Tab Navigation */}
            <div>
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

            {/* Photos Tab */}
            {activeTab === "photos" && (
                <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>Event Gallery</h2>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {photos.length > 0 && (
                                <button onClick={handleDownloadAllPhotos} className="btn btn-secondary btn-sm">
                                    Download All
                                </button>
                            )}
                            {selectedPhotos.length > 0 && (
                                <button onClick={handleDownloadSelectedPhotos} className="btn btn-secondary btn-sm">
                                    Download Selected ({selectedPhotos.length})
                                </button>
                            )}
                            {selectedPhotos.length > 0 && (
                                <button onClick={handleDeleteSelected} className="btn btn-sm" style={{ background: "#be123c", color: "#fff", border: "1px solid #9f1239" }}>
                                    Delete Selected ({selectedPhotos.length})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                        onDrop={onDrop} onDragOver={(e) => e.preventDefault()}
                        style={{
                            padding: "32px 16px", borderRadius: "var(--r-lg)",
                            border: "2px dashed var(--hairline)", background: "var(--surface-2)",
                            textAlign: "center", cursor: "pointer",
                            transition: "border-color 0.15s ease",
                            marginBottom: "24px"
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--ink-subtle)"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--hairline)"}
                        onClick={() => uploadRef.current?.click()}
                    >
                        <div style={{ color: "var(--ink-tertiary)", display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                            <MgrIcons.Upload />
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--ink)", margin: "0 0 4px 0" }}>
                            Drag and drop photo files or <span style={{ color: "#ff5600", fontWeight: 500, textDecoration: "underline" }}>browse files</span>
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
                            Photos are indexed automatically. Large batches are uploaded in background threads.
                        </p>
                        <input ref={uploadRef} type="file" multiple accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
                    </div>

                    {/* Upload progress state */}
                    {uploadPhase === "uploading" && (
                        <div style={{ marginBottom: "20px", padding: "12px", borderRadius: "var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--hairline)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--ink-muted)", marginBottom: "6px" }}>
                                <span>Uploading {uploadProgress.uploaded} of {uploadProgress.total} photos</span>
                                <span>{Math.round((uploadProgress.uploaded / uploadProgress.total) * 100)}%</span>
                            </div>
                            <div className="progress-bar" style={{ height: "6px", background: "var(--hairline)", borderRadius: "3px", overflow: "hidden" }}>
                                <div className="progress-bar-fill" style={{ width: `${(uploadProgress.uploaded / uploadProgress.total) * 100}%`, background: "#ff5600", height: "100%" }} />
                            </div>
                        </div>
                    )}
                    {uploadPhase === "done" && (
                        <div className="alert alert-success" style={{ marginBottom: "20px" }}>
                            ✓ Photos successfully loaded and queued in face indexing pipeline
                        </div>
                    )}

                    {/* Photos grid list */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                        {photos.map((photo) => {
                            const isSelected = selectedPhotos.some((p) => p._id === photo._id);
                            return (
                                <div
                                    key={photo._id}
                                    className="photo-tile"
                                    style={{
                                        padding: 4, cursor: "pointer",
                                        border: isSelected ? "2px solid var(--accent)" : "1px solid var(--hairline)",
                                    }}
                                    onClick={() => togglePhoto(photo)}
                                >
                                    <img src={photo.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 110, width: "100%", objectFit: "cover" }} />
                                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "var(--ink-muted)" }}>
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
                        <div style={{ textAlign: "center", padding: "40px 12px", color: "var(--ink-tertiary)" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                <MgrIcons.Image />
                            </div>
                            <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>No photos uploaded yet</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Add images above to run biometric scanning.</p>
                        </div>
                    )}

                    <Pagination totalItems={totalPhotos} currentPage={photoPage} pageSize={PAGE_SIZE} onPageChange={setPhotoPage} />
                </section>
            )}

            {/* Guests Tab */}
            {activeTab === "guests" && (
                <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>Guest Activity</h2>
                    <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "0 0 24px 0" }}>
                        Guests who have accessed matching records on this event.
                    </p>

                    {guests.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 12px", color: "var(--ink-tertiary)" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                <MgrIcons.Users />
                            </div>
                            <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>No guest activity yet</h3>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Guests will appear here once they search using the sharable link.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--hairline)", color: "var(--ink-muted)", textAlign: "left" }}>
                                        <th style={{ padding: "12px 8px" }}>Guest Account</th>
                                        <th style={{ padding: "12px 8px" }}>Last Visited</th>
                                        <th style={{ padding: "12px 8px" }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.map((guest) => (
                                        <tr key={guest._id} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                                            <td style={{ padding: "14px 8px", color: "var(--ink)", fontWeight: 500 }}>
                                                {guest.user?.fullname || guest.userId?.slice(-8).toUpperCase() || "Anonymous Guest"}
                                            </td>
                                            <td style={{ padding: "14px 8px", color: "var(--ink-muted)" }}>
                                                {new Date(guest.accessedAt).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "14px 8px" }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => loadGuestCollection(guest)}
                                                    disabled={!guest.userId}
                                                >
                                                    {!guest.userId
                                                        ? "No Account"
                                                        : (expandedGuest?._id === guest._id ? "Hide Collection" : "View Collection")}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Expandable guest collection editor drawer panel */}
                    {expandedGuest && (
                        <div className="card" style={{ marginTop: "24px", padding: "20px", border: "1px solid var(--hairline)", background: "var(--surface-2)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>
                                    Editing Matches: {expandedGuest.user?.fullname || expandedGuest.userId?.slice(-8).toUpperCase() || "Anonymous"}
                                </h3>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button onClick={openAddPhotoModal} className="btn btn-primary btn-sm">
                                        + Add Photos
                                    </button>
                                    {selectedGuestPhotos.length > 0 && (
                                        <button onClick={handleRemoveFromGuestCollection} className="btn btn-sm" style={{ background: "#be123c", color: "#fff", border: "1px solid #9f1239" }}>
                                            Remove Selected ({selectedGuestPhotos.length})
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {guestCollectionLoading ? (
                                <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}><div className="spinner" /></div>
                            ) : guestCollectionPhotos.length === 0 ? (
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                                    No photos in this guest's collection. Click "Add Photos" to link images manually.
                                </p>
                            ) : (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                                        {guestCollectionPhotos.map((p) => {
                                            const isSel = selectedGuestPhotos.includes(p._id);
                                            return (
                                                <div key={p._id} className="photo-tile" style={{ padding: 4, border: isSel ? "2px solid var(--accent)" : "1px solid var(--hairline)", cursor: "pointer" }}
                                                    onClick={() => setSelectedGuestPhotos((prev) => isSel ? prev.filter((x) => x !== p._id) : [...prev, p._id])}
                                                >
                                                    <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 80, width: "100%", objectFit: "cover" }} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Pagination
                                        totalItems={guestCollectionTotal}
                                        currentPage={guestCollectionPage}
                                        pageSize={PAGE_SIZE}
                                        onPageChange={async (page) => {
                                            if (!guestCollectionId) return;
                                            setGuestCollectionPage(page);
                                            setGuestCollectionLoading(true);
                                            try {
                                                const res = await api.getCollectionPhotos(guestCollectionId, page - 1, PAGE_SIZE);
                                                const photos = res.data.length > 0 && Array.isArray(res.data[0].myPhotos)
                                                    ? res.data[0].myPhotos as PhotoData[]
                                                    : [];
                                                setGuestCollectionPhotos(photos);
                                            } finally {
                                                setGuestCollectionLoading(false);
                                            }
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </section>
            )}

            {/* Access Control Tab */}
            {activeTab === "access" && (
                <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 16px 0" }}>Access Settings</h2>
                    
                    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", marginBottom: "32px" }}>
                        {(["spot", "browse"] as const).map((level) => {
                            const isSelected = event.accessLevel === level;
                            return (
                                <label
                                    key={level}
                                    style={{
                                        display: "block", padding: "20px", borderRadius: "var(--r-lg)", cursor: "pointer",
                                        border: `1px solid ${isSelected ? "var(--accent)" : "var(--hairline)"}`,
                                        background: isSelected ? "var(--surface-2)" : "var(--surface-1)",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <input type="radio" checked={isSelected} onChange={() => handleAccessChange(level)}
                                            style={{ accentColor: "#ff5600" }} />
                                        <strong style={{ color: "var(--ink)", fontSize: "16px" }}>
                                            {level === "spot" ? "Spot Only" : "Browse & Spot"}
                                        </strong>
                                    </div>
                                    <p style={{ marginTop: 8, fontSize: "13px", color: "var(--ink-muted)", lineHeight: 1.5, margin: 0 }}>
                                        {level === "spot"
                                            ? "Guests upload selfies to find their matches. General event library is locked and hidden."
                                            : "Guests can freely scroll the complete event gallery or upload selfies to filter matches."}
                                    </p>
                                </label>
                            );
                        })}
                    </div>

                    <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", marginBottom: "8px" }}>Public Guest URL</h3>
                        <div style={{
                            padding: "12px 16px", borderRadius: "var(--r-md)",
                            border: "1px solid var(--hairline)", background: "var(--surface-2)",
                            fontSize: "13px", wordBreak: "break-all", color: "#ff5600",
                            fontWeight: 500, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px"
                        }}>
                            <MgrIcons.Link />
                            <span>{event.sharableLink}</span>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button onClick={copyLink} className="btn btn-secondary">
                                {copiedLink ? "✓ Copied" : "Copy Guest Link"}
                            </button>
                            <a href={event.sharableLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: "none" }}>
                                Open Guest View
                            </a>
                        </div>
                    </div>
                </section>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 20px 0" }}>Event Settings</h2>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480, marginBottom: "40px" }}>
                        <label className="ui-label">
                            Event Name
                            <input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} className="ui-input" required />
                        </label>
                        <label className="ui-label">
                            Event Date
                            <input type="date" value={settingsDate} onChange={(e) => setSettingsDate(e.target.value)} className="ui-input" required />
                        </label>
                        <button onClick={saveSettings} disabled={settingsSaving} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                            {settingsSaving ? "Saving..." : "Save Settings"}
                        </button>
                    </div>

                    <div style={{
                        padding: "24px", borderRadius: "var(--r-lg)",
                        border: "1px solid rgba(196,28,28,0.2)", background: "rgba(196,28,28,0.01)",
                    }}>
                        <h3 style={{ fontSize: "16px", fontWeight: 500, color: "#c41c1c", margin: "0 0 8px 0" }}>Danger Zone</h3>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, margin: "0 0 16px 0" }}>
                            Permanently delete this event. All photographs, biometric indices, and collections will be wiped out.
                        </p>
                        <button onClick={handleDelete} className="btn" style={{ background: "#be123c", color: "#fff", border: "1px solid #9f1239" }}>
                            Delete Event
                        </button>
                    </div>
                </section>
            )}

        </div>

            {/* Modals and Dialogs - outside animated container to avoid stacking context clip */}
            {addPhotoModal && (
                <div className="modal-backdrop">
                    <div className="card card-xl" style={{ width: "100%", maxWidth: 640, maxHeight: "85vh", overflow: "auto", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>Add Photos manually</h2>
                            <button onClick={() => setAddPhotoModal(false)} style={{ background: "none", border: "none", color: "var(--ink-muted)", cursor: "pointer", fontSize: 18 }}>✕</button>
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "20px" }}>
                            Select photos from the event to force-associate them into this guest's collection.
                        </p>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10, marginBottom: "20px" }}>
                            {eventPhotosForAdd.map((p) => {
                                const isSel = addPhotoSelections.includes(p._id);
                                return (
                                    <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: isSel ? "2px solid var(--accent)" : "1px solid var(--hairline)" }}
                                        onClick={() => setAddPhotoSelections((prev) => isSel ? prev.filter((x) => x !== p._id) : [...prev, p._id])}
                                    >
                                        <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 80, width: "100%", objectFit: "cover" }} />
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
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: "24px" }}>
                            <button onClick={() => setAddPhotoModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleAddToGuestCollection} disabled={!addPhotoSelections.length} className="btn btn-primary">
                                Add {addPhotoSelections.length} Photo(s)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDialog && (
                <div className="modal-backdrop">
                    <div className="card card-xl" style={{ width: "100%", maxWidth: 440, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
                        <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink)", margin: "0 0 8px 0" }}>{confirmDialog.title}</h3>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, margin: "0 0 24px 0" }}>
                            {confirmDialog.message}
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="btn btn-secondary"
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
                                className="btn"
                                style={{ background: "#be123c", color: "#fff", border: "1px solid #9f1239" }}
                            >
                                {confirmDialog.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Download toast */}
            {downloadToast && (
                <div style={{
                    position: "fixed", right: 24, bottom: 24, zIndex: 70,
                    padding: "10px 16px", borderRadius: "var(--r-md)",
                    border: "1px solid rgba(11,223,80,0.25)",
                    background: "rgba(11,223,80,0.08)", color: "#0a8a32",
                    fontSize: "13px", fontWeight: 500,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}>
                    {downloadToast}
                </div>
            )}
        </>
    );
}
