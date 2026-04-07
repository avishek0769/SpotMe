import { useRef, useState, type ChangeEvent } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { useAppContext } from "../context/AppContext";

const PAGE_SIZE = 20;

export function GuestCollectionPage() {
    const { id } = useParams();
    const {
        events,
        currentUser,
        upsertGuestCollection,
        setGuestMatchingUploads,
        removeGuestCollectionPhotos,
    } = useAppContext();

    const [page, setPage] = useState(1);
    const [selectedSelfieCount, setSelectedSelfieCount] = useState(0);
    const [isMatching, setIsMatching] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedPhotoIds, setSelectedPhotoIds] = useState<number[]>([]);
    const selfieInputRef = useRef<HTMLInputElement | null>(null);

    if (!currentUser) {
        return <Navigate to={`/events/${id}/guest`} replace />;
    }

    const eventItem = events.find((eventData) => eventData.id === id);

    if (!eventItem) {
        return <Navigate to="/dashboard" replace />;
    }

    const collectionEvent = eventItem;

    const guestName = currentUser.name;
    const guestRecord = collectionEvent.guests.find(
        (guest) => guest.name.toLowerCase() === guestName.toLowerCase(),
    );

    const myPhotos = (guestRecord?.collectionPhotoIds ?? [])
        .map((photoId) => collectionEvent.photos.find((photo) => photo.id === photoId))
        .filter((photo): photo is NonNullable<typeof photo> => Boolean(photo));

    const pagedMyPhotos = myPhotos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function onSelfieInputChange(event: ChangeEvent<HTMLInputElement>) {
        const fileCount = event.target.files?.length ?? 0;
        setSelectedSelfieCount(Math.min(3, fileCount));
    }

    function runMatching() {
        if (selectedSelfieCount <= 0) {
            setMessage("Select 1-3 selfies before running matching");
            return;
        }

        setMessage("");
        setIsMatching(true);

        window.setTimeout(() => {
            const existingIds = guestRecord?.collectionPhotoIds ?? [];
            const pool = collectionEvent.photos.filter((photo) => !existingIds.includes(photo.id));

            const matchingUploads = Array.from({ length: selectedSelfieCount }, (_, index) => {
                const seed = Date.now() + index;
                return {
                    id: seed,
                    url: `https://picsum.photos/seed/upload-${seed}/400/300`,
                    uploadedAt: new Date().toISOString(),
                };
            });
            setGuestMatchingUploads(collectionEvent.id, guestName, matchingUploads);

            if (existingIds.length > 0) {
                const newPhotos = pool.slice(0, 3);
                upsertGuestCollection(
                    collectionEvent.id,
                    guestName,
                    newPhotos.map((photo) => photo.id),
                    { merge: true, updateSearchedAt: true },
                );
                setMessage(`${newPhotos.length} new photos added to your collection`);
            } else {
                const firstSet = collectionEvent.photos.slice(0, 12).map((photo) => photo.id);
                upsertGuestCollection(collectionEvent.id, guestName, firstSet, {
                    merge: false,
                    updateSearchedAt: true,
                });
                setMessage("My Photos collection created");
            }

            setSelectedSelfieCount(0);
            if (selfieInputRef.current) {
                selfieInputRef.current.value = "";
            }
            setIsMatching(false);
        }, 2200);
    }

    function togglePhoto(photoId: number) {
        setSelectedPhotoIds((prev) =>
            prev.includes(photoId) ? prev.filter((idNum) => idNum !== photoId) : [...prev, photoId],
        );
    }

    function removeSelected() {
        if (!selectedPhotoIds.length) {
            return;
        }
        removeGuestCollectionPhotos(collectionEvent.id, guestName, selectedPhotoIds);
        setSelectedPhotoIds([]);
    }

    return (
        <div className="page-wrap">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Collection</h1>
                    <p className="mt-1 text-sm muted">{collectionEvent.name}</p>
                </div>
                <Link to="/dashboard" className="btn-secondary px-4 py-2 text-sm">
                    Back to Dashboard
                </Link>
            </div>

            <section className="card mt-5 p-5">
                <h2 className="text-lg font-semibold">Upload Selfie and Find</h2>
                <p className="mt-1 text-sm muted">
                    Signed in as {guestName}. Select up to 3 selfies and run matching.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <label className="ui-label">
                        Selfie Files (1-3)
                        <input
                            ref={selfieInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onSelfieInputChange}
                            className="ui-input"
                        />
                    </label>
                    <button
                        type="button"
                        disabled={isMatching}
                        onClick={runMatching}
                        className="btn-primary w-full px-4 py-2 text-sm sm:w-auto"
                    >
                        {isMatching ? "Finding..." : "Upload & Find"}
                    </button>
                </div>

                <p className="mt-2 text-sm muted">Selected selfies: {selectedSelfieCount}</p>
                {message ? (
                    <div className="mt-3 rounded-lg border border-[#2d4164] bg-[#13213a] px-3 py-2 text-sm text-[#d4e2ff]">
                        {message}
                    </div>
                ) : null}
            </section>

            <section className="card mt-5 p-5">
                <h2 className="text-lg font-semibold">My Photos</h2>
                <p className="mt-1 text-sm muted">Photos matched for {guestName}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {pagedMyPhotos.map((photo) => (
                        <div key={photo.id} className="photo-tile p-2">
                            <img src={photo.url} alt="My photo" className="rounded-md" />
                            <label className="mt-2 flex items-center gap-2 text-xs text-[#b8c6e4]">
                                <input
                                    type="checkbox"
                                    checked={selectedPhotoIds.includes(photo.id)}
                                    onChange={() => togglePhoto(photo.id)}
                                />
                                #{photo.id}
                            </label>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => window.alert(`Downloading ${myPhotos.length} photos`)}
                        className="btn-primary px-4 py-2 text-sm"
                    >
                        Download All
                    </button>
                    <button
                        type="button"
                        onClick={removeSelected}
                        className="btn-secondary px-4 py-2 text-sm"
                    >
                        Remove Selected
                    </button>
                </div>

                {myPhotos.length === 0 ? (
                    <div className="card mt-4 p-8 text-center">
                        <p className="text-3xl">🔎</p>
                        <p className="mt-2 text-base font-medium">No matched photos yet</p>
                        <p className="mt-1 text-sm muted">Use Upload & Find above on this same page.</p>
                    </div>
                ) : null}

                <Pagination totalItems={myPhotos.length} currentPage={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </section>

            <section className="card mt-5 p-5">
                <h2 className="text-lg font-semibold">Selfies Uploaded For Matching</h2>
                <p className="mt-1 text-sm muted">Latest 1-3 uploads used for the most recent matching run</p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {(guestRecord?.matchingUploads ?? []).map((upload) => (
                        <div key={upload.id} className="photo-tile p-2">
                            <img src={upload.url} alt="Uploaded for matching" className="rounded-md" />
                            <p className="mt-2 text-xs text-[#b8c6e4]">
                                Uploaded {new Date(upload.uploadedAt).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                {(guestRecord?.matchingUploads.length ?? 0) === 0 ? (
                    <div className="card mt-4 p-8 text-center">
                        <p className="text-3xl">📸</p>
                        <p className="mt-2 text-base font-medium">No selfie uploads yet</p>
                        <p className="mt-1 text-sm muted">Upload a selfie from the event guest page to start matching.</p>
                    </div>
                ) : null}
            </section>
        </div>
    );
}