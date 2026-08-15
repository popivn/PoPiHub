import { Injectable } from '@nestjs/common';
import { getFirestore } from '../app/firebase-admin';

export interface ChineseCharacterExample {
  sentence: string;
  pinyin: string;
  meaning: string;
}

export interface ChineseCharacterItem {
  id: string;
  char: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  level: string;
  category: string;       // Tên thể loại (vd: Nơi Công Sở, Lĩnh Vực IT)
  categoryId: string;     // ID thể loại (vd: office, it, home, basic)
  radical: string;
  strokeCount: number;
  examples: ChineseCharacterExample[];
}

export interface CategoryItem {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

export interface LessonItem {
  id: string;
  courseId: string;
  lessonNumber: number;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  topicName: string;
  topicNameEn?: string;
  category: string;
  icon: string;
  level: string;
  durationMinutes: number;
  totalCards: number;
  active: boolean;
}

@Injectable()
export class LearnService {
  private readonly defaultCharacters: ChineseCharacterItem[] = [
    {
        "id": "cn_it_001",
        "char": "码",
        "pinyin": "mǎ",
        "hanViet": "Mã",
        "meaning": "Mã, ký hiệu, con số (trong Mã code)",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryId": "it",
        "radical": "石 (Thạch - bộ 112)",
        "strokeCount": 8,
        "examples": [
            {
                "sentence": "写代码。",
                "pinyin": "Xiě dàimǎ.",
                "meaning": "Viết mã code."
            },
            {
                "sentence": "源码已经更新。",
                "pinyin": "Yuánmǎ yǐjīng gēngxīn.",
                "meaning": "Mã nguồn đã được cập nhật."
            }
        ]
    },
    {
        "id": "cn_it_002",
        "char": "网",
        "pinyin": "wǎng",
        "hanViet": "Võng",
        "meaning": "Mạng, lưới, internet",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryId": "it",
        "radical": "冂 (Quynh - bộ 13) / 网 (Võng)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "上网查资料。",
                "pinyin": "Shàngwǎng chá zīliào.",
                "meaning": "Lên mạng tra cứu tài liệu."
            },
            {
                "sentence": "网络连接正常。",
                "pinyin": "Wǎnglù liánjiē zhèngcháng.",
                "meaning": "Kết nối mạng bình thường."
            }
        ]
    },
    {
        "id": "cn_it_003",
        "char": "电",
        "pinyin": "diàn",
        "hanViet": "Điện",
        "meaning": "Điện, máy tính, thiết bị điện tử",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryId": "it",
        "radical": "田 (Điền - bộ 102)",
        "strokeCount": 5,
        "examples": [
            {
                "sentence": "电脑关机了。",
                "pinyin": "Diànnǎo guānjī le.",
                "meaning": "Máy tính đã tắt nguồn."
            },
            {
                "sentence": "电子邮件。",
                "pinyin": "Diànzǐ yóujiàn.",
                "meaning": "Thư điện tử (Email)."
            }
        ]
    },
    {
        "id": "cn_it_004",
        "char": "库",
        "pinyin": "kù",
        "hanViet": "Khố",
        "meaning": "Kho, cơ sở dữ liệu (Database)",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryId": "it",
        "radical": "广 (Quảng - bộ 53)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "数据库连接成功。",
                "pinyin": "Shùjùkù liánjiē chénggōng.",
                "meaning": "Kết nối cơ sở dữ liệu thành công."
            }
        ]
    },
    {
        "id": "cn_it_005",
        "char": "端",
        "pinyin": "duān",
        "hanViet": "Đoan",
        "meaning": "Đầu, mút, giao diện (Frontend/Backend)",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryId": "it",
        "radical": "立 (Lập - bộ 117)",
        "strokeCount": 14,
        "examples": [
            {
                "sentence": "前端开发。",
                "pinyin": "Qiánduān kāifā.",
                "meaning": "Phát triển Frontend."
            },
            {
                "sentence": "后端接口。",
                "pinyin": "Hòuduān jiēkǒu.",
                "meaning": "Endpoint API Backend."
            }
        ]
    },
    {
        "id": "cn_off_001",
        "char": "公",
        "pinyin": "gōng",
        "hanViet": "Công",
        "meaning": "Công ty, công sở, chung, công cộng",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryId": "office",
        "radical": "八 (Bát - bộ 12)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "我在科技公司工作。",
                "pinyin": "Wǒ zài kējì gōngsī gōngzuò.",
                "meaning": "Tôi làm việc ở công ty công nghệ."
            },
            {
                "sentence": "办公室在五楼。",
                "pinyin": "Bàngōngshì zài wǔ lóu.",
                "meaning": "Văn phòng ở tầng 5."
            }
        ]
    },
    {
        "id": "cn_off_002",
        "char": "会",
        "pinyin": "huì",
        "hanViet": "Hội",
        "meaning": "Cuộc họp, hội nghị, biết làm",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryId": "office",
        "radical": "人 (Nhân - bộ 9)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "我们九点开会。",
                "pinyin": "Wǒmen jiǔ diǎn kāihuì.",
                "meaning": "Chúng tôi họp lúc 9 giờ."
            }
        ]
    },
    {
        "id": "cn_off_003",
        "char": "报",
        "pinyin": "bào",
        "hanViet": "Báo",
        "meaning": "Báo cáo, thông báo",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryId": "office",
        "radical": "扌 (Thủ - bộ 64)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "这是月度工作报告。",
                "pinyin": "Zhè shì yuèdù gōngzuò bàoɡào.",
                "meaning": "Đây là báo cáo công việc hàng tháng."
            }
        ]
    },
    {
        "id": "cn_off_004",
        "char": "办",
        "pinyin": "bàn",
        "hanViet": "Biện",
        "meaning": "Làm, xử lý, giải quyết công việc",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryId": "office",
        "radical": "力 (Lực - bộ 19)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "马上办理。",
                "pinyin": "Mǎshàng bànlǐ.",
                "meaning": "Xử lý ngay lập tức."
            },
            {
                "sentence": "怎么办？",
                "pinyin": "Zěnme bàn?",
                "meaning": "Giải quyết thế nào đây?"
            }
        ]
    },
    {
        "id": "cn_hm_001",
        "char": "家",
        "pinyin": "jiā",
        "hanViet": "Gia",
        "meaning": "Nhà, gia đình",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryId": "home",
        "radical": "宀 (Miên - bộ 40)",
        "strokeCount": 10,
        "examples": [
            {
                "sentence": "我下班回家了。",
                "pinyin": "Wǒ xiàbān huí jiā le.",
                "meaning": "Tôi tan làm về nhà rồi."
            },
            {
                "sentence": "家人都很健康。",
                "pinyin": "Jiārén dōu hěn jiànkāng.",
                "meaning": "Người nhà đều khỏe mạnh."
            }
        ]
    },
    {
        "id": "cn_hm_002",
        "char": "饭",
        "pinyin": "fàn",
        "hanViet": "Phạn",
        "meaning": "Cơm, bữa ăn",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryId": "home",
        "radical": "饣 (Thực - bộ 184)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "吃晚饭。",
                "pinyin": "Chī wǎnfàn.",
                "meaning": "Ăn cơm tối."
            }
        ]
    },
    {
        "id": "cn_hm_003",
        "char": "睡",
        "pinyin": "shuì",
        "hanViet": "Thụy",
        "meaning": "Ngủ",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryId": "home",
        "radical": "目 (Mục - bộ 109)",
        "strokeCount": 13,
        "examples": [
            {
                "sentence": "早点睡觉。",
                "pinyin": "Zǎodiǎn shuìjiào.",
                "meaning": "Đi ngủ sớm nhé."
            }
        ]
    },
    {
        "id": "cn_hm_004",
        "char": "亲",
        "pinyin": "qīn",
        "hanViet": "Thân",
        "meaning": "Thân thiết, bố mẹ, người thân",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryId": "home",
        "radical": "立 (Lập - bộ 117)",
        "strokeCount": 9,
        "examples": [
            {
                "sentence": "父亲和母亲。",
                "pinyin": "Fùqīn hé mǔqīn.",
                "meaning": "Bố và mẹ."
            }
        ]
    },
    {
        "id": "cn_bs_001",
        "char": "爱",
        "pinyin": "ài",
        "hanViet": "Ái",
        "meaning": "Yêu, thương, yêu thích",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "爪 (Trảo - bộ 87)",
        "strokeCount": 10,
        "examples": [
            {
                "sentence": "我爱你。",
                "pinyin": "Wǒ ài nǐ.",
                "meaning": "Tôi yêu bạn."
            }
        ]
    },
    {
        "id": "cn_bs_002",
        "char": "学",
        "pinyin": "xué",
        "hanViet": "Học",
        "meaning": "Học tập, nghiên cứu",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "子 (Tử - bộ 39)",
        "strokeCount": 8,
        "examples": [
            {
                "sentence": "我喜欢学汉语。",
                "pinyin": "Wǒ xǐhuān xué Hànyǔ.",
                "meaning": "Tôi thích học tiếng Trung."
            }
        ]
    },
    {
        "id": "cn_bs_003",
        "char": "好",
        "pinyin": "hǎo",
        "hanViet": "Hảo",
        "meaning": "Tốt, đẹp, hay, khỏe",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "女 (Nữ - bộ 38)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "你好！",
                "pinyin": "Nǐ hǎo!",
                "meaning": "Xin chào!"
            }
        ]
    },
    {
        "id": "cn_bs_004",
        "char": "水",
        "pinyin": "shuǐ",
        "hanViet": "Thủy",
        "meaning": "Nước",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "水 (Thủy - bộ 85)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "喝水。",
                "pinyin": "Hē shuǐ.",
                "meaning": "Uống nước."
            }
        ]
    },
    {
        "id": "cn_bs_005",
        "char": "书",
        "pinyin": "shū",
        "hanViet": "Thư",
        "meaning": "Sách, văn bản",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "乙 (Ất - bộ 5)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "看书。",
                "pinyin": "Kàn shū.",
                "meaning": "Đọc sách."
            }
        ]
    },
    {
        "id": "cn_bs_006",
        "char": "心",
        "pinyin": "xīn",
        "hanViet": "Tâm",
        "meaning": "Tim, lòng, tâm trí",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryId": "basic",
        "radical": "心 (Tâm - bộ 61)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "开心。",
                "pinyin": "Kāixīn.",
                "meaning": "Vui vẻ."
            }
        ]
    }
];

  async getChineseCharacters(category?: string, level?: string, limit: number = 20): Promise<ChineseCharacterItem[]> {
    try {
      const db = getFirestore();
      let query: any = db.collection('chinese_characters');
      if (category && category !== 'all') {
        query = query.where('categoryId', '==', category);
      }
      if (level) {
        query = query.where('level', '==', level);
      }
      const snapshot = await query.limit(limit).get();

      if (!snapshot.empty) {
        return snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
    } catch {
      // Fallback to in-memory curated data
    }

    let items = this.defaultCharacters;
    if (category && category !== 'all') {
      items = items.filter(
        (item) => item.categoryId.toLowerCase() === category.toLowerCase() || item.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (level) {
      items = items.filter((item) => item.level.toLowerCase() === level.toLowerCase());
    }
    return items.slice(0, limit);
  }

  async getCharacterById(id: string): Promise<ChineseCharacterItem | null> {
    const item = this.defaultCharacters.find((c) => c.id === id);
    return item ?? null;
  }

  getCategories(): CategoryItem[] {
    return [
      { id: 'all', name: 'Tất cả chủ đề', icon: '🌐', count: this.defaultCharacters.length },
      { id: 'office', name: 'Nơi Công Sở', icon: '🏢', count: 4 },
      { id: 'home', name: 'Giao Tiếp Tại Nhà', icon: '🏠', count: 4 },
      { id: 'it', name: 'Lĩnh Vực IT', icon: '💻', count: 4 },
      { id: 'basic', name: 'Căn Bản HSK', icon: '📚', count: 2 },
    ];
  }

  private readonly defaultLessons: LessonItem[] = [
    {
      id: 'lesson_1_greetings',
      courseId: 'chinese_hub',
      lessonNumber: 1,
      title: 'Bài 1: Chào Hỏi & Giới Thiệu Bản Thân',
      titleEn: 'Lesson 1: Greetings & Self-Introduction',
      description: 'Học cách chào hỏi cơ bản, nói lời cảm ơn, tạm biệt và tự giới thiệu tên tuổi bằng tiếng Trung chuẩn.',
      descriptionEn: 'Learn basic greetings, saying thanks, goodbyes, and introducing yourself in Chinese.',
      topicName: 'Giao Tiếp Cơ Bản',
      topicNameEn: 'Basic Greetings',
      category: 'greetings',
      icon: '👋',
      level: 'HSK 1 • A1',
      durationMinutes: 15,
      totalCards: 12,
      active: true,
    },
    {
      id: 'lesson_2_numbers',
      courseId: 'chinese_hub',
      lessonNumber: 2,
      title: 'Bài 2: Con Số, Thời Gian & Ngày Tháng',
      titleEn: 'Lesson 2: Numbers, Time & Calendar',
      description: 'Nắm vững cách đếm từ 1-100, nói thời gian giờ phút và đọc ngày tháng năm chính xác.',
      descriptionEn: 'Master counting 1-100, telling time, and reading dates accurately in Chinese.',
      topicName: 'Con Số & Thời Gian',
      topicNameEn: 'Numbers & Time',
      category: 'numbers',
      icon: '🔢',
      level: 'HSK 1 • A1',
      durationMinutes: 20,
      totalCards: 15,
      active: true,
    },
    {
      id: 'lesson_3_food',
      courseId: 'chinese_hub',
      lessonNumber: 3,
      title: 'Bài 3: Gọi Món & Ẩm Thực Nhà Hàng',
      titleEn: 'Lesson 3: Restaurant Dining & Food Ordering',
      description: 'Học từ vựng về món ăn nổi tiếng, cách gọi món tại quán ăn và thanh toán tiền mặt/mã QR.',
      descriptionEn: 'Learn vocabulary for famous dishes, ordering food at restaurants, and making payments.',
      topicName: 'Ẩm Thực & Nhà Hàng',
      topicNameEn: 'Dining & Food',
      category: 'food',
      icon: '🍜',
      level: 'HSK 2 • A2',
      durationMinutes: 25,
      totalCards: 18,
      active: true,
    },
    {
      id: 'lesson_4_office',
      courseId: 'chinese_hub',
      lessonNumber: 4,
      title: 'Bài 4: Giao Tiếp Văn Phòng & IT',
      titleEn: 'Lesson 4: Office & Workplace IT Chinese',
      description: 'Từ vựng chuyên ngành IT, viết email công việc, họp online và trao đổi công việc hàng ngày.',
      descriptionEn: 'IT technical vocabulary, writing work emails, online meetings, and daily office tasks.',
      topicName: 'Công Việc & IT',
      topicNameEn: 'Workplace & IT',
      category: 'it',
      icon: '💻',
      level: 'HSK 2 • A2',
      durationMinutes: 30,
      totalCards: 20,
      active: true,
    },
    {
      id: 'lesson_5_home',
      courseId: 'chinese_hub',
      lessonNumber: 5,
      title: 'Bài 5: Gia Đình & Đời Sống Thường Ngày',
      titleEn: 'Lesson 5: Family & Daily Household Life',
      description: 'Hỏi thăm sức khỏe người thân, mô tả hoạt động gia đình và giao tiếp đời thường thân mật.',
      descriptionEn: 'Asking about family health, describing household activities, and friendly chats.',
      topicName: 'Gia Đình & Đời Sống',
      topicNameEn: 'Family & Daily Life',
      category: 'home',
      icon: '🏠',
      level: 'HSK 2 • A2',
      durationMinutes: 25,
      totalCards: 16,
      active: true,
    },
    {
      id: 'lesson_6_travel',
      courseId: 'chinese_hub',
      lessonNumber: 6,
      title: 'Bài 6: Du Lịch, Hỏi Đường & Đặt Phòng',
      titleEn: 'Lesson 6: Travel, Directions & Hotel Booking',
      description: 'Giao tiếp tại sân bay, hỏi đường đi, bắt xe taxi và đặt phòng khách sạn thuận tiện khi đi du lịch.',
      descriptionEn: 'Airport conversations, asking for directions, catching taxis, and booking hotel rooms.',
      topicName: 'Du Lịch & Di Chuyển',
      topicNameEn: 'Travel & Transport',
      category: 'travel',
      icon: '✈️',
      level: 'HSK 3 • B1',
      durationMinutes: 35,
      totalCards: 25,
      active: true,
    },
  ];

  async getLessons(courseId?: string): Promise<LessonItem[]> {
    try {
      const db = getFirestore();
      const doc = await db.collection('settings').doc('lessons').get();
      if (doc.exists && doc.data()?.lessons) {
        const lessons: LessonItem[] = doc.data()?.lessons;
        if (courseId) {
          return lessons.filter((l) => l.courseId === courseId);
        }
        return lessons;
      }
    } catch {}
    if (courseId) {
      return this.defaultLessons.filter((l) => l.courseId === courseId);
    }
    return this.defaultLessons;
  }
}
