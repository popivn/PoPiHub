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

export interface MinigameCard {
  id: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  image: string;
  link: string;
  active: boolean;
}

export interface MinigameSettings {
  title: string;
  titleEn?: string;
  subtitle: string;
  subtitleEn?: string;
  cards: MinigameCard[];
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

  // ===== MINIGAME SETTINGS =====

  private defaultMinigame: MinigameSettings = {
    title: 'MINI GAME',
    titleEn: 'MINI GAME',
    subtitle: 'Thư giãn và luyện não với các trò chơi nhỏ từ SliStudy.',
    subtitleEn: 'Relax and train your brain with small games from SliStudy.',
    cards: [
      {
        id: 'slime_quiz',
        title: 'Slime Quiz',
        titleEn: 'Slime Quiz',
        description: 'Đoán nghĩa chữ Hán nhanh chóng. Vui nhộn và gây nghiện.',
        descriptionEn: 'Guess the meaning of Chinese characters. Fast, fun, and addictive.',
        image: '/slime/quiz_thumb.svg',
        link: '/learn/chinese',
        active: true,
      },
      {
        id: 'xianria_world',
        title: 'Thế Giới Xianria',
        titleEn: 'Xianria World',
        description: 'Nhảy vào thế giới slime, khám phá và kết bạn.',
        descriptionEn: 'Jump into the slime world, explore and collect friends.',
        image: '/slime/quiz_thumb.svg',
        link: '',
        active: true,
      },
    ],
  };

  async getMinigameSettings(): Promise<MinigameSettings> {
    try {
      const db = getFirestore();
      const doc = await db.collection('settings').doc('minigame').get();
      if (doc.exists && doc.data()?.settings) {
        return doc.data()?.settings as MinigameSettings;
      }
    } catch {}
    return this.defaultMinigame;
  }

  async updateMinigameSettings(settings: MinigameSettings): Promise<MinigameSettings> {
    try {
      const db = getFirestore();
      await db.collection('settings').doc('minigame').set({ settings, updatedAt: new Date().toISOString() });
    } catch {}
    this.defaultMinigame = settings;
    return settings;
  }
}
