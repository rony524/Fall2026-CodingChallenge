import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { AccordionHero } from "../components/AccordionHero";
import { SearchBar, type SearchFilters } from "../components/SearchBar";
import { ViewTabs, type ViewOption } from "../components/ViewTabs";
import { Feed } from "../components/Feed";
import { Collections } from "../components/Collections";
import { FriendsView } from "../components/FriendsView";
import { login, logout, currentUser, type AuthUser } from "../api/auth";
import { getImages, createImage } from "../api/images.ts";


import heroImage from "../assets/heroImage.jpg";

// Assumes collections.ts gets the getCollection -> getCollections fix
// described in chat (rename + return type CollectionRecords[]). Using the
// current singular/mis-typed version here would need an ugly cast.
import { getCollections, createCollection, type CollectionRecords } from "../api/collections";
import type { ImageItem, CollectionItem, FriendItem } from "../types";
import "./HomePage.css";

// Friends has no backend route yet — left as mock data until one exists.
const MOCK_FRIENDS: FriendItem[] = [
  { id: "f1", name: "mara", recentSrc: "/mock/photo-1.svg" },
  { id: "f2", name: "devon", recentSrc: "/mock/photo-2.svg" },
  { id: "f3", name: "imani", recentSrc: "/mock/photo-4.svg" },
  { id: "f4", name: "sana", recentSrc: "/mock/photo-6.svg" },
];

// The list endpoint fills in my_role / image_count / cover_url; the create
// endpoint doesn't, but whoever just created a collection is its owner and it's empty.
function toCollectionItem(r: CollectionRecords): CollectionItem {
  return {
    id: String(r.collection_id),
    name: r.name,
    description: r.description,
    coverSrc: r.cover_url ?? undefined,
    imageCount: r.image_count ?? 0,
    isPublic: r.is_public,
    myRole: r.my_role ?? "owner",
  };
}

export function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<ViewOption>("discover");
  const [allImages, setAllImages] = useState<ImageItem[]>([]); // everything fetched, unfiltered
  const [images, setImages] = useState<ImageItem[]>([]); // what's actually shown (post-search)
  const [collections, setCollections] = useState<CollectionItem[]>([]);

  async function handleUpload(input: { url: string; caption: string }) {
  const record = await createImage(input);
  const newImage: ImageItem = {
    id: String(record.id),
    src: record.url,
    caption: record.caption,
    owner: String(record.owner_id),
  };
  setAllImages((prev) => [newImage, ...prev]);
  setImages((prev) => [newImage, ...prev]);
}
  // Restore an existing session on load (e.g. page refresh) instead of
  // always starting signed out. currentUser() resolves to null on a 401,
  // but throws on other failures (e.g. server down) — treat those as signed out.
  useEffect(() => {
    async function restoreSession() {
      try {
        const existingUser = await currentUser();
        setUser(existingUser);
      } catch (err) {
        console.error(err);
        setUser(null);
      }
    }
    restoreSession();
  }, []);

  // getImages() returns ImageRecord[] — {id, url, caption, owner_id,
  // created_at} — which doesn't match what <Feed> expects (ImageItem:
  // {id, src, caption, owner}), so map between the two shapes here.
  useEffect(() => {
    async function loadFeed() {
      try {
        const records = await getImages();
        const mapped: ImageItem[] = records.map((r) => ({
          id: String(r.id),
          src: r.url,
          caption: r.caption,
          owner: String(r.owner_id),
        }));
        setAllImages(mapped);
        setImages(mapped);
      } catch (err) {
        console.error(err);
      }
    }
    loadFeed();
  }, []);

  // Collections only matter once someone's signed in.
  useEffect(() => {
    if (!user) {
      setCollections([]);
      return;
    }
    refreshCollections();
  }, [user]);

  // Also called by the collection modal after photos are added/removed, so the
  // cards' counts and covers stay in sync.
  async function refreshCollections() {
    try {
      const records = await getCollections();
      setCollections(records.map(toCollectionItem));
    } catch (err) {
      console.error(err);
    }
  }

  // Errors are left to propagate: <LoginForm> catches them and shows the message.
  async function handleSignIn(username: string, password: string) {
    const signedInUser = await login(username, password);
    setUser(signedInUser);
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
    setCollections((prev) => [toCollectionItem(record), ...prev]);
  }

  // Navbar expects { name, avatarUrl? }; AuthUser only has
  // firstname/lastname/username — derive a display name here.
  const navbarUser = user ? { name: user.firstname ?? user.username } : null;

  return (
    <div className="home-page">
      <Navbar
        user={navbarUser}
        onSignIn={handleSignIn}
        onLogOut={handleSignOut}
        onUpload={handleUpload}
        onCreateCollection={handleCreateCollection}
      />

      <AccordionHero imageUrl= {heroImage} />

      <div className="home-page-controls">
        <SearchBar onSearch={handleSearch} />
        <ViewTabs active={activeView} onChange={setActiveView} />
      </div>

      <div className="home-page-content">
        {activeView === "discover" && <Feed images={images} />}
        {activeView === "collections" && (
          <Collections
            collections={collections}
            isSignedIn={Boolean(user)}
            currentUserId={user?.user_id ?? null}
            availableImages={allImages}
            onCollectionChanged={refreshCollections}
          />
        )}
        {activeView === "friends" && <FriendsView friends={MOCK_FRIENDS} />}
      </div>
    </div>
  );
}
