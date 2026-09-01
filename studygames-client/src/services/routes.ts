/**
 * Central API route definitions — single source of truth.
 *
 * Map 1:1 với @Controller của NestJS server (global prefix `/api`).
 * Thay vì hardcode `${API_BASE_URL}/bo/courses` ở mỗi service,
 * dùng `apiUrl(routes.topics.list)` để lấy URL đầy đủ.
 *
 * Khi server thêm/sửa route, chỉ cần cập nhật file này.
 */

import { API_BASE_URL } from '../auth/authClient';

/**
 * Route descriptor — `path` có thể chứa placeholder `:param`.
 * Ví dụ: { path: 'players/:id/select', method: 'POST' }
 */
export interface RouteDescriptor {
  /** Path tương đối (không có prefix `/api`). Có thể chứa `:param`. */
  path: string;
  /** HTTP method. */
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
}

/**
 * Build URL đầy đủ từ RouteDescriptor + thay placeholder bằng params.
 *
 * @example
 *   apiUrl(routes.topics.list)                              // → /api/topics
 *   apiUrl(routes.learn.chineseById, { id: 'char_123' })    // → /api/learn/chinese/char_123
 *   apiUrl(routes.learn.chinese, { category: 'radicals' })  // → /api/learn/chinese?category=radicals
 */
export function apiUrl(
  route: RouteDescriptor,
  params?: Record<string, string | number>,
  query?: Record<string, string | number | undefined>,
): string {
  let path = route.path;

  // Replace :param placeholders
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  // Append query string (bỏ qua undefined/null)
  if (query) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        qs.set(key, String(value));
      }
    }
    const qsStr = qs.toString();
    if (qsStr) path += `?${qsStr}`;
  }

  return `${API_BASE_URL}/${path}`;
}

/**
 * All server routes — mirror của NestJS controllers.
 * Cập nhật file này mỗi khi thêm/sửa @Controller hoặc @Get/@Post ở server.
 */
export const routes = {
  // ===== Auth (auth.controller.ts + users.controller.ts) =====
  auth: {
    /** POST /api/auth/anonymous — Body: { uid? } */
    anonymous: { path: 'auth/anonymous', method: 'POST' } as RouteDescriptor,
    /** GET /api/auth/me — Yêu cầu JWT */
    me: { path: 'auth/me', method: 'GET' } as RouteDescriptor,
    /** POST /api/auth/register — Body: { username, password, secretKey? } */
    register: { path: 'auth/register', method: 'POST' } as RouteDescriptor,
    /** POST /api/auth/login — Body: { username, password } */
    login: { path: 'auth/login', method: 'POST' } as RouteDescriptor,
    /** POST /api/auth/login-key — Body: { secretKey } */
    loginKey: { path: 'auth/login-key', method: 'POST' } as RouteDescriptor,
  },

  // ===== Users (users.admin.controller.ts) — BO admin only =====
  users: {
    /** GET /api/users — List all users (admin) */
    list: { path: 'users', method: 'GET' } as RouteDescriptor,
  },

  // ===== Players (players.controller.ts) — JWT required =====
  players: {
    /** GET /api/players — List player characters của user */
    list: { path: 'players', method: 'GET' } as RouteDescriptor,
    /** POST /api/players — Tạo player mới */
    create: { path: 'players', method: 'POST' } as RouteDescriptor,
    /** GET /api/players/selected — Player đang chọn */
    selected: { path: 'players/selected', method: 'GET' } as RouteDescriptor,
    /** POST /api/players/:id/select — Chọn player */
    select: { path: 'players/:id/select', method: 'POST' } as RouteDescriptor,
    /** DELETE /api/players/:id — Xoá player */
    remove: { path: 'players/:id', method: 'DELETE' } as RouteDescriptor,
  },

  // ===== Topics / Courses (topics.controller.ts + topics-admin.controller.ts) =====
  topics: {
    /** GET /api/topics — List all topics + courses (public, không cần auth) */
    list: { path: 'topics', method: 'GET' } as RouteDescriptor,
    /** POST /api/topics — Tạo topic mới (admin JWT required) */
    create: { path: 'topics', method: 'POST' } as RouteDescriptor,
    /** PATCH /api/topics/:id — Cập nhật topic (admin JWT required) */
    update: { path: 'topics/:id', method: 'PATCH' } as RouteDescriptor,
    /** DELETE /api/topics/:id — Xoá topic (admin JWT required) */
    remove: { path: 'topics/:id', method: 'DELETE' } as RouteDescriptor,
  },

  // ===== Features (features.controller.ts + features-admin.controller.ts) =====
  features: {
    /** GET /api/features — List all features (public, không cần auth) */
    list: { path: 'features', method: 'GET' } as RouteDescriptor,
    /** POST /api/features — Tạo feature mới (admin JWT required) */
    create: { path: 'features', method: 'POST' } as RouteDescriptor,
    /** PATCH /api/features/:id — Cập nhật feature (admin JWT required) */
    update: { path: 'features/:id', method: 'PATCH' } as RouteDescriptor,
    /** DELETE /api/features/:id — Xoá feature (admin JWT required) */
    remove: { path: 'features/:id', method: 'DELETE' } as RouteDescriptor,
  },

  // ===== Learn (learn.controller.ts) =====
  learn: {
    /** GET /api/learn/chinese — List Chinese characters (paginated) */
    chinese: { path: 'learn/chinese', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/chinese/categories — List categories */
    chineseCategories: { path: 'learn/chinese/categories', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/chinese/:id — Chi tiết 1 character */
    chineseById: { path: 'learn/chinese/:id', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/lessons — List lessons (?courseId=) */
    lessons: { path: 'learn/lessons', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/lookup/:word — Tra từ điển */
    dictLookup: { path: 'learn/dict/lookup/:word', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/search?q=&limit= — Search từ điển đơn chữ */
    dictSearch: { path: 'learn/dict/search', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/phrasesearch?q=&limit= — Search cụm từ */
    dictPhraseSearch: { path: 'learn/dict/phrasesearch', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/hanzi/:char — Chi tiết bút tích 1 chữ */
    hanziDetails: { path: 'learn/dict/hanzi/:char', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/hanzi/:char/etymology-vi — Dịch lục thư sang tiếng Việt */
    hanziEtymologyVi: { path: 'learn/dict/hanzi/:char/etymology-vi', method: 'GET' } as RouteDescriptor,
    /** GET /api/learn/dict/examples/:word — 3 câu ví dụ do AI tạo */
    dictExamples: { path: 'learn/dict/examples/:word', method: 'GET' } as RouteDescriptor,
  },
} as const;

export type Routes = typeof routes;
