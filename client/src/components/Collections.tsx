/**
 * The "Collections" view: a grid of cards, one per collection the user owns or has been
 * invited to. Clicking a card opens CollectionModal for it.
 *
 * Which card is open is this component's own state (`openId`). The modal is looked up
 * from the `collections` prop by id, so if the list changes underneath it (say the user
 * leaves the collection, or logs out) the modal disappears instead of showing stale data.
 */
import { useState } from "react";
import type { CollectionItem, ImageItem } from "../types";
import { CollectionModal } from "./CollectionModal";
import "./Collections.css";

interface CollectionsProps {
    collections: CollectionItem[];
    isSignedIn: boolean;
    // Lets the modal mark the current user's row ("you") and offer "Leave"
    currentUserId: number | null;
    // Photos the user can pick from when adding to a collection (the loaded feed).
    availableImages: ImageItem[];
    // Called after something inside a modal changes (photo added/removed, left a collection)
    // so the cards' counts and covers can be refreshed.
    onCollectionChanged: () => void;
}

// Display names for the roles (the data uses the lowercase ids)
const ROLE_LABEL = { owner: "Owner", editor: "Editor", viewer: "Viewer" } as const;

export function Collections({
    collections,
    isSignedIn,
    currentUserId,
    availableImages,
    onCollectionChanged,
}: CollectionsProps) {
    // id of the collection whose modal is open, or null when none is
    const [openId, setOpenId] = useState<string | null>(null);
    const openCollection = collections.find((c) => c.id === openId);

    // Empty states. Both come after the hook above, since hooks can't be called conditionally.
    if (!isSignedIn) {
        return <p className="collections-empty">Log in to see your collections.</p>;
    }

    if (collections.length === 0) {
        return (
            <p className="collections-empty">
                You don't have any collections yet. Open the menu and choose “New Collection” to make one.
            </p>
        );
    }

    return (
        <>
            <div className="collections-grid">
                {collections.map((collection) => (
                    <button
                        key={collection.id}
                        type="button"
                        className="collection-card"
                        onClick={() => setOpenId(collection.id)}
                    >
                        <div className="collection-card-cover">
                            {/* Cover = the newest photo. Empty collections get a placeholder icon. */}
                            {collection.coverSrc ? (
                                <img src={collection.coverSrc} alt="" loading="lazy" />
                            ) : (
                                <span className="collection-card-placeholder" aria-hidden="true">
                                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="7" width="14" height="12" rx="2" />
                                        <path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                                        <circle cx="8.5" cy="11.5" r="1.3" />
                                        <path d="M17 17l-3.5-3.5a1.5 1.5 0 0 0-2.1 0L7 18" />
                                    </svg>
                                </span>
                            )}
                            {/* Badge only on collections someone else shared with you */}
                            {collection.myRole !== "owner" && (
                                <span className="collection-card-badge">Shared · {ROLE_LABEL[collection.myRole]}</span>
                            )}
                        </div>
                        <div className="collection-card-info">
                            <span className="collection-card-name">{collection.name}</span>
                            <span className="collection-card-meta">
                                {collection.imageCount} {collection.imageCount === 1 ? "photo" : "photos"}
                                {" · "}
                                {collection.isPublic ? "Public" : "Private"}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* key={id} makes React start with fresh state (and reload the photos and people)
                for each collection instead of reusing one modal instance between them. */}
            {openCollection && (
                <CollectionModal
                    key={openCollection.id}
                    collection={openCollection}
                    currentUserId={currentUserId}
                    availableImages={availableImages}
                    onClose={() => setOpenId(null)}
                    onChanged={onCollectionChanged}
                />
            )}
        </>
    );
}
