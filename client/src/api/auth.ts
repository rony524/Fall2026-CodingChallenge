/**
 * Client for the /api/auth routes (log in, log out, sign up, "who am I?").
 *
 * Every request uses `credentials: "include"` so the browser sends and stores the
 * session cookie that the server sets on login. Without it the cookie would be ignored
 * (the API is on a different port than the page) and you'd look logged out every time.
 *
 * On failure these functions throw an Error whose message comes from the server's
 * `{ error: { message } }` body when there is one, so callers can show it directly.
 */

// The logged-in user, as returned by login, signup and /me.
// (lowercase `firstname` / `lastname`: that's how Postgres returns the columns)
export interface AuthUser {
    firstname: string | null,
    lastname: string | null,
    user_id: number,
    username: string
}

// NOTE: the server's signup route reads `firstName` / `lastName` (camelCase), so these
// two keys don't line up with it yet and the names would be dropped. signUp() isn't
// used by any screen so far; align the names when a signup form is added.
interface SignInInput {
    firstname?: string,
    lastname?: string,
    username: string,
    password: string
}

// Where the API lives. Set VITE_API_URL (e.g. in client/.env) if it isn't on localhost:3000.
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function login(username: string, password: string): Promise<AuthUser>{
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify({username, password})
    })

    if (!res.ok) {
    // The body may not be JSON (e.g. the server is down behind a proxy), hence the catch
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Login failed (${res.status})`);
  }

  return res.json();
}

// Ends the session on the server. The server answers 204 with no body, so nothing to parse.
export async function logout(): Promise<void> {
    await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",

    });


}

// Creates an account and logs in as it (the server starts a session on signup).
export async function signUp( input: SignInInput): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify(input)
    });

    if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Signup failed (${res.status})`);
  }

  return res.json();
}

// Asks the server who is logged in. Used on page load to restore the session after a refresh.
// A 401 just means "nobody is logged in", so that returns null instead of throwing;
// any other failure is a real error.
export async function currentUser(): Promise<AuthUser | null> {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include"});

    if(res.status === 401) return null;
    if(!res.ok) throw new Error(`Failed to retrieve current user (${res.status})`);

    return res.json();

}
