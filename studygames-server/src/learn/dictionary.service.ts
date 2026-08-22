import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface DictEntry {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string;
  vietnamese: string;
}

export interface CharacterLookup {
  char: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  meaningEn: string;
  examples: { sentence: string; pinyin: string; meaning: string }[];
}

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private cedictMap = new Map<string, DictEntry[]>();
  private cvdictMap = new Map<string, DictEntry[]>();
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

    this.loaded = true;
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
    return raw
      .replace(/u:/g, 'ü')
      .replace(/\d/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Lookup a single character or word in both dictionaries.
   * Merges English (CEDICT) and Vietnamese (CVDICT) meanings.
   */
  lookup(word: string): CharacterLookup | null {
    this.load();
    if (!word) return null;

    const cedictEntries = this.cedictMap.get(word) || [];
    const cvdictEntries = this.cvdictMap.get(word) || [];

    if (cedictEntries.length === 0 && cvdictEntries.length === 0) return null;

    const cedict = cedictEntries[0];
    const cvdict = cvdictEntries[0];

    const pinyin = cedict?.pinyin || cvdict?.pinyin || '';
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

    return {
      char: word,
      pinyin,
      hanViet,
      meaning: vietnamese || meaningEn,
      meaningEn,
      examples,
    };
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
    const results: CharacterLookup[] = [];
    const seen = new Set<string>();
    const q = query.toLowerCase().trim();

    if (!q) return [];

    // Search in CVDICT (Vietnamese meanings)
    for (const [key, entries] of this.cvdictMap) {
      for (const entry of entries) {
        if (seen.has(key)) continue;
        const matches =
          entry.simplified.includes(q) ||
          entry.pinyin.toLowerCase().includes(q) ||
          entry.vietnamese.toLowerCase().includes(q);

        if (matches && key.length === 1) {
          seen.add(key);
          const lookup = this.lookup(key);
          if (lookup && results.length < limit) {
            results.push(lookup);
          }
        }
      }
      if (results.length >= limit) break;
    }

    // Also search CEDICT if not enough results
    if (results.length < limit) {
      for (const [key, entries] of this.cedictMap) {
        if (seen.has(key)) continue;
        for (const entry of entries) {
          if (entry.simplified.includes(q) || entry.pinyin.toLowerCase().includes(q) || entry.english.toLowerCase().includes(q)) {
            if (key.length === 1) {
              seen.add(key);
              const lookup = this.lookup(key);
              if (lookup && results.length < limit) {
                results.push(lookup);
              }
            }
          }
        }
        if (results.length >= limit) break;
      }
    }

    return results;
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

      for (const entry of entries) {
        if (!this.isUsableEntry(entry)) continue;

        const meaning = entry.vietnamese.toLowerCase();
        const matched = keywords.some((kw) => meaning.includes(kw.toLowerCase()));
        if (matched) {
          seen.add(key);
          const lookup = this.lookup(key);
          if (lookup && this.isUsableLookup(lookup) && results.length < limit) {
            results.push(lookup);
          }
          break;
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
      const lookup = this.lookup(key);
      if (lookup && this.isUsableLookup(lookup)) {
        seen.add(key);
        results.push(lookup);
      }
    }
    for (const [key] of this.cedictMap) {
      if (key.length !== 1 || seen.has(key) || !this.isCjkUnifiedIdeograph(key)) continue;
      const lookup = this.lookup(key);
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
