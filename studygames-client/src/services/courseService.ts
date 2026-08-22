/**
 * Course Service & Settings API — giao tiếp với studygames-server /bo/courses endpoint.
 */

import { API_BASE_URL } from '../auth/authClient';

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
        return parsed.data;
      }
    }
  } catch {
    // Cache hỏng → bỏ qua, fetch mới
  }

  // Clear legacy cache
  localStorage.removeItem('sg_topic_settings');

  // 2. Fetch mới từ server
  try {
    const res = await fetch(`${API_BASE_URL}/bo/courses`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
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
    }
  } catch (error) {
    console.error('Failed to fetch topic settings strictly from BO backend:', error);
  }

  return [];
}

export async function updateTopicSettings(topics: TopicItem[]): Promise<boolean> {
  clearTopicSettingsCache();
  try {
    const res = await fetch(`${API_BASE_URL}/bo/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(topics),
    });
    return res.ok;
  } catch {
    return false;
  }
}

