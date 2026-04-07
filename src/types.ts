export type EventType = "Wedding" | "Corporate" | "Concert" | "Other";

export type EventStatus = "Uploading" | "Indexing" | "Ready";

export type AccessLevel = 1 | 2;

export type AppRole = "photographer" | "guest";

export interface AppUser {
    id: string;
    name: string;
    email: string;
    password: string;
    role: AppRole;
}

export interface Photo {
    id: number;
    url: string;
}

export interface MatchingUpload {
    id: number;
    url: string;
    uploadedAt: string;
}

export interface EventGuest {
    name: string;
    accessedAt: string;
    collectionPhotoIds: number[];
    lastSearchedAt: string | null;
    matchingUploads: MatchingUpload[];
}

export interface EventData {
    id: string;
    name: string;
    date: string;
    type: EventType;
    status: EventStatus;
    accessLevel: AccessLevel;
    photographerId: string;
    sharedWithUserIds: string[];
    expiryDate: string;
    photos: Photo[];
    guests: EventGuest[];
}
