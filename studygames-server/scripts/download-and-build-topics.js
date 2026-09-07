#!/usr/bin/env node
/**
 * Script download sentences.json từ no7z/hsk-sentences-audio (GitHub)
 * và trích xuất từ vựng (tokens.word) theo 18 chủ đề (topics),
 * lưu vào data/categories/<topicId>.json để server LearnService nạp vào.
 */
const { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } = require('fs');
const { join, resolve } = require('path');
const https = require('https');

const DATA_DIR = resolve(process.cwd(), 'data');
const HSK_DIR = join(DATA_DIR, 'hsk');
const CATEGORIES_DIR = join(DATA_DIR, 'categories');
const SENTENCES_FILE = join(HSK_DIR, 'sentences.json');
const URL = 'https://raw.githubusercontent.com/no7z/hsk-sentences-audio/main/dist/sentences.json';

// Cấu hình 18 chủ đề kèm tên hiển thị (Tiếng Việt & Tiếng Anh) và icon FontAwesome
const TOPIC_CONFIG = {
  greetings: {
    name: 'Chào Hỏi & Lễ Phép',
    nameEn: 'Greetings & Etiquette',
    icon: 'faHand',
  },
  identity: {
    name: 'Bản Thân & Nghề Nghiệp',
    nameEn: 'Identity & Occupation',
    icon: 'faUserTie',
  },
  family: {
    name: 'Gia Đình & Người Thân',
    nameEn: 'Family & Relatives',
    icon: 'faHouseChimney',
  },
  numbers: {
    name: 'Con Số & Lượng Từ',
    nameEn: 'Numbers & Quantifiers',
    icon: 'faHashtag',
  },
  time: {
    name: 'Thời Gian & Ngày Tháng',
    nameEn: 'Time & Dates',
    icon: 'faClock',
  },
  daily_actions: {
    name: 'Hoạt Động Hàng Ngày',
    nameEn: 'Daily Actions',
    icon: 'faPersonWalking',
  },
  school_work: {
    name: 'Học Tập & Công Sở',
    nameEn: 'School & Work',
    icon: 'faBriefcase',
  },
  location: {
    name: 'Địa Điểm & Phương Hướng',
    nameEn: 'Location & Directions',
    icon: 'faCompass',
  },
  transport: {
    name: 'Du Lịch & Giao Thông',
    nameEn: 'Travel & Transport',
    icon: 'faCar',
  },
  shopping: {
    name: 'Mua Sắm & Tiền Tệ',
    nameEn: 'Shopping & Money',
    icon: 'faBagShopping',
  },
  food: {
    name: 'Ẩm Thực & Ăn Uống',
    nameEn: 'Food & Drinks',
    icon: 'faUtensils',
  },
  weather_state: {
    name: 'Thời Tiết & Khí Hậu',
    nameEn: 'Weather & Seasons',
    icon: 'faCloudSun',
  },
  questions: {
    name: 'Giao Tiếp & Hỏi Đáp',
    nameEn: 'Questions & Modals',
    icon: 'faComments',
  },
  objects_misc: {
    name: 'Đồ Vật & Đời Sống',
    nameEn: 'Objects & Life',
    icon: 'faBoxOpen',
  },
  health_body: {
    name: 'Sức Khỏe & Thể Chất',
    nameEn: 'Health & Body',
    icon: 'faHeartPulse',
  },
  sports_leisure: {
    name: 'Thể Thao & Giải Trí',
    nameEn: 'Sports & Leisure',
    icon: 'faGamepad',
  },
  feelings: {
    name: 'Cảm Xúc & Tính Cách',
    nameEn: 'Emotions & Personality',
    icon: 'faFaceSmile',
  },
  nature: {
    name: 'Tự Nhiên & Động Vật',
    nameEn: 'Nature & Animals',
    icon: 'faPaw',
  },
};

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (e) => {
        reject(e);
      });
  });
}

function isChineseWord(word) {
  if (!word || typeof word !== 'string') return false;
  // Bỏ dấu câu và ký tự đặc biệt
  const trimmed = word.trim();
  if (!trimmed) return false;
  // Kiểm tra có chứa ít nhất 1 chữ Hán (CJK Unified Ideographs)
  return /[\u4e00-\u9fa5]/.test(trimmed) && !/[，。！？、“”‘’（）\d\s]/.test(trimmed);
}

async function main() {
  if (!existsSync(HSK_DIR)) {
    mkdirSync(HSK_DIR, { recursive: true });
  }
  if (!existsSync(CATEGORIES_DIR)) {
    mkdirSync(CATEGORIES_DIR, { recursive: true });
  }

  // 1. Tải sentences.json nếu chưa có
  if (!existsSync(SENTENCES_FILE)) {
    console.log(`Downloading sentences.json from ${URL}...`);
    await download(URL, SENTENCES_FILE);
    console.log(`Saved to ${SENTENCES_FILE}`);
  } else {
    console.log(`Found existing sentences.json at ${SENTENCES_FILE}`);
  }

  // 2. Đọc file sentences.json
  console.log('Reading sentences.json...');
  const rawData = readFileSync(SENTENCES_FILE, 'utf-8');
  const sentences = JSON.parse(rawData);
  console.log(`Total sentences parsed: ${sentences.length}`);

  // 3. Gom từ vựng theo topic
  const topicWords = {};
  for (const topicId of Object.keys(TOPIC_CONFIG)) {
    topicWords[topicId] = new Set();
  }

  let totalTokensExtracted = 0;

  for (const item of sentences) {
    const topic = item.topic;
    if (!topic || !topicWords[topic]) continue;

    if (Array.isArray(item.tokens)) {
      for (const token of item.tokens) {
        const word = token.word;
        if (isChineseWord(word)) {
          topicWords[topic].add(word);
          totalTokensExtracted++;
        }
      }
    }
  }

  // 4. Ghi từng topic ra file data/categories/<topicId>.json
  console.log(`\nExtracted ${totalTokensExtracted} word tokens into 18 topics:`);
  for (const [topicId, config] of Object.entries(TOPIC_CONFIG)) {
    const words = Array.from(topicWords[topicId]);
    const filePath = join(CATEGORIES_DIR, `${topicId}.json`);
    const content = {
      name: config.name,
      nameEn: config.nameEn,
      icon: config.icon,
      chars: words,
    };
    writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`  - [${topicId}]: "${config.name}" (${words.length} từ) -> ${topicId}.json`);
  }

  console.log('\nAll 18 category files created successfully in data/categories/');
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
