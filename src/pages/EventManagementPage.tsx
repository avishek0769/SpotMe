import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";

const PAGE_SIZE = 20;

type EventTab = "photos" | "guests" | "access" | "settings";

function formatWhen(iso: string | null) {
    if (!iso) {
        return "Never";
    }
    return new Date(iso).toLocaleString();
}

function getStatusClass(status: "Uploading" | "Indexing" | "Ready") {
    if (status === "Ready") {
        return "status-pill status-ready";
    }
    if (status === "Indexing") {
        return "status-pill status-indexing";
    }
    return "status-pill status-uploading";
}

export function EventManagementPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const {
        currentUser,
        events,
        setEventStatus,
        addPhotosToEvent,
        setEventAccessLevel,
        updateEventMeta,
        deleteEvent,
        upsertGuestCollection,
        removeGuestCollectionPhotos,
    } = useAppContext();

    const eventItem = useMemo(() => events.find((eventData) => eventData.id === id), [events, id]);

    const [activeTab, setActiveTab] = useState<EventTab>("photos");
    const [photoPage, setPhotoPage] = useState(1);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
    const [uploadUnits, setUploadUnits] = useState(0);
    const [uploadTotalUnits, setUploadTotalUnits] = useState(800);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [indexingProgress, setIndexingProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<"idle" | "uploading" | "indexing">("idle");
    const [guestPhotoSelections, setGuestPhotoSelections] = useState<Record<string, number[]>>({});
    const [expandedGuestName, setExpandedGuestName] = useState<string | null>(null);
    const [settingsName, setSettingsName] = useState(eventItem?.name ?? "");
    const [settingsExpiry, setSettingsExpiry] = useState(eventItem?.expiryDate ?? "");

    const uploadInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (uploadPhase !== "uploading") {
            return;
        }

        const handleBeforeUnload = (evt: BeforeUnloadEvent) => {
            evt.preventDefault();
            evt.returnValue = "Upload in progress";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [uploadPhase]);

    if (!eventItem) {
        return <Navigate to="/dashboard" replace />;
    }

    const managedEvent = eventItem;

    if (managedEvent.photographerId !== currentUser?.id) {
        return (
            <div className="page-wrap">
                <div className="card max-w-3xl p-6">
                    <p className="text-sm muted">Only the photographer can manage this event.</p>
                    <Link to="/dashboard" className="mt-2 inline-block text-sm text-[#a8c0ff] hover:text-[#d7e4ff]">
                    Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const photoPageItems = managedEvent.photos.slice((photoPage - 1) * PAGE_SIZE, photoPage * PAGE_SIZE);

    function togglePhotoSelection(photoId: number) {
        setSelectedPhotoIds((prev) =>
            prev.includes(photoId) ? prev.filter((idNum) => idNum !== photoId) : [...prev, photoId],
        );
    }

    function startUploadSimulation(selectedFileCount: number) {
        if (selectedFileCount <= 0) {
            return;
        }

        const totalUnits = Math.max(800, selectedFileCount * 160);
        setUploadTotalUnits(totalUnits);
        setUploadUnits(0);
        setUploadingCount(selectedFileCount);
        setIndexingProgress(0);
        setUploadPhase("uploading");
        setEventStatus(managedEvent.id, "Uploading");

        let units = 0;
        const uploadTimer = window.setInterval(() => {
            const delta = 12 + Math.floor(Math.random() * 28);
            units = Math.min(totalUnits, units + delta);
            setUploadUnits(units);

            if (units >= totalUnits) {
                window.clearInterval(uploadTimer);
                setUploadPhase("indexing");
                setEventStatus(managedEvent.id, "Indexing");

                let idx = 0;
                const indexingTimer = window.setInterval(() => {
                    idx = Math.min(100, idx + (3 + Math.floor(Math.random() * 9)));
                    setIndexingProgress(idx);
                    if (idx >= 100) {
                        window.clearInterval(indexingTimer);
                        setUploadPhase("idle");
                        setEventStatus(managedEvent.id, "Ready");
                        addPhotosToEvent(managedEvent.id, selectedFileCount * 5);
                    }
                }, 250);
            }
        }, 220);
    }

    function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        startUploadSimulation(files?.length ?? 0);
        e.target.value = "";
    }

    function onUploadDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        startUploadSimulation(e.dataTransfer.files?.length ?? 0);
    }

    function toggleGuestPhotoSelection(guestName: string, photoId: number) {
        setGuestPhotoSelections((prev) => {
            const current = prev[guestName] ?? [];
            const next = current.includes(photoId)
                ? current.filter((idNum) => idNum !== photoId)
                : [...current, photoId];
            return {
                ...prev,
                [guestName]: next,
            };
        });
    }

    function addRandomPhotoToGuest(guestName: string) {
        const guest = managedEvent.guests.find((g) => g.name === guestName);
        if (!guest) {
            return;
        }
        const candidate = managedEvent.photos.find((photo) => !guest.collectionPhotoIds.includes(photo.id));
        if (!candidate) {
            return;
        }
        upsertGuestCollection(managedEvent.id, guestName, [candidate.id], {
            merge: true,
            updateSearchedAt: false,
        });
    }

    function removeSelectedFromGuest(guestName: string) {
        const selected = guestPhotoSelections[guestName] ?? [];
        if (!selected.length) {
            return;
        }
        removeGuestCollectionPhotos(managedEvent.id, guestName, selected);
        setGuestPhotoSelections((prev) => ({
            ...prev,
            [guestName]: [],
        }));
    }

    function copyGuestLink() {
        const shareLink = `spotme.app/events/${managedEvent.id}/guest`;
        if (navigator.clipboard && window.isSecureContext) {
            void navigator.clipboard.writeText(shareLink);
            return;
        }
        window.prompt("Copy this link:", shareLink);
    }

    function saveSettings() {
        if (!settingsName.trim() || !settingsExpiry.trim()) {
            return;
        }
        updateEventMeta(managedEvent.id, {
            name: settingsName.trim(),
            expiryDate: settingsExpiry,
        });
    }

    function handleDeleteEvent() {
        const shouldDelete = window.confirm("Delete this event permanently?");
        if (!shouldDelete) {
            return;
        }
        deleteEvent(managedEvent.id);
        navigate("/dashboard");
    }

    return (
        <div className="page-wrap">
            <Link to="/dashboard" className="text-sm text-[#9eb7ff] hover:text-[#c8d8ff]">
                Back to Dashboard
            </Link>

            <header className="card mt-3 p-5">
                <h1 className="text-2xl font-bold tracking-tight">{managedEvent.name}</h1>
                <p className="mt-2 text-sm muted">Date: {managedEvent.date}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="status-pill border border-[#384969] bg-[#1a2640] text-[#ced9ef]">{managedEvent.type}</span>
                    <span className={getStatusClass(managedEvent.status)}>{managedEvent.status}</span>
                </div>
            </header>

            <div className="mt-4 inline-flex rounded-xl border border-[#2a364d] bg-[#121a2a] p-1">
                {(["photos", "guests", "access", "settings"] as EventTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded-lg px-3 py-2 text-sm capitalize ${
                            activeTab === tab
                                ? "bg-[#1f2e4c] text-[#f6f9ff]"
                                : "text-[#a2b1cd] hover:text-[#dbe6ff]"
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === "photos" ? (
                <section className="card mt-4 p-5">
                    <h2 className="text-lg font-semibold">Photos</h2>
                    <div
                        className="mt-4 rounded-xl border border-dashed border-[#3a4b70] bg-[#101a2b] p-6 text-sm"
                        onDrop={onUploadDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <p className="muted">Drag and drop photos here, or click below to upload.</p>
                        <input
                            ref={uploadInputRef}
                            type="file"
                            multiple
                            onChange={onFileInputChange}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => uploadInputRef.current?.click()}
                            className="btn-secondary mt-3 px-4 py-2"
                        >
                            Select Files
                        </button>
                    </div>

                    {uploadPhase === "uploading" ? (
                        <div className="mt-4 card p-4">
                            <p className="text-sm text-[#d5e0f8]">
                                Uploading {uploadUnits}/{uploadTotalUnits} ({uploadingCount} files)
                            </p>
                            <div className="mt-2 flex items-center justify-between text-xs muted">
                                <span>Progress</span>
                                <span>{Math.round((uploadUnits / uploadTotalUnits) * 100)}%</span>
                            </div>
                            <div className="mt-2 h-2.5 w-full rounded-full bg-[#23314a]">
                                <div
                                    className="h-2.5 rounded-full bg-[#4f7cff]"
                                    style={{ width: `${(uploadUnits / uploadTotalUnits) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {uploadPhase === "indexing" ? (
                        <div className="mt-4 card p-4">
                            <p className="text-sm text-[#d5e0f8]">Indexing faces, you can close this tab</p>
                            <div className="mt-2 flex items-center justify-between text-xs muted">
                                <span>Progress</span>
                                <span>{indexingProgress}%</span>
                            </div>
                            <div className="mt-2 h-2.5 w-full rounded-full bg-[#23314a]">
                                <div
                                    className="h-2.5 rounded-full bg-[#4f7cff]"
                                    style={{ width: `${indexingProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-6">
                        <p className="text-sm muted">Selected photos: {selectedPhotoIds.length}</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {photoPageItems.map((photo) => (
                                <label key={photo.id} className="photo-tile block p-2 text-xs">
                                    <img src={photo.url} alt="Event" className="rounded-md" />
                                    <span className="mt-2 flex items-center gap-2 text-[#b8c6e4]">
                                        <input
                                            type="checkbox"
                                            checked={selectedPhotoIds.includes(photo.id)}
                                            onChange={() => togglePhotoSelection(photo.id)}
                                        />
                                        Photo #{photo.id}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {managedEvent.photos.length === 0 ? (
                            <div className="card mt-4 p-8 text-center">
                                <p className="text-3xl">🖼️</p>
                                <p className="mt-2 text-base font-medium">No photos uploaded yet</p>
                                <p className="mt-1 text-sm muted">Upload event photos to start indexing faces.</p>
                            </div>
                        ) : null}
                        <Pagination
                            totalItems={managedEvent.photos.length}
                            currentPage={photoPage}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPhotoPage}
                        />
                    </div>
                </section>
            ) : null}

            {activeTab === "guests" ? (
                <section className="card mt-4 p-5">
                    <h2 className="text-lg font-semibold">Guests</h2>
                    <p className="mt-3 rounded-lg border border-[#2f4669] bg-[#13213a] p-3 text-sm text-[#c9d8f2]">
                        You cannot see the photos guests uploaded for matching
                    </p>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[#2a364d] text-left text-[#9aa8c3]">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Accessed</th>
                                    <th className="p-2">My Photos Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managedEvent.guests.map((guest) => (
                                    <tr
                                        key={guest.name}
                                        className="cursor-pointer border-b border-[#1f2a3e] hover:bg-[#121d31]"
                                        onClick={() =>
                                            setExpandedGuestName((prev) =>
                                                prev === guest.name ? null : guest.name,
                                            )
                                        }
                                    >
                                        <td className="p-2">{guest.name}</td>
                                        <td className="p-2">{formatWhen(guest.accessedAt)}</td>
                                        <td className="p-2">{guest.collectionPhotoIds.length}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {managedEvent.guests.length === 0 ? (
                        <div className="card mt-4 p-8 text-center">
                            <p className="text-3xl">👥</p>
                            <p className="mt-2 text-base font-medium">No guest activity yet</p>
                            <p className="mt-1 text-sm muted">Guests will appear here after opening your shared link.</p>
                        </div>
                    ) : null}

                    {expandedGuestName ? (
                        <div className="card mt-4 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-semibold">My Photos: {expandedGuestName}</h3>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => addRandomPhotoToGuest(expandedGuestName)}
                                        className="btn-secondary px-3 py-2 text-sm"
                                    >
                                        Add Random Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSelectedFromGuest(expandedGuestName)}
                                        className="btn-primary px-3 py-2 text-sm"
                                    >
                                        Remove Selected
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {(eventItem.guests
                                    .find((guest) => guest.name === expandedGuestName)
                                    ?.collectionPhotoIds ?? []
                                ).map((photoId) => {
                                    const photo = managedEvent.photos.find((p) => p.id === photoId);
                                    if (!photo) {
                                        return null;
                                    }
                                    const selected = (
                                        guestPhotoSelections[expandedGuestName] ?? []
                                    ).includes(photoId);

                                    return (
                                        <label key={photoId} className="photo-tile block p-2 text-xs">
                                            <img src={photo.url} alt="Guest collection" className="rounded-md" />
                                            <span className="mt-2 flex items-center gap-2 text-[#b8c6e4]">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        toggleGuestPhotoSelection(expandedGuestName, photoId)
                                                    }
                                                />
                                                #{photoId}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ) : null}
                </section>
            ) : null}

            {activeTab === "access" ? (
                <section className="card mt-4 p-5">
                    <h2 className="text-lg font-semibold">Access</h2>
                    <div className="mt-3 space-y-2 text-sm">
                        <label className="flex items-start gap-2 rounded-lg border border-[#2a364d] bg-[#101a2b] p-3">
                            <input
                                type="radio"
                                checked={managedEvent.accessLevel === 1}
                                onChange={() => setEventAccessLevel(managedEvent.id, 1)}
                            />
                            <span>
                                <strong>Level 1 - Spot Only</strong>: guests cannot browse all photos, can only
                                upload face and find their own
                            </span>
                        </label>
                        <label className="flex items-start gap-2 rounded-lg border border-[#2a364d] bg-[#101a2b] p-3">
                            <input
                                type="radio"
                                checked={managedEvent.accessLevel === 2}
                                onChange={() => setEventAccessLevel(managedEvent.id, 2)}
                            />
                            <span>
                                <strong>Level 2 - Browse and Spot</strong>: guests can see all photos and also use
                                face spotting
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 rounded-lg border border-[#2a364d] bg-[#101a2b] p-3 text-sm">
                        <p className="text-[#c9d8f2]">spotme.app/events/{managedEvent.id}/guest</p>
                        <button
                            type="button"
                            onClick={copyGuestLink}
                            className="btn-secondary mt-3 px-3 py-2"
                        >
                            Copy Link
                        </button>
                    </div>
                </section>
            ) : null}

            {activeTab === "settings" ? (
                <section className="card mt-4 p-5">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <div className="mt-3 max-w-md space-y-3">
                        <label className="ui-label">
                            Event Name
                            <input
                                value={settingsName}
                                onChange={(e) => setSettingsName(e.target.value)}
                                className="ui-input"
                            />
                        </label>
                        <label className="ui-label">
                            Event Expiry Date
                            <input
                                type="date"
                                value={settingsExpiry}
                                onChange={(e) => setSettingsExpiry(e.target.value)}
                                className="ui-input"
                            />
                        </label>
                        <button type="button" onClick={saveSettings} className="btn-primary px-4 py-2 text-sm">
                            Save Settings
                        </button>
                    </div>

                    <div className="mt-8 rounded-lg border border-red-500/60 bg-red-600/10 p-4">
                        <h3 className="font-medium text-red-300">Danger Zone</h3>
                        <button
                            type="button"
                            onClick={handleDeleteEvent}
                            className="mt-3 rounded-lg border border-red-500 px-3 py-2 text-sm text-red-300 hover:bg-red-600/10"
                        >
                            Delete Event
                        </button>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
