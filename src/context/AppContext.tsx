/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { AppUser, EventData, EventGuest, EventStatus, EventType, MatchingUpload } from "../types";

interface CreateEventPayload {
    name: string;
    date: string;
    type: EventType;
}

interface AppContextValue {
    users: AppUser[];
    events: EventData[];
    currentUser: AppUser | null;
    login: (email: string, password: string) => Promise<boolean>;
    signup: (name: string, email: string, password: string) => Promise<boolean>;
    logout: () => void;
    createEvent: (payload: CreateEventPayload) => Promise<EventData>;
    deleteEvent: (eventId: string) => void;
    updateEventMeta: (eventId: string, payload: { name: string; expiryDate: string }) => void;
    setEventStatus: (eventId: string, status: EventStatus) => void;
    setEventAccessLevel: (eventId: string, level: 1 | 2) => void;
    addPhotosToEvent: (eventId: string, count: number) => void;
    upsertGuestCollection: (
        eventId: string,
        guestName: string,
        photoIds: number[],
        options?: { merge?: boolean; updateSearchedAt?: boolean },
    ) => void;
    setGuestMatchingUploads: (eventId: string, guestName: string, uploads: MatchingUpload[]) => void;
    removeGuestCollectionPhotos: (eventId: string, guestName: string, photoIds: number[]) => void;
    getMyEvents: () => EventData[];
    getSharedEvents: () => EventData[];
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const LOCAL_USERS_KEY = "spotme.users";
const LOCAL_SESSION_KEY = "spotme.session";

const nowIso = () => new Date().toISOString();

const daysAgoIso = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
};

const createPhotos = (startSeed: number, count: number) =>
    Array.from({ length: count }, (_, index) => {
        const id = startSeed + index;
        return {
            id,
            url: `https://picsum.photos/seed/${id}/400/300`,
        };
    });

const createMatchingUploads = (startSeed: number, count: number): MatchingUpload[] =>
    Array.from({ length: count }, (_, index) => {
        const id = startSeed + index;
        return {
            id,
            url: `https://picsum.photos/seed/match-${id}/400/300`,
            uploadedAt: nowIso(),
        };
    });

const initialUsers: AppUser[] = [
    {
        id: "u-photographer-rahul",
        name: "Rahul Sharma",
        email: "rahul@example.com",
        password: "123456",
        role: "photographer",
    },
    {
        id: "u-guest-sneha",
        name: "Sneha",
        email: "sneha@example.com",
        password: "123456",
        role: "guest",
    },
];

function loadUsersFromStorage(): AppUser[] {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    if (!raw) {
        return initialUsers;
    }
    try {
        const parsed = JSON.parse(raw) as AppUser[];
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialUsers;
    } catch {
        return initialUsers;
    }
}

function loadSessionFromStorage(): AppUser | null {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) {
        return null;
    }
    try {
        const parsed = JSON.parse(raw) as AppUser;
        return parsed ?? null;
    } catch {
        return null;
    }
}

const initialEvents: EventData[] = [
    {
        id: "evt-1",
        name: "Priya & Arjun Wedding",
        date: "2025-03-12",
        type: "Wedding",
        status: "Ready",
        accessLevel: 1,
        photographerId: "u-photographer-rahul",
        sharedWithUserIds: ["u-guest-sneha"],
        expiryDate: "2026-03-12",
        photos: createPhotos(1000, 240),
        guests: [
            {
                name: "Sneha",
                accessedAt: daysAgoIso(2),
                collectionPhotoIds: createPhotos(1000, 14).map((p) => p.id),
                lastSearchedAt: daysAgoIso(2),
                matchingUploads: createMatchingUploads(9000, 2),
            },
            {
                name: "Karan",
                accessedAt: daysAgoIso(5),
                collectionPhotoIds: createPhotos(1014, 9).map((p) => p.id),
                lastSearchedAt: daysAgoIso(5),
                matchingUploads: createMatchingUploads(9100, 1),
            },
            {
                name: "Meera",
                accessedAt: nowIso(),
                collectionPhotoIds: [],
                lastSearchedAt: null,
                matchingUploads: [],
            },
        ],
    },
    {
        id: "evt-2",
        name: "TechConf 2025",
        date: "2025-04-01",
        type: "Corporate",
        status: "Indexing",
        accessLevel: 2,
        photographerId: "u-photographer-rahul",
        sharedWithUserIds: ["u-guest-sneha"],
        expiryDate: "2026-04-01",
        photos: createPhotos(5000, 80),
        guests: [
            {
                name: "Sneha",
                accessedAt: daysAgoIso(3),
                collectionPhotoIds: createPhotos(5000, 6).map((p) => p.id),
                lastSearchedAt: daysAgoIso(3),
                matchingUploads: createMatchingUploads(9200, 1),
            },
        ],
    },
];

