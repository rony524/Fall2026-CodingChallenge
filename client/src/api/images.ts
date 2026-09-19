/**
 * Client for the /api/images routes: load the feed and upload a photo.
 * (A "photo" is a url + caption; the image itself is hosted somewhere else.)
 */

// A photo as the API returns it. The server sends `id` and `owner_id` as numbers even
// though they're typed as strings here; HomePage converts them with String() when it
// turns records into ImageItem objects.
export interface ImageRecord {
    id: string,
    url: string,
    caption: string,
    owner_id: string,
    created_at: string
}

// Where the API lives. Set VITE_API_URL (e.g. in client/.env) if it isn't on localhost:3000.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// The public feed. No credentials needed: anyone can browse photos without logging in.
export async function getImages(): Promise<ImageRecord[]> {

    const res = await fetch(`${API_BASE}/api/images`)

    if(!res.ok) {
        throw new Error(`Failed to load images (${res.status})`)
    }

    return res.json();

}

// Adds a photo owned by the logged-in user (the session cookie says who that is).
export async function createImage(input: { url: string; caption: string }): Promise<ImageRecord> {
    const res = await fetch(`${API_BASE}/api/images`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `Failed to upload image (${res.status})`);
    }

    return res.json();
}
