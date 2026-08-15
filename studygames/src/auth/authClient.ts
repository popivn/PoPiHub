/**
 * Auth client — giao tiếp với studygames-server.
 * Không có Firebase config ở frontend (kiến trúc B: server proxy).
 */

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? '';

const TOKEN_KEY = 'sg_access_token';
const UID_KEY = 'sg_uid';
const USERNAME_KEY = 'sg_username';
const PROVIDER_KEY = 'sg_provider';

export interface AuthState {
  accessToken: string | null;
  uid: string | null;
  username: string | null;
  provider: string | null;
}

export interface AuthResponse {
  accessToken: string;
  uid: string;
  username?: string;
  isNewUser: boolean;
}

function readStorage(): AuthState {
  return {
    accessToken: localStorage.getItem(TOKEN_KEY),
    uid: localStorage.getItem(UID_KEY),
    username: localStorage.getItem(USERNAME_KEY),
    provider: localStorage.getItem(PROVIDER_KEY),
  };
}

function writeStorage(r: AuthResponse, provider: string) {
  localStorage.setItem(TOKEN_KEY, r.accessToken);
  localStorage.setItem(UID_KEY, r.uid);
  localStorage.setItem(PROVIDER_KEY, provider);
  if (r.username) localStorage.setItem(USERNAME_KEY, r.username);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(UID_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(PROVIDER_KEY);
}

export function getAuthState(): AuthState {
  return readStorage();
}

async function postJson(path: string, body: unknown): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message ?? `Request failed (${res.status})`;
    throw new Error(Array.isArray(msg) ? msg.join(', ') : msg);
  }
  return data as AuthResponse;
}

export async function anonymousSignIn(existingUid?: string): Promise<AuthResponse> {
  const r = await postJson('/auth/anonymous', { uid: existingUid });
  writeStorage(r, 'anonymous');
  return r;
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const r = await postJson('/auth/register', { username, password });
  writeStorage(r, 'password');
  return r;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const r = await postJson('/auth/login', { username, password });
  writeStorage(r, 'password');
  return r;
}

/**
 * Fetch wrapper tự đính kèm Bearer token.
 * Trả về response gốc; caller tự xử lý 401 (onUnauthorized callback).
 */
export async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}

export const API_BASE_URL = API_BASE;
