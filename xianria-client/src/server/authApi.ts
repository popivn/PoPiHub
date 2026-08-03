const API_BASE = 'http://localhost:3000'

export interface AuthUser {
  uid: string
  username: string | null
  isGuest: boolean
  coins: number
  createdAt: number
}

export interface AuthResult {
  token: string
  user: AuthUser
  launchUrl: string
}

export interface VerifyResult {
  valid: boolean
  user: AuthUser | null
  launchUrl: string | null
}

function getToken(): string | null {
  return localStorage.getItem('xianria_token')
}

function setToken(token: string): void {
  localStorage.setItem('xianria_token', token)
}

function clearToken(): void {
  localStorage.removeItem('xianria_token')
}

async function postJSON(path: string, body: unknown): Promise<AuthResult> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  setToken(data.token)
  return data as AuthResult
}

export const authApi = {
  async register(username: string, password: string): Promise<AuthResult> {
    return postJSON('/auth/register', { username, password })
  },

  async login(username: string, password: string): Promise<AuthResult> {
    return postJSON('/auth/login', { username, password })
  },

  async guest(nickname?: string): Promise<AuthResult> {
    return postJSON('/auth/guest', { nickname })
  },

  async verify(): Promise<VerifyResult> {
    const token = getToken()
    if (!token) return { valid: false, user: null, launchUrl: null }
    try {
      const res = await fetch(`${API_BASE}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        clearToken()
        return { valid: false, user: null, launchUrl: null }
      }
      return (await res.json()) as VerifyResult
    } catch {
      return { valid: false, user: null, launchUrl: null }
    }
  },

  getToken,
  setToken,
  clearToken,

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('xianria_user')
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },

  setStoredUser(user: AuthUser): void {
    localStorage.setItem('xianria_user', JSON.stringify(user))
  },

  logout(): void {
    clearToken()
    localStorage.removeItem('xianria_user')
  },
}
