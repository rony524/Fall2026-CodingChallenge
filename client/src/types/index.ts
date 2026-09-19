

export interface ImageItem {
  id: string;
  src: string;
  caption: string;
  owner: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  coverSrc?: string;
  imageCount: number;
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
