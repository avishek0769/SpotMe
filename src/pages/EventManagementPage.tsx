import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
} from "react";
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
        events,
        setEventStatus,
        addPhotosToEvent,
        setEventAccessLevel,
        updateEventMeta,
        deleteEvent,
        upsertGuestCollection,
        removeGuestCollectionPhotos,
    } = useAppContext();

    const eventItem = useMemo(
        () => events.find((eventData) => eventData.id === id),
        [events, id],
    );

    const [activeTab, setActiveTab] = useState<EventTab>("photos");
    const [photoPage, setPhotoPage] = useState(1);
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
    const [uploadUnits, setUploadUnits] = useState(0);
    const [uploadTotalUnits, setUploadTotalUnits] = useState(800);
    const [uploadingCount, setUploadingCount] = useState(0);
    const [indexingProgress, setIndexingProgress] = useState(0);
    const [uploadPhase, setUploadPhase] = useState<
        "idle" | "uploading" | "indexing"
    >("idle");
    const [guestPhotoSelections, setGuestPhotoSelections] = useState<
        Record<string, number[]>
    >({});
    const [expandedGuestName, setExpandedGuestName] = useState<string | null>(
        null,
    );
    const [settingsName, setSettingsName] = useState(eventItem?.name ?? "");
    const [settingsExpiry, setSettingsExpiry] = useState(
        eventItem?.expiryDate ?? "",
    );
    const [copiedLink, setCopiedLink] = useState(false);

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
    const guestLink =
        typeof window !== "undefined"
            ? `${window.location.origin}/events/${managedEvent.id}/guest`
            : `/events/${managedEvent.id}/guest`;

    const photoPageItems = managedEvent.photos.slice(
        (photoPage - 1) * PAGE_SIZE,
        photoPage * PAGE_SIZE,
    );

    function togglePhotoSelection(photoId: number) {
        setSelectedPhotoIds((prev) =>
            prev.includes(photoId)
                ? prev.filter((idNum) => idNum !== photoId)
                : [...prev, photoId],
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
                    idx = Math.min(
                        100,
                        idx + (3 + Math.floor(Math.random() * 9)),
                    );
                    setIndexingProgress(idx);
                    if (idx >= 100) {
                        window.clearInterval(indexingTimer);
                        setUploadPhase("idle");
                        setEventStatus(managedEvent.id, "Ready");
                        addPhotosToEvent(
                            managedEvent.id,
                            selectedFileCount * 5,
                        );
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
        const candidate = managedEvent.photos.find(
            (photo) => !guest.collectionPhotoIds.includes(photo.id),
        );
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
        if (navigator.clipboard && window.isSecureContext) {
            void navigator.clipboard.writeText(guestLink);
            setCopiedLink(true);
            window.setTimeout(() => setCopiedLink(false), 1500);
            return;
        }
        window.prompt("Copy this link:", guestLink);
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
            <div className="mb-3 flex items-center justify-between gap-3">
                <Link
                    to="/dashboard"
                    className="text-sm text-[#9eb7ff] hover:text-[#c8d8ff]"
                >
                    Back to Dashboard
                </Link>
                <span className="rounded-full border border-[#334563] bg-[#121d32] px-3 py-1 text-xs text-[#9fb2d3]">
                    Event ID: {managedEvent.id}
                </span>
            </div>

            <header className="card p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {managedEvent.name}
                        </h1>
                        <p className="mt-2 text-sm muted">
                            Date: {managedEvent.date}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="status-pill border border-[#384969] bg-[#1a2640] text-[#ced9ef]">
                            {managedEvent.type}
                        </span>
                        <span className={getStatusClass(managedEvent.status)}>
                            {managedEvent.status}
                        </span>
                    </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-[#2e3b56] bg-[#111a2c] p-3">
                        <p className="text-xs muted">Total Photos</p>
                        <p className="mt-1 text-lg font-semibold text-[#e7efff]">
                            {managedEvent.photos.length}
                        </p>
                    </div>
                    <div className="rounded-lg border border-[#2e3b56] bg-[#111a2c] p-3">
                        <p className="text-xs muted">Guest Records</p>
                        <p className="mt-1 text-lg font-semibold text-[#e7efff]">
                            {managedEvent.guests.length}
                        </p>
                    </div>
                    <div className="rounded-lg border border-[#2e3b56] bg-[#111a2c] p-3">
                        <p className="text-xs muted">Access Level</p>
                        <p className="mt-1 text-lg font-semibold text-[#e7efff]">
                            {managedEvent.accessLevel === 1
                                ? "Spot Only"
                                : "Browse and Spot"}
                        </p>
                    </div>
                </div>
            </header>

            <div className="mt-4 overflow-x-auto">
                <div className="inline-flex min-w-full rounded-xl border border-[#2a364d] bg-[#121a2a] p-1 sm:min-w-0">
                    {(
                        ["photos", "guests", "access", "settings"] as EventTab[]
                    ).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`rounded-lg px-3 py-2 text-sm capitalize sm:px-4 ${
                                activeTab === tab
                                    ? "bg-[#1f2e4c] text-[#f6f9ff]"
                                    : "text-[#a2b1cd] hover:text-[#dbe6ff]"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === "photos" ? (
                <section className="card mt-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Photos</h2>
                        <p className="text-sm muted">
                            Selected: {selectedPhotoIds.length}
                        </p>
                    </div>

                    <div
                        className="mt-4 rounded-xl border border-dashed border-[#3a4b70] bg-[#101a2b] p-6"
                        onDrop={onUploadDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <p className="text-sm text-[#d4e1f8]">
                            Drag and drop photos here
                        </p>
                        <p className="mt-1 text-xs muted">
                            or choose files from your device
                        </p>
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
                            className="btn-secondary mt-4 px-4 py-2"
                        >
                            Select Files
                        </button>
                    </div>

                    {uploadPhase === "uploading" ? (
                        <div className="mt-4 card p-4">
                            <p className="text-sm text-[#d5e0f8]">
                                Uploading {uploadUnits}/{uploadTotalUnits} (
                                {uploadingCount} files)
                            </p>
                            <div className="mt-2 flex items-center justify-between text-xs muted">
                                <span>Progress</span>
                                <span>
                                    {Math.round(
                                        (uploadUnits / uploadTotalUnits) * 100,
                                    )}
                                    %
                                </span>
                            </div>
                            <div className="mt-2 h-2.5 w-full rounded-full bg-[#23314a]">
                                <div
                                    className="h-2.5 rounded-full bg-[#4f7cff]"
                                    style={{
                                        width: `${(uploadUnits / uploadTotalUnits) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ) : null}

                    {uploadPhase === "indexing" ? (
                        <div className="mt-4 card p-4">
                            <p className="text-sm text-[#d5e0f8]">
                                Indexing faces, you can close this tab
                            </p>
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
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {photoPageItems.map((photo) => (
                                <label
                                    key={photo.id}
                                    className="photo-tile block p-2 text-xs"
                                >
                                    <img
                                        src={photo.url}
                                        alt="Event"
                                        className="rounded-md"
                                    />
                                    <span className="mt-2 flex items-center gap-2 text-[#b8c6e4]">
                                        <input
                                            type="checkbox"
                                            checked={selectedPhotoIds.includes(
                                                photo.id,
                                            )}
                                            onChange={() =>
                                                togglePhotoSelection(photo.id)
                                            }
                                            className="h-4 w-4 rounded border-[#5b6f98] bg-[#0f1625] accent-[#4f7cff]"
                                        />
                                        Photo #{photo.id}
                                    </span>
                                </label>
                            ))}
                        </div>
                        {managedEvent.photos.length === 0 ? (
                            <div className="card mt-4 p-8 text-center">
                                <p className="text-3xl">🖼️</p>
                                <p className="mt-2 text-base font-medium">
                                    No photos uploaded yet
                                </p>
                                <p className="mt-1 text-sm muted">
                                    Upload event photos to start indexing faces.
                                </p>
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
                <section className="card mt-4 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Guests</h2>
                        <p className="text-xs text-[#9fb2d3]">
                            Use View Collection to inspect matched photos
                        </p>
                    </div>
                    <p className="mt-3 rounded-lg border border-[#2f4669] bg-[#13213a] p-3 text-sm text-[#c9d8f2]">
                        You cannot see the photos guests uploaded for matching
                    </p>

                    <div className="mt-4 overflow-x-auto rounded-lg border border-[#2a364d]">
                        <table className="w-full min-w-[640px] border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-[#2a364d] bg-[#101a2b] text-left text-[#9aa8c3]">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Accessed</th>
                                    <th className="p-3">My Photos Count</th>
                                    <th className="p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {managedEvent.guests.map((guest) => (
                                    <tr
                                        key={guest.name}
                                        className="border-b border-[#1f2a3e] hover:bg-[#121d31]"
                                    >
                                        <td className="p-3">{guest.name}</td>
                                        <td className="p-3">
                                            {formatWhen(guest.accessedAt)}
                                        </td>
                                        <td className="p-3">
                                            {guest.collectionPhotoIds.length}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedGuestName(
                                                        (prev) =>
                                                            prev === guest.name
                                                                ? null
                                                                : guest.name,
                                                    )
                                                }
                                                className="btn-secondary px-3 py-1.5 text-xs"
                                            >
                                                {expandedGuestName ===
                                                guest.name
                                                    ? "Hide Collection"
                                                    : "View Collection"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {managedEvent.guests.length === 0 ? (
                        <div className="card mt-4 p-8 text-center">
                            <p className="text-3xl">👥</p>
                            <p className="mt-2 text-base font-medium">
                                No guest activity yet
                            </p>
                            <p className="mt-1 text-sm muted">
                                Guests will appear here after opening your
                                shared link.
                            </p>
                        </div>
                    ) : null}

                    {expandedGuestName ? (
                        <div className="card mt-4 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-semibold">
                                    My Photos: {expandedGuestName}
                                </h3>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            addRandomPhotoToGuest(
                                                expandedGuestName,
                                            )
                                        }
                                        className="btn-secondary px-3 py-2 text-sm"
                                    >
                                        Add Random Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeSelectedFromGuest(
                                                expandedGuestName,
                                            )
                                        }
                                        className="btn-primary px-3 py-2 text-sm"
                                    >
                                        Remove Selected
                                    </button>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                                {(
                                    eventItem.guests.find(
                                        (guest) =>
                                            guest.name === expandedGuestName,
                                    )?.collectionPhotoIds ?? []
                                ).map((photoId) => {
                                    const photo = managedEvent.photos.find(
                                        (p) => p.id === photoId,
                                    );
                                    if (!photo) {
                                        return null;
                                    }
                                    const selected = (
                                        guestPhotoSelections[
                                            expandedGuestName
                                        ] ?? []
                                    ).includes(photoId);

                                    return (
                                        <label
                                            key={photoId}
                                            className="photo-tile block p-2 text-xs"
                                        >
                                            <img
                                                src={photo.url}
                                                alt="Guest collection"
                                                className="rounded-md"
                                            />
                                            <span className="mt-2 flex items-center gap-2 text-[#b8c6e4]">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        toggleGuestPhotoSelection(
                                                            expandedGuestName,
                                                            photoId,
                                                        )
                                                    }
                                                    className="h-4 w-4 rounded border-[#5b6f98] bg-[#0f1625] accent-[#4f7cff]"
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
                <section className="card mt-4 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold">Access</h2>
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <label
                            className={`cursor-pointer rounded-lg border p-3 transition ${
                                managedEvent.accessLevel === 1
                                    ? "border-[#4f7cff] bg-[#152342]"
                                    : "border-[#2a364d] bg-[#101a2b]"
                            }`}
                        >
                            <input
                                type="radio"
                                checked={managedEvent.accessLevel === 1}
                                onChange={() =>
                                    setEventAccessLevel(managedEvent.id, 1)
                                }
                                className="h-4 w-4 rounded border-[#5b6f98] bg-[#0f1625] accent-[#4f7cff]"
                            />
                            <span className="ml-2 block">
                                <strong className="text-[#e9f0ff]">
                                    Level 1 - Spot Only
                                </strong>
                                <span className="mt-1 block text-sm text-[#b8c6e4]">
                                    Guests cannot browse all photos, can only
                                    upload face and find their own
                                </span>
                            </span>
                        </label>
                        <label
                            className={`cursor-pointer rounded-lg border p-3 transition ${
                                managedEvent.accessLevel === 2
                                    ? "border-[#4f7cff] bg-[#152342]"
                                    : "border-[#2a364d] bg-[#101a2b]"
                            }`}
                        >
                            <input
                                type="radio"
                                checked={managedEvent.accessLevel === 2}
                                onChange={() =>
                                    setEventAccessLevel(managedEvent.id, 2)
                                }
                                className="h-4 w-4 rounded border-[#5b6f98] bg-[#0f1625] accent-[#4f7cff]"
                            />
                            <span className="ml-2 block">
                                <strong className="text-[#e9f0ff]">
                                    Level 2 - Browse and Spot
                                </strong>
                                <span className="mt-1 block text-sm text-[#b8c6e4]">
                                    Guests can see all photos and also use face
                                    spotting
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className="mt-4 rounded-lg border border-[#2a364d] bg-[#101a2b] p-4 text-sm">
                        <a
                            href={guestLink}
                            target="_blank"
                            rel="noreferrer"
                            className="break-all text-[#9eb7ff] hover:text-[#c8d8ff]"
                        >
                            {guestLink}
                        </a>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={copyGuestLink}
                                className="btn-secondary px-3 py-2"
                            >
                                {copiedLink ? "Copied" : "Copy Link"}
                            </button>
                            <a
                                href={guestLink}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-primary px-3 py-2"
                            >
                                Open Link
                            </a>
                        </div>
                    </div>
                </section>
            ) : null}

            {activeTab === "settings" ? (
                <section className="card mt-4 p-5 sm:p-6">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <div className="mt-4 grid gap-3 md:max-w-xl">
                        <label className="ui-label">
                            Event Name
                            <input
                                value={settingsName}
                                onChange={(e) =>
                                    setSettingsName(e.target.value)
                                }
                                className="ui-input"
                            />
                        </label>
                        <label className="ui-label">
                            Event Expiry Date
                            <input
                                type="date"
                                value={settingsExpiry}
                                onChange={(e) =>
                                    setSettingsExpiry(e.target.value)
                                }
                                className="ui-input"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={saveSettings}
                            className="btn-primary w-full px-4 py-2 text-sm sm:w-auto"
                        >
                            Save Settings
                        </button>
                    </div>

                    <div className="mt-8 rounded-lg border border-red-500/60 bg-red-600/10 p-4">
                        <h3 className="font-medium text-red-300">
                            Danger Zone
                        </h3>
                        <p className="mt-1 text-sm text-red-200/80">
                            Deleting an event will remove all uploaded photos
                            and guest collections.
                        </p>
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