export function AppProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>(() => loadUsersFromStorage());
    const [events, setEvents] = useState<EventData[]>(initialEvents);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(() => loadSessionFromStorage());

    useEffect(() => {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(currentUser));
            return;
        }
        localStorage.removeItem(LOCAL_SESSION_KEY);
    }, [currentUser]);

    const login = useCallback(
        (email: string, password: string) =>
            new Promise<boolean>((resolve) => {
                setTimeout(() => {
                    const normalizedEmail = email.trim().toLowerCase();
                    const found = users.find(
                        (user) => user.email.toLowerCase() === normalizedEmail && user.password === password,
                    );
                    if (!found) {
                        resolve(false);
                        return;
                    }
                    setCurrentUser(found);
                    resolve(true);
                }, 1000);
            }),
        [users],
    );

    const signup = useCallback(
        (name: string, email: string, password: string) =>
            new Promise<boolean>((resolve) => {
                setTimeout(() => {
                    const normalizedEmail = email.trim().toLowerCase();
                    const exists = users.some((user) => user.email === normalizedEmail);
                    if (exists) {
                        resolve(false);
                        return;
                    }
                    const created: AppUser = {
                        id: `u-signup-${Date.now()}`,
                        name: name.trim(),
                        email: normalizedEmail,
                        password,
                        role: "guest",
                    };
                    setUsers((prev) => [...prev, created]);
                    setCurrentUser(created);
                    resolve(true);
                }, 1000);
            }),
        [users],
    );

    const logout = useCallback(() => {
        localStorage.removeItem(LOCAL_SESSION_KEY);
        setCurrentUser(null);
    }, []);

    const createEvent = useCallback(
        (payload: CreateEventPayload) =>
            new Promise<EventData>((resolve) => {
                setTimeout(() => {
                    const seedBase = Math.floor(Math.random() * 900000);
                    const created: EventData = {
                        id: `evt-${Date.now()}`,
                        name: payload.name,
                        date: payload.date,
                        type: payload.type,
                        status: "Uploading",
                        accessLevel: 1,
                        photographerId: currentUser?.id ?? "u-photographer-rahul",
                        sharedWithUserIds: [],
                        expiryDate: payload.date,
                        photos: createPhotos(seedBase, 0),
                        guests: [],
                    };
                    setEvents((prev) => [created, ...prev]);
                    resolve(created);
                }, 700);
            }),
        [currentUser?.id],
    );

    const deleteEvent = useCallback((eventId: string) => {
        setEvents((prev) => prev.filter((eventItem) => eventItem.id !== eventId));
    }, []);

    const updateEventMeta = useCallback(
        (eventId: string, payload: { name: string; expiryDate: string }) => {
            setEvents((prev) =>
                prev.map((eventItem) =>
                    eventItem.id === eventId
                        ? {
                              ...eventItem,
                              name: payload.name,
                              expiryDate: payload.expiryDate,
                          }
                        : eventItem,
                ),
            );
        },
        [],
    );

    const setEventStatus = useCallback((eventId: string, status: EventStatus) => {
        setEvents((prev) =>
            prev.map((eventItem) => (eventItem.id === eventId ? { ...eventItem, status } : eventItem)),
        );
    }, []);

    const setEventAccessLevel = useCallback((eventId: string, level: 1 | 2) => {
        setEvents((prev) =>
            prev.map((eventItem) =>
                eventItem.id === eventId ? { ...eventItem, accessLevel: level } : eventItem,
            ),
        );
    }, []);

    const addPhotosToEvent = useCallback((eventId: string, count: number) => {
        if (count <= 0) {
            return;
        }
        setEvents((prev) =>
            prev.map((eventItem) => {
                if (eventItem.id !== eventId) {
                    return eventItem;
                }
                const maxId = eventItem.photos.reduce((max, photo) => Math.max(max, photo.id), 0);
                const nextSeed = maxId + 1;
                const freshPhotos = createPhotos(nextSeed, count);
                return {
                    ...eventItem,
                    photos: [...eventItem.photos, ...freshPhotos],
                };
            }),
        );
    }, []);

    const upsertGuestCollection = useCallback(
        (
            eventId: string,
            guestName: string,
            photoIds: number[],
            options?: { merge?: boolean; updateSearchedAt?: boolean },
        ) => {
            setEvents((prev) =>
                prev.map((eventItem) => {
                    if (eventItem.id !== eventId) {
                        return eventItem;
                    }
                    const mergedGuests = [...eventItem.guests];
                    const targetIdx = mergedGuests.findIndex(
                        (guest) => guest.name.toLowerCase() === guestName.toLowerCase(),
                    );

                    const nextGuest: EventGuest =
                        targetIdx >= 0
                            ? {
                                  ...mergedGuests[targetIdx],
                                  collectionPhotoIds: options?.merge
                                      ? Array.from(
                                            new Set([
                                                ...mergedGuests[targetIdx].collectionPhotoIds,
                                                ...photoIds,
                                            ]),
                                        )
                                      : photoIds,
                                  accessedAt: nowIso(),
                                  lastSearchedAt: options?.updateSearchedAt
                                      ? nowIso()
                                      : mergedGuests[targetIdx].lastSearchedAt,
                              }
                            : {
                                  name: guestName,
                                  accessedAt: nowIso(),
                                  collectionPhotoIds: photoIds,
                                  lastSearchedAt: options?.updateSearchedAt ? nowIso() : null,
                                    matchingUploads: [],
                              };

                    if (targetIdx >= 0) {
                        mergedGuests[targetIdx] = nextGuest;
                    } else {
                        mergedGuests.push(nextGuest);
                    }

                    return {
                        ...eventItem,
                        guests: mergedGuests,
                    };
                }),
            );
        },
        [],
    );

    const setGuestMatchingUploads = useCallback(
        (eventId: string, guestName: string, uploads: MatchingUpload[]) => {
            setEvents((prev) =>
                prev.map((eventItem) => {
                    if (eventItem.id !== eventId) {
                        return eventItem;
                    }

                    const idx = eventItem.guests.findIndex(
                        (guest) => guest.name.toLowerCase() === guestName.toLowerCase(),
                    );

                    if (idx < 0) {
                        return {
                            ...eventItem,
                            guests: [
                                ...eventItem.guests,
                                {
                                    name: guestName,
                                    accessedAt: nowIso(),
                                    collectionPhotoIds: [],
                                    lastSearchedAt: nowIso(),
                                    matchingUploads: uploads,
                                },
                            ],
                        };
                    }

                    return {
                        ...eventItem,
                        guests: eventItem.guests.map((guest, guestIdx) =>
                            guestIdx === idx
                                ? {
                                      ...guest,
                                      accessedAt: nowIso(),
                                      matchingUploads: uploads,
                                  }
                                : guest,
                        ),
                    };
                }),
            );
        },
        [],
    );

    const removeGuestCollectionPhotos = useCallback(
        (eventId: string, guestName: string, photoIds: number[]) => {
            if (!photoIds.length) {
                return;
            }
            setEvents((prev) =>
                prev.map((eventItem) => {
                    if (eventItem.id !== eventId) {
                        return eventItem;
                    }
                    return {
                        ...eventItem,
                        guests: eventItem.guests.map((guest) =>
                            guest.name.toLowerCase() === guestName.toLowerCase()
                                ? {
                                      ...guest,
                                      collectionPhotoIds: guest.collectionPhotoIds.filter(
                                          (id) => !photoIds.includes(id),
                                      ),
                                  }
                                : guest,
                        ),
                    };
                }),
            );
        },
        [],
    );

    const getMyEvents = useCallback(() => {
        if (!currentUser) {
            return [];
        }
        return events.filter((eventItem) => eventItem.photographerId === currentUser.id);
    }, [currentUser, events]);

    const getSharedEvents = useCallback(() => {
        if (!currentUser) {
            return [];
        }
        return events.filter((eventItem) => eventItem.sharedWithUserIds.includes(currentUser.id));
    }, [currentUser, events]);

    const value = useMemo<AppContextValue>(
        () => ({
            users,
            events,
            currentUser,
            login,
            signup,
            logout,
            createEvent,
            deleteEvent,
            updateEventMeta,
            setEventStatus,
            setEventAccessLevel,
            addPhotosToEvent,
            upsertGuestCollection,
            setGuestMatchingUploads,
            removeGuestCollectionPhotos,
            getMyEvents,
            getSharedEvents,
        }),
        [
            users,
            events,
            currentUser,
            login,
            signup,
            logout,
            createEvent,
            deleteEvent,
            updateEventMeta,
            setEventStatus,
            setEventAccessLevel,
            addPhotosToEvent,
            upsertGuestCollection,
            setGuestMatchingUploads,
            removeGuestCollectionPhotos,
            getMyEvents,
            getSharedEvents,
        ],
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used inside AppProvider");
    }
    return context;
}
