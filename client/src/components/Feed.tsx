import type { ImageItem } from "../types";
import "./Feed.css";

interface FeedProps {
  images: ImageItem[];
}

export function Feed({ images }: FeedProps) {
  if (images.length === 0) {
    return <p className="feed-empty">No photos match your search yet.</p>;
  }

  return (
    <div className="feed-grid">
      {images.map((image) => (
        <div key={image.id} className="feed-card">
          <img src={image.src} alt={image.caption} />
          <div className="feed-card-caption">{image.owner}</div>
        </div>
      ))}
    </div>
  );
}
