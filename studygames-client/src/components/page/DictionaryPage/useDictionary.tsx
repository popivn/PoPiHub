import { useState, useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { apiUrl, routes } from '../../../services/routes';

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

export interface DictPhrase {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string;
  vietnamese: string;
}

export interface HanziDetails {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  radical?: string;
  etymology?: { type?: string; hint?: string };
  strokes?: string[];
  medians?: number[][][];
}

export interface HotKeyword {
  word: string;
  pinyin: string;
  meaning: string;
  searchCount: number;
}

export interface Topic {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  wordCount: number;
}

export interface ExampleSentence {
  sentence: string;
  pinyin: string;
  meaning: string;
  meaningEn?: string;
  meaningVi?: string;
  isTranslating?: boolean;
}

export interface DictionaryState {
  query: string;
  isSearching?: boolean;
  searched: boolean;
  results: DictPhrase[];
  selected: CharacterLookup | null;
  hanzi: HanziDetails | null;
  loading: boolean;
  isSearchFocused: boolean;
  animateStrokes: boolean;
  history: { selected: CharacterLookup; hanzi: HanziDetails | null }[];
  activeChar: string | null;
  activeCharMeaning: string;
  activeCharPinyin: string;
  etymologyVi: string | null;
  etymologyLoading: boolean;
  recentSearches: string[];
  aiExamples: ExampleSentence[] | null;
  aiExamplesLoading: boolean;
  topics: Topic[];
  topicsLoading: boolean;
  selectedTopic: Topic | null;
  topicWords: any[];
  topicWordsLoading: boolean;
}

export interface DictionaryActions {
  setQuery: (query: string) => void;
  setIsSearchFocused: (focused: boolean) => void;
  lookup: (word: string) => Promise<void>;
  goBack: () => void;
  loadHanziForChar: (char: string) => Promise<void>;
  speakText: (text: string) => void;
  toggleStrokeAnimation: () => void;
  clearSearch: () => void;
  fetchTopics: () => Promise<void>;
  fetchTopicWords: (topicId: string) => Promise<void>;
  setSelectedTopic: (topic: Topic | null) => void;
  search: (q: string) => Promise<void>;
}

const hotKeywords: HotKeyword[] = [
  { word: '学习', pinyin: 'xué xí', meaning: 'Học tập', searchCount: 1250 },
  { word: '中国', pinyin: 'zhōng guó', meaning: 'Trung Quốc', searchCount: 980 },
  { word: '朋友', pinyin: 'péng you', meaning: 'Bạn bè', searchCount: 856 },
  { word: '爱', pinyin: 'ài', meaning: 'Yêu thương', searchCount: 743 },
  { word: '时间', pinyin: 'shí jiān', meaning: 'Thời gian', searchCount: 692 },
  { word: '工作', pinyin: 'gōng zuò', meaning: 'Công việc', searchCount: 621 },
  { word: '家庭', pinyin: 'jiā tíng', meaning: 'Gia đình', searchCount: 587 },
  { word: '快乐', pinyin: 'kuài lè', meaning: 'Vui vẻ', searchCount: 534 },
  { word: '生活', pinyin: 'shēng huó', meaning: 'Cuộc sống', searchCount: 498 },
  { word: '梦想', pinyin: 'mèng xiǎng', meaning: 'Giấc mơ', searchCount: 456 },
];

export const useDictionary = (lang: string) => {
  const [state, setState] = useState<DictionaryState>({
    query: '',
    results: [],
    selected: null,
    hanzi: null,
    loading: false,
    searched: false,
    isSearchFocused: false,
    animateStrokes: false,
    history: [],
    activeChar: null,
    activeCharMeaning: '',
    activeCharPinyin: '',
    etymologyVi: null,
    etymologyLoading: false,
    recentSearches: (() => {
      try {
        const saved = localStorage.getItem('dict-recent');
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    })(),
    aiExamples: null,
    aiExamplesLoading: false,
    topics: [],
    topicsLoading: false,
    selectedTopic: null,
    topicWords: [],
    topicWordsLoading: false,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setState(prev => ({ ...prev, results: [], searched: false }));
      return;
    }
    setState(prev => ({ ...prev, loading: true }));
    try {
      const url = apiUrl(routes.learn.dictPhraseSearch, undefined, { q: trimmed, limit: 30 });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setState(prev => ({
        ...prev,
        results: Array.isArray(data) ? data : [],
        searched: true,
        loading: false,
      }));
    } catch {
      setState(prev => ({
        ...prev,
        results: [],
        searched: true,
        loading: false,
      }));
    }
  }, []);

  const startStrokeAnimation = useCallback((strokeCount: number) => {
    setState(prev => ({ ...prev, animateStrokes: true }));
    if (strokeCount > 0) {
      const totalTime = (strokeCount - 1) * 500 + 300;
      setTimeout(() => setState(prev => ({ ...prev, animateStrokes: false })), totalTime);
    }
  }, []);

  const loadHanziForChar = useCallback(async (char: string) => {
    setState(prev => ({ ...prev, activeChar: char, activeCharMeaning: '', activeCharPinyin: '' }));

    let pinyinResult: string[] = [];

    try {
      const hanziUrl = apiUrl(routes.learn.hanziDetails, { char });
      const hanziRes = await fetch(hanziUrl);
      if (hanziRes.ok) {
        const data = await hanziRes.json();
        if (!data?.error) {
          if (Array.isArray(data.pinyin) && data.pinyin.length > 0) {
            pinyinResult = data.pinyin;
          }
          setState(prev => ({
            ...prev,
            hanzi: data,
            activeCharPinyin: pinyinResult.join(', '),
          }));
          startStrokeAnimation(data.strokes?.length || 0);
        } else {
          setState(prev => ({ ...prev, hanzi: null }));
        }
      } else {
        setState(prev => ({ ...prev, hanzi: null }));
      }
    } catch {
      setState(prev => ({ ...prev, hanzi: null }));
    }

    try {
      const lookupUrl = apiUrl(routes.learn.dictLookup, { word: char });
      const lookupRes = await fetch(lookupUrl);
      if (lookupRes.ok) {
        const data = await lookupRes.json();
        if (!data?.error) {
          setState(prev => {
            let finalPinyin = prev.activeCharPinyin;
            let updatedHanzi = prev.hanzi;
            if (!finalPinyin && data.pinyin) {
              finalPinyin = data.pinyin;
              const pArr = data.pinyin.split(/[,;\s]+/).map((s: string) => s.trim()).filter(Boolean);
              if (updatedHanzi) {
                updatedHanzi = { ...updatedHanzi, pinyin: pArr };
              }
            }
            return {
              ...prev,
              activeCharMeaning: data.meaning || '',
              activeCharPinyin: finalPinyin,
              hanzi: updatedHanzi,
            };
          });
        } else {
          setState(prev => ({ ...prev, activeCharMeaning: '' }));
        }
      } else {
        setState(prev => ({ ...prev, activeCharMeaning: '' }));
      }
    } catch {
      setState(prev => ({ ...prev, activeCharMeaning: '' }));
    }
  }, [startStrokeAnimation]);

  const lookup = useCallback(async (word: string) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const url = apiUrl(routes.learn.dictLookup, { word });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();

      if (!data?.char) {
        setState(prev => ({
          ...prev,
          selected: null,
          hanzi: null,
          activeChar: null,
          loading: false,
        }));
        return;
      }

      const firstChar = data.char ? [...data.char][0] : null;

      setState(prev => {
        const newHistory = prev.selected ? [...prev.history, { selected: prev.selected, hanzi: prev.hanzi }] : prev.history;
        const recentTerm = data.simplified || data.char;
        const newRecentSearches = recentTerm
          ? [recentTerm, ...prev.recentSearches.filter((w) => w !== recentTerm)].slice(0, 10)
          : prev.recentSearches;
        
        if (recentTerm) {
          localStorage.setItem('dict-recent', JSON.stringify(newRecentSearches));
        }

        return {
          ...prev,
          query: word,
          selected: data,
          results: [],
          searched: false,
          hanzi: null,
          activeChar: firstChar,
          history: newHistory,
          recentSearches: newRecentSearches,
          loading: false,
        };
      });

      if (firstChar) {
        await loadHanziForChar(firstChar);
      }
    } catch {
      setState(prev => ({
        ...prev,
        selected: null,
        hanzi: null,
        activeChar: null,
        loading: false,
      }));
    }
  }, [loadHanziForChar]);

  const goBack = useCallback(() => {
    setState(prev => {
      if (prev.history.length === 0) return prev;
      const last = prev.history[prev.history.length - 1];
      const firstChar = last.hanzi?.character || (last.selected?.char ? [...last.selected.char][0] : null);
      return {
        ...prev,
        history: prev.history.slice(0, -1),
        selected: last.selected,
        hanzi: last.hanzi,
        activeChar: firstChar,
      };
    });
  }, []);

  const speakText = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    } catch {}
  }, []);

  const toggleStrokeAnimation = useCallback(() => {
    setState(prev => {
      if (prev.animateStrokes) {
        return { ...prev, animateStrokes: false };
      } else {
        startStrokeAnimation(prev.hanzi?.strokes?.length || 0);
        return prev;
      }
    });
  }, [startStrokeAnimation]);

  const translateEtymologyType = useCallback((type?: string): string => {
    if (lang === 'en') return type || '';
    const map: Record<string, string> = {
      pictographic: 'Tượng hình - Vẽ theo hình dáng',
      ideographic: 'Chỉ sự - Dùng ký hiệu biểu thị ý',
      ideographic_compound: 'Hội ý - Ghép nhiều ý lại',
      pictophonetic: 'Hình thanh - Phần nghĩa + phần gợi âm',
      derivative: 'Chuyển chú - Chữ có liên hệ nghĩa',
      rebus: 'Giả tá - Mượn chữ theo âm',
    };
    return map[type || ''] || type || '';
  }, [lang]);

  const highlightWord = useCallback((text: string, word: string): React.ReactNode => {
    if (!word || !text.includes(word)) return text;
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapeRegExp(word)})`, 'g'));
    return parts.map((part, i) =>
      part === word ? (
        <span key={i} className="text-rose-400 font-semibold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(state.query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state.query, search]);

  // Fetch etymology translation
  useEffect(() => {
    if (!state.hanzi?.character || !state.hanzi?.etymology?.hint) {
      setState(prev => ({ ...prev, etymologyVi: null, etymologyLoading: false }));
      return;
    }
    if (lang === 'en') {
      setState(prev => ({ ...prev, etymologyVi: null, etymologyLoading: false }));
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, etymologyVi: null, etymologyLoading: true }));

    const fetchEtymology = async () => {
      try {
        const url = apiUrl(routes.learn.hanziEtymologyVi, { char: state.hanzi!.character });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setState(prev => ({ ...prev, etymologyVi: data.translated || '', etymologyLoading: false }));
          }
        } else {
          if (!cancelled) {
            setState(prev => ({ ...prev, etymologyVi: null, etymologyLoading: false }));
          }
        }
      } catch {
        if (!cancelled) {
          setState(prev => ({ ...prev, etymologyVi: null, etymologyLoading: false }));
        }
      }
    };

    fetchEtymology();
    return () => {
      cancelled = true;
    };
  }, [state.hanzi, lang]);

  // Fetch AI examples
  useEffect(() => {
    if (!state.selected?.char) {
      setState(prev => ({ ...prev, aiExamples: null, aiExamplesLoading: false }));
      return;
    }

    let cancelled = false;
    setState(prev => ({ ...prev, aiExamples: null, aiExamplesLoading: true }));

    const fetchExamples = async () => {
      try {
        const url = apiUrl(routes.learn.dictExamples, { word: state.selected!.char });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data) ? data : [];
          const formatted: ExampleSentence[] = rawList.map((item: any) => ({
            sentence: item.sentence,
            pinyin: item.pinyin || '',
            meaning: item.meaningVi || item.meaning || item.meaningEn || '',
            meaningEn: item.meaningEn || (item.meaningVi ? item.meaning : '') || '',
            meaningVi: item.meaningVi || '',
            isTranslating: !item.meaningVi,
          }));

          if (!cancelled) {
            setState(prev => ({
              ...prev,
              aiExamples: formatted,
              aiExamplesLoading: false,
            }));
          }

          // If any sentence needs AI Vietnamese translation, fetch translation
          const needTranslation = formatted.filter(e => !e.meaningVi && e.sentence).map(e => e.sentence);
          if (needTranslation.length > 0) {
            try {
              const transUrl = apiUrl(routes.learn.dictTranslateExamples);
              const transRes = await fetch(transUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sentences: needTranslation }),
              });
              if (transRes.ok) {
                const transMap: Record<string, string> = await transRes.json();
                if (!cancelled && transMap) {
                  setState(prev => {
                    if (!prev.aiExamples) return prev;
                    return {
                      ...prev,
                      aiExamples: prev.aiExamples.map(ex => {
                        const vi = transMap[ex.sentence];
                        if (vi) {
                          return {
                            ...ex,
                            meaningVi: vi,
                            meaning: vi,
                            isTranslating: false,
                          };
                        }
                        return { ...ex, isTranslating: false };
                      }),
                    };
                  });
                }
              } else {
                if (!cancelled) {
                  setState(prev => ({
                    ...prev,
                    aiExamples: prev.aiExamples?.map(ex => ({ ...ex, isTranslating: false })) ?? null,
                  }));
                }
              }
            } catch {
              if (!cancelled) {
                setState(prev => ({
                  ...prev,
                  aiExamples: prev.aiExamples?.map(ex => ({ ...ex, isTranslating: false })) ?? null,
                }));
              }
            }
          }
        } else {
          if (!cancelled) {
            setState(prev => ({ ...prev, aiExamples: null, aiExamplesLoading: false }));
          }
        }
      } catch {
        if (!cancelled) {
          setState(prev => ({ ...prev, aiExamples: null, aiExamplesLoading: false }));
        }
      }
    };

    fetchExamples();
    return () => {
      cancelled = true;
    };
  }, [state.selected]);

  const fetchTopics = useCallback(async () => {
    setState(prev => ({ ...prev, topicsLoading: true }));
    try {
      const res = await fetch(apiUrl(routes.learn.vocabularyTopics));
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped: Topic[] = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            nameEn: t.nameEn || t.name,
            icon: t.icon || 'faBookOpen',
            wordCount: t.count || 0,
          }));
          setState(prev => ({ ...prev, topics: mapped, topicsLoading: false }));
          return;
        }
      }
      setState(prev => ({ ...prev, topicsLoading: false }));
    } catch {
      setState(prev => ({ ...prev, topicsLoading: false }));
    }
  }, []);

  const fetchTopicWords = useCallback(async (topicId: string) => {
    setState(prev => ({ ...prev, topicWordsLoading: true }));
    try {
      const res = await fetch(apiUrl(routes.learn.vocabularyByTopic, { topicId }, { pageSize: 50 }));
      if (res.ok) {
        const data = await res.json();
        setState(prev => ({ ...prev, topicWords: data.items || [], topicWordsLoading: false }));
      } else {
        setState(prev => ({ ...prev, topicWords: [], topicWordsLoading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, topicWords: [], topicWordsLoading: false }));
    }
  }, []);

  // Auto-fetch vocabulary topics on mount
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const actions: DictionaryActions = {
    setQuery: (query) => setState(prev => ({ ...prev, query })),
    setIsSearchFocused: (focused) => setState(prev => ({ ...prev, isSearchFocused: focused })),
    lookup,
    search,
    goBack,
    loadHanziForChar,
    speakText,
    toggleStrokeAnimation,
    clearSearch: () => setState(prev => ({
      ...prev,
      query: '',
      results: [],
      searched: false,
      selected: null,
    })),
    fetchTopics,
    fetchTopicWords,
    setSelectedTopic: (selectedTopic) => setState(prev => ({ ...prev, selectedTopic })),
  };

  return {
    state,
    actions,
    hotKeywords,
    topics: state.topics,
    translateEtymologyType,
    highlightWord,
  };
};
