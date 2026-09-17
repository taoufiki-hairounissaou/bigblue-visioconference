const AUTH_STORAGE_KEY = 'bigblue_auth';

export async function register(displayName, email, password) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Inscription impossible.');
  saveAuth(data);
  return data;
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Connexion impossible.');
  saveAuth(data);
  return data;
}

export function saveAuth(data) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
