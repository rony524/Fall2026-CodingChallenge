/**
 * The app's only page. It owns the state shared between the navbar and the three views
 * (Discover / Collections / Friends) and talks to the API on their behalf:
 *
 *   - who is signed in (restored from the session cookie on load)
 *   - the photo feed, plus the search filter applied to it
 *   - the signed-in user's collections
 *
 * The child components stay simple: they get data and callbacks as props and never call
 * the API for this state themselves. The one exception is CollectionModal, which loads
 * the photos and people of the collection it shows and tells this page when something
 * changed (onCollectionChanged) so the cards refresh.
 */
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

// Converts an API collection record into the shape the Collections view uses.
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

  // Saves a new photo, then adds it to the top of the feed locally so it appears at once
  // (no need to re-fetch the whole feed). Errors propagate so <UploadImageForm> can show them.
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

  // Collections only matter once someone's signed in. Re-runs whenever `user` changes,
  // so signing in loads them and signing out clears them.
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
  // Matching is by caption. Sorting by "popular" only reverses the order for now: there is
  // no popularity data yet, so it's a placeholder. Always switches to the Discover view.
  function handleSearch(query: string, filters: SearchFilters) {
    const q = query.trim().toLowerCase();
    const matches = q ? allImages.filter((img) => img.caption.toLowerCase().includes(q)) : allImages;
    const sorted = filters.sortBy === "popular" ? [...matches].reverse() : matches;
    setImages(sorted);
    setActiveView("discover");
  }

  // New collections are created private (the menu form has no public/private option yet).
  // Errors propagate so <NewCollectionsForm> can show them.
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

      {/* Only the active view is rendered. availableImages is the unfiltered feed, so the
          collection modal can offer any photo when adding to a collection. */}
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
