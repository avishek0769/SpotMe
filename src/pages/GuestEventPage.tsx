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

    // Load event details - use verifyJWT (optional) route through getEventDetails
    // But getEventDetails requires verifyStrictJWT... we need a non-auth route
    // The collection/find route uses verifyJWT. For now, event details needs auth.
    // Let's try - if user is not logged in, getEventDetails might fail.
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
            <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                <div className="spinner" />
            </div>
        );
    }

    if (notFound || !event) {
        return (
            <div className="page-wrap" style={{ textAlign: "center", paddingTop: "4rem" }}>
                <div style={{ fontSize: 48 }}>🔒</div>
                <h1 style={{ marginTop: 12, fontSize: "1.5rem", fontWeight: 700, color: "#fff" }}>Event not found</h1>
                <p style={{ marginTop: 8, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    This event link may have expired or is invalid. {!user && (
                        <>Try <Link to="/login" style={{ color: "var(--accent-hover)" }}>signing in</Link> first.</>
                    )}
                </p>
                <Link to="/" className="btn-primary" style={{ marginTop: 20, padding: "0.625rem 1.25rem", display: "inline-block", textDecoration: "none" }}>
                    Go Home
                </Link>
            </div>
        );
    }

    // File selection handler
    function onSelfieChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;
        const arr = Array.from(files).slice(0, 3);
        setSelfieFiles(arr);
        // Generate previews
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

    // Step 2: Upload selfies to S3
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

    // Step 3: Find matches
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

    // Reset flow
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
        if (!id || !collectionId || !user) return;
        try {
            setDownloadToast("Download started");
            window.setTimeout(() => setDownloadToast(""), 1800);
            const res = await api.downloadAllCollection(collectionId, id);
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
        select: "Step 1: Select Selfies",
        uploading: "Uploading...",
        uploaded: "Step 2: Upload Complete — Ready to Find",
        matching: "Finding your photos...",
        results: "Step 3: Results",
    };

    return (
        <>
            <div className="page-wrap">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{event.name}</h1>
                    <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        {new Date(event.eventDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <Link to="/" style={{ fontSize: "0.8125rem", color: "var(--accent-hover)", textDecoration: "none" }}>
                    SpotMe Home
                </Link>
            </div>

            {!user && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                    Shared link mode: you can upload selfies and find matches without signing in.
                    <Link to="/login" style={{ color: "var(--accent-hover)", fontWeight: 600, marginLeft: 4 }}>Sign in</Link> only if you want saved collections and downloads.
                </div>
            )}

            {user && (
                <div style={{ marginTop: 12 }}>
                    <Link to="/dashboard" style={{ fontSize: "0.8125rem", color: "var(--accent-hover)", textDecoration: "none" }}>
                        ← Back to Dashboard
                    </Link>
                </div>
            )}

            {event.accessLevel === "browse" && (
                <section className="card" style={{ marginTop: 20, padding: "1.25rem" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>All Event Photos</h2>
                    <p style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {browseTotal > 0 ? `${browseTotal} photos` : "Loading..."}
                    </p>
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                        {browsePhotos.map((p) => (
                            <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                <img src={p.url} alt="" style={{ borderRadius: 6, height: 100 }} />
                            </div>
                        ))}
                    </div>
                    {browsePhotos.length === 0 && (
                        <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
                            <span style={{ fontSize: 32 }}>🖼️</span>
                            <p style={{ marginTop: 6, fontSize: "0.8125rem" }}>No photos yet</p>
                        </div>
                    )}
                    <Pagination totalItems={browseTotal} currentPage={browsePage} pageSize={PAGE_SIZE} onPageChange={setBrowsePage} />
                </section>
            )}

            <section className="card" style={{ marginTop: 20, padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>Find My Photos</h2>
                        {matchStep !== "select" && matchStep !== "uploading" && matchStep !== "matching" && (
                            <button onClick={resetFlow} className="btn-secondary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
                                Start Over
                            </button>
                        )}
                    </div>

                    <div style={{
                        marginTop: 12, padding: "0.5rem 0.875rem", borderRadius: 8,
                        background: "var(--bg-soft)", border: "1px solid var(--border)",
                        fontSize: "0.8125rem", fontWeight: 500, color: "var(--accent-hover)",
                    }}>
                        {stepLabels[matchStep]}
                    </div>

                    {error && <div className="alert alert-error" style={{ marginTop: 10 }}>{error}</div>}
                    {message && matchStep !== "select" && <div className="alert alert-success" style={{ marginTop: 10 }}>{message}</div>}

                    {(matchStep === "select") && (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 10 }}>
                                Select 1-3 selfie photos for face matching
                            </p>
                            <input ref={selfieRef} type="file" multiple accept="image/*" onChange={onSelfieChange} className="ui-input" style={{ maxWidth: 400 }} />

                            {selfiePreviews.length > 0 && (
                                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                                    {selfiePreviews.map((preview, i) => (
                                        <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                                            <img src={preview} alt={`Selfie ${i + 1}`} style={{ width: 100, height: 100, objectFit: "cover" }} />
                                            <button
                                                type="button" onClick={() => removeSelfie(i)}
                                                style={{
                                                    position: "absolute", top: 4, right: 4, width: 22, height: 22,
                                                    borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none",
                                                    color: "#fff", fontSize: 11, cursor: "pointer",
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
                                className="btn-primary"
                                style={{ marginTop: 16, padding: "0.5rem 1.25rem" }}
                            >
                                Upload {selfieFiles.length} Selfie(s)
                            </button>
                        </div>
                    )}

                    {matchStep === "uploading" && (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem" }}>
                            <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32 }} />
                            <p style={{ marginTop: 12, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                Uploading selfies...
                            </p>
                        </div>
                    )}

                    {matchStep === "uploaded" && (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                {uploadedUrls.length} selfie(s) uploaded. Click below to run face matching against event photos.
                            </p>
                            <button onClick={handleFindMatches} className="btn-primary" style={{ marginTop: 12, padding: "0.625rem 1.5rem" }}>
                                🔍 Find My Photos
                            </button>
                        </div>
                    )}

                    {matchStep === "matching" && (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem" }}>
                            <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32 }} />
                            <p style={{ marginTop: 12, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                Running AI face matching...
                            </p>
                        </div>
                    )}

                    {matchStep === "results" && (
                        <div style={{ marginTop: 16 }}>
                            {matchedPhotos.length > 0 && user && (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                                    <button onClick={handleDownloadAll} className="btn-primary" style={{ padding: "0.4rem 0.875rem" }}>
                                        Download All ({matchedPhotos.length})
                                    </button>
                                    <button onClick={handleDownloadSelected} disabled={!selectedIds.length} className="btn-secondary" style={{ padding: "0.4rem 0.875rem" }}>
                                        Download Selected ({selectedIds.length})
                                    </button>
                                </div>
                            )}

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                                {pagedMyPhotos.map((p) => {
                                    const sel = selectedIds.includes(p._id);
                                    return (
                                        <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: sel ? "2px solid var(--accent)" : undefined }}
                                            onClick={() => toggleSelect(p._id)}
                                        >
                                            <img src={p.url} alt="" style={{ borderRadius: 6, height: 100 }} />
                                            <div style={{ padding: "4px 6px", fontSize: "0.6875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                                                <input type="checkbox" checked={sel} readOnly />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {matchedPhotos.length === 0 && (
                                <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                                    <div style={{ fontSize: 40 }}>😔</div>
                                    <p style={{ marginTop: 8, fontWeight: 500 }}>No matches found</p>
                                    <p style={{ fontSize: "0.8125rem" }}>Try with a clearer selfie photo</p>
                                </div>
                            )}

                            <Pagination totalItems={matchedPhotos.length} currentPage={myPhotosPage} pageSize={PAGE_SIZE} onPageChange={setMyPhotosPage} />

                            {!user && matchedPhotos.length > 0 && (
                                <div className="alert alert-info" style={{ marginTop: 10 }}>
                                    <Link to="/login" style={{ color: "var(--accent-hover)", fontWeight: 600 }}>Sign in</Link> to save these matches and download photos.
                                </div>
                            )}
                        </div>
                    )}
                </section>

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
        </>
    );
}
