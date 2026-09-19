/**
 * Client for the /api/collections routes: collections, the photos in them, and their
 * collaborators. Which of these a user may call depends on their role in the collection
 * (owner / editor / viewer); the server enforces that and answers 403 otherwise.
 *
 * Every request sends the session cookie (`credentials: "include"`). On failure the
 * functions throw an Error carrying the server's message, ready to show in the UI.
 */

// "owner" created the collection; "editor" and "viewer" are collaborator roles.
export type CollectionRole = "owner" | "editor" | "viewer";
// The roles you can hand out (there's exactly one owner, and it can't be reassigned)
export type CollaboratorRole = Exclude<CollectionRole, "owner">;

// A collection as the API returns it
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

// A photo inside a collection
export interface CollectionImages {
    image_id: number;
    url: string;
    user_id: number;
    caption: string;
}

// One person with access to a collection. The owner is included, with role "owner".
export interface Collaborator {
    user_id: number;
    username: string;
    firstname: string | null;
    lastname: string | null;
    role: CollectionRole;
}

// Where the API lives. Set VITE_API_URL (e.g. in client/.env) if it isn't on localhost:3000.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// Turns a fetch Response into parsed JSON, or throws using the server's error message.
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

// Every collection the logged-in user owns or collaborates on (with my_role, image_count, cover_url).
export async function getCollections(): Promise<CollectionRecords[]> {
    const res = await fetch(`${API_BASE}/api/collections`, {credentials: "include"});
    return handleJSON(res, "Failed to load collections");
}

// The photos in a collection, newest-added first.
export async function getCollectionImage(collection_id: number): Promise<CollectionImages[]> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images`, {credentials: "include"});
    return handleJSON(res, "Failed to load collection images");
}

// Creates a collection owned by the logged-in user.
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

// Puts an existing photo into a collection (owner or editor only).
export async function addImageToCollection( collection_id: number, image_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images`, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ imageId: image_id })
    });
    return handleVoid(res, "Failed to add photo");
}

// Takes a photo out of a collection (owner or editor only). The photo itself isn't deleted.
export async function removeImageFromCollection( collection_id: number, image_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/images/${image_id}`, {
        method: "DELETE",
        credentials: "include"
    });
    return handleVoid(res, "Failed to remove photo");
}

// Everyone with access to the collection, owner first. Only members may ask.
export async function getCollaborators( collection_id: number): Promise<Collaborator[]> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators`, {credentials: "include"});
    return handleJSON(res, "Failed to load collaborators");
}

// Invites someone by username (owner only). Rejects with the server's message if the
// username doesn't exist. Inviting an existing collaborator just changes their role.
export async function addCollaborators( collection_id: number, username: string, role: CollaboratorRole = "editor"):Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators`, {
        method: "POST",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({username, role})
    });
    return handleVoid(res, "Failed to add collaborator");
}

// Changes a collaborator's role (owner only).
export async function updateCollaboratorRole( collection_id: number, user_id: number, role: CollaboratorRole): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators/${user_id}`, {
        method: "PATCH",
        credentials: "include",
        headers: JSON_HEADERS,
        body: JSON.stringify({ role })
    });
    return handleVoid(res, "Failed to change role");
}

// Removes a collaborator. The owner can remove anyone; a collaborator can remove
// themselves (that's how "Leave" works).
export async function removeCollaborator( collection_id: number, user_id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/api/collections/${collection_id}/collaborators/${user_id}`, {
        method: "DELETE",
        credentials: "include"
    });
    return handleVoid(res, "Failed to remove collaborator");
}
