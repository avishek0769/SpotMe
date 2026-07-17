import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";
import type { EventData, PhotoData } from "../api";

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

type MatchStep = "select" | "uploading" | "uploaded" | "matching" | "results";

/* ─── Custom SVG Icons ──────────────────────────────────────────────── */
const PageIcons = {
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
    )
};

export function GuestEventPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAppContext();

    const [event, setEvent] = useState<EventData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Browse all photos (for access=browse)
    const [browsePhotos, setBrowsePhotos] = useState<PhotoData[]>([]);
    const [browsePage, setBrowsePage] = useState(1);
    const [browseTotal, setBrowseTotal] = useState(0);

    // Selfie matching — 3 distinct steps
    const [matchStep, setMatchStep] = useState<MatchStep>("select");
    const [selfieFiles, setSelfieFiles] = useState<File[]>([]);
    const [selfiePreviews, setSelfiePreviews] = useState<string[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [selfiePhotoIds, setSelfiePhotoIds] = useState<string[]>([]);
    const [collectionId, setCollectionId] = useState<string | null>(null);
    const [matchedPhotos, setMatchedPhotos] = useState<PhotoData[]>([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [downloadToast, setDownloadToast] = useState("");
    const [myPhotosPage, setMyPhotosPage] = useState(1);
    const selfieRef = useRef<HTMLInputElement>(null);

    // Download selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!id) return;
        api.getEventDetails(id)
            .then((res) => setEvent(res.data))
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    // Load browse photos
    useEffect(() => {
        if (!id || !event || event.accessLevel !== "browse") return;
        api.getEventPhotos(id, browsePage - 1, PAGE_SIZE)
            .then((res) => {
                setBrowsePhotos(res.data);
                if (browsePage === 1) {
                    countEventPhotosWithPagination(id).then((count) => setBrowseTotal(count)).catch(() => {});
                }
            })
            .catch(() => {});
    }, [id, event, browsePage]);

    const pagedMyPhotos = useMemo(() => {
        const start = (myPhotosPage - 1) * PAGE_SIZE;
        return matchedPhotos.slice(start, start + PAGE_SIZE);
    }, [matchedPhotos, myPhotosPage]);

    if (loading) {
        return (
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (notFound || !event) {
        return (
            <div style={{ display: "flex", minHeight: "calc(100vh - 56px)", alignItems: "center", justifyContent: "center", background: "var(--canvas)", padding: "24px" }}>
                <div className="card card-xl" style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
                    <div style={{ color: "#ff5600", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: "24px", fontWeight: 500, color: "var(--ink)", marginBottom: "8px" }}>Event not found</h1>
                    <p style={{ fontSize: "14px", color: "var(--ink-muted)", lineHeight: 1.5, marginBottom: "24px" }}>
                        This event link may have expired or is invalid. {!user && (
                            <>Try <Link to="/login" style={{ color: "#ff5600", fontWeight: 500 }}>signing in</Link> first.</>
                        )}
                    </p>
                    <Link to="/" className="btn btn-primary" style={{ display: "inline-flex" }}>
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    function onSelfieChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;
        const arr = Array.from(files).slice(0, 3);
        setSelfieFiles(arr);
        const previews = arr.map((f) => URL.createObjectURL(f));
        setSelfiePreviews(previews);
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
        if (!id || selfieFiles.length === 0) {
            setError("Select at least 1 selfie");
            return;
        }
        setMatchStep("uploading");
        setError("");
        try {
            if (user) {
                const signedRes = await api.getSignedUrlForSelfie(id, selfieFiles.length);
                const signedUrls = signedRes.data.urls;

                const results = await Promise.allSettled(
                    selfieFiles.map((file, i) => api.uploadSelfieToS3(signedUrls[i], file))
                );
                const urls = results
                    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
                    .map((r) => r.value);

                if (urls.length === 0) {
                    setError("Failed to upload selfies. Please try again.");
                    setMatchStep("select");
                    return;
                }

                const selfieRes = await api.createSelfie(id, urls);
                setUploadedUrls(urls);
                setSelfiePhotoIds(selfieRes.data.photos.map((p) => p._id));
                setCollectionId(selfieRes.data.collection._id);
            } else {
                const tempUploadRes = await api.uploadTempSelfies(selfieFiles);
                setUploadedUrls(tempUploadRes.data.selfieImageIds);
                setSelfiePhotoIds(tempUploadRes.data.selfieImageIds);
                setCollectionId(null);
            }

            setMatchStep("uploaded");
            setMessage(`${selfieFiles.length} selfie(s) uploaded successfully!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setMatchStep("select");
        }
    }

    async function handleFindMatches() {
        if (!id || !selfiePhotoIds.length) return;
        setMatchStep("matching");
        setError("");
        try {
            const matchRes = user
                ? await api.findMatch(id, selfiePhotoIds, collectionId || "")
                : await api.findMatchWithoutPersist(id, selfiePhotoIds);
            setMatchedPhotos(matchRes.data);
            setMatchStep("results");
            setMessage(`Found ${matchRes.data.length} matching photo(s)!`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Matching failed");
            setMatchStep("uploaded");
        }
    }

    function resetFlow() {
        setSelfieFiles([]);
        selfiePreviews.forEach((p) => URL.revokeObjectURL(p));
        setSelfiePreviews([]);
        setUploadedUrls([]);
        setSelfiePhotoIds([]);
        setMatchedPhotos([]);
        setMatchStep("select");
        setMessage("");
        setError("");
        setSelectedIds([]);
        if (selfieRef.current) selfieRef.current.value = "";
    }

    function toggleSelect(photoId: string) {
        setSelectedIds((prev) => prev.includes(photoId) ? prev.filter((x) => x !== photoId) : [...prev, photoId]);
    }

    async function handleDownloadAll() {
        if (!id) return;
        try {
            setDownloadToast("Download started");
            window.setTimeout(() => setDownloadToast(""), 1800);
            const res = user && collectionId
                ? await api.downloadAllCollection(collectionId, id)
                : await api.downloadAllFound(
                    id,
                    matchedPhotos.map((p) => p.url.split("/").pop() || "").filter(Boolean),
                );
            await api.triggerDownload(res, "my_photos.zip");
        } catch { setError("Download failed"); }
    }

    async function handleDownloadSelected() {
        if (!id || !selectedIds.length || !user) return;
        try {
            setDownloadToast("Download started");
            window.setTimeout(() => setDownloadToast(""), 1800);
            const selected = matchedPhotos.filter((p) => selectedIds.includes(p._id));
            const fileNames = selected.map((p) => p.url.split("/").pop() || "");
            const res = await api.downloadSelected(id, fileNames);
            await api.triggerDownload(res, "selected_photos.zip");
        } catch { setError("Download failed"); }
    }

    const stepLabels: Record<MatchStep, string> = {
        select: "Step 1: Select Search Selfies",
        uploading: "Uploading images to secure storage...",
        uploaded: "Step 2: Upload Complete — Ready to Scan",
        matching: "Spotting matches with AI recognition...",
        results: "Step 3: Matches Found",
    };

    return (
        <div className="page-wrap fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Header context info */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, borderBottom: "1px solid var(--hairline)", paddingBottom: "24px" }}>
                <div>
                    <h1 style={{ fontSize: "28px", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.5px", margin: 0 }}>{event.name}</h1>
                    <p style={{ marginTop: 4, fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                        {new Date(event.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <Link to="/" style={{ fontSize: "14px", color: "#ff5600", textDecoration: "none", fontWeight: 500 }}>
                    SpotMe Home &rarr;
                </Link>
            </div>

            {!user && (
                <div className="alert alert-info" style={{ fontSize: "14px" }}>
                    Shared link mode: you can upload selfies and find matches without signing in.
                    <Link to="/login" style={{ color: "#ff5600", fontWeight: 600, marginLeft: 4, textDecoration: "none" }}>Sign in</Link> if you want to save your collection.
                </div>
            )}

            {user && (
                <div>
                    <Link to="/dashboard" style={{ fontSize: "14px", color: "#ff5600", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        &larr; Back to Dashboard
                    </Link>
                </div>
            )}

            {/* Find my photos card */}
            <section className="card card-xl" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: 0 }}>Find My Photos</h2>
                    {matchStep !== "select" && matchStep !== "uploading" && matchStep !== "matching" && (
                        <button onClick={resetFlow} className="btn btn-secondary btn-sm">
                            Start Over
                        </button>
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

                {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{error}</div>}
                {message && matchStep !== "select" && <div className="alert alert-success" style={{ marginBottom: "16px" }}>{message}</div>}

                {matchStep === "select" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                            Select 1 to 3 selfies of yourself. Our AI uses these temporarily to retrieve matches.
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
                                        <button
                                            type="button" onClick={() => removeSelfie(i)}
                                            style={{
                                                position: "absolute", top: 4, right: 4, width: 20, height: 20,
                                                borderRadius: "50%", background: "rgba(196,28,28,0.95)", border: "none",
                                                color: "#fff", fontSize: 10, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={handleUpload}
                            disabled={selfieFiles.length === 0}
                            className="btn btn-primary"
                            style={{ alignSelf: "flex-start" }}
                        >
                            Upload {selfieFiles.length} Selfie(s)
                        </button>
                    </div>
                )}

                {matchStep === "uploading" && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }} />
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                            Uploading search files securely...
                        </p>
                    </div>
                )}

                {matchStep === "uploaded" && (
                    <div>
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", marginBottom: "20px" }}>
                            {uploadedUrls.length} search selfie(s) prepared. Ready to scan.
                        </p>
                        <button onClick={handleFindMatches} className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <PageIcons.Search /> Scan Gallery
                        </button>
                    </div>
                )}

                {matchStep === "matching" && (
                    <div style={{ textAlign: "center", padding: "40px 0" }}>
                        <div className="spinner" style={{ margin: "0 auto 16px" }} />
                        <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>
                            Matching faces with vector indexing...
                        </p>
                    </div>
                )}

                {matchStep === "results" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {matchedPhotos.length > 0 && (
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <button onClick={handleDownloadAll} className="btn btn-primary btn-sm">
                                    Download All ({matchedPhotos.length})
                                </button>
                                <button onClick={handleDownloadSelected} disabled={!selectedIds.length || !user} className="btn btn-secondary btn-sm">
                                    Download Selected ({selectedIds.length})
                                </button>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                            {pagedMyPhotos.map((p) => {
                                const sel = selectedIds.includes(p._id);
                                return (
                                    <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: sel ? "2px solid var(--accent)" : "1px solid var(--hairline)" }}
                                        onClick={() => toggleSelect(p._id)}
                                    >
                                        <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 110, width: "100%", objectFit: "cover" }} />
                                        <div style={{ padding: "6px 4px 2px", fontSize: "12px", color: "var(--ink-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                            <input type="checkbox" checked={sel} readOnly />
                                            <span>Select</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {matchedPhotos.length === 0 && (
                            <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-tertiary)" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                                    <PageIcons.Frown />
                                </div>
                                <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>No matches found</p>
                                <p style={{ fontSize: "14px", color: "var(--ink-muted)", margin: 0 }}>Try uploading a clearer selfie in direct light.</p>
                            </div>
                        )}

                        <Pagination totalItems={matchedPhotos.length} currentPage={myPhotosPage} pageSize={PAGE_SIZE} onPageChange={setMyPhotosPage} />

                        {!user && matchedPhotos.length > 0 && (
                            <div className="alert alert-info" style={{ marginTop: 8 }}>
                                <Link to="/login" style={{ color: "#ff5600", fontWeight: 600, textDecoration: "none" }}>Sign in</Link> to save these photos into a personal dashboard collection.
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* All photos browse section (if event is browseable) */}
            {event.accessLevel === "browse" && (
                <section className="card" style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 500, color: "var(--ink)", margin: "0 0 4px 0" }}>All Event Photos</h2>
                    <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: "0 0 20px 0" }}>
                        {browseTotal > 0 ? `${browseTotal} photos available` : "Loading..."}
                    </p>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12 }}>
                        {browsePhotos.map((p) => (
                            <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                <img src={p.url} alt="" style={{ borderRadius: "var(--r-sm)", height: 110, width: "100%", objectFit: "cover" }} />
                            </div>
                        ))}
                    </div>

                    {browsePhotos.length === 0 && (
                        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--ink-tertiary)" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
                                <PageIcons.Image />
                            </div>
                            <p style={{ fontSize: "15px", color: "var(--ink-muted)", margin: 0 }}>No photos uploaded yet</p>
                        </div>
                    )}

                    <Pagination totalItems={browseTotal} currentPage={browsePage} pageSize={PAGE_SIZE} onPageChange={setBrowsePage} />
                </section>
            )}

            {/* Download Toast notification */}
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
