const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function request<T>(url: string, opts: RequestInit = {}): Promise<T> {
    const accessToken = localStorage.getItem("spotme.accessToken");
    const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    if (!(opts.body instanceof FormData)) headers["Content-Type"] = "application/json";

    const res = await fetch(`${BASE}${url}`, { ...opts, headers, credentials: "include" });

    if (res.status === 452) {
        const refreshed = await refreshTokens();
        if (refreshed) {
            headers["Authorization"] = `Bearer ${localStorage.getItem("spotme.accessToken")}`;
            const retry = await fetch(`${BASE}${url}`, { ...opts, headers, credentials: "include" });
            if (!retry.ok) { const err = await retry.json().catch(() => ({ message: "Request failed" })); throw new Error(err.message); }
            return retry.json() as Promise<T>;
        }
        localStorage.removeItem("spotme.accessToken"); localStorage.removeItem("spotme.refreshToken"); localStorage.removeItem("spotme.user");
        window.location.href = "/login"; throw new Error("Session expired");
    }
    if (res.headers.get("content-type")?.includes("application/zip")) return res as unknown as T;
    if (!res.ok) { const err = await res.json().catch(() => ({ message: "Request failed" })); throw new Error(err.message); }
    return res.json() as Promise<T>;
}

interface ApiRes<T> { statusCode: number; data: T; message: string; }

