export type CollectionRole = "owner" | "editor" | "viewer";
export type CollaboratorRole = Exclude<CollectionRole, "owner">;

export interface CollectionRecords {
    name: string;
    collection_id: number;
    description: string | null;
    is_public: boolean;
    owner_id: number;
    created_at: string;
    // Only returned by the list endpoint (not by create):
    my_role?: CollectionRole;
    image_count?: number;
    cover_url?: string | null;
}

export interface CollectionImages {
    image_id: number;
    url: string;
    user_id: number;
    caption: string;
}

export interface Collaborator {
    user_id: number;
    username: string;
    firstname: string | null;
    lastname: string | null;
    role: CollectionRole;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function handleJSON<T>( res: Response, fallbackMessage: string): Promise<T> {
    if(!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `${fallbackMessage} (${res.status})`)
    }

    return res.json();
}

// For endpoints that answer with no body (204) or a body we don't need.
async function handleVoid( res: Response, fallbackMessage: string): Promise<void> {
    if(!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? `${fallbackMessage} (${res.status})`)
    }
}

const JSON_HEADERS = { "Content-Type": "application/json" };

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
        headers: JSON_HEADERS,
        body: JSON.stringify(input)
    });

    return handleJSON(res, "Failed to create collection");
}

export async function addImageToCollection( collection_id: number, image_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images`, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ imageId: image_id })
    });
    return handleVoid(res, "Failed to add photo");
}

export async function removeImageFromCollection( collection_id: number, image_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images/${image_id}`, {
        method: "DELETE",
        credentials: "include"
    });
    return handleVoid(res, "Failed to remove photo");
}

export async function getCollaborators( collection_id: number): Promise<Collaborator[]> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators`, {credentials: "include"});
    return handleJSON(res, "Failed to load collaborators");
}

export async function addCollaborators( collection_id: number, username: string, role: CollaboratorRole = "editor"):Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({username, role})
    });
    return handleVoid(res, "Failed to add collaborator");
}

export async function updateCollaboratorRole( collection_id: number, user_id: number, role: CollaboratorRole): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators/${user_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ role })
    });
    return handleVoid(res, "Failed to change role");
}

export async function removeCollaborator( collection_id: number, user_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators/${user_id}`, {
        method: "DELETE",
        credentials: "include"
    });
    return handleVoid(res, "Failed to remove collaborator");
}
