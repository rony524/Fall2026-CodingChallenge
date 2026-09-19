export interface NotificationItems {
    is_read: boolean;
    notification_id: string;
    message: string;
    created_at: string
}

export interface NotificationPages {
    items: NotificationItems[];
    has_more: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

interface GetNotificationOptions {
    limit?: number;
    offset?: number;
}

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

export async function readNotifications( id:number ): Promise<void> {
    
    const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include"
    })

    if(!res.ok) {
        throw new Error(`Failed to update notifications ${res.status}`);
    }
}