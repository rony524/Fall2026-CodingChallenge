interface AuthUser {
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

const API_BASE = import.meta.env.VITE_API_URL ?? "https://localhost:3000";

export async function login(username: string, password: string): Promise<AuthUser>{
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content_Type" : "application/json"},
        body: JSON.stringify({username, password})
    })

    if(!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(`Login unsuccessful (${res.status})`)
    }
}

export async function logout(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",

    });


}

export async function signUp( input: SignInInput): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        credentials: "include",
        headers: { "Content_Type": "application/json"},
        body: JSON.stringify(input)
    });

    if(!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(`Sign up failes (${res.status})`);
    }
}

export async function currentUser(): Promise<AuthUser | null> {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include"});

    if(res.status === 401) return null;
    if(!res.ok) throw new Error(`Failed to retrieve current user (${res.status})`);

    return res.json();

}