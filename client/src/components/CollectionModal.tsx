import { useEffect, useRef, useState } from "react";
import {
  addCollaborators,
  addImageToCollection,
  getCollaborators,
  getCollectionImage,
  removeCollaborator,
  removeImageFromCollection,
  updateCollaboratorRole,
  type Collaborator,
  type CollaboratorRole,
  type CollectionImages,
} from "../api/collections";
import type { CollectionItem, ImageItem } from "../types";
import "./CollectionModal.css";

interface CollectionModalProps {
  collection: CollectionItem;
  currentUserId: number | null;
  availableImages: ImageItem[];
  onClose: () => void;
  onChanged: () => void;
}

type Tab = "photos" | "people";

const ROLE_LABEL = { owner: "Owner", editor: "Editor", viewer: "Viewer" } as const;

function errorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof Error ? err.message : fallback;
}

function displayName(person: Collaborator) {
  return [person.firstname, person.lastname].filter(Boolean).join(" ") || person.username;
}

export function CollectionModal({
  collection,
  currentUserId,
  availableImages,
  onClose,
  onChanged,
}: CollectionModalProps) {
  const collectionId = Number(collection.id);
  const isOwner = collection.myRole === "owner";
  const canEdit = collection.myRole === "owner" || collection.myRole === "editor";

  const [tab, setTab] = useState<Tab>("photos");
  const [photos, setPhotos] = useState<CollectionImages[] | null>(null); // null = still loading
  const [people, setPeople] = useState<Collaborator[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [selectedImageId, setSelectedImageId] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<CollaboratorRole>("editor");

  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Load photos and people once when the modal opens.
  useEffect(() => {
    let cancelled = false;

    Promise.all([getCollectionImage(collectionId), getCollaborators(collectionId)])
      .then(([loadedPhotos, loadedPeople]) => {
        if (cancelled) return;
        setPhotos(loadedPhotos);
        setPeople(loadedPeople);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Failed to load this collection"));
      });

    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  // Escape closes, Tab stays inside the dialog, page scroll is locked, and focus
  // returns to whatever opened the modal.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    document.body.style.overflow = "hidden";

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
  }, []);

  async function refreshPhotos() {
    setPhotos(await getCollectionImage(collectionId));
  }

  async function refreshPeople() {
    setPeople(await getCollaborators(collectionId));
  }

  // Runs a mutation with a shared busy flag and inline error reporting.
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleAddPhoto() {
    if (!selectedImageId) return;
    run(async () => {
      await addImageToCollection(collectionId, Number(selectedImageId));
      setSelectedImageId("");
      await refreshPhotos();
      onChanged();
    });
  }

  function handleRemovePhoto(imageId: number) {
    run(async () => {
      await removeImageFromCollection(collectionId, imageId);
      await refreshPhotos();
      onChanged();
    });
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    const username = newUsername.trim();
    if (!username) return;
    run(async () => {
      await addCollaborators(collectionId, username, newRole);
      setNewUsername("");
      await refreshPeople();
    });
  }

  function handleRoleChange(userId: number, role: CollaboratorRole) {
    run(async () => {
      await updateCollaboratorRole(collectionId, userId, role);
      await refreshPeople();
    });
  }

  function handleRemovePerson(userId: number) {
    run(async () => {
      await removeCollaborator(collectionId, userId);
      await refreshPeople();
    });
  }

  function handleLeave() {
    if (currentUserId === null) return;
    run(async () => {
      await removeCollaborator(collectionId, currentUserId);
      onChanged();
      onClose();
    });
  }

  const addablePhotos = photos
    ? availableImages.filter((image) => !photos.some((p) => String(p.image_id) === image.id))
    : [];

  return (
    <div
      className="cm-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="cm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="cm-header">
          <div className="cm-header-text">
            <h2 id="cm-title">{collection.name}</h2>
            {collection.description && <p className="cm-description">{collection.description}</p>}
            <div className="cm-chips">
              <span className="cm-chip">{collection.isPublic ? "Public" : "Private"}</span>
              <span className="cm-chip">You: {ROLE_LABEL[collection.myRole]}</span>
            </div>
          </div>
          <button type="button" className="cm-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="cm-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            id="cm-tab-photos"
            aria-selected={tab === "photos"}
            aria-controls="cm-panel-photos"
            className={`cm-tab ${tab === "photos" ? "is-active" : ""}`}
            onClick={() => setTab("photos")}
          >
            Photos{photos && <span className="cm-tab-count">{photos.length}</span>}
          </button>
          <button
            type="button"
            role="tab"
            id="cm-tab-people"
            aria-selected={tab === "people"}
            aria-controls="cm-panel-people"
            className={`cm-tab ${tab === "people" ? "is-active" : ""}`}
            onClick={() => setTab("people")}
          >
            People{people && <span className="cm-tab-count">{people.length}</span>}
          </button>
        </div>

        {actionError && (
          <p className="cm-error cm-error-bar" role="alert">
            {actionError}
          </p>
        )}

        <div className="cm-body">
          {loadError ? (
            <p className="cm-error" role="alert">
              {loadError}
            </p>
          ) : photos === null || people === null ? (
            <p className="cm-hint">Loading…</p>
          ) : tab === "photos" ? (
            <div role="tabpanel" id="cm-panel-photos" aria-labelledby="cm-tab-photos">
              {canEdit && (
                <div className="cm-add-row">
                  <select
                    aria-label="Photo to add"
                    value={selectedImageId}
                    onChange={(e) => setSelectedImageId(e.target.value)}
                    disabled={busy || addablePhotos.length === 0}
                  >
                    <option value="">
                      {addablePhotos.length === 0 ? "No other photos to add yet" : "Add a photo from the feed…"}
                    </option>
                    {addablePhotos.map((image) => (
                      <option key={image.id} value={image.id}>
                        {image.caption}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="cm-primary-btn"
                    onClick={handleAddPhoto}
                    disabled={busy || !selectedImageId}
                  >
                    Add
                  </button>
                </div>
              )}

              {photos.length === 0 ? (
                <p className="cm-hint">
                  No photos in this collection yet.{canEdit ? "" : " Only editors can add photos."}
                </p>
              ) : (
                <ul className="cm-photo-grid">
                  {photos.map((photo) => (
                    <li key={photo.image_id} className="cm-photo">
                      <img src={photo.url} alt={photo.caption} loading="lazy" />
                      <span className="cm-photo-caption">{photo.caption}</span>
                      {canEdit && (
                        <button
                          type="button"
                          className="cm-photo-remove"
                          aria-label={`Remove ${photo.caption} from this collection`}
                          onClick={() => handleRemovePhoto(photo.image_id)}
                          disabled={busy}
                        >
                          ×
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div role="tabpanel" id="cm-panel-people" aria-labelledby="cm-tab-people">
              {isOwner && (
                <>
                  <form className="cm-add-row" onSubmit={handleAddPerson}>
                    <input
                      type="text"
                      aria-label="Username to add"
                      placeholder="Add someone by username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      disabled={busy}
                      autoComplete="off"
                    />
                    <select
                      aria-label="Role for new collaborator"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as CollaboratorRole)}
                      disabled={busy}
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button type="submit" className="cm-primary-btn" disabled={busy || !newUsername.trim()}>
                      Add
                    </button>
                  </form>
                  <p className="cm-hint cm-role-hint">
                    Editors can add and remove photos. Viewers can only look.
                  </p>
                </>
              )}

              <ul className="cm-people">
                {people.map((person) => {
                  const name = displayName(person);
                  const isMe = person.user_id === currentUserId;

                  return (
                    <li key={person.user_id} className="cm-person">
                      <span className="cm-avatar" aria-hidden="true">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="cm-person-text">
                        <span className="cm-person-name">
                          {name}
                          {isMe && <span className="cm-you"> (you)</span>}
                        </span>
                        <span className="cm-person-handle">@{person.username}</span>
                      </span>

                      {person.role === "owner" ? (
                        <span className="cm-role-chip is-owner">Owner</span>
                      ) : isOwner ? (
                        <>
                          <select
                            className="cm-role-select"
                            aria-label={`Role for ${name}`}
                            value={person.role}
                            disabled={busy}
                            onChange={(e) => handleRoleChange(person.user_id, e.target.value as CollaboratorRole)}
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            type="button"
                            className="cm-icon-btn"
                            aria-label={`Remove ${name} from this collection`}
                            onClick={() => handleRemovePerson(person.user_id)}
                            disabled={busy}
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="cm-role-chip">{ROLE_LABEL[person.role]}</span>
                          {isMe && (
                            <button type="button" className="cm-link-btn" onClick={handleLeave} disabled={busy}>
                              Leave
                            </button>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
