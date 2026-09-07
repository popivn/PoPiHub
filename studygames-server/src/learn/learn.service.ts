import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { getFirestore } from '../app/firebase-admin';
import { DictionaryService } from './dictionary.service';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';

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
  meaningEn?: string;
  level: string;
  category: string;
  categoryEn?: string;
  categoryId: string;
  radical: string;
  strokeCount: number;
  examples: ChineseCharacterExample[];
}

export interface CategoryItem {
  id: string;
  name: string;
  nameEn?: string;
  icon: string;
  count?: number;
}

export interface ChineseCharacterPage {
  items: ChineseCharacterItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Số từ vựng tải mỗi trang — đủ lấp đầy 1-3 cột grid mà không fetch quá nặng. */
export const CHINESE_PAGE_SIZE = 24;

interface CacheCursor {
  o: number;
}
interface FirestoreCursor {
  d: string;
}
type Cursor = CacheCursor | FirestoreCursor;

function decodeCursor(raw?: string): Cursor | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')) as Cursor;
  } catch {
    return null;
  }
}

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64');
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

interface CategoryFile {
  name: string;
  nameEn: string;
  icon: string;
  chars: string[];
}

interface HSKVocabularyRow {
  ID: string;
  Simplified: string;
  Traditional: string;
  Pinyin: string;
  POS: string;
  Level: string;
  WebNo: string;
  WebPinyin: string;
  OCR: string;
  Variants: string;
  CEDICT: string;
}

// Simple CSV parser (handles quoted fields)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char === '\r') {
        currentRow.push(currentField);
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  
  return rows;
}

@Injectable()
export class LearnService implements OnModuleInit {
  private readonly logger = new Logger(LearnService.name);
  private characterCache = new Map<string, ChineseCharacterItem>();
  private categoryMeta: Record<string, CategoryFile> = {};
  /** Cache toàn bộ single-char từ dict (built lazily). Dùng cho filter "Tất Cả". */
  private allDictCharsCache: ChineseCharacterItem[] | null = null;
  /** HSK vocabulary cache from CSV */
  private hskVocabulary: ChineseCharacterItem[] = [];
  /** HSK level counts */
  private hskLevelCounts: Record<string, number> = {};

  constructor(private readonly dictService: DictionaryService) {}

  onModuleInit() {
    this.loadCategoryFiles();
    this.loadCharactersFromDict();
    this.loadHSKData();
  }

  private loadCategoryFiles() {
    try {
      const dir = resolve(process.cwd(), 'data', 'categories');
      const files = readdirSync(dir).filter((f) => extname(f) === '.json');
      for (const file of files) {
        const id = basename(file, '.json');
        const raw = readFileSync(resolve(dir, file), 'utf-8');
        this.categoryMeta[id] = JSON.parse(raw);
      }
      this.logger.log(`Loaded ${files.length} category files: ${files.join(', ')}`);
    } catch (e: any) {
      this.logger.warn(`Failed to load category files: ${e?.message || e}`);
    }
  }

  private loadCharactersFromDict() {
    let loaded = 0;
    for (const [categoryId, meta] of Object.entries(this.categoryMeta)) {
      let catIndex = 0;
      for (const char of meta.chars) {
        const lookup = this.dictService.lookup(char, { includeExtras: false });
        if (!lookup) continue;
        loaded++;
        catIndex++;
        const id = `cn_${categoryId}_${String(catIndex).padStart(4, '0')}`;
        const item: ChineseCharacterItem = {
          id,
          char,
          pinyin: lookup.pinyin,
          hanViet: lookup.hanViet,
          meaning: lookup.meaning,
          meaningEn: lookup.meaningEn,
          level: categoryId.toUpperCase(),
          category: meta.name,
          categoryEn: meta.nameEn,
          categoryId,
          radical: '',
          strokeCount: 0,
          examples: lookup.examples || [],
        };
        this.characterCache.set(id, item);
      }
    }
    this.logger.log(`Loaded ${loaded} curated characters from dictionary across ${Object.keys(this.categoryMeta).length} topics`);
  }

  private loadHSKData() {
    const hskCsvPath = resolve(process.cwd(), 'data', 'hsk', 'hsk30.csv');
    if (!existsSync(hskCsvPath)) {
      this.logger.warn('HSK CSV file not found, skipping HSK data load');
      return;
    }

    try {
      const csvContent = readFileSync(hskCsvPath, 'utf-8');
      const rows = parseCSV(csvContent);
      
      // Skip header row
      const header = rows[0];
      const dataRows = rows.slice(1);

      this.hskVocabulary = [];
      this.hskLevelCounts = {};

      for (const row of dataRows) {
        if (row.length < 6) continue;
        
        const level = row[5]; // Level column
        const simplified = row[1]; // Simplified column
        const pinyin = row[3]; // Pinyin column
        
        // Count by level
        this.hskLevelCounts[level] = (this.hskLevelCounts[level] || 0) + 1;

        // Lookup in dictionary for additional info
        const lookup = this.dictService.lookup(simplified, { includeExtras: false });
        
        const item: ChineseCharacterItem = {
          id: `hsk_${row[0]}`, // Use ID from CSV
          char: simplified,
          pinyin: pinyin,
          hanViet: lookup?.hanViet || '',
          meaning: lookup?.meaning || '',
          meaningEn: lookup?.meaningEn || '',
          level: `HSK ${level}`,
          category: `HSK ${level}`,
          categoryEn: `HSK ${level}`,
          categoryId: `hsk${level}`,
          radical: '',
          strokeCount: 0,
          examples: lookup?.examples || [],
        };
        
        this.hskVocabulary.push(item);
      }

      this.logger.log(`Loaded ${this.hskVocabulary.length} HSK vocabulary items from CSV`);
      this.logger.log(`HSK level counts: ${JSON.stringify(this.hskLevelCounts)}`);
    } catch (e: any) {
      this.logger.error(`Failed to load HSK CSV: ${e?.message || e}`);
    }
  }

