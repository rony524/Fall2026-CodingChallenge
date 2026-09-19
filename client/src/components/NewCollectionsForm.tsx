import {useState} from "react";
import "./NewCollectionsForm.css";

interface NewCollectionsProps {
    isSignedIn: boolean,
    onCreate: (input: {name: string; description?: string}) => Promise<void>,
    onBack: () => void;
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
        e.defaultPrevented;

        setIsSubmitting(true);
        setError(null);

        try {
            await onCreate({ name: name.trim(), description: description.trim()  || undefined});
            onBack();
        } catch(err) {
            setError(err instanceof Error ? err.message : "Failed to create collection")
        } finally {
            setIsSubmitting(true);
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