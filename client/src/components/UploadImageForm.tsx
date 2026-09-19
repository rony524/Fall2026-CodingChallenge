import { useState } from "react";
import "./UploadImageForm.css";

interface UploadImageFormProps {
  isSignedIn: boolean;
  onUpload: (input: { url: string; caption: string }) => Promise<void>;
  onBack: () => void;
}

export function UploadImageForm({ isSignedIn, onUpload, onBack }: UploadImageFormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="upload-form">
        <p className="upload-form-hint">You need to be logged in to upload a photo.</p>
        <button type="button" className="upload-form-back" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !caption.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onUpload({ url: url.trim(), caption: caption.trim() });
      onBack(); // success — back to the menu view
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <p className="upload-form-hint">
        Paste a link to an image that's already hosted somewhere (for now — picking a file directly from your
        device is a future upgrade).
      </p>

      <label className="upload-form-field">
        <span>Image URL</span>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          autoFocus
          required
        />
      </label>

      <label className="upload-form-field">
        <span>Caption</span>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          required
        />
      </label>

      {error && <p className="upload-form-error">{error}</p>}

      <div className="upload-form-actions">
        <button type="button" className="upload-form-back" onClick={onBack} disabled={isSubmitting}>
          Back
        </button>
        <button type="submit" className="upload-form-submit" disabled={isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload"}
        </button>
      </div>
    </form>
  );
}
