/**
 * The "Log in" screen inside the navbar's side panel.
 *
 * It doesn't call the API itself: it hands the credentials to `onSignIn` (which HomePage
 * implements). If that rejects — e.g. "Incorrect username or password" — the message is
 * shown under the fields and the form stays open so the user can try again.
 */
import { useState } from "react";
import "./LoginForm.css";

interface LoginFormProps {
  onSignIn: (username: string, password: string) => Promise<void>;
  onBack: () => void; // return to the menu screen
}

export function LoginForm({ onSignIn, onBack }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // stop the browser's default full-page form submit
    if (!username.trim() || !password) return;

    setError(null);
    setIsSubmitting(true); // disables the buttons so it can't be submitted twice
    try {
      await onSignIn(username.trim(), password);
      onBack(); // success — back to the menu view, which now shows the signed-in identity
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="login-form-field">
        <span>Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />
      </label>

      <label className="login-form-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && <p className="login-form-error">{error}</p>}

      <div className="login-form-actions">
        <button type="button" className="login-form-back" onClick={onBack} disabled={isSubmitting}>
          Back
        </button>
        <button type="submit" className="login-form-submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Log in"}
        </button>
      </div>
    </form>
  );
}
