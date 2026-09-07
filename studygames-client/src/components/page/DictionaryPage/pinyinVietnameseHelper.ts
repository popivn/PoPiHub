/**
 * Helper chuyển đổi Bính âm (Pinyin) sang phiên âm đọc Tiếng Việt
 * Dựa trên bảng quy tắc ánh xạ Thanh mẫu (Initials) và Vận mẫu (Finals).
 *
 * Ví dụ:
 *  zhōng -> zh + ong -> tr + ung -> trung
 *  pán, pàng -> pán, pạng
 *  nǐ hǎo -> nỉ hảo
 */

// Bảng chuyển đổi Thanh mẫu (Initials)
export const PINYIN_INITIALS_MAP: Record<string, string> = {
  zh: 'tr',
  ch: 'tr',
  sh: 's',
  x: 'x',
  q: 'ch',
  j: 'chi',
  c: 'x',
  z: 'ch',
  b: 'p',
  p: 'p',
  m: 'm',
  f: 'f',
  d: 't',
  t: 'th',
  n: 'n',
  l: 'l',
  g: 'c',
  k: 'kh',
  h: 'h',
  r: 'r',
  w: 'u',
  y: 'y',
};

// Bảng chuyển đổi Vận mẫu (Finals)
export const PINYIN_FINALS_MAP: Record<string, string> = {
  ang: 'ang',
  ong: 'ung',
  ian: 'ien',
  iao: 'iao',
  eng: 'âng',
  ing: 'inh',
  iong: 'iung',
  uang: 'uang',
  ueng: 'uâng',
  iang: 'iang',
  ai: 'ai',
  ei: 'ây',
  ui: 'uôi',
  ao: 'ao',
  ou: 'âu',
  iu: 'iêu',
  ie: 'iê',
  ue: 'uê',
  üe: 'uê',
  an: 'an',
  en: 'ơn',
  in: 'in',
  un: 'un',
  ün: 'uyn',
  uan: 'uan',
  üan: 'uyn',
  er: 'ơ',
  a: 'a',
  o: 'o',
  e: 'ơ',
  i: 'i',
  u: 'u',
  ü: 'uy',
  v: 'uy',
};

// Bảng ánh xạ nguyên âm có dấu sang nguyên âm gốc và thanh điệu (1: ngang, 2: sắc, 3: hỏi, 4: nặng/huyền)
const TONE_DECOMPOSE_MAP: Record<string, { base: string; tone: number }> = {
  ā: { base: 'a', tone: 1 },
  á: { base: 'a', tone: 2 },
  ǎ: { base: 'a', tone: 3 },
  à: { base: 'a', tone: 4 },
  ō: { base: 'o', tone: 1 },
  ó: { base: 'o', tone: 2 },
  ǒ: { base: 'o', tone: 3 },
  ò: { base: 'o', tone: 4 },
  ē: { base: 'e', tone: 1 },
  é: { base: 'e', tone: 2 },
  ě: { base: 'e', tone: 3 },
  è: { base: 'e', tone: 4 },
  ī: { base: 'i', tone: 1 },
  í: { base: 'i', tone: 2 },
  ǐ: { base: 'i', tone: 3 },
  ì: { base: 'i', tone: 4 },
  ū: { base: 'u', tone: 1 },
  ú: { base: 'u', tone: 2 },
  ǔ: { base: 'u', tone: 3 },
  ù: { base: 'u', tone: 4 },
  ǖ: { base: 'ü', tone: 1 },
  ǘ: { base: 'ü', tone: 2 },
  ǚ: { base: 'ü', tone: 3 },
  ǜ: { base: 'ü', tone: 4 },
};

// Gắn thanh điệu tiếng Việt lên nguyên âm
const VI_TONES: Record<string, [string, string, string, string, string]> = {
  // [tone 1 (ngang), tone 2 (sắc), tone 3 (hỏi), tone 4 (nặng), tone 5 (ngang)]
  a: ['a', 'á', 'ả', 'ạ', 'a'],
  ă: ['ă', 'ắ', 'ẳ', 'ặ', 'ă'],
  â: ['â', 'ấ', 'ẩ', 'ậ', 'â'],
  e: ['e', 'é', 'ẻ', 'ẹ', 'e'],
  ê: ['ê', 'ế', 'ể', 'ệ', 'ê'],
  i: ['i', 'í', 'ỉ', 'ị', 'i'],
  o: ['o', 'ó', 'ỏ', 'ọ', 'o'],
  ô: ['ô', 'ố', 'ổ', 'ộ', 'ô'],
  ơ: ['ơ', 'ớ', 'ở', 'ợ', 'ơ'],
  u: ['u', 'ú', 'ủ', 'ụ', 'u'],
  ư: ['ư', 'ứ', 'ử', 'ự', 'ư'],
  y: ['y', 'ý', 'ỷ', 'ỵ', 'y'],
};

function applyViTone(word: string, tone: number): string {
  if (tone <= 1 || tone === 5) return word;

  const lower = word.toLowerCase();
  let targetIdx = -1;

  // Ưu tiên đặt dấu trên ê, ô, ơ, â, ă
  for (let i = 0; i < lower.length; i++) {
    if ('êôơâă'.includes(lower[i])) {
      targetIdx = i;
      break;
    }
  }

  // Nếu không có, ưu tiên a, e
  if (targetIdx === -1) {
    for (let i = 0; i < lower.length; i++) {
      if ('ae'.includes(lower[i])) {
        targetIdx = i;
        break;
      }
    }
  }

  // Nếu có oa, oe, uy thì đặt ở nguyên âm sau
  if (targetIdx === -1) {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ('aiouyư'.includes(lower[i])) {
        targetIdx = i;
        break;
      }
    }
  }

  if (targetIdx === -1) return word;

  const ch = lower[targetIdx];
  const tonedArr = VI_TONES[ch];
  if (!tonedArr) return word;

  const tonedChar = tonedArr[tone - 1] || ch;
  return word.substring(0, targetIdx) + tonedChar + word.substring(targetIdx + 1);
}

