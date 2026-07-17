import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";
import type { EventData, PhotoData, CollectionData } from "../api";

const PAGE_SIZE = 20;

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

type MatchStep = "select" | "uploading" | "uploaded" | "matching" | "done";

/* ─── Custom SVG Icons ──────────────────────────────────────────────── */
const CollectionIcons = {
    Camera: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </svg>
    ),
    Image: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    Lock: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    Frown: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    ),
    Search: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    EmptyInbox: () => (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
    )
};

export function GuestCollectionPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAppContext();

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Collection state
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [myPhotos, setMyPhotos] = useState<PhotoData[]>([]);
    const [selfies, setSelfies] = useState<PhotoData[]>([]);
    const [myPhotoPage, setMyPhotoPage] = useState(1);
    const [myPhotoTotal, setMyPhotoTotal] = useState(0);

    // Browse all event photos
    const [allPhotos, setAllPhotos] = useState<PhotoData[]>([]);
    const [allPhotoPage, setAllPhotoPage] = useState(1);
    const [allPhotoTotal, setAllPhotoTotal] = useState(0);

    // 3-step matching flow
    const [matchStep, setMatchStep] = useState<MatchStep>("select");
    const [selfieFiles, setSelfieFiles] = useState<File[]>([]);
    const [selfiePreviews, setSelfiePreviews] = useState<string[]>([]);
    const [uploadedSelfieIds, setUploadedSelfieIds] = useState<string[]>([]);
    const [newMatchedPhotos, setNewMatchedPhotos] = useState<PhotoData[]>([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [downloadToast, setDownloadToast] = useState("");
    const selfieRef = useRef<HTMLInputElement>(null);

    // Selection
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<"find" | "collection" | "all">("collection");

    // Load event
    useEffect(() => {
        if (!id) return;
        api.getEventDetails(id)
            .then((res) => setEvent(res.data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        api.getMyCollectionByEvent(id)
            .then((res) => {
                if (res.data?._id) {
                    setCollection(res.data);
                    setMyPhotoTotal(Array.isArray(res.data.myPhotos) ? res.data.myPhotos.length : 0);
                }
            })
            .catch(() => {});
    }, [id]);

    // Load collection photos + selfies when we have a collection
    useEffect(() => {
        if (!collection?._id) return;
        api.getCollectionPhotos(collection._id, myPhotoPage - 1, PAGE_SIZE)
            .then((res) => {
                const col = res.data[0];
                const photos = col && Array.isArray(col.myPhotos) ? col.myPhotos as PhotoData[] : [];
                setMyPhotos(photos);
            })
            .catch(console.error);
    }, [collection, myPhotoPage]);

    useEffect(() => {
        if (!collection?._id) return;
        api.getCollectionSelfies(collection._id)
            .then((res) => {
                if (res.data.length > 0) {
                    setSelfies(Array.isArray(res.data[0].selfies) ? res.data[0].selfies as PhotoData[] : []);
                }
            })
            .catch(console.error);
    }, [collection]);

    // Load all event photos for browse tab
    useEffect(() => {
        if (!id || activeTab !== "all" || !event || event.accessLevel !== "browse") return;
        api.getEventPhotos(id, allPhotoPage - 1, PAGE_SIZE)
            .then((res) => {
                setAllPhotos(res.data);
                if (allPhotoPage === 1) {
                    countEventPhotosWithPagination(id).then((count) => setAllPhotoTotal(count)).catch(() => {});
                }
            })
            .catch(console.error);
    }, [id, event, activeTab, allPhotoPage]);

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
                <div className="spinner" />
            </div>
        );
    }
    if (!user) return <Navigate to={`/event/${id}`} replace />;
    if (notFound || !event) return <Navigate to="/dashboard" replace />;

    function onSelfieChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;
        const arr = Array.from(files).slice(0, 3);
        setSelfieFiles(arr);
        setSelfiePreviews(arr.map((f) => URL.createObjectURL(f)));
        setMatchStep("select");
        setError("");
        setMessage("");
    }

    function removeSelfie(idx: number) {
        const newFiles = [...selfieFiles];
        newFiles.splice(idx, 1);
        setSelfieFiles(newFiles);
        URL.revokeObjectURL(selfiePreviews[idx]);
        const newPreviews = [...selfiePreviews];
        newPreviews.splice(idx, 1);
        setSelfiePreviews(newPreviews);
    }

    async function handleUpload() {
        if (!id || selfieFiles.length === 0) { setError("Select at least 1 selfie"); return; }
        setMatchStep("uploading");
        setError("");
        try {
            const signedRes = await api.getSignedUrlForSelfie(id, selfieFiles.length);
            const results = await Promise.allSettled(
                selfieFiles.map((file, i) => api.uploadSelfieToS3(signedRes.data.urls[i], file))
            );
            const urls = results
                .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
                .map((r) => r.value);

            if (urls.length === 0) { setError("Upload failed"); setMatchStep("select"); return; }

            const selfieRes = await api.createSelfie(id, urls);
            setUploadedSelfieIds(selfieRes.data.photos.map((p) => p._id));
            setCollection(selfieRes.data.collection);
            setSelfies(prev => [...prev, ...selfieRes.data.photos]);
            setMatchStep("uploaded");
            setMessage(`${urls.length} selfie(s) uploaded!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setMatchStep("select");
        }
    }

    async function handleFindMatches() {
        const selfieIdsToMatch = uploadedSelfieIds.length > 0
            ? uploadedSelfieIds
            : selfies.map((s) => s._id);

        if (!id || !selfieIdsToMatch.length || !collection?._id) {
            setError("Upload at least one selfie before finding matches");
            return;
        }

        setMatchStep("matching");
        setError("");
        try {
            const matchRes = await api.findMatch(id, selfieIdsToMatch, collection._id);
            setNewMatchedPhotos(matchRes.data);
            setMatchStep("done");
            setMessage(`Found ${matchRes.data.length} matching photo(s)!`);
            const colRes = await api.getCollectionPhotos(collection._id, 0, PAGE_SIZE);
            if (colRes.data.length > 0) {
                const photos = Array.isArray(colRes.data[0].myPhotos) ? colRes.data[0].myPhotos as PhotoData[] : [];
                setMyPhotos(photos);
                const collectionRes = await api.getMyCollectionByEvent(id);
                if (collectionRes.data) {
                    setCollection(collectionRes.data);
                    setMyPhotoTotal(Array.isArray(collectionRes.data.myPhotos) ? collectionRes.data.myPhotos.length : 0);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Matching failed");
            setMatchStep(uploadedSelfieIds.length > 0 ? "uploaded" : "select");
        }
    }

    function resetMatchFlow() {
        setSelfieFiles([]);
        selfiePreviews.forEach((p) => URL.revokeObjectURL(p));
        setSelfiePreviews([]);
        setUploadedSelfieIds([]);
        setNewMatchedPhotos([]);
        setMatchStep("select");
        setMessage("");
        setError("");
        if (selfieRef.current) selfieRef.current.value = "";
    }

    function togglePhotoSelection(photoId: string) {
        setSelectedPhotoIds((prev) => prev.includes(photoId) ? prev.filter((x) => x !== photoId) : [...prev, photoId]);
    }

    async function removeSelected() {
        if (!collection?._id || !selectedPhotoIds.length) return;
        try {
            await api.removePhotoFromCollection(collection._id, selectedPhotoIds);
            setMyPhotos((prev) => prev.filter((p) => !selectedPhotoIds.includes(p._id)));
            setMyPhotoTotal((prev) => prev - selectedPhotoIds.length);
            setSelectedPhotoIds([]);
            setMessage("Photos removed from your collection");
            setTimeout(() => setMessage(""), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to remove");
        }
    }

    async function handleDownloadAll() {
        if (!id || !collection?._id) return;
        try {
            setDownloadToast("Download started");
            window.setTimeout(() => setDownloadToast(""), 1800);
            const res = await api.downloadAllCollection(collection._id, id);
            await api.triggerDownload(res, "my_photos.zip");
        } catch { setError("Download failed"); }
    }

    async function handleDownloadSelected() {
        if (!id || selectedPhotoIds.length === 0) return;
        try {
            setDownloadToast("Download started");
            window.setTimeout(() => setDownloadToast(""), 1800);
            const fileNames = myPhotos
                .filter((p) => selectedPhotoIds.includes(p._id))
                .map((p) => p.url.split("/").pop() || "")
                .filter(Boolean);
            if (!fileNames.length) return;
            const res = await api.downloadSelected(id, fileNames);
            await api.triggerDownload(res, "selected_my_photos.zip");
        } catch {
            setError("Download failed");
        }
    }

    async function handleDeleteSelfie(selfie: PhotoData) {
        if (!collection?._id) return;
        try {
            const fileName = selfie.url.split("/").pop() || "";
            await api.deleteSelfies(collection._id, [fileName], [selfie._id]);
            setSelfies((prev) => prev.filter((s) => s._id !== selfie._id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed");
        }
    }

    const stepLabels: Record<MatchStep, string> = {
        select: "Step 1: Select Selfies",
        uploading: "Uploading images...",
        uploaded: "Step 2: Upload Complete — Ready to Scan",
        matching: "Scanning event photos with face vector AI...",
        done: "Matching Completed Successfully",
    };

    return (
        <div className="page-wrap fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header context */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--hairline)", paddingBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.5px", margin: 0 }}>My Collection</h1>
                    <p style={{ marginTop: 4, fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>{event.name}</p>
                    <span className="status-pill status-ready" style={{ marginTop: 8, display: "inline-block" }}>
                        {event.accessLevel === "browse" ? "Browse & Spot" : "Spot Only"}
                    </span>
                </div>
                <Link to="/dashboard" className="btn btn-secondary">
                    &larr; Dashboard
                </Link>
            </div>

            {error && (
                <div className="alert alert-error" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{error}</span>
                    <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "16px" }}>✕</button>
                </div>
            )}
            {message && <div className="alert alert-success">{message}</div>}

            {/* Tab selection */}
            <div>
                <div className="tab-bar">
                    <button className={`tab-btn ${activeTab === "collection" ? "active" : ""}`} onClick={() => setActiveTab("collection")}>
                        My Photos
                    </button>
                    <button className={`tab-btn ${activeTab === "find" ? "active" : ""}`} onClick={() => setActiveTab("find")}>
                        Find Photos
                    </button>
                    <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
                        All Photos
                    </button>
                </div>
            </div>

            {/* Tab contents */}
            {activeTab === "collection" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: "20px" }}>
                            <div>
                                <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>My Matched Photos</h2>
                                <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: "4px 0 0" }}>{myPhotoTotal} photos found</p>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {myPhotos.length > 0 && (
                                    <button onClick={handleDownloadAll} className="btn btn-primary btn-sm">
                                        Download All
                                    </button>
                                )}
                                {selectedPhotoIds.length > 0 && (
                                    <button onClick={handleDownloadSelected} className="btn btn-secondary btn-sm">
                                        Download Selected
                                    </button>
                                )}
                                {selectedPhotoIds.length > 0 && (
                                    <button onClick={removeSelected} className="btn btn-sm" style={{ background: "#be123c", color: "#fff", border: "1px solid #9f1239" }}>
                                        Remove ({selectedPhotoIds.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                            {myPhotos.map((p) => {
                                const isSel = selectedPhotoIds.includes(p._id);
                                return (
                                    <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: isSel ? "2px solid var(--accent)" : "1px solid var(--hairline)" }}
                                        onClick={() => togglePhotoSelection(p._id)}
                                    >
                                        <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 110, width: "100%", objectFit: "cover" }} />
                                        <div style={{ padding: "6px 4px 2px", display: "flex", alignItems: "center", gap: 6, fontSize: "12px", color: "var(--ink-muted)" }}>
                                            <input type="checkbox" checked={isSel} readOnly />
                                            <span>Select</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {myPhotos.length === 0 && !collection && (
                            <div style={{ textAlign: "center", padding: "40px 12px", color: "var(--ink-tertiary)" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                    <CollectionIcons.Search />
                                </div>
                                <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>No matched photos yet</h3>
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: "0 0 20px 0" }}>Go to the "Find Photos" tab to upload search selfies.</p>
                            </div>
                        )}

                        {myPhotos.length === 0 && collection && (
                            <div style={{ textAlign: "center", padding: "40px 12px", color: "var(--ink-tertiary)" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                                    <CollectionIcons.EmptyInbox />
                                </div>
                                <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>Collection is empty</h3>
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Try uploading different selfies or run the scan again.</p>
                            </div>
                        )}

                        <Pagination totalItems={myPhotoTotal} currentPage={myPhotoPage} pageSize={PAGE_SIZE} onPageChange={setMyPhotoPage} />
                    </section>

                    {selfies.length > 0 && (
                        <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>My Selfies</h2>
                            <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: "0 0 20px 0" }}>
                                {selfies.length} of 3 selfies saved for this event
                            </p>
                            
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {selfies.map((s) => (
                                    <div key={s._id} className="photo-tile" style={{ padding: 4, position: "relative", width: "100px", height: "100px" }}>
                                        <img src={s.url} alt="Selfie" style={{ borderRadius: "var(--r-md)", width: "100%", height: "100%", objectFit: "cover" }} />
                                        <button onClick={() => handleDeleteSelfie(s)} style={{
                                            position: "absolute", top: 8, right: 8, width: 20, height: 20,
                                            borderRadius: "50%", background: "rgba(196,28,28,0.95)", border: "none",
                                            color: "#fff", fontSize: 10, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {activeTab === "find" && (
                <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: "20px" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>Find My Photos</h2>
                        {matchStep !== "select" && matchStep !== "uploading" && matchStep !== "matching" && (
                            <button onClick={resetMatchFlow} className="btn btn-secondary btn-sm">
                                Start Over
                            </button>
                        )}
                    </div>

                    <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "20px" }}>
                        Signed in as {user.fullname || user.username}
                    </p>

                    <div style={{ marginBottom: "24px" }}>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)", marginBottom: "8px" }}>
                            Current Saved Selfies ({selfies.length} / 3)
                        </p>
                        {selfies.length > 0 ? (
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                {selfies.map((s) => (
                                    <div key={s._id} className="photo-tile" style={{ padding: 4, position: "relative", width: "90px", height: "90px" }}>
                                        <img src={s.url} alt="Selfie" style={{ borderRadius: "var(--r-md)", width: "100%", height: "100%", objectFit: "cover" }} />
                                        <button onClick={() => handleDeleteSelfie(s)} style={{
                                            position: "absolute", top: 6, right: 6, width: 18, height: 18,
                                            borderRadius: "50%", background: "rgba(196,28,28,0.95)", border: "none",
                                            color: "#fff", fontSize: 9, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>No selfies saved yet.</p>
                        )}
                    </div>

                    <div style={{
                        padding: "10px 14px", borderRadius: "var(--r-md)",
                        background: "var(--surface-2)", border: "1px solid var(--hairline)",
                        fontSize: "13px", fontWeight: 500, color: "#ff5600",
                        marginBottom: "20px", display: "inline-block"
                    }}>
                        {stepLabels[matchStep]}
                    </div>

                    {matchStep === "select" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                                Select selfies ({3 - selfies.length} remaining slots)
                            </p>
                            
                            <div
                                onClick={() => selfieRef.current?.click()}
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    justifyContent: "center", gap: "12px",
                                    padding: "28px 20px",
                                    border: "2px dashed var(--hairline)",
                                    borderRadius: "var(--r-lg)",
                                    background: "var(--surface-2)",
                                    cursor: "pointer",
                                    transition: "border-color 0.15s ease, background 0.15s ease",
                                    maxWidth: "420px",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--ink-subtle)";
                                    e.currentTarget.style.background = "var(--surface-1)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--hairline)";
                                    e.currentTarget.style.background = "var(--surface-2)";
                                }}
                            >
                                <div style={{ color: "var(--ink-tertiary)" }}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ fontSize: "14px", color: "var(--ink)", margin: "0 0 2px 0", fontWeight: 500 }}>
                                        Choose selfie photos
                                    </p>
                                    <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
                                        Up to 3 images &middot; JPG, PNG, WEBP
                                    </p>
                                </div>
                                <input
                                    ref={selfieRef} type="file" multiple accept="image/*"
                                    onChange={onSelfieChange}
                                    style={{ display: "none" }}
                                />
                            </div>

                            {selfiePreviews.length > 0 && (
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                    {selfiePreviews.map((preview, i) => (
                                        <div key={i} style={{ position: "relative", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--hairline)", width: "100px", height: "100px" }}>
                                            <img src={preview} alt={`Selfie ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            <button type="button" onClick={() => removeSelfie(i)} style={{
                                                position: "absolute", top: 4, right: 4, width: 20, height: 20,
                                                borderRadius: "50%", background: "rgba(196,28,28,0.95)", border: "none",
                                                color: "#fff", fontSize: 10, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button onClick={handleUpload} disabled={selfieFiles.length === 0} className="btn btn-primary">
                                    Upload {selfieFiles.length} Selfie(s)
                                </button>
                                {selfies.length > 0 && (
                                    <button onClick={handleFindMatches} className="btn btn-secondary">
                                        Scan event using saved selfies
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {matchStep === "uploading" && (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                            <div className="spinner" style={{ margin: "0 auto 16px" }} />
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Uploading selfies securely...</p>
                        </div>
                    )}

                    {matchStep === "uploaded" && (
                        <div>
                            <div className="alert alert-success" style={{ marginBottom: "16px" }}>{message}</div>
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "20px" }}>
                                New selfie uploaded. Click below to discover matches.
                            </p>
                            <button onClick={handleFindMatches} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                <CollectionIcons.Search /> Scan Gallery
                            </button>
                        </div>
                    )}

                    {matchStep === "matching" && (
                        <div style={{ textAlign: "center", padding: "40px 0" }}>
                            <div className="spinner" style={{ margin: "0 auto 16px" }} />
                            <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Searching via AI facial vector match...</p>
                        </div>
                    )}

                    {matchStep === "done" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="alert alert-success">{message}</div>
                            {newMatchedPhotos.length > 0 ? (
                                <>
                                    <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                                        New photos have been matched and saved to your collection.
                                    </p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
                                        {newMatchedPhotos.slice(0, 8).map((p) => (
                                            <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                                <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 80, width: "100%", objectFit: "cover" }} />
                                            </div>
                                        ))}
                                    </div>
                                    {newMatchedPhotos.length > 8 && (
                                        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
                                            + {newMatchedPhotos.length - 8} more matches
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "24px 0", color: "var(--ink-tertiary)" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                                        <CollectionIcons.Frown />
                                    </div>
                                    <p style={{ fontSize: "15px", color: "var(--ink-muted)", margin: 0 }}>No matches found. Try uploading a clearer selfie.</p>
                                </div>
                            )}
                            <button onClick={() => setActiveTab("collection")} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                                View Collection &rarr;
                            </button>
                        </div>
                    )}
                </section>
            )}

            {activeTab === "all" && (
                event.accessLevel === "browse" ? (
                    <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>All Event Photos</h2>
                        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: "0 0 20px 0" }}>{allPhotoTotal} photos available</p>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                            {allPhotos.map((p) => (
                                <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                    <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 110, width: "100%", objectFit: "cover" }} />
                                </div>
                            ))}
                        </div>
                        
                        <Pagination totalItems={allPhotoTotal} currentPage={allPhotoPage} pageSize={PAGE_SIZE} onPageChange={setAllPhotoPage} />
                    </section>
                ) : (
                    <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                        <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 16px 0" }}>All Event Photos</h2>
                        <div className="alert alert-info">
                            This event is locked to "Spot Only". You can only discover photos you are matching in.
                        </div>
                    </section>
                )
            )}

            {/* Toast download */}
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
        </div>
    );
}
