/**
 * The "Discover" view: a responsive grid of photo cards.
 * Purely presentational: HomePage decides which photos to pass in (all of them, or the
 * ones matching a search).
 */
import type { ImageItem } from "../types";
import "./Feed.css";

interface FeedProps {
  images: ImageItem[];
}

export function Feed({ images }: FeedProps) {
  // Empty state: nothing matches the search (or no photos have been uploaded yet)
  if (images.length === 0) {
    return <p className="feed-empty">No photos match your search yet.</p>;
  }

  return (
    <div className="feed-grid">
      {images.map((image) => (
        <div key={image.id} className="feed-card">
          <img src={image.src} alt={image.caption} />
          {/* The label on each card is the uploader's user id for now; the API doesn't
              send usernames with photos yet. */}
          <div className="feed-card-caption">{image.owner}</div>
        </div>
      ))}
    </div>
  );
}
