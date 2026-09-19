

export interface AuthUser {
    firstname: string | null,
    lastname: string | null,
    user_id: number,
    username: string
}

interface SignInInput {
    firstname?: string,
    lastname?: string,
    username: string,
    password: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function login(username: string, password: string): Promise<AuthUser>{
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type" : "application/json"},
        body: JSON.stringify({username, password})
    })

    if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Login failed (${res.status})`);
  }

  return res.json();
}

export async function logout(): Promise<void> {
    await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",

    });


}

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

export async function currentUser(): Promise<AuthUser | null> {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include"});

    if(res.status === 401) return null;
    if(!res.ok) throw new Error(`Failed to retrieve current user (${res.status})`);

    return res.json();

}