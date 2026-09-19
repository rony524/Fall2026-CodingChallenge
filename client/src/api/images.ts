
export interface ImageRecord {
    id: string,
    url: string,
    caption: string,
    owner_id: string,
    created_at: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getImages(): Promise<ImageRecord[]> {

    const res = await fetch(`${API_BASE}/api/images`)

    if(!res.ok) {
        throw new Error(`Failed to load images (${res.status})`)
    }

    return res.json();

}
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