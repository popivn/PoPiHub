import { CONFIG } from '../config';

const STORAGE_KEY = 'popi_access_key';

/**
 * Lấy key từ URL path (ví dụ /363636 → "363636").
 * Bỏ qua dấu / đầu và cuối.
 */
export const getKeyFromUrl = (): string => {
  const path = window.location.pathname;
  return path.replace(/^\/+|\/+$/g, '');
};

/**
 * Kiểm tra key có khớp với ROOT_KEY không.
 */
export const isValidKey = (key: string): boolean => {
  return key === CONFIG.ROOT_KEY;
};

/**
 * Lưu key hợp lệ vào sessionStorage (mất khi đóng tab).
 */
export const saveAccessKey = (key: string) => {
  sessionStorage.setItem(STORAGE_KEY, key);
};

/**
 * Lấy key đã lưu từ sessionStorage.
 */
export const getStoredAccessKey = (): string | null => {
  return sessionStorage.getItem(STORAGE_KEY);
};

/**
 * Xóa key đã lưu (logout).
 */
export const clearAccessKey = () => {
  sessionStorage.removeItem(STORAGE_KEY);
};

/**
 * Kiểm tra xem user đã được xác thực chưa (có key hợp lệ trong sessionStorage).
 */
export const isAuthenticated = (): boolean => {
  const stored = getStoredAccessKey();
  return stored !== null && isValidKey(stored);
};

/**
 * Logic chính:
 * - Nếu URL có key hợp lệ → lưu vào sessionStorage, trả về 'authorized'
 * - Nếu URL có key nhưng sai → trả về 'denied_wrong'
 * - Nếu URL không có key nhưng sessionStorage có key hợp lệ → trả về 'authorized'
 * - Nếu URL không có key và không có session → trả về 'denied'
 */
export type AuthResult = 'authorized' | 'denied' | 'denied_wrong';

export const checkAccess = (): AuthResult => {
  const urlKey = getKeyFromUrl();

  if (urlKey) {
    // URL có key
    if (isValidKey(urlKey)) {
      saveAccessKey(urlKey);
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
