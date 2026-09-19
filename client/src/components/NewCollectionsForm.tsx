/**
 * The "New Collection" screen inside the navbar's side panel: a name, an optional
 * description, and a Create button. Signed-out visitors see a "log in first" message.
 * It hands the values to `onCreate` (HomePage creates the collection through the API)
 * and shows any error that comes back. New collections are private.
 *
 * (The component is exported as `NewCollectionsForms`, with an "s".)
 */
import {useState} from "react";
import "./NewCollectionsForm.css";

interface NewCollectionsProps {
    isSignedIn: boolean,
    onCreate: (input: {name: string; description?: string}) => Promise<void>,
    onBack: () => void; // return to the menu screen
}

 export function NewCollectionsForms(
    {
        isSignedIn,
        onCreate,
        onBack
    } : NewCollectionsProps
 ) {

    const[name, setName] = useState("");
    const[description, setDescription] = useState("");
    const[isSubmitting, setIsSubmitting] = useState(false);
    const[error, setError] = useState< string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault(); // stop the browser's default full-page form submit

        setIsSubmitting(true);
        setError(null);

        try {
            // An empty description is sent as undefined so the server stores null, not ""
            await onCreate({ name: name.trim(), description: description.trim()  || undefined});
            onBack();
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to create collection")
        } finally {
            // Re-enable the button whether it worked or failed, so an error can be retried
            setIsSubmitting(false);
        }
    }

    return (
    <div className="new-collection-wrap">
      <button type="button" className="new-collection-back" onClick={onBack}>
        ← Back
      </button>

      {!isSignedIn ? (
        <p className="new-collection-signed-out">Log in to create a collection.</p>
      ) : (
        <form className="new-collection-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekend trips"
              required
            />
          </label>

          <label>
            Description <span className="new-collection-optional">(optional)</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>

          {error && <p className="new-collection-error">{error}</p>}

          <button type="submit" className="new-collection-submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create collection"}
          </button>
        </form>
      )}
    </div>
  );
 }
