interface CollectionRecords {
    name: string;
    collection_id: number;
    description: string | null;
    is_public: boolean;
    created_at: string;
}

interface CollectionImages {
    image_id: number;
    url: string;
    user_id: number;
    caption: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function handleJSON<T>( res: Response, fallbackMessage: string): Promise<T> {
    if(!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `${fallbackMessage} (${res.status})`)
    }

    return res.json();
}

export async function getCollections(): Promise<CollectionRecords[]> {
    const res = await fetch(`${API_BASE}/api/collections`, {credentials: "include"});
    return handleJSON(res, "Failed to load collections");
}

export async function getCollectionImage(collection_id: number): Promise<CollectionImages[]> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images`, {credentials: "include"});
    return handleJSON(res, "Failed to load collection images");
}

export async function createCollection( input: {
    name: string,
    description?: string,
    isPublic: boolean
}): Promise<CollectionRecords> {
    const res = await fetch(`${API_BASE}/api/collections`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(input)
    });

    return handleJSON(res, "Failed to create collection");
}

export async function removeImageFromCollection( collection_id: number, image_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images/${image_id}`, {
        method: "DELETE",
        credentials: "include"
    });
    if (!res.ok) throw new Error(`Failed to delete Image (${res.status})`);
}

export async function addCollaborators( collection_id: number, username: string, role: "editor" | "viewer" = "editor"):Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({username, role})
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ??
        `Failed to add collaborators (${res.status})`);
    }
}
