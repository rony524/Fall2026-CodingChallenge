

export interface ImageItem {
  id: string;
  src: string;
  caption: string;
  owner: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string | null;
  coverSrc?: string;
  imageCount: number;
  isPublic: boolean;
  // The signed-in user's role in this collection — decides what the modal lets them do.
  myRole: "owner" | "editor" | "viewer";
}

export interface FriendItem {
  id: string;
  name: string;
  avatarSrc?: string;
  recentSrc: string;
}

export interface CurrentUser {
  name: string;
  avatarUrl?: string;
  interests: string[]; 
}
