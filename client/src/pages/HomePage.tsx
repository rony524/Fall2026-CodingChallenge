import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { AccordionHero } from "../components/AccordionHero";
import { SearchBar, type SearchFilters } from "../components/SearchBar";
import { ViewTabs, type ViewOption } from "../components/ViewTabs";
import { Feed } from "../components/Feed";
import { Collections } from "../components/Collections";
import { FriendsView } from "../components/FriendsView";
import { login, logout, currentUser, type AuthUser } from "../api/auth";
import { getImages } from "../api/images";

import heroImage from "../assets/heroImage.jpg";

// Assumes collections.ts gets the getCollection -> getCollections fix
// described in chat (rename + return type CollectionRecords[]). Using the
// current singular/mis-typed version here would need an ugly cast.
import { getCollections, createCollection } from "../api/collections";
import type { ImageItem, CollectionItem, FriendItem } from "../types";
import "./HomePage.css";

// Friends has no backend route yet — left as mock data until one exists.
const MOCK_FRIENDS: FriendItem[] = [
  { id: "f1", name: "mara", recentSrc: "/mock/photo-1.jpg" },
  { id: "f2", name: "devon", recentSrc: "/mock/photo-2.jpg" },
  { id: "f3", name: "imani", recentSrc: "/mock/photo-4.jpg" },
  { id: "f4", name: "sana", recentSrc: "/mock/photo-6.jpg" },
];

export function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<ViewOption>("discover");
  const [allImages, setAllImages] = useState<ImageItem[]>([]); // everything fetched, unfiltered
  const [images, setImages] = useState<ImageItem[]>([]); // what's actually shown (post-search)
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Restore an existing session on load (e.g. page refresh) instead of
  // always starting signed out. currentUser() resolves to null on a 401
  // rather than throwing, so no try/catch needed here.
  useEffect(() => {
    async function restoreSession() {
      const existingUser = await currentUser();
      setUser(existingUser);
    }
    restoreSession();
  }, []);

  // getImages() returns ImageRecord[] — {id, url, caption, owner_id,
  // created_at} — which doesn't match what <Feed> expects (ImageItem:
  // {id, src, caption, owner}), so map between the two shapes here.
  useEffect(() => {
    async function loadFeed() {
      const records = await getImages();
      const mapped: ImageItem[] = records.map((r) => ({
        id: r.id,
        src: r.url,
        caption: r.caption,
        owner: r.owner_id,
      }));
      setAllImages(mapped);
      setImages(mapped);
    }
    loadFeed();
  }, []);

  // Collections only matter once someone's signed in.
  useEffect(() => {
    if (!user) {
      setCollections([]);
      return;
    }
    async function loadCollections() {
      const records = await getCollections();
      setCollections(
        records.map((r) => ({
          id: String(r.collection_id),
          name: r.name,
          imageCount: 0, 
        }))
      );
    }
    loadCollections();
  }, [user]);

  async function handleSignIn(username: string, password: string) {
    try {
      setLoginError(null);
      const signedInUser = await login(username, password);
      setUser(signedInUser);
    } catch (err) {
      setLoginError((err as Error).message);
    }
  }

  async function handleSignOut() {
    await logout(); // actually ends the session server-side, not just local state
    setUser(null);
  }

  // No search endpoint exists yet (api/images.ts only has getImages()), so
  // this filters what's already loaded client-side instead of fetching.
  function handleSearch(query: string, filters: SearchFilters) {
    const q = query.trim().toLowerCase();
    const matches = q ? allImages.filter((img) => img.caption.toLowerCase().includes(q)) : allImages;
    const sorted = filters.sortBy === "popular" ? [...matches].reverse() : matches;
    setImages(sorted);
    setActiveView("discover");
  }

  async function handleCreateCollection(input: { name: string; description?: string }) {
    const record = await createCollection({ ...input, isPublic: false });
    const newCollection: CollectionItem = {
      id: String(record.collection_id),
      name: record.name,
      imageCount: 0,
    };
    setCollections((prev) => [newCollection, ...prev]);
  }

  // Navbar expects { name, avatarUrl? }; AuthUser only has
  // firstname/lastname/username — derive a display name here.
  const navbarUser = user ? { name: user.firstname ?? user.username } : null;

  return (
    <div className="home-page">
      <Navbar
        user={navbarUser}
        onUploadClick={() => {}}
        onProfileClick={user ? handleSignOut : () => {}}
        onCreateCollections={handleCreateCollection}
      />

      {loginError && <p className="home-page-error">{loginError}</p>}

      <AccordionHero imageUrl= {heroImage} />

      <div className="home-page-controls">
        <SearchBar onSearch={handleSearch} />
        <ViewTabs active={activeView} onChange={setActiveView} />
      </div>

      <div className="home-page-content">
        {activeView === "discover" && <Feed images={images} />}
        {activeView === "collections" && <Collections collections={collections} />}
        {activeView === "friends" && <FriendsView friends={MOCK_FRIENDS} />}
      </div>
    </div>
  );
}