  /** Build lazily toàn bộ single-char items từ dict (chỉ 1 lần, cache lại). */
  private ensureAllDictChars(): ChineseCharacterItem[] {
    if (this.allDictCharsCache) return this.allDictCharsCache;
    const lookups = this.dictService.getAllSingleChars();
    const items: ChineseCharacterItem[] = lookups.map((lk, i) => ({
      id: `cn_dict_${String(i).padStart(5, '0')}`,
      char: lk.char,
      pinyin: lk.pinyin,
      hanViet: lk.hanViet,
      meaning: lk.meaning,
      meaningEn: lk.meaningEn,
      level: 'DICT',
      category: 'Tất Cả',
      categoryEn: 'Everything',
      categoryId: 'everything',
      radical: '',
      strokeCount: 0,
      examples: lk.examples || [],
    }));
    this.allDictCharsCache = items;
    this.logger.log(`Built all-dict-chars cache: ${items.length} entries`);
    return items;
  }

  async getChineseCharacters(
    category?: string,
    level?: string,
    cursor?: string,
    pageSize: number = CHINESE_PAGE_SIZE,
  ): Promise<ChineseCharacterPage> {
    const decoded = decodeCursor(cursor);

    // Filter HSK levels from CSV data
    if (category && category.startsWith('hsk')) {
      const hskLevel = category.replace('hsk', '');
      let items = this.hskVocabulary.filter((item) => item.categoryId === category);
      
      const offset = decoded && (decoded as CacheCursor).o ? (decoded as CacheCursor).o : 0;
      const page = items.slice(offset, offset + pageSize);
      const hasMore = offset + pageSize < items.length;
      const nextCursor = hasMore ? encodeCursor({ o: offset + pageSize } as CacheCursor) : null;
      return { items: page, nextCursor, hasMore };
    }

    // Filter "Tất Cả" — lấy toàn bộ dict chars không phân biệt category
    if (category === 'everything') {
      const allItems = this.ensureAllDictChars();
      const offset = decoded && (decoded as CacheCursor).o ? (decoded as CacheCursor).o : 0;
      const page = allItems.slice(offset, offset + pageSize);
      const hasMore = offset + pageSize < allItems.length;
      const nextCursor = hasMore ? encodeCursor({ o: offset + pageSize } as CacheCursor) : null;
      return { items: page, nextCursor, hasMore };
    }

    // Filter by curated topic (từ data/categories)
    if (category && this.categoryMeta[category]) {
      let items = Array.from(this.characterCache.values()).filter(
        (item) => item.categoryId.toLowerCase() === category.toLowerCase(),
      );
      if (level) {
        items = items.filter((item) => item.level.toLowerCase() === level.toLowerCase());
      }
      const offset = decoded && (decoded as CacheCursor).o ? (decoded as CacheCursor).o : 0;
      const page = items.slice(offset, offset + pageSize);
      const hasMore = offset + pageSize < items.length;
      const nextCursor = hasMore ? encodeCursor({ o: offset + pageSize } as CacheCursor) : null;
      return { items: page, nextCursor, hasMore };
    }

    // Ưu tiên Firestore nếu có dữ liệu
    try {
      const db = getFirestore();
      let query: any = db.collection('chinese_characters');
      if (category && category !== 'all') {
        query = query.where('categoryId', '==', category);
      }
      if (level) {
        query = query.where('level', '==', level);
      }
      if (decoded && (decoded as FirestoreCursor).d) {
        const lastDocSnap = await db.collection('chinese_characters').doc((decoded as FirestoreCursor).d).get();
        if (lastDocSnap.exists) {
          query = query.startAfter(lastDocSnap);
        }
      }
      // Fetch pageSize + 1 để phát hiện hasMore mà không cần query count
      const snapshot = await query.limit(pageSize + 1).get();
      if (!snapshot.empty) {
        const docs = snapshot.docs;
        const hasMore = docs.length > pageSize;
        const items = docs.slice(0, pageSize).map((doc: any) => ({ id: doc.id, ...doc.data() }));
        const nextCursor = hasMore && items.length > 0
          ? encodeCursor({ d: items[items.length - 1].id } as FirestoreCursor)
          : null;
        return { items, nextCursor, hasMore };
      }
    } catch {}

    // Fallback: cache in-memory (curated words từ dict)
    let items = Array.from(this.characterCache.values());
    if (category && category !== 'all') {
      items = items.filter((item) => item.categoryId.toLowerCase() === category.toLowerCase());
    }
    if (level) {
      items = items.filter((item) => item.level.toLowerCase() === level.toLowerCase());
    }

    const offset = decoded && (decoded as CacheCursor).o ? (decoded as CacheCursor).o : 0;
    const page = items.slice(offset, offset + pageSize);
    const hasMore = offset + pageSize < items.length;
    const nextCursor = hasMore ? encodeCursor({ o: offset + pageSize } as CacheCursor) : null;
    return { items: page, nextCursor, hasMore };
  }

