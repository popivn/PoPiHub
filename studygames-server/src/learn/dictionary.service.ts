import { Injectable, Logger } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pinyinToVietnamese, splitPinyin } from './pinyin-vietnamese.helper';

export interface DictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string;
  vietnamese: string;
}

export interface CompoundWord {
  word: string;
  pinyin: string;
  meaning: string;
}

export interface CharacterLookup {
  char: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  meaningEn: string;
  pos?: string;
  posVi?: string;
  hskLevel?: number;
  synonyms?: string[];
  antonyms?: string[];
  compounds?: CompoundWord[];
  examples: { sentence: string; pinyin: string; meaning: string }[];
}

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private cedictMap = new Map<string, DictEntry[]>();
  private cvdictMap = new Map<string, DictEntry[]>();
  private synonymsMap = new Map<string, string[]>();
  private antonymsMap = new Map<string, string[]>();
  private hskPosMap = new Map<string, { pos: string; posVi: string; level?: number }>();
  private sentences: { chinese: string; pinyin: string; translation?: { en?: string; vi?: string } }[] = [];
  private translationsViMap = new Map<string, string>();
  private loaded = false;

  onModuleInit() {
    this.load();
  }

  private load() {
    if (this.loaded) return;

    try {
      const cedictPath = resolve(process.cwd(), 'data', 'cedict.txt');
      const cedictRaw = readFileSync(cedictPath, 'utf-8');
      this.parseDict(cedictRaw, this.cedictMap, 'en');
      this.logger.log(`Loaded CEDICT: ${this.cedictMap.size} unique entries`);
    } catch (e: any) {
      this.logger.warn(`Failed to load CEDICT: ${e?.message || e}`);
    }

    try {
      const cvdictPath = resolve(process.cwd(), 'data', 'cvdict.u8');
      const cvdictRaw = readFileSync(cvdictPath, 'utf-8');
      this.parseDict(cvdictRaw, this.cvdictMap, 'vi');
      this.logger.log(`Loaded CVDICT: ${this.cvdictMap.size} unique entries`);
    } catch (e: any) {
      this.logger.warn(`Failed to load CVDICT: ${e?.message || e}`);
    }

    try {
      const synPath = resolve(process.cwd(), 'data', 'lexical', 'synonyms.json');
      if (existsSync(synPath)) {
        const raw = readFileSync(synPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          if (Array.isArray(v)) this.synonymsMap.set(k, v as string[]);
        }
        this.logger.log(`Loaded ${this.synonymsMap.size} synonyms entries`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load synonyms.json: ${e?.message || e}`);
    }

    try {
      const antPath = resolve(process.cwd(), 'data', 'lexical', 'antonyms.json');
      if (existsSync(antPath)) {
        const raw = readFileSync(antPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          if (Array.isArray(v)) this.antonymsMap.set(k, v as string[]);
        }
        this.logger.log(`Loaded ${this.antonymsMap.size} antonyms entries`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load antonyms.json: ${e?.message || e}`);
    }

    try {
      const posPath = resolve(process.cwd(), 'data', 'lexical', 'hsk-pos.json');
      if (existsSync(posPath)) {
        const raw = readFileSync(posPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          this.hskPosMap.set(k, v as any);
        }
        this.logger.log(`Loaded ${this.hskPosMap.size} HSK POS entries`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load hsk-pos.json: ${e?.message || e}`);
    }

    try {
      const sentencesPath = resolve(process.cwd(), 'data', 'hsk', 'sentences.json');
      if (existsSync(sentencesPath)) {
        const sentencesRaw = readFileSync(sentencesPath, 'utf-8');
        this.sentences = JSON.parse(sentencesRaw);
        // Nạp các bản dịch 'vi' đã có sẵn trong sentences.json vào map
        for (const s of this.sentences) {
          if (s.chinese && s.translation?.vi) {
            this.translationsViMap.set(s.chinese, s.translation.vi);
          }
        }
        this.logger.log(`Loaded ${this.sentences.length} HSK example sentences (${this.translationsViMap.size} with 'vi')`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load HSK sentences: ${e?.message || e}`);
    }

    try {
      const viPath = resolve(process.cwd(), 'data', 'hsk', 'translations-vi.json');
      if (existsSync(viPath)) {
        const raw = readFileSync(viPath, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof v === 'string') this.translationsViMap.set(k, v);
        }
        this.logger.log(`Loaded ${this.translationsViMap.size} total cached Vietnamese translations`);
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load translations-vi.json: ${e?.message || e}`);
    }

    this.loaded = true;
  }

  private saveSentencesJson() {
    try {
      const sentencesPath = resolve(process.cwd(), 'data', 'hsk', 'sentences.json');
      writeFileSync(sentencesPath, JSON.stringify(this.sentences, null, 2), 'utf-8');
      this.logger.log(`Updated and saved 'vi' into data/hsk/sentences.json`);
    } catch (e: any) {
      this.logger.warn(`Failed to save sentences.json: ${e?.message || e}`);
    }
  }

  private saveTranslationsVi() {
    try {
      const viPath = resolve(process.cwd(), 'data', 'hsk', 'translations-vi.json');
      const obj: Record<string, string> = {};
      for (const [k, v] of this.translationsViMap.entries()) {
        obj[k] = v;
      }
      writeFileSync(viPath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e: any) {
      this.logger.warn(`Failed to save translations-vi.json: ${e?.message || e}`);
    }
  }

  private parseDict(raw: string, map: Map<string, DictEntry[]>, lang: 'en' | 'vi') {
    const lines = raw.split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') continue;

      const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
      if (!match) continue;

      const [, traditional, simplified, pinyin, meanings] = match;
      const meaning = meanings.split('/').filter((m) => m.trim() !== '');

      const entry: DictEntry = {
        traditional,
        simplified,
        pinyin: this.formatPinyin(pinyin),
        english: lang === 'en' ? meaning.join('; ') : '',
        vietnamese: lang === 'vi' ? meaning.join('; ') : '',
      };

      for (const key of [simplified, traditional]) {
        const existing = map.get(key);
        if (existing) {
          const found = existing.find(
            (e) => e.pinyin === entry.pinyin && e.simplified === entry.simplified,
          );
          if (found) {
            if (lang === 'en') found.english = entry.english;
            else found.vietnamese = entry.vietnamese;
          } else {
            existing.push(entry);
          }
        } else {
          map.set(key, [entry]);
        }
      }
    }
  }

  private formatPinyin(raw: string): string {
    const toneMap: Record<string, string[]> = {
      a: ['ā', 'á', 'ǎ', 'à', 'a'],
      o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
      e: ['ē', 'é', 'ě', 'è', 'e'],
      i: ['ī', 'í', 'ǐ', 'ì', 'i'],
      u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
      v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
      'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
    };

    return raw
      .replace(/u:/g, 'ü')
      .split(/\s+/)
      .map((syllable) => {
        const match = syllable.match(/^([a-zA-ZüÜ]+)([1-5])$/);
        if (!match) {
          return syllable.replace(/\d/g, '');
        }

        const [, base, toneStr] = match;
        const tone = parseInt(toneStr, 10);
        if (tone === 5) return base;

        const lowerBase = base.toLowerCase();
        let vowelIdx = -1;
        if (lowerBase.includes('a')) {
          vowelIdx = lowerBase.indexOf('a');
        } else if (lowerBase.includes('e')) {
          vowelIdx = lowerBase.indexOf('e');
        } else if (lowerBase.includes('ou')) {
          vowelIdx = lowerBase.indexOf('o');
        } else {
          for (let i = lowerBase.length - 1; i >= 0; i--) {
            if ('aioueüv'.includes(lowerBase[i])) {
              vowelIdx = i;
              break;
            }
          }
        }

        if (vowelIdx === -1) return base;

        const vowelChar = lowerBase[vowelIdx];
        const isUpper = base[vowelIdx] === base[vowelIdx].toUpperCase();
        const tonedChar = toneMap[vowelChar]?.[tone - 1] || vowelChar;
        const finalToned = isUpper ? tonedChar.toUpperCase() : tonedChar;

        return base.substring(0, vowelIdx) + finalToned + base.substring(vowelIdx + 1);
      })
      .join(' ')
      .trim();
  }

  private stripTones(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ü/g, 'u')
      .toLowerCase();
  }

  /**
   * Lookup a single character or word in both dictionaries.
   * Merges English (CEDICT) and Vietnamese (CVDICT) meanings.
   */
  lookup(word: string, options?: { includeExtras?: boolean }): CharacterLookup | null {
    this.load();
    if (!word) return null;

    const cedictEntries = this.cedictMap.get(word) || [];
    const cvdictEntries = this.cvdictMap.get(word) || [];

    if (cedictEntries.length === 0 && cvdictEntries.length === 0) {
      // Fallback: Nếu word là Pinyin (vd: "meiyou", "nihao") hoặc từ phiên âm, tìm kết quả phù hợp nhất
      const phraseMatches = this.phraseSearch(word, 1);
      if (phraseMatches.length > 0 && phraseMatches[0].simplified !== word) {
        return this.lookup(phraseMatches[0].simplified, options);
      }
      const charMatches = this.search(word, 1);
      if (charMatches.length > 0 && charMatches[0].char !== word) {
        return charMatches[0];
      }
      return null;
    }

    const cedict = cedictEntries[0];
    const cvdict = cvdictEntries[0];

    // For single character, collect all distinct pinyin readings if multiple exist
    const pinyinSet = new Set<string>();
    for (const entry of [...cedictEntries, ...cvdictEntries]) {
      if (entry.pinyin) {
        entry.pinyin.split(/[,;\s]+/).forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) pinyinSet.add(trimmed);
        });
      }
    }
    const pinyin = word.length === 1 && pinyinSet.size > 0
      ? Array.from(pinyinSet).join(', ')
      : (cedict?.pinyin || cvdict?.pinyin || '');
    const meaningEn = cedict?.english || '';
    const vietnamese = cvdict?.vietnamese || '';

    // Extract Hán-Việt from Vietnamese meaning (usually first part before explanation)
    const hanViet = this.extractHanViet(vietnamese, word);

    // Find example sentences from CEDICT entries
    const examples: { sentence: string; pinyin: string; meaning: string }[] = [];
    const seen = new Set<string>();
    for (const entry of [...cedictEntries, ...cvdictEntries]) {
      if (entry.simplified === word || entry.traditional === word) continue;
      if (entry.simplified.length <= 1) continue;
      if (seen.has(entry.simplified)) continue;
      seen.add(entry.simplified);

      const meaning = entry.vietnamese || entry.english || '';
      if (meaning && examples.length < 3) {
        examples.push({
          sentence: entry.simplified,
          pinyin: entry.pinyin,
          meaning,
        });
      }
    }

    // POS (Tính từ / Động từ / Danh từ...)
    const hskInfo = this.hskPosMap.get(word);
    const pos = hskInfo?.pos;
    const posVi = hskInfo?.posVi;
    const hskLevel = hskInfo?.level;

    const includeExtras = options?.includeExtras ?? true;

    // Synonyms & Antonyms
    const synonyms = includeExtras ? (this.synonymsMap.get(word) || []).slice(0, 10) : undefined;
    const antonyms = includeExtras ? (this.antonymsMap.get(word) || []).slice(0, 10) : undefined;

    // Compounds (Từ ghép liên quan)
    const compounds = includeExtras ? this.getCompoundWords(word, 8) : undefined;

    return {
      char: word,
      pinyin,
      hanViet,
      meaning: vietnamese || meaningEn,
      meaningEn,
      pos,
      posVi,
      hskLevel,
      synonyms,
      antonyms,
      compounds,
      examples,
    };
  }

  getCompoundWords(word: string, limit = 8): CompoundWord[] {
    const results: CompoundWord[] = [];
    const seen = new Set<string>();

    // 1. Check cvdictMap (Vietnamese meanings)
    for (const [, entries] of this.cvdictMap) {
      const entry = entries[0];
      if (!entry || !entry.vietnamese) continue;
      const simp = entry.simplified;
      if (simp.includes(word) && simp !== word && !seen.has(simp)) {
        seen.add(simp);
        const firstMeaning = entry.vietnamese.split(';')[0].trim();
        results.push({
          word: simp,
          pinyin: entry.pinyin,
          meaning: firstMeaning,
        });
      }
      if (results.length >= 60) break;
    }

    // 2. Check cedictMap if more needed
    if (results.length < limit) {
      for (const [, entries] of this.cedictMap) {
        const entry = entries[0];
        if (!entry) continue;
        const simp = entry.simplified;
        if (simp.includes(word) && simp !== word && !seen.has(simp)) {
          seen.add(simp);
          const firstMeaning = (entry.vietnamese || entry.english || '').split(';')[0].trim();
          results.push({
            word: simp,
            pinyin: entry.pinyin,
            meaning: firstMeaning,
          });
        }
        if (results.length >= 60) break;
      }
    }

    // Sort compounds by length (2-char words first, then 3, then 4)
    results.sort((a, b) => a.word.length - b.word.length);
    return results.slice(0, limit);
  }

  private extractHanViet(vietnamese: string, char: string): string {
    if (!vietnamese) return '';
    // First meaning segment often starts with the Hán-Việt reading
    const firstMeaning = vietnamese.split(';')[0].trim();
    // Try to extract the Hán-Việt part (usually before the explanation in parentheses)
    const parenMatch = firstMeaning.match(/^([^()]+)/);
    if (parenMatch) {
      const candidate = parenMatch[1].trim();
      // If it's a short word (1-4 chars), likely the Hán-Việt reading
      if (candidate.length <= 10 && candidate.length > 0) {
        return candidate;
      }
    }
    return firstMeaning;
  }

  /**
   * Search characters by keyword (in pinyin, meaning, or the character itself).
   */
  search(query: string, limit = 20): CharacterLookup[] {
    this.load();
    const results: { lookup: CharacterLookup; score: number }[] = [];
    const seen = new Set<string>();
    const q = query.toLowerCase().trim();

    if (!q) return [];
    const qClean = this.stripTones(q);
    const qNoSpaces = qClean.replace(/[\s\-_]+/g, '');

    const checkMap = (map: Map<string, DictEntry[]>) => {
      for (const [key, entries] of map) {
        if (key.length !== 1 || seen.has(key)) continue;
        for (const entry of entries) {
          const pClean = this.stripTones(entry.pinyin);
          const pNoSpaces = pClean.replace(/[\s\-_]+/g, '');
          const viReading = pinyinToVietnamese(entry.pinyin);
          const viReadingClean = this.stripTones(viReading).replace(/[\s\-_]+/g, '');

          let score = 0;
          if (entry.simplified === q) {
            score = 1000;
          } else if (pNoSpaces === qNoSpaces) {
            score = 900;
          } else if (viReadingClean === qNoSpaces) {
            score = 850;
          } else if (pNoSpaces.startsWith(qNoSpaces)) {
            score = 800;
          } else if (viReadingClean.startsWith(qNoSpaces)) {
            score = 750;
          } else if (pNoSpaces.includes(qNoSpaces)) {
            score = 650;
          } else if (viReadingClean.includes(qNoSpaces)) {
            score = 600;
          } else if (entry.vietnamese && this.stripTones(entry.vietnamese).includes(qClean)) {
            score = 500;
          } else if (entry.english && entry.english.toLowerCase().includes(q)) {
            score = 400;
          }

          if (score > 0) {
            seen.add(key);
            const lookup = this.lookup(key, { includeExtras: false });
            if (lookup) {
              results.push({ lookup, score });
            }
            break;
          }
        }
      }
    };

    checkMap(this.cvdictMap);
    checkMap(this.cedictMap);

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map((r) => r.lookup);
  }

  /**
   * Find single characters whose Vietnamese meaning contains any of the given keywords.
   * Used for auto-categorization.
   */
  findSingleCharsByKeywords(keywords: string[], limit = 50): CharacterLookup[] {
    this.load();
    const results: CharacterLookup[] = [];
    const seen = new Set<string>();

    for (const [key, entries] of this.cvdictMap) {
      if (key.length !== 1) continue;
      if (seen.has(key)) continue;
      if (!this.isCjkUnifiedIdeograph(key)) continue;

      const matches = keywords.some((kw) =>
        entries.some((e) => e.vietnamese.toLowerCase().includes(kw)),
      );

      if (matches) {
        seen.add(key);
        const lookup = this.lookup(key, { includeExtras: false });
        if (lookup && this.isUsableLookup(lookup)) {
          results.push(lookup);
        }
      }
      if (results.length >= limit) break;
    }

    return results;
  }

  private isCjkUnifiedIdeograph(char: string): boolean {
    const code = char.codePointAt(0) ?? 0;
    // CJK Unified Ideographs blocks A, B, C, D, E, F... are too rare for learning.
    // Restrict to the most common block for educational vocabulary.
    return code >= 0x4e00 && code <= 0x9fff;
  }

  private isUsableEntry(entry: DictEntry): boolean {
    if (!entry.pinyin || !entry.vietnamese) return false;
    if (/^[\d\W]+$/.test(entry.vietnamese)) return false;
    const firstMeaning = entry.vietnamese.split(/[;/]/)[0].trim().toLowerCase();
    // Reject entries that are ONLY a surname reading with no other info
    if (firstMeaning.startsWith('họ') && !entry.vietnamese.includes(';')) return false;
    return true;
  }

  private isUsableLookup(lookup: CharacterLookup): boolean {
    if (!lookup.pinyin || lookup.pinyin.trim().length === 0) return false;
    if (/\d/.test(lookup.pinyin)) return false; // reject tone-numbered pinyin leftovers
    if (!lookup.hanViet && !lookup.meaning) return false;
    return true;
  }

  /**
   * Search phrases / compound words (and characters) matching query in CEDICT or CVDICT.
   * Hỗ trợ tìm kiếm theo chữ Hán, Pinyin có dấu / không dấu / viết liền (vd: meiyou, nihao),
   * và phiên âm đọc Tiếng Việt (vd: mấy yẩu, nỉ hảo).
   */
  phraseSearch(query: string, limit = 20): DictEntry[] {
    this.load();
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const qClean = this.stripTones(q);
    const qNoSpaces = qClean.replace(/[\s\-_]+/g, '');

    const matches: { entry: DictEntry; score: number }[] = [];
    const seen = new Set<string>();

    const checkMap = (map: Map<string, DictEntry[]>) => {
      for (const [, entries] of map) {
        for (const rawEntry of entries) {
          if (!rawEntry.simplified) continue;
          if (seen.has(rawEntry.simplified)) continue;

          // Bổ sung nghĩa tiếng Việt nếu entry hiện tại từ CEDICT chưa có
          let entry = rawEntry;
          if (!entry.vietnamese) {
            const cv = this.cvdictMap.get(entry.simplified)?.[0];
            if (cv?.vietnamese) {
              entry = { ...entry, vietnamese: cv.vietnamese };
            }
          }

          const pClean = this.stripTones(entry.pinyin);
          const pNoSpaces = pClean.replace(/[\s\-_]+/g, '');
          const viReading = pinyinToVietnamese(entry.pinyin);
          const viReadingClean = this.stripTones(viReading).replace(/[\s\-_]+/g, '');

          let score = 0;
          if (entry.simplified === q) {
            score = 1000;
          } else if (pNoSpaces === qNoSpaces) {
            // Khớp chính xác Pinyin (vd: "meiyou" khớp "méi yǒu") -> ưu tiên từ ngắn nhất trước
            score = 900 - entry.simplified.length * 2;
          } else if (viReadingClean === qNoSpaces) {
            // Khớp chính xác phiên âm tiếng Việt (vd: "may yau" khớp "mấy yẩu")
            score = 850 - entry.simplified.length * 2;
          } else if (pNoSpaces.startsWith(qNoSpaces)) {
            score = 800 - entry.simplified.length * 2;
          } else if (viReadingClean.startsWith(qNoSpaces)) {
            score = 750 - entry.simplified.length * 2;
          } else if (entry.simplified.startsWith(q)) {
            score = 720 - entry.simplified.length * 2;
          } else if (entry.simplified.includes(q)) {
            score = 700 - entry.simplified.length * 2;
          } else if (pNoSpaces.includes(qNoSpaces)) {
            score = 650 - entry.simplified.length * 2;
          } else if (viReadingClean.includes(qNoSpaces)) {
            score = 600 - entry.simplified.length * 2;
          } else if (entry.vietnamese && this.stripTones(entry.vietnamese).includes(qClean)) {
            score = 500 - entry.simplified.length * 2;
          } else if (entry.english && entry.english.toLowerCase().includes(q)) {
            score = 400 - entry.simplified.length * 2;
          }

          if (score > 0) {
            seen.add(entry.simplified);
            matches.push({ entry, score });
          }
        }
      }
    };

    // Quét CVDICT trước (ưu tiên có nghĩa tiếng Việt) rồi CEDICT
    checkMap(this.cvdictMap);
    checkMap(this.cedictMap);

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, limit).map((m) => m.entry);
  }

  /**
   * Get detailed character info including decomposition and radical.
   */
  async getHanziDetails(char: string): Promise<Record<string, any> | null> {
    this.load();
    if (!char || char.length !== 1) return null;

    const lookup = this.lookup(char);
    const cedictEntries = this.cedictMap.get(char) || [];
    const cvdictEntries = this.cvdictMap.get(char) || [];

    const pinyinSet = new Set<string>();
    for (const entry of [...cedictEntries, ...cvdictEntries]) {
      if (entry.pinyin) {
        entry.pinyin.split(/[,;\s]+/).forEach((p) => {
          const trimmed = p.trim();
          if (trimmed) pinyinSet.add(trimmed);
        });
      }
    }
    if (lookup?.pinyin) {
      lookup.pinyin.split(/[,;\s]+/).forEach((p) => {
        const trimmed = p.trim();
        if (trimmed) pinyinSet.add(trimmed);
      });
    }

    const result: Record<string, any> = {
      character: char,
      definition: lookup?.meaning || '',
      pinyin: Array.from(pinyinSet),
    };

    // Try to get stroke data from Hanzi Writer CDN
    try {
      const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        result.strokes = data.strokes || [];
        result.medians = data.medians || [];
        result.radical = data.rad || '';
        result.decomposition = data.moeSimplified || '';
        if (data.etymology) {
          result.etymology = {
            type: data.etymology.type || '',
            hint: data.etymology.hint || '',
          };
        }
      }
    } catch {}

    return result;
  }

  /**
   * Translate etymology hint to Vietnamese (simple mapping for common types).
   */
  getHanziEtymologyVi(char: string): { translated: string } | null {
    this.load();
    if (!char || char.length !== 1) return null;

    // For now, return a placeholder since we don't have a translation API
    // In production, you could use Google Translate API or similar
    return {
      translated: `Chữ ${char} - xem chi tiết bằng tiếng Anh`,
    };
  }

  /**
   * Find example sentences containing the given character/word.
   */
  getExamples(word: string): { sentence: string; pinyin: string; meaning: string; meaningEn?: string; meaningVi?: string }[] {
    this.load();
    if (!word) return [];

    const results: { sentence: string; pinyin: string; meaning: string; meaningEn?: string; meaningVi?: string }[] = [];
    const seen = new Set<string>();

    // 1. Ưu tiên tìm trong 4.354 câu ví dụ chuẩn HSK (sentences.json)
    if (this.sentences && this.sentences.length > 0) {
      for (const s of this.sentences) {
        if (s.chinese && s.chinese.includes(word)) {
          if (seen.has(s.chinese)) continue;
          seen.add(s.chinese);

          const meaningVi = this.translationsViMap.get(s.chinese) || s.translation?.vi || '';
          const meaningEn = s.translation?.en || '';

          results.push({
            sentence: s.chinese,
            pinyin: s.pinyin || '',
            meaning: meaningVi || meaningEn || '',
            meaningEn,
            meaningVi,
          });
          if (results.length >= 3) return results;
        }
      }
    }

    // 2. Fallback: Search CEDICT for compound words/phrases
    for (const [, entries] of this.cedictMap) {
      for (const entry of entries) {
        if (entry.simplified === word) continue;
        if (!entry.simplified.includes(word)) continue;
        if (seen.has(entry.simplified)) continue;
        seen.add(entry.simplified);

        const meaningVi = this.translationsViMap.get(entry.simplified) || '';
        const meaningEn = entry.english || '';

        results.push({
          sentence: entry.simplified,
          pinyin: entry.pinyin,
          meaning: meaningVi || meaningEn || '',
          meaningEn,
          meaningVi,
        });
        if (results.length >= 3) return results;
      }
    }

    // 3. Fallback: Search CVDICT for Vietnamese meanings
    for (const [, entries] of this.cvdictMap) {
      for (const entry of entries) {
        if (entry.simplified === word) continue;
        if (!entry.simplified.includes(word)) continue;
        if (seen.has(entry.simplified)) continue;
        seen.add(entry.simplified);

        const meaningVi = this.translationsViMap.get(entry.simplified) || entry.vietnamese || '';

        results.push({
          sentence: entry.simplified,
          pinyin: entry.pinyin,
          meaning: meaningVi,
          meaningEn: '',
          meaningVi,
        });
        if (results.length >= 3) return results;
      }
    }

    return results;
  }

  /**
   * Translate Chinese sentences to Vietnamese using OpenRouter (Gemini Flash).
   * Caches results in translationsViMap and persists to data/hsk/translations-vi.json.
   */
  async translateSentences(sentences: string[]): Promise<Record<string, string>> {
    this.load();
    const result: Record<string, string> = {};
    if (!Array.isArray(sentences) || sentences.length === 0) return result;

    const missing: string[] = [];
    for (const s of sentences) {
      if (!s || typeof s !== 'string') continue;
      const cached = this.translationsViMap.get(s);
      if (cached) {
        result[s] = cached;
      } else {
        missing.push(s);
      }
    }

    if (missing.length === 0) return result;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      this.logger.warn('OPENROUTER_API_KEY is not configured. Cannot translate example sentences.');
      return result;
    }

    try {
      this.logger.log(`Translating ${missing.length} sentences with AI...`);
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert Chinese-to-Vietnamese translator. Translate the given JSON array of Chinese sentences into natural, idiomatic Vietnamese. Output ONLY a valid JSON array of strings corresponding to the input sentences, with no Markdown ticks or extra text.',
            },
            {
              role: 'user',
              content: JSON.stringify(missing),
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        this.logger.error(`OpenRouter error (${response.status}): ${errText}`);
        return result;
      }

      const data = await response.json();
      const rawContent = data?.choices?.[0]?.message?.content?.trim() || '';
      const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        missing.forEach((s, idx) => {
          if (parsed[idx] && typeof parsed[idx] === 'string') {
            const vi = parsed[idx].trim();
            this.translationsViMap.set(s, vi);
            result[s] = vi;
          }
        });
        this.saveTranslationsVi();
        this.logger.log(`Successfully translated and cached ${missing.length} sentences.`);
      }
    } catch (e: any) {
      this.logger.error(`Failed to translate sentences with AI: ${e?.message || e}`);
    }

    return result;
  }

  /**
   * Cache toàn bộ single-char lookups (built lazily, 1 lần duy nhất).
   * Dùng cho filter "Tất Cả" — lấy toàn bộ từ vựng trong dataset không phân biệt category.
   */
  private allSingleCharCache: CharacterLookup[] | null = null;

  getAllSingleChars(): CharacterLookup[] {
    this.load();
    if (this.allSingleCharCache) return this.allSingleCharCache;

    const results: CharacterLookup[] = [];
    const seen = new Set<string>();

    // Ưu tiên cvdict (có nghĩa tiếng Việt) trước, rồi bổ sung từ cedict
    for (const [key] of this.cvdictMap) {
      if (key.length !== 1 || seen.has(key) || !this.isCjkUnifiedIdeograph(key)) continue;
      const lookup = this.lookup(key, { includeExtras: false });
      if (lookup && this.isUsableLookup(lookup)) {
        seen.add(key);
        results.push(lookup);
      }
    }
    for (const [key] of this.cedictMap) {
      if (key.length !== 1 || seen.has(key) || !this.isCjkUnifiedIdeograph(key)) continue;
      const lookup = this.lookup(key, { includeExtras: false });
      if (lookup && this.isUsableLookup(lookup)) {
        seen.add(key);
        results.push(lookup);
      }
    }

    this.allSingleCharCache = results;
    this.logger.log(`Built all-single-char cache: ${results.length} entries`);
    return results;
  }
}
