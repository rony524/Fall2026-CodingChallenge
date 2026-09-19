import { useState } from "react";
import "./LoginForm.css";

interface LoginFormProps {
  onSignIn: (username: string, password: string) => Promise<void>;
  onBack: () => void;
}

export function LoginForm({ onSignIn, onBack }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setError(null);
    setIsSubmitting(true);
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