/**
 * Chuyển đổi 1 âm tiết Pinyin đơn lẻ sang phiên âm tiếng Việt
 * Ví dụ: 'zhōng' -> 'trung', 'pàng' -> 'pạng'
 */
export function convertSinglePinyinToVietnamese(pinyinSyllable: string): string {
  let cleaned = pinyinSyllable.trim().toLowerCase();
  if (!cleaned) return '';

  let detectedTone = 1;

  // 1. Tách thanh điệu nếu có số cuối (ví dụ: zhong1)
  const numMatch = cleaned.match(/^([a-zūúǔùīíǐìōóǒòāáǎàēéěèüǖǘǚǜv]+)([1-5])$/);
  if (numMatch) {
    cleaned = numMatch[1];
    detectedTone = parseInt(numMatch[2], 10);
  } else {
    // Tách thanh điệu từ ký tự có dấu (ví dụ: zhōng -> o + tone 1)
    let deToned = '';
    for (const char of cleaned) {
      if (TONE_DECOMPOSE_MAP[char]) {
        deToned += TONE_DECOMPOSE_MAP[char].base;
        detectedTone = TONE_DECOMPOSE_MAP[char].tone;
      } else {
        deToned += char;
      }
    }
    cleaned = deToned;
  }

  // Chuẩn hoá u: thành ü
  cleaned = cleaned.replace(/u:/g, 'ü');

  // 2. Tách Thanh mẫu (Initial)
  let initial = '';
  let final = cleaned;

  // Kiểm tra thanh mẫu 2 ký tự trước (zh, ch, sh)
  if (cleaned.length >= 2 && PINYIN_INITIALS_MAP[cleaned.substring(0, 2)]) {
    initial = cleaned.substring(0, 2);
    final = cleaned.substring(2);
  } else if (cleaned.length >= 1 && PINYIN_INITIALS_MAP[cleaned.substring(0, 1)]) {
    initial = cleaned.substring(0, 1);
    final = cleaned.substring(1);
  }

  // 3. Chuyển đổi Thanh mẫu sang tiếng Việt
  let viInitial = initial ? (PINYIN_INITIALS_MAP[initial] ?? initial) : '';

  // 4. Chuyển đổi Vận mẫu sang tiếng Việt
  let viFinal = final ? (PINYIN_FINALS_MAP[final] ?? final) : '';

  // Xử lý trường hợp j: "chi":
  // Nếu initial là 'j' ("chi") và final bắt đầu bằng 'i', rút gọn tránh 'chii' -> 'chi', 'chia'
  if (initial === 'j') {
    if (viFinal.startsWith('i')) {
      viInitial = 'ch';
    } else if (viFinal === '') {
      viInitial = 'chi';
    } else {
      viInitial = 'chi';
    }
  }

  // Ghép lại
  let combined = viInitial + viFinal;
  if (!combined) combined = pinyinSyllable;

  // 5. Gắn thanh điệu tiếng Việt (nếu có)
  return applyViTone(combined, detectedTone);
}

const PINYIN_REGEX = /^(zh|ch|sh|[bpmfdtnlgkhjqxzcsryw])?(iang|uang|iong|ueng|ian|iao|ang|eng|ing|ong|uai|uan|uen|uang|ai|ei|ao|ou|an|en|er|in|un|ia|ie|iu|ua|uo|ui|ue|üe|ün|üan|[aoeiuvü])/i;

/**
 * Tách một chuỗi Pinyin liền nhau không dấu cách (vd: "meiyou", "nihao") thành mảng các âm tiết
 */
export function splitPinyin(str: string): string[] {
  let text = str.trim().toLowerCase();
  const syllables: string[] = [];
  while (text.length > 0) {
    const match = text.match(PINYIN_REGEX);
    if (!match || match[0].length === 0) {
      syllables.push(text[0]);
      text = text.slice(1);
    } else {
      syllables.push(match[0]);
      text = text.slice(match[0].length);
    }
  }
  return syllables;
}

/**
 * Chuyển đổi chuỗi Pinyin (có thể gồm nhiều từ hoặc dấu phẩy hoặc viết liền không dấu cách) sang tiếng Việt
 * Ví dụ:
 *  "zhōng" -> "trung"
 *  "pán, pàng" -> "pán, pạng"
 *  "nǐ hǎo" -> "nỉ hảo"
 *  "meiyou" -> "mấy yẩu"
 */
export function pinyinToVietnamese(pinyinStr: string): string {
  if (!pinyinStr || typeof pinyinStr !== 'string') return '';

  // Xử lý các từ cách nhau bởi dấu phẩy
  if (pinyinStr.includes(',')) {
    return pinyinStr
      .split(',')
      .map((part) => pinyinToVietnamese(part.trim()))
      .filter(Boolean)
      .join(', ');
  }

  // Xử lý các từ cách nhau bởi dấu cách
  if (/\s+/.test(pinyinStr.trim())) {
    return pinyinStr
      .trim()
      .split(/\s+/)
      .map((syllable) => convertSinglePinyinToVietnamese(syllable))
      .join(' ');
  }

  // Xử lý pinyin viết liền không dấu cách (vd: "meiyou", "nihao")
  const syllables = splitPinyin(pinyinStr);
  return syllables.map((s) => convertSinglePinyinToVietnamese(s)).join(' ');
}
