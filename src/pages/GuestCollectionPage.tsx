import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";
import * as api from "../api";
import type { EventData, PhotoData, CollectionData } from "../api";

const PAGE_SIZE = 20;

type MatchStep = "select" | "uploading" | "uploaded" | "matching" | "done";

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
                }
            })
            .catch(() => {});
    }, [id]);

    // Try to find existing collection by creating selfie endpoint (it creates or finds)
    // We'll just try to get the collection photos via event-based lookup
    // The collection is identified by userId + eventId
    // Since we can't directly get "my collection" without a collectionId,
    // we'll create one on first selfie upload, or check if one exists via createSelfie

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

        api.getCollectionPhotos(collection._id, 0, 999999)
            .then((r) => {
                const col = r.data[0];
                const totalPhotos = col && Array.isArray(col.myPhotos)
                    ? (col.myPhotos as PhotoData[]).length
                    : 0;
                setMyPhotoTotal(totalPhotos);
            })
            .catch(() => {});
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
                    api.getEventPhotos(id, 0, 999999).then((r) => setAllPhotoTotal(r.data.length)).catch(() => {});
                }
            })
            .catch(console.error);
    }, [id, event, activeTab, allPhotoPage]);

    if (loading) {
        return (
            <div className="page-wrap" style={{ display: "flex", justifyContent: "center", paddingTop: "4rem" }}>
                <div className="spinner" />
            </div>
        );
    }
    if (!user) return <Navigate to={`/event/${id}`} replace />;
    if (notFound || !event) return <Navigate to="/dashboard" replace />;

    // ─── Selfie file selection ───
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

    // ─── Step 2: Upload ───
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

    // ─── Step 3: Find matches ───
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
            // Reload collection photos
            const colRes = await api.getCollectionPhotos(collection._id, 0, PAGE_SIZE);
            if (colRes.data.length > 0) {
                const photos = Array.isArray(colRes.data[0].myPhotos) ? colRes.data[0].myPhotos as PhotoData[] : [];
                setMyPhotos(photos);
                api.getCollectionPhotos(collection._id, 0, 999999).then((r) => {
                    if (r.data.length > 0) setMyPhotoTotal((r.data[0].myPhotos as PhotoData[]).length);
                }).catch(() => {});
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

    // ─── Collection management ───
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
        uploading: "Uploading...",
        uploaded: "Step 2: Upload Complete — Ready to Find",
        matching: "Finding your photos...",
        done: "Matching Complete",
    };

    return (
        <>
            <div className="page-wrap">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>My Collection</h1>
                    <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{event.name}</p>
                    <span className={`status-pill status-${event.accessLevel}`} style={{ marginTop: 8, display: "inline-flex" }}>
                        {event.accessLevel === "browse" ? "Browse & Spot" : "Spot Only"}
                    </span>
                </div>
                <Link to="/dashboard" className="btn-secondary" style={{ padding: "0.4rem 0.875rem", textDecoration: "none" }}>
                    ← Dashboard
                </Link>
            </div>

            {/* Alerts */}
            {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}<button onClick={() => setError("")} style={{ float: "right", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>✕</button></div>}
            {message && <div className="alert alert-success" style={{ marginTop: 12 }}>{message}</div>}

            {/* Tab Bar */}
            <div style={{ marginTop: 16 }}>
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

            {/* ═══ COLLECTION TAB ═══ */}
            {activeTab === "collection" && (
                <>
                    <section className="card" style={{ marginTop: 16, padding: "1.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                            <div>
                                <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>My Matched Photos</h2>
                                <p style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-secondary)" }}>{myPhotoTotal} photos</p>
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                {myPhotos.length > 0 && (
                                    <button onClick={handleDownloadAll} className="btn-primary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                                        Download All
                                    </button>
                                )}
                                {selectedPhotoIds.length > 0 && (
                                    <button onClick={handleDownloadSelected} className="btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                                        Download Selected
                                    </button>
                                )}
                                {selectedPhotoIds.length > 0 && (
                                    <button onClick={removeSelected} className="btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                                        Remove {selectedPhotoIds.length}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                            {myPhotos.map((p) => {
                                const isSel = selectedPhotoIds.includes(p._id);
                                return (
                                    <div key={p._id} className="photo-tile" style={{ padding: 4, cursor: "pointer", border: isSel ? "2px solid var(--accent)" : undefined }}
                                        onClick={() => togglePhotoSelection(p._id)}
                                    >
                                        <img src={p.url} alt="" style={{ borderRadius: 6, height: 100 }} />
                                        <div style={{ padding: "4px 6px", display: "flex", alignItems: "center", gap: 4, fontSize: "0.6875rem", color: "var(--text-secondary)" }}>
                                            <input type="checkbox" checked={isSel} readOnly />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {myPhotos.length === 0 && !collection && (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                                <div style={{ fontSize: 40 }}>🔍</div>
                                <p style={{ marginTop: 8, fontWeight: 500 }}>No matched photos yet</p>
                                <p style={{ fontSize: "0.8125rem" }}>Go to the "Find Photos" tab to upload selfies and discover your photos</p>
                            </div>
                        )}
                        {myPhotos.length === 0 && collection && (
                            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                                <div style={{ fontSize: 40 }}>📭</div>
                                <p style={{ marginTop: 8, fontWeight: 500 }}>Collection is empty</p>
                                <p style={{ fontSize: "0.8125rem" }}>Run face matching again to find more photos</p>
                            </div>
                        )}
                        <Pagination totalItems={myPhotoTotal} currentPage={myPhotoPage} pageSize={PAGE_SIZE} onPageChange={setMyPhotoPage} />
                    </section>

                    {/* Selfies */}
                    {selfies.length > 0 && (
                        <section className="card" style={{ marginTop: 16, padding: "1.25rem" }}>
                            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>My Selfies</h2>
                            <p style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {selfies.length} / 3 selfies uploaded
                            </p>
                            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                                {selfies.map((s) => (
                                    <div key={s._id} className="photo-tile" style={{ padding: 4, position: "relative" }}>
                                        <img src={s.url} alt="Selfie" style={{ borderRadius: 6, height: 100 }} />
                                        <button onClick={() => handleDeleteSelfie(s)} style={{
                                            position: "absolute", top: 8, right: 8, width: 22, height: 22,
                                            borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none",
                                            color: "#fff", fontSize: 11, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </>
            )}

            {/* ═══ FIND PHOTOS TAB ═══ */}
            {activeTab === "find" && (
                <section className="card" style={{ marginTop: 16, padding: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>Find My Photos</h2>
                        {matchStep !== "select" && matchStep !== "uploading" && matchStep !== "matching" && (
                            <button onClick={resetMatchFlow} className="btn-secondary" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
                                Start Over
                            </button>
                        )}
                    </div>

                    <p style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        Signed in as {user.fullname || user.username}
                    </p>

                    <div style={{ marginTop: 12 }}>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Uploaded selfies ({selfies.length} / 3)
                        </p>
                        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(92px, 1fr))", gap: 8 }}>
                            {selfies.map((s) => (
                                <div key={s._id} className="photo-tile" style={{ padding: 4, position: "relative" }}>
                                    <img src={s.url} alt="Selfie" style={{ borderRadius: 6, height: 86 }} />
                                    <button onClick={() => handleDeleteSelfie(s)} style={{
                                        position: "absolute", top: 8, right: 8, width: 20, height: 20,
                                        borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none",
                                        color: "#fff", fontSize: 10, cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div style={{
                        marginTop: 12, padding: "0.5rem 0.875rem", borderRadius: 8,
                        background: "var(--bg-soft)", border: "1px solid var(--border)",
                        fontSize: "0.8125rem", fontWeight: 500, color: "var(--accent-hover)",
                    }}>
                        {stepLabels[matchStep]}
                    </div>

                    {/* Step 1: Select */}
                    {matchStep === "select" && (
                        <div style={{ marginTop: 16 }}>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 10 }}>
                                Select 1-3 selfie photos for face matching ({3 - selfies.length} remaining)
                            </p>
                            <input ref={selfieRef} type="file" multiple accept="image/*" onChange={onSelfieChange} className="ui-input" style={{ maxWidth: 400 }} />

                            {selfiePreviews.length > 0 && (
                                <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                                    {selfiePreviews.map((preview, i) => (
                                        <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                                            <img src={preview} alt={`Selfie ${i + 1}`} style={{ width: 100, height: 100, objectFit: "cover" }} />
                                            <button type="button" onClick={() => removeSelfie(i)} style={{
                                                position: "absolute", top: 4, right: 4, width: 22, height: 22,
                                                borderRadius: "50%", background: "rgba(239,68,68,0.9)", border: "none",
                                                color: "#fff", fontSize: 11, cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button onClick={handleUpload} disabled={selfieFiles.length === 0} className="btn-primary" style={{ marginTop: 16, padding: "0.5rem 1.25rem" }}>
                                Upload {selfieFiles.length} Selfie(s)
                            </button>

                            {selfies.length > 0 && (
                                <button onClick={handleFindMatches} className="btn-secondary" style={{ marginTop: 10, padding: "0.5rem 1.25rem", marginLeft: 8 }}>
                                    Find Match with Uploaded Selfies
                                </button>
                            )}
                        </div>
                    )}

                    {/* Uploading */}
                    {matchStep === "uploading" && (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem" }}>
                            <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32 }} />
                            <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>Uploading selfies...</p>
                        </div>
                    )}

                    {/* Step 2: Uploaded */}
                    {matchStep === "uploaded" && (
                        <div style={{ marginTop: 16 }}>
                            <div className="alert alert-success" style={{ marginBottom: 12 }}>{message}</div>
                            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                Selfies uploaded. Now run face matching against event photos.
                            </p>
                            <button onClick={handleFindMatches} className="btn-primary" style={{ marginTop: 12, padding: "0.625rem 1.5rem" }}>
                                🔍 Find My Photos
                            </button>
                        </div>
                    )}

                    {/* Matching */}
                    {matchStep === "matching" && (
                        <div style={{ marginTop: 20, textAlign: "center", padding: "2rem" }}>
                            <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32 }} />
                            <p style={{ marginTop: 12, color: "var(--text-secondary)" }}>Running AI face matching...</p>
                        </div>
                    )}

                    {/* Done */}
                    {matchStep === "done" && (
                        <div style={{ marginTop: 16 }}>
                            <div className="alert alert-success" style={{ marginBottom: 12 }}>{message}</div>
                            {newMatchedPhotos.length > 0 ? (
                                <>
                                    <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                                        New matches have been added to your collection. View them in the "My Photos" tab.
                                    </p>
                                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
                                        {newMatchedPhotos.slice(0, 8).map((p) => (
                                            <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                                <img src={p.url} alt="" style={{ borderRadius: 6, height: 80 }} />
                                            </div>
                                        ))}
                                    </div>
                                    {newMatchedPhotos.length > 8 && (
                                        <p style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                            + {newMatchedPhotos.length - 8} more photos
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-secondary)" }}>
                                    <p style={{ fontSize: 32 }}>😔</p>
                                    <p style={{ marginTop: 6, fontSize: "0.8125rem" }}>No matches found. Try with a clearer selfie.</p>
                                </div>
                            )}
                            <button onClick={() => setActiveTab("collection")} className="btn-primary" style={{ marginTop: 16, padding: "0.5rem 1rem" }}>
                                View My Collection →
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* ═══ ALL PHOTOS TAB ═══ */}
            {activeTab === "all" && (
                event.accessLevel === "browse" ? (
                    <section className="card" style={{ marginTop: 16, padding: "1.25rem" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>All Event Photos</h2>
                        <p style={{ marginTop: 2, fontSize: "0.75rem", color: "var(--text-secondary)" }}>{allPhotoTotal} photos</p>
                        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
                            {allPhotos.map((p) => (
                                <div key={p._id} className="photo-tile" style={{ padding: 4 }}>
                                    <img src={p.url} alt="" style={{ borderRadius: 6, height: 100 }} />
                                </div>
                            ))}
                        </div>
                        <Pagination totalItems={allPhotoTotal} currentPage={allPhotoPage} pageSize={PAGE_SIZE} onPageChange={setAllPhotoPage} />
                    </section>
                ) : (
                    <section className="card" style={{ marginTop: 16, padding: "1.25rem" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#fff" }}>All Event Photos</h2>
                        <div className="alert alert-warning" style={{ marginTop: 12 }}>
                            This event is "Spot Only". You can only view your matched photos.
                        </div>
                    </section>
                )
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
        </>
    );
}
