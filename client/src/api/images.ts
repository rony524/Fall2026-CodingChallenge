
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
        throw new Error(`Failes to load images (${res.status})`)
    }

    return res.json();
}