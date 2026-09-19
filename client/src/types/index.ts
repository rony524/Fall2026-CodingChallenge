/**
 * Shapes the UI components work with.
 *
 * These are deliberately separate from the raw JSON the API returns (the *Record and
 * Auth* types in src/api/*.ts). HomePage converts API records into these, so the
 * components don't depend on database column names.
 */

// One photo in the Discover feed
export interface ImageItem {
  id: string;
  src: string;       // image url
  caption: string;
  owner: string;     // id of the user who uploaded it (shown on the card)
}

// One card in the Collections view (also what the collection modal opens with)
export interface CollectionItem {
  id: string;
  name: string;
  description?: string | null;
  coverSrc?: string;     // newest photo in the collection; the card shows a placeholder without it
  imageCount: number;
  isPublic: boolean;
  // The signed-in user's role in this collection — decides what the modal lets them do.
  myRole: "owner" | "editor" | "viewer";
}

// One card in the Friends view. There is no friends backend yet, so HomePage feeds
// these from mock data.
export interface FriendItem {
  id: string;
  name: string;
  avatarSrc?: string;
  recentSrc: string;   // the friend's most recent photo
}

// Not used anywhere yet.
export interface CurrentUser {
  name: string;
  avatarUrl?: string;
  interests: string[];
}
