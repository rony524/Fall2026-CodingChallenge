import { useEffect, useRef, useState} from "react";
import { getNotifications, readNotifications, type NotificationItems} from "../api/notifications.ts";
import "./NotificationBell.css";

interface NotificationBellProps {
    isSignedIn: boolean;
}
    const PAGE_SIZE = 4;

    function timeago(iso:string): string {
        const minute = Math.floor((Date.now() - new Date(iso).getTime())/ 60000);
        if (minute < 1) return "just now";
        if (minute < 60) return `${minute}m ago`;
        const hour = Math.floor(minute/ 60);
        if (hour < 24) return `${hour}h ago`;
        const day = Math.floor(hour/24);
        return `${day}d ago`;

    }

    export function NotificationBell({isSignedIn} : NotificationBellProps) {
        const [isOpen,setIsOpen] = useState(false);
        const [notificationItems, setNotificationItems] = useState<NotificationItems[]>([]);
        const [hasMore, setHasMore] = useState(false);
        const [isLoadingMore, setIsLoadingMore] = useState(false);
        const [isLoading, setIsLoading] = useState(false);
        const [error, setError] = useState< string | null>(null);
        const containerRef = useRef<HTMLDivElement>(null);

        const unread = notificationItems.filter((n) => !n.is_read).length;
    

        // to set the notifications
    useEffect(() => {
        
        if(!isSignedIn) {
            setNotificationItems([]);
            setError(null);
            return ;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        getNotifications({limit: PAGE_SIZE, offset: 0}).then((page)=> {
            if ( cancelled) return;
            setNotificationItems(page.items);
            setHasMore(Boolean(page.has_more));
        }).catch((err) => {
            if(!cancelled) setError(err instanceof Error ? err.message : "Failed to load Notifications")
        }).finally(() => {
            if (!cancelled) setIsLoading(false);
        });

        return () => {
            cancelled = true;
        };      
    }, [isSignedIn]);


// to close the modal when mouse clicks anywhere else
    useEffect(() => {
    if(!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);


    }
    }, [isOpen])

    async function handleLoadMore() {
        setIsLoadingMore(true);

        try{
            const page = await getNotifications({limit: PAGE_SIZE, offset: notificationItems.length})
            setNotificationItems((prev) => [...prev, ... page.items]);
            setHasMore(Boolean(page.has_more));
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to load more notifications");
        }finally{
            setIsLoadingMore(false);
        };
    }

    async function handleItemClick(item: NotificationItems) {
        if (!item.is_read) return;

        setNotificationItems((prev) => (
                prev.map((n) => (n.notification_id == item.notification_id) ? {...n, is_read: true}: n)
        ));
        
            
        try {
            await readNotifications(Number(item.notification_id));
        } catch {
            setNotificationItems((prev) =>
        prev.map((n) => (n.notification_id === item.notification_id ? { ...n, is_read: false } : n)));
        }
    
    }

    return(
        <>
            <div className="notif-wrap" ref={containerRef}>
                <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Notifications"
            >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      
      <div className={`notif-popover ${isOpen ? "is-open" : ""}`} role="menu">
        <div className="notif-popover-header">Notifications</div>

        {!isSignedIn ? (
          <p className="notif-popover-empty">Log in to see your notifications.</p>
        ) : isLoading ? (
          <p className="notif-popover-empty">Loading…</p>
        ) : error ? (
          <p className="notif-popover-empty">{error}</p>
        ) : notificationItems.length === 0 ? (
          <p className="notif-popover-empty">You're all caught up.</p>
        ) : (
          <>
            <div className="notif-popover-list">
              {notificationItems.map((item) => (
                <button
                  key={item.notification_id}
                  type="button"
                  className={`notif-item ${item.is_read ? "" : "is-unread"}`}
                  onClick={() => handleItemClick(item)}
                >
                  <p>{item.message}</p>
                  <span className="notif-item-time">{timeago(item.created_at)}</span>
                </button>
              ))}
            </div>

            {hasMore && (
              <button type="button" className="notif-load-more" onClick={handleLoadMore} disabled={isLoadingMore}>
                {isLoadingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

    