  async getCharacterById(id: string): Promise<ChineseCharacterItem | null> {
    try {
      const db = getFirestore();
      const doc = await db.collection('chinese_characters').doc(id).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as ChineseCharacterItem;
      }
    } catch {}
    return this.characterCache.get(id) ?? null;
  }

  getCategories(): CategoryItem[] {
    const counts: Record<string, number> = {};
    for (const item of this.characterCache.values()) {
      counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
    }
    const categories: CategoryItem[] = [
      { id: 'all', name: 'Tất cả chủ đề', nameEn: 'All Topics', icon: 'faLayerGroup', count: this.characterCache.size },
    ];
    
    // 1. Danh sách 18 chủ đề thực tế (Thematic Topics)
    for (const [id, meta] of Object.entries(this.categoryMeta)) {
      categories.push({
        id,
        name: meta.name,
        nameEn: meta.nameEn,
        icon: meta.icon,
        count: counts[id] || 0,
      });
    }

    // 2. Danh sách Cấp độ HSK (HSK Levels)
    const hskLevels = ['1', '2', '3', '4', '5', '6', '7-9'];
    const hskIcons: Record<string, string> = {
      '1': 'faGraduationCap',
      '2': 'faBook',
      '3': 'faFeather',
      '4': 'faScroll',
      '5': 'faAward',
      '6': 'faTrophy',
      '7-9': 'faCrown',
    };
    for (const level of hskLevels) {
      const count = this.hskLevelCounts[level] || 0;
      if (count > 0) {
        categories.push({
          id: `hsk${level}`,
          name: `HSK ${level}`,
          nameEn: `HSK ${level}`,
          icon: hskIcons[level] || 'faGraduationCap',
          count,
        });
      }
    }

    // 3. Toàn bộ từ điển tra cứu
    categories.push({
      id: 'everything',
      name: 'Toàn Bộ Từ Điển',
      nameEn: 'Complete Dictionary',
      icon: 'faDatabase',
      count: this.ensureAllDictChars().length,
    });

    return categories;
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
      icon: 'faHand',
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
      icon: 'faHashtag',
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
      description: 'Học từ vựng và mẫu câu giao tiếp khi đi ăn nhà hàng, gọi món, thanh toán.',
      descriptionEn: 'Learn vocabulary and phrases for dining out, ordering food, and paying the bill.',
      topicName: 'Ẩm Thực & Gọi Món',
      topicNameEn: 'Food & Dining',
      category: 'food',
      icon: 'faUtensils',
      level: 'HSK 1 • A1',
      durationMinutes: 25,
      totalCards: 18,
      active: true,
    },
    {
      id: 'lesson_4_directions',
      courseId: 'chinese_hub',
      lessonNumber: 4,
      title: 'Bài 4: Hỏi Đường & Phương Tiện Di Chuyển',
      titleEn: 'Lesson 4: Asking Directions & Transportation',
      description: 'Học cách hỏi đường, chỉ hướng, và thảo luận về các phương tiện di chuyển phổ biến.',
      descriptionEn: 'Learn to ask for and give directions, and discuss common transportation options.',
      topicName: 'Địa Điểm & Di Chuyển',
      topicNameEn: 'Locations & Transport',
      category: 'directions',
      icon: 'faMapLocationDot',
      level: 'HSK 2 • A2',
      durationMinutes: 30,
      totalCards: 20,
      active: true,
    },
    {
      id: 'lesson_5_shopping',
      courseId: 'chinese_hub',
      lessonNumber: 5,
      title: 'Bài 5: Mua Sắm & Trả Giá',
      titleEn: 'Lesson 5: Shopping & Bargaining',
      description: 'Học từ vựng mua sắm, cách hỏi giá, trả giá và thảo luận về sản phẩm.',
      descriptionEn: 'Learn shopping vocabulary, how to ask prices, bargain, and discuss products.',
      topicName: 'Mua Sắm & Giá Cả',
      topicNameEn: 'Shopping & Prices',
      category: 'shopping',
      icon: 'faCartShopping',
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
      description: 'Giao tiếp tại sân bay, hỏi đường đi, bắt xe taxi và đặt phòng khách sạn.',
      descriptionEn: 'Airport conversations, asking for directions, catching taxis, and booking hotel rooms.',
      topicName: 'Du Lịch & Di Chuyển',
      topicNameEn: 'Travel & Transport',
      category: 'travel',
      icon: 'faPlane',
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