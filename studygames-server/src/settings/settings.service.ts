import { Injectable } from '@nestjs/common';
import { getFirestore } from '../app/firebase-admin';

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

@Injectable()
export class SettingsService {
  private defaultTopics: TopicItem[] = [
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
        {
          id: 'lessons_hub',
          title: 'Học Theo Bài Học',
          titleEn: 'Learn by Lessons',
          description: 'Hệ thống các bài học phân chia theo từng chủ đề thực tế từ cơ bản đến nâng cao (Chào hỏi, Con số, Ẩm thực, IT, Du lịch...).',
          descriptionEn: 'Structured lessons organized by real-world topics from beginner to advanced (Greetings, Numbers, Food, IT, Travel...).',
          image: '/chinese_course_thumb.jpg',
          link: '/learn/lessons',
          active: true,
        },
      ],
    },
  ];

  async getTopics(): Promise<TopicItem[]> {
    let topics = this.defaultTopics;
    try {
      const db = getFirestore();
      const doc = await db.collection('settings').doc('topics').get();
      if (doc.exists && doc.data()?.topics) {
        topics = doc.data()?.topics;
      }
    } catch {}

    return topics.map((t) => ({
      ...t,
      nameEn: t.nameEn || t.name,
      courses: Array.isArray(t.courses)
        ? t.courses.map((c) => ({
            ...c,
            titleEn: c.titleEn || (c.id === 'chinese_hub' ? 'Chinese Learning Hub' : c.title),
            descriptionEn: c.descriptionEn || (c.id === 'chinese_hub' ? 'Memorize radicals, pronunciation, pinyin and recognize Chinese characters through interactive 3D flashcards & Slime Quiz games.' : (c.description === 'Học theo khoá học' ? 'Learn by Lessons' : c.description)),
          }))
        : [],
    }));
  }

  async updateTopics(topics: TopicItem[]): Promise<TopicItem[]> {
    try {
      const db = getFirestore();
      await db.collection('settings').doc('topics').set({ topics, updatedAt: new Date().toISOString() });
    } catch {}
    this.defaultTopics = topics;
    return topics;
  }
}
