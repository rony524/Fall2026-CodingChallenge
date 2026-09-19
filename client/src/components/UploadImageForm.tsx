/**
 * The "Upload Photo" screen inside the navbar's side panel.
 *
 * For now a "photo" is a link to an image that's already hosted somewhere plus a caption;
 * the server stores just those two strings, not a file. Signed-out visitors get a short
 * "log in first" message instead of the form. Like LoginForm, it hands the values to a
 * callback (`onUpload`) and shows any error that comes back.
 */
import { useState } from "react";
import "./UploadImageForm.css";

interface UploadImageFormProps {
  isSignedIn: boolean;
  onUpload: (input: { url: string; caption: string }) => Promise<void>;
  onBack: () => void; // return to the menu screen
}

export function UploadImageForm({ isSignedIn, onUpload, onBack }: UploadImageFormProps) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All hooks are declared above this point: React requires hooks to run on every render,
  // so an early return like this one has to come after them.
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
    e.preventDefault(); // stop the browser's default full-page form submit
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

      {/* type="url" makes the browser check the address looks like a link before submitting */}
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
