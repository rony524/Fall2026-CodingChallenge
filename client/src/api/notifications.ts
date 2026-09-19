/**
 * Client for the /api/notifications routes, used by the bell in the navbar.
 * Notifications are loaded a few at a time (paged) so the popover stays short.
 */

export interface NotificationItems {
    is_read: boolean;
    notification_id: string;
    message: string;
    created_at: string
}

// One page of results. `has_more` says whether more notifications exist after this page,
// which is what decides whether the popover shows a "Load more" button.
export interface NotificationPages {
    items: NotificationItems[];
    has_more: boolean;
}

// Where the API lives. Set VITE_API_URL (e.g. in client/.env) if it isn't on localhost:3000.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface GetNotificationOptions {
    limit?: number;
    offset?: number;
}

// Loads `limit` notifications (newest first), skipping the first `offset`.
// To fetch the next page, pass offset = the number already loaded.
export async function getNotifications({
        limit = 4,
        offset = 0
    }:GetNotificationOptions = {}): Promise<NotificationPages> {
    const res = await fetch(`${API_BASE}/api/notifications?limit=${limit}&offset=${offset}`, {credentials: "include"});

     if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Failed to load notifications (${res.status})`);
  }

    return res.json();
}

// Marks one notification as read. The method must be upper-case "PATCH": browsers only
// normalise GET/POST/PUT/DELETE/HEAD/OPTIONS, so "Patch" would be sent as-is and rejected.
export async function readNotifications( id:number ): Promise<void> {

    const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include"
    })

    if(!res.ok) {
        throw new Error(`Failed to update notifications ${res.status}`);
    }
}
