import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";

const PAGE_SIZE = 20;

function toDaysAgoText(iso: string | null) {
    if (!iso) {
        return "No previous search";
    }
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(1, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
    return `Last searched: ${diff} day${diff > 1 ? "s" : ""} ago`;
}

export function GuestEventPage() {
    const { id } = useParams();
    const { events, currentUser, upsertGuestCollection, removeGuestCollectionPhotos } = useAppContext();

    const eventItem = useMemo(() => events.find((eventData) => eventData.id === id), [events, id]);

    const [guestName, setGuestName] = useState(currentUser?.name ?? "");
    const [isMatching, setIsMatching] = useState(false);
    const [message, setMessage] = useState("");
    const [browsePage, setBrowsePage] = useState(1);
    const [myPhotosPage, setMyPhotosPage] = useState(1);
    const [selectedMyPhotoIds, setSelectedMyPhotoIds] = useState<number[]>([]);

    const guestRecord = useMemo(() => {
        if (!eventItem || !guestName.trim()) {
            return null;
        }
        return eventItem.guests.find(
            (guest) => guest.name.toLowerCase() === guestName.trim().toLowerCase(),
        );
    }, [eventItem, guestName]);

    const myPhotos = useMemo(() => {
        if (!eventItem || !guestRecord) {
            return [];
        }
        return guestRecord.collectionPhotoIds
            .map((photoId) => eventItem.photos.find((photo) => photo.id === photoId))
            .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));
    }, [eventItem, guestRecord]);

    if (!eventItem) {
        return <Navigate to="/" replace />;
    }

    const guestEvent = eventItem;

    const browsePhotos = guestEvent.photos.slice((browsePage - 1) * PAGE_SIZE, browsePage * PAGE_SIZE);
    const pagedMyPhotos = myPhotos.slice((myPhotosPage - 1) * PAGE_SIZE, myPhotosPage * PAGE_SIZE);

    function runSearch() {
        if (!guestName.trim()) {
            setMessage("Please enter your name");
            return;
        }

        setMessage("");
        setIsMatching(true);

        window.setTimeout(() => {
            const normalizedName = guestName.trim();
            const existingIds = guestRecord?.collectionPhotoIds ?? [];
            const pool = guestEvent.photos.filter((photo) => !existingIds.includes(photo.id));

            if (existingIds.length > 0) {
                const newPhotos = pool.slice(0, 3);
                upsertGuestCollection(
                    guestEvent.id,
                    normalizedName,
                    newPhotos.map((photo) => photo.id),
                    { merge: true, updateSearchedAt: true },
                );
                setMessage(`${newPhotos.length} new photos added to your collection`);
            } else {
                const firstSet = guestEvent.photos.slice(0, 12).map((photo) => photo.id);
                upsertGuestCollection(guestEvent.id, normalizedName, firstSet, {
                    merge: false,
                    updateSearchedAt: true,
                });
                setMessage("My Photos collection created");
            }

            setIsMatching(false);
        }, 2500);
    }

    function toggleMyPhoto(photoId: number) {
        setSelectedMyPhotoIds((prev) =>
            prev.includes(photoId) ? prev.filter((idNum) => idNum !== photoId) : [...prev, photoId],
        );
    }

    function removeSelectedMyPhotos() {
        if (!selectedMyPhotoIds.length || !guestName.trim()) {
            return;
        }
        removeGuestCollectionPhotos(guestEvent.id, guestName.trim(), selectedMyPhotoIds);
        setSelectedMyPhotoIds([]);
    }

    function removeSinglePhoto(photoId: number) {
        if (!guestName.trim()) {
            return;
        }
        removeGuestCollectionPhotos(guestEvent.id, guestName.trim(), [photoId]);
        setSelectedMyPhotoIds((prev) => prev.filter((idNum) => idNum !== photoId));
    }

    function downloadAll() {
        window.alert(`Downloading ${myPhotos.length} photos`);
    }

    function downloadSelected() {
        window.alert(`Downloading ${selectedMyPhotoIds.length} photos`);
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6">
            <div className="flex items-center justify-between gap-2">
                <h1 className="text-2xl font-semibold">{guestEvent.name}</h1>
                <Link to="/" className="text-sm underline">
                    SpotMe Home
                </Link>
            </div>
            <p className="mt-1 text-sm">Photographer: Rahul Sharma</p>

            {!currentUser ? (
                <div className="mt-3 rounded border bg-yellow-50 p-3 text-sm">
                    You are viewing as a guest. Sign in to save your collection and access it later.
                </div>
            ) : null}

            {guestEvent.accessLevel === 2 ? (
                <section className="mt-5 rounded border p-4">
                    <h2 className="text-lg font-medium">All Event Photos</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {browsePhotos.map((photo) => (
                            <img key={photo.id} src={photo.url} alt="Event" className="rounded border" />
                        ))}
                    </div>
                    <Pagination
                        totalItems={guestEvent.photos.length}
                        currentPage={browsePage}
                        pageSize={PAGE_SIZE}
                        onPageChange={setBrowsePage}
                    />
                </section>
            ) : null}

            <section className="mt-5 rounded border p-4">
                <h2 className="text-lg font-medium">Find My Photos</h2>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="flex flex-col gap-1 text-sm">
                        Your Name
                        <input
                            value={guestName}
                            onChange={(e) => {
                                setGuestName(e.target.value);
                                setSelectedMyPhotoIds([]);
                                setMyPhotosPage(1);
                            }}
                            className="rounded border px-3 py-2"
                            placeholder="Enter your name"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={runSearch}
                        disabled={isMatching}
                        className="rounded border px-4 py-2 text-sm"
                    >
                        Upload Selfie & Find Photos
                    </button>
                </div>

                <p className="mt-3 text-sm text-gray-700">{toDaysAgoText(guestRecord?.lastSearchedAt ?? null)}</p>
                {guestRecord ? (
                    <button
                        type="button"
                        onClick={runSearch}
                        disabled={isMatching}
                        className="mt-2 rounded border px-3 py-1 text-sm"
                    >
                        Search Again
                    </button>
                ) : null}

                {isMatching ? <p className="mt-3 text-sm">Finding your photos...</p> : null}
                {message ? <p className="mt-3 text-sm">{message}</p> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={downloadAll} className="rounded border px-3 py-2 text-sm">
                        Download All
                    </button>
                    <button
                        type="button"
                        onClick={downloadSelected}
                        className="rounded border px-3 py-2 text-sm"
                    >
                        Download Selected
                    </button>
                    <button
                        type="button"
                        onClick={removeSelectedMyPhotos}
                        className="rounded border px-3 py-2 text-sm"
                    >
                        Remove Selected
                    </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {pagedMyPhotos.map((photo) => (
                        <div key={photo.id} className="space-y-1 text-xs">
                            <img src={photo.url} alt="My matched" className="rounded border" />
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedMyPhotoIds.includes(photo.id)}
                                    onChange={() => toggleMyPhoto(photo.id)}
                                />
                                #{photo.id}
                            </label>
                            <button
                                type="button"
                                onClick={() => removeSinglePhoto(photo.id)}
                                className="rounded border px-2 py-1"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>

                <Pagination
                    totalItems={myPhotos.length}
                    currentPage={myPhotosPage}
                    pageSize={PAGE_SIZE}
                    onPageChange={setMyPhotosPage}
                />
            </section>
        </div>
    );
}
