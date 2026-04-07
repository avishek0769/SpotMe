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
            <div className="mx-auto max-w-3xl p-4">
                <p className="text-sm">Only the photographer can manage this event.</p>
                <Link to="/dashboard" className="mt-2 inline-block underline">
                    Back to dashboard
                </Link>
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
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
            <Link to="/dashboard" className="text-sm underline">
                Back to Dashboard
            </Link>

            <header className="mt-3 rounded border p-4">
                <h1 className="text-xl font-semibold">{managedEvent.name}</h1>
                <p className="mt-1 text-sm">Date: {managedEvent.date}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded border px-2 py-1">{managedEvent.type}</span>
                    <span className="rounded border px-2 py-1">{managedEvent.status}</span>
                </div>
            </header>

            <div className="mt-4 flex flex-wrap gap-2">
                {(["photos", "guests", "access", "settings"] as EventTab[]).map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`rounded border px-3 py-2 text-sm ${
                            activeTab === tab ? "bg-gray-100" : ""
                        }`}
                    >
                        {tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === "photos" ? (
                <section className="mt-4 rounded border p-4">
                    <h2 className="text-lg font-medium">Photos</h2>
                    <div
                        className="mt-3 rounded border border-dashed p-6 text-sm"
                        onDrop={onUploadDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <p>Drag and drop photos here, or click below to upload.</p>
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
                            className="mt-3 rounded border px-3 py-2"
                        >
                            Select Files
                        </button>
                    </div>

                    {uploadPhase === "uploading" ? (
                        <div className="mt-4">
                            <p className="text-sm">
                                Uploading {uploadUnits}/{uploadTotalUnits} ({uploadingCount} files)
                            </p>
                            <div className="mt-2 h-2 w-full rounded bg-gray-200">
                                <div
                                    className="h-2 rounded bg-black"
                                    style={{ width: `${(uploadUnits / uploadTotalUnits) * 100}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {uploadPhase === "indexing" ? (
                        <div className="mt-4">
                            <p className="text-sm">Indexing faces, you can close this tab ({indexingProgress}%)</p>
                            <div className="mt-2 h-2 w-full rounded bg-gray-200">
                                <div
                                    className="h-2 rounded bg-black"
                                    style={{ width: `${indexingProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : null}

                    <div className="mt-6">
                        <p className="text-sm">Selected photos: {selectedPhotoIds.length}</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {photoPageItems.map((photo) => (
                                <label key={photo.id} className="space-y-1 text-xs">
                                    <img src={photo.url} alt="Event" className="w-full rounded border" />
                                    <span className="flex items-center gap-2">
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
                <section className="mt-4 rounded border p-4">
                    <h2 className="text-lg font-medium">Guests</h2>
                    <p className="mt-2 rounded border bg-gray-50 p-2 text-sm">
                        You cannot see the photos guests uploaded for matching
                    </p>

                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="p-2">Name</th>
                                    <th className="p-2">Accessed</th>
                                    <th className="p-2">My Photos Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managedEvent.guests.map((guest) => (
                                    <tr
                                        key={guest.name}
                                        className="cursor-pointer border-b"
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

                    {expandedGuestName ? (
                        <div className="mt-4 rounded border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-medium">My Photos: {expandedGuestName}</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => addRandomPhotoToGuest(expandedGuestName)}
                                        className="rounded border px-3 py-1 text-sm"
                                    >
                                        Add Random Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeSelectedFromGuest(expandedGuestName)}
                                        className="rounded border px-3 py-1 text-sm"
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
                                        <label key={photoId} className="space-y-1 text-xs">
                                            <img src={photo.url} alt="Guest collection" className="rounded border" />
                                            <span className="flex items-center gap-2">
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
                <section className="mt-4 rounded border p-4">
                    <h2 className="text-lg font-medium">Access</h2>
                    <div className="mt-3 space-y-2 text-sm">
                        <label className="flex items-start gap-2">
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
                        <label className="flex items-start gap-2">
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

                    <div className="mt-4 rounded border p-3 text-sm">
                        <p>spotme.app/events/{managedEvent.id}/guest</p>
                        <button
                            type="button"
                            onClick={copyGuestLink}
                            className="mt-2 rounded border px-3 py-1"
                        >
                            Copy Link
                        </button>
                    </div>
                </section>
            ) : null}

            {activeTab === "settings" ? (
                <section className="mt-4 rounded border p-4">
                    <h2 className="text-lg font-medium">Settings</h2>
                    <div className="mt-3 max-w-md space-y-3">
                        <label className="flex flex-col gap-1 text-sm">
                            Event Name
                            <input
                                value={settingsName}
                                onChange={(e) => setSettingsName(e.target.value)}
                                className="rounded border px-3 py-2"
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-sm">
                            Event Expiry Date
                            <input
                                type="date"
                                value={settingsExpiry}
                                onChange={(e) => setSettingsExpiry(e.target.value)}
                                className="rounded border px-3 py-2"
                            />
                        </label>
                        <button type="button" onClick={saveSettings} className="rounded border px-3 py-2 text-sm">
                            Save Settings
                        </button>
                    </div>

                    <div className="mt-8 rounded border border-red-400 p-4">
                        <h3 className="font-medium text-red-700">Danger Zone</h3>
                        <button
                            type="button"
                            onClick={handleDeleteEvent}
                            className="mt-2 rounded border border-red-500 px-3 py-2 text-sm text-red-700"
                        >
                            Delete Event
                        </button>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