// ─── AUTH ───
export async function sendVerificationCode(email: string) {
    return request<ApiRes<{ emailSent: boolean }>>("/user/send-verification-code", { method: "POST", body: JSON.stringify({ email }) });
}
export async function verifyEmailApi(email: string, code: string) {
    return request<ApiRes<Record<string, unknown>>>("/user/verify-email", { method: "POST", body: JSON.stringify({ email, code }) });
}
export async function register(data: { fullname: string; username: string; email: string; password: string }) {
    const res = await request<ApiRes<UserData>>("/user/register", { method: "POST", body: JSON.stringify(data) });
    storeSession(res.data); return res;
}
export async function login(data: { email?: string; username?: string; password: string }) {
    const res = await request<ApiRes<UserData>>("/user/login", { method: "POST", body: JSON.stringify(data) });
    storeSession(res.data); return res;
}
export async function logout() {
    try { await request<ApiRes<object>>("/user/logout", { method: "GET" }); } finally {
        localStorage.removeItem("spotme.accessToken"); localStorage.removeItem("spotme.refreshToken"); localStorage.removeItem("spotme.user");
    }
}
export async function refreshTokens(): Promise<boolean> {
    try {
        const rt = localStorage.getItem("spotme.refreshToken"); if (!rt) return false;
        const res = await fetch(`${BASE}/user/refresh-auth-tokens`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${rt}` }, credentials: "include" });
        if (!res.ok) return false;
        const json = (await res.json()) as ApiRes<{ accessToken: string; refreshToken: string }>;
        localStorage.setItem("spotme.accessToken", json.data.accessToken);
        if (json.data.refreshToken) localStorage.setItem("spotme.refreshToken", json.data.refreshToken);
        return true;
    } catch { return false; }
}
export async function getCurrentUser() { return request<ApiRes<UserData>>("/user/current", { method: "GET" }); }
export async function sendResetCode(email: string) {
    return request<ApiRes<{ emailSent: boolean }>>("/user/send-reset-code", { method: "POST", body: JSON.stringify({ email }) });
}
export async function resetPassword(email: string, code: string, password: string) {
    return request<ApiRes<{ reset: boolean }>>("/user/reset-password", { method: "PATCH", body: JSON.stringify({ email, code, password }) });
}

// ─── EVENTS ───
export async function createEvent(data: { name: string; eventDate: string; accessLevel?: string }) {
    return request<ApiRes<EventData>>("/event/create", { method: "POST", body: JSON.stringify(data) });
}
export async function getAllCreatedEvents() { return request<ApiRes<EventData[]>>("/event/created/list", { method: "GET" }); }
export async function getAllSharedEvents() { return request<ApiRes<EventData[]>>("/event/shared/list", { method: "GET" }); }
export async function getEventDetails(eventId: string) { return request<ApiRes<EventData>>(`/event/details/${eventId}`, { method: "GET" }); }
export async function editEvent(eventId: string, data: { name?: string; eventDate?: string; accessLevel?: string; photoId?: string }) {
    return request<ApiRes<EventData>>(`/event/edit/${eventId}`, { method: "PATCH", body: JSON.stringify(data) });
}
export async function deleteEventApi(eventId: string) { return request<ApiRes<null>>(`/event/delete/${eventId}`, { method: "DELETE" }); }
export async function getEventPhotos(eventId: string, page = 0, limit = 20) {
    return request<ApiRes<PhotoData[]>>(`/event/all-photos/${eventId}?page=${page}&limit=${limit}`, { method: "GET" });
}
export async function getEventGuests(eventId: string) { return request<ApiRes<GuestData[]>>(`/event/all-guests/${eventId}`, { method: "GET" }); }
export async function enqueueBatch(eventId: string, urls: string[]) {
    return request<ApiRes<null>>(`/event/enqueue-batch/${eventId}`, { method: "POST", body: JSON.stringify({ urls }) });
}

// ─── PHOTOS ───
export async function getSignedUrlForEvent(eventId: string) {
    return request<ApiRes<{ url: string; fields: Record<string, string> }>>(`/photo/signed-url/event/${eventId}`, { method: "GET" });
}
export async function getSignedUrlForSelfie(eventId: string, fileCount: number) {
    return request<ApiRes<{ urls: string[] }>>(`/photo/signed-url/selfie?eventId=${eventId}&fileCount=${fileCount}`, { method: "GET" });
}
export async function createSelfie(eventId: string, urls: string[]) {
    return request<ApiRes<{ photos: PhotoData[]; collection: CollectionData }>>(`/photo/create/selfie/${eventId}`, { method: "POST", body: JSON.stringify({ urls }) });
}
export async function downloadAllEvent(eventId: string) {
    const t = localStorage.getItem("spotme.accessToken");
    return fetch(`${BASE}/photo/download/all/event/${eventId}`, { method: "GET", headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: "include" });
}
export async function downloadAllCollection(collectionId: string, eventId: string) {
    const t = localStorage.getItem("spotme.accessToken");
    return fetch(`${BASE}/photo/download/all/collection/${collectionId}/${eventId}`, { method: "GET", headers: t ? { Authorization: `Bearer ${t}` } : {}, credentials: "include" });
}
export async function downloadSelected(eventId: string, fileNames: string[]) {
    const t = localStorage.getItem("spotme.accessToken");
    return fetch(`${BASE}/photo/download/selected/${eventId}`, { method: "POST", headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, credentials: "include", body: JSON.stringify({ fileNames }) });
}
export async function deletePhotos(eventId: string, fileNames: string[], photoIds: string[]) {
    return request<ApiRes<{ deletedCount: number }>>(`/photo/delete/event/${eventId}`, { method: "DELETE", body: JSON.stringify({ fileNames, photoIds }) });
}
export async function deleteSelfies(collectionId: string, fileNames: string[], photoIds: string[]) {
    return request<ApiRes<{ deletedCount: number }>>(`/photo/delete/selfie/${collectionId}`, { method: "DELETE", body: JSON.stringify({ fileNames, photoIds }) });
}

// ─── COLLECTIONS ───
export async function findMatch(eventId: string, selfiePhotoIds: string[], collectionId: string) {
    return request<ApiRes<PhotoData[]>>(`/collection/find/${eventId}`, { method: "POST", body: JSON.stringify({ selfiePhotoIds, collectionId }) });
}
export async function removePhotoFromCollection(collectionId: string, photoIds: string[]) {
    return request<ApiRes<null>>(`/collection/photo/remove/${collectionId}`, { method: "DELETE", body: JSON.stringify({ photoIds }) });
}
export async function addPhotoToCollection(collectionId: string, photoIds: string[], eventId: string) {
    return request<ApiRes<null>>(`/collection/photo/add/${collectionId}`, { method: "POST", body: JSON.stringify({ photoIds, eventId }) });
}
export async function getCollectionPhotos(collectionId: string, page = 0, limit = 20) {
    return request<ApiRes<CollectionData[]>>(`/collection/all-photos/${collectionId}?page=${page}&limit=${limit}`, { method: "GET" });
}
export async function getCollectionSelfies(collectionId: string) {
    return request<ApiRes<CollectionData[]>>(`/collection/all-selfies/${collectionId}`, { method: "GET" });
}
export async function getMyCollectionByEvent(eventId: string) {
    return request<ApiRes<CollectionData | null>>(`/collection/my/${eventId}`, { method: "GET" });
}
export async function getGuestCollectionByEvent(eventId: string, userId: string) {
    return request<ApiRes<CollectionData | null>>(`/collection/event/${eventId}/user/${userId}`, { method: "GET" });
}

// ─── S3 Upload helpers ───
export async function uploadFileToS3(url: string, fields: Record<string, string>, file: File): Promise<string> {
    const formData = new FormData();
    const key = fields["key"].replace("${filename}", file.name);
    const fieldsWithKey = { ...fields, key };
    for (const [k, v] of Object.entries(fieldsWithKey)) formData.append(k, v);
    formData.append("file", file);
    const res = await fetch(url, { method: "POST", body: formData });
    if (!res.ok && res.status !== 204) throw new Error(`S3 upload failed: ${file.name}`);
    return `${url}${key}`;
}

export async function uploadEventPhotos(eventId: string, files: File[], onProgress?: (uploaded: number, total: number, phase: string) => void) {
    const BATCH_SIZE = 5;
    let uploaded = 0;
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        const { data } = await getSignedUrlForEvent(eventId);
        const results = await Promise.allSettled(batch.map((f) => uploadFileToS3(data.url, data.fields, f)));
        const urls: string[] = [];
        for (const r of results) { if (r.status === "fulfilled") { urls.push(r.value); } uploaded++; }
        onProgress?.(uploaded, files.length, "uploading");
        if (urls.length > 0) await enqueueBatch(eventId, urls);
    }
    onProgress?.(files.length, files.length, "done");
}

export async function uploadSelfieToS3(signedUrl: string, file: File): Promise<string> {
    await fetch(signedUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type || "image/jpeg" } });
    return signedUrl.split("?")[0];
}

// ─── Types ───
export interface UserData { _id: string; fullname?: string; username?: string; email: string; isVerified?: boolean; accessToken?: string; refreshToken?: string; }
export interface EventData { _id: string; name: string; eventDate: string; userId: string; coverImage: string | null; accessLevel: "spot" | "browse"; sharableLink: string; expiresAt: string; status: "empty" | "processing" | "expired"; }
export interface PhotoData { _id: string; eventId: string; url: string; type: "selfie" | "event"; createdAt?: string; updatedAt?: string; }
export interface GuestData { _id: string; userId: string; eventId: string; accessedAt: string; }
export interface CollectionData { _id: string; userId: string; eventId: string; selfies: PhotoData[] | string[]; myPhotos: PhotoData[] | string[]; }

function storeSession(data: UserData) {
    if (data.accessToken) localStorage.setItem("spotme.accessToken", data.accessToken);
    if (data.refreshToken) localStorage.setItem("spotme.refreshToken", data.refreshToken);
    const u = { ...data }; delete u.accessToken; delete u.refreshToken;
    localStorage.setItem("spotme.user", JSON.stringify(u));
}
export function getStoredUser(): UserData | null {
    const raw = localStorage.getItem("spotme.user"); if (!raw) return null;
    try { return JSON.parse(raw) as UserData; } catch { return null; }
}
export async function triggerDownload(response: Response, filename: string) {
    const blob = await response.blob(); const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
}
