// Helper quản lý Identity & JWT Token tự phát hành cho Sư Tôn
export interface UserIdentity {
  token: string;
  name: string;
  avatarId: number;
  createdAt: number;
}

// Hàm mã hóa đơn giản Base64Url JWT client-side không cần secret nặng
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

export function generateIdentityJWT(name: string, avatarId: number = 1): UserIdentity {
  const timestamp = Date.now();
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: `su_ton_${timestamp}`,
    name: name.trim() || 'Tông Sư Ẩn Danh',
    avatarId,
    iat: Math.floor(timestamp / 1000),
    exp: Math.floor(timestamp / 1000) + 30 * 24 * 60 * 60, // 30 ngày
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  // Signature định danh client-side
  const signature = base64UrlEncode(`sig_nks5_${timestamp}_${name}`);

  const token = `${encodedHeader}.${encodedPayload}.${signature}`;

  const identity: UserIdentity = {
    token,
    name: payload.name,
    avatarId,
    createdAt: timestamp,
  };

  localStorage.setItem('nks5_su_ton_identity', JSON.stringify(identity));
  return identity;
}

export function getStoredIdentity(): UserIdentity | null {
  try {
    const raw = localStorage.getItem('nks5_su_ton_identity');
    if (!raw) return null;
    const parsed: UserIdentity = JSON.parse(raw);
    if (!parsed || !parsed.name || !parsed.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}
