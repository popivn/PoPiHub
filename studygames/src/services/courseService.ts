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

export const DEFAULT_TOPICS: TopicItem[] = [
  {
    id: 'topic_chinese',
    name: 'Tiếng Trung',
    nameEn: 'Chinese',
    active: true,
    courses: [
      {
        id: 'chinese_hub',
        title: 'Học Mặt Chữ Tiếng Trung',
        titleEn: 'Chinese Learning Hub',
        description: 'Ghi nhớ bộ thủ, phát âm, pinyin và nhận diện mặt chữ Hán qua các bài lướt thẻ 3D & trò chơi Slime Quiz tương tác thú vị.',
        descriptionEn: 'Memorize radicals, pronunciation, pinyin and recognize Chinese characters through interactive 3D flashcards & Slime Quiz games.',
        image: '/chinese_course_thumb.jpg',
        link: '/learn/chinese',
        active: true,
      },
    ],
  },
];

export async function fetchTopicSettings(): Promise<TopicItem[]> {
  // Clear any legacy local storage cache so it never overrides BO server data
  localStorage.removeItem('sg_topic_settings');

  try {
    const res = await fetch(`${API_BASE_URL}/bo/courses`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Auto-migration if backend returned legacy array of courses
        if (data.length > 0 && !data[0].courses) {
          return [{
            id: 'topic_chinese',
            name: 'Tiếng Trung',
            nameEn: 'Chinese',
            active: true,
            courses: data,
          }];
        }
        return data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch topic settings strictly from BO backend:', error);
  }

  return [];
}

export async function updateTopicSettings(topics: TopicItem[]): Promise<boolean> {
  localStorage.removeItem('sg_topic_settings');
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

