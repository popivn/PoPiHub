import { getUserByKey, seedDefaultUser } from './storage';

const STORAGE_KEY = 'popi_access_key';
const STORAGE_USER_ID = 'popi_user_id';

/**
 * Lấy key từ URL path (ví dụ /363636 → "363636").
 * Bỏ qua dấu / đầu và cuối.
 */
export const getKeyFromUrl = (): string => {
  const path = window.location.pathname;
  return path.replace(/^\/+|\/+$/g, '');
};

/**
 * Lưu key + userId vào sessionStorage (mất khi đóng tab).
 */
export const saveAccessKey = (key: string, userId: string) => {
  sessionStorage.setItem(STORAGE_KEY, key);
  sessionStorage.setItem(STORAGE_USER_ID, userId);

  // Lưu vào danh sách key đã dùng gần đây ở localStorage (tối đa 5 keys)
  try {
    const raw = localStorage.getItem('popi_recent_keys');
    let keys: string[] = raw ? JSON.parse(raw) : [];
    keys = keys.filter((k) => k !== key);
    keys.push(key);
    if (keys.length > 5) {
      keys.shift();
    }
    localStorage.setItem('popi_recent_keys', JSON.stringify(keys));
  } catch (err) {
    console.error('Error saving recent keys:', err);
  }
};

/**
 * Lấy key đã lưu từ sessionStorage.
 */
export const getStoredAccessKey = (): string | null => {
  return sessionStorage.getItem(STORAGE_KEY);
};

/**
 * Lấy userId đã lưu từ sessionStorage.
 */
export const getStoredUserId = (): string | null => {
  return sessionStorage.getItem(STORAGE_USER_ID);
};

/**
 * Xóa key + userId đã lưu (logout).
 */
export const clearAccessKey = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_USER_ID);
};

/**
 * Kiểm tra xem user đã được xác thực chưa (có key + userId trong sessionStorage).
 */
export const isAuthenticated = (): boolean => {
  const stored = getStoredAccessKey();
  const userId = getStoredUserId();
  return stored !== null && userId !== null;
};

/**
 * Logic chính:
 * - Nếu URL có key → kiểm tra key trong Firestore `users` collection.
 *   - Nếu hợp lệ → lưu key + userId vào sessionStorage, trả về 'authorized'.
 *   - Nếu không hợp lệ → trả về 'denied_wrong'.
 * - Nếu URL không có key nhưng sessionStorage có → trả về 'authorized'.
 * - Nếu URL không có key và không có session → trả về 'denied'.
 */
export type AuthResult = 'authorized' | 'denied' | 'denied_wrong';

export const checkAccess = async (): Promise<AuthResult> => {
  // Đảm bảo user default (id=1, key=363636) tồn tại trong DB
  await seedDefaultUser().catch((err) => console.error('seedDefaultUser error:', err));

  const urlKey = getKeyFromUrl();

  if (urlKey) {
    // URL có key → kiểm tra trong Firestore
    const user = await getUserByKey(urlKey);
    if (user) {
      saveAccessKey(user.key, user.id);
      // Clean URL: chuyển về / để không lộ key
      window.history.replaceState({}, '', '/');
      return 'authorized';
    }
    return 'denied_wrong';
  }

  // URL không có key → kiểm tra sessionStorage
  if (isAuthenticated()) {
    return 'authorized';
  }

  return 'denied';
};
