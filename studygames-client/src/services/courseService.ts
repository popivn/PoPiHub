/**
 * Course Service & Settings API — giao tiếp với studygames-server.
 * Routes được định nghĩa tập trung tại ./routes.ts (single source of truth).
 */

import { apiUrl, routes } from './routes';

export interface CourseItem {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  image: string;
  link: string;
  active: boolean;
}

export interface TopicItem {
  id: string;
  name: string;
  nameEn?: string;
  active: boolean;
  courses: CourseItem[];
}

/**
 * Cache topic settings trong localStorage với TTL (mặc định 5 phút).
 * Tránh fetch lại khi user quay lại LandingPage trong thời gian ngắn.
 */
const TOPICS_CACHE_KEY = 'sg_topics_cache';
const TOPICS_CACHE_TTL = 5 * 60 * 1000; // 5 phút

interface TopicsCache {
  data: TopicItem[];
  ts: number;
}

export function clearTopicSettingsCache() {
  localStorage.removeItem(TOPICS_CACHE_KEY);
  // Clear legacy key (cũ, không còn dùng)
  localStorage.removeItem('sg_topic_settings');
}

export async function fetchTopicSettings(): Promise<TopicItem[]> {
  // 1. Kiểm tra cache — nếu còn hạn thì return ngay không fetch
  try {
    const cached = localStorage.getItem(TOPICS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as TopicsCache;
      if (Date.now() - parsed.ts < TOPICS_CACHE_TTL) {
        console.log('[courseService] Cache hit, returning cached topics');
        return parsed.data;
      }
      console.log('[courseService] Cache expired, fetching fresh data');
    } else {
      console.log('[courseService] No cache, fetching fresh data');
    }
  } catch {
    // Cache hỏng → bỏ qua, fetch mới
    console.warn('[courseService] Cache parse error, fetching fresh data');
  }

  // Clear legacy cache
  localStorage.removeItem('sg_topic_settings');

  // 2. Fetch mới từ server
  const url = apiUrl(routes.topics.list);
  console.log(`[courseService] GET ${url}`);
  console.log(`[courseService] route = topics.list`);

  try {
    const res = await fetch(url, {
      cache: 'no-store',
    });
    console.log(`[courseService] Response: ${res.status} ${res.statusText}`);

    if (res.ok) {
      const data = await res.json();
      console.log('[courseService] Response data:', data);

      if (Array.isArray(data)) {
        // Auto-migration if backend returned legacy array of courses
        let topics: TopicItem[];
        if (data.length > 0 && !data[0].courses) {
          topics = [{
            id: 'topic_chinese',
            name: 'Tiếng Trung',
            nameEn: 'Chinese',
            active: true,
            courses: data,
          }];
        } else {
          topics = data;
        }
        // 3. Lưu cache
        try {
          localStorage.setItem(TOPICS_CACHE_KEY, JSON.stringify({ data: topics, ts: Date.now() } satisfies TopicsCache));
        } catch {
          // localStorage đầy → bỏ qua, không quan trọng
        }
        return topics;
      }
      console.warn('[courseService] Response is not an array:', typeof data);
    } else {
      // Log response body khi không ok — giúp debug 404/500
      const body = await res.text().catch(() => '<unreadable>');
      console.error(`[courseService] Fetch failed: ${res.status} ${res.statusText}`);
      console.error(`[courseService] Response body:`, body);
      console.error(`[courseService] Requested URL was: ${url}`);
    }
  } catch (error) {
    console.error('[courseService] Network error:', error);
    console.error(`[courseService] Requested URL was: ${url}`);
  }

  return [];
}

export async function updateTopicSettings(topics: TopicItem[]): Promise<boolean> {
  clearTopicSettingsCache();
  const url = apiUrl(routes.topics.create);
  console.log(`[courseService] POST ${url}`, topics);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topics),
    });
    console.log(`[courseService] POST Response: ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const body = await res.text().catch(() => '<unreadable>');
      console.error(`[courseService] POST failed: ${res.status}`, body);
    }
    return res.ok;
  } catch (error) {
    console.error('[courseService] POST network error:', error);
    return false;
  }
}

