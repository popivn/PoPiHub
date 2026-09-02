import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faChevronRight,
  faMagnifyingGlass,
  faVolumeHigh,
  faXmark,
  faCircleInfo,
  faArrowLeft,
  faPlay,
  faPause,
} from '@fortawesome/free-solid-svg-icons';
import { MainLayout } from '../../layout';
import { useI18n } from '../../../i18n';
import { apiUrl, routes } from '../../../services/routes';
import './DictionaryPage.css';

interface CharacterLookup {
  char: string;
  pinyin: string;
  hanViet: string;
  meaning: string;
  meaningEn: string;
  examples: { sentence: string; pinyin: string; meaning: string }[];
}

interface DictPhrase {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string;
  vietnamese: string;
}

interface HanziDetails {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  radical?: string;
  etymology?: { type?: string; hint?: string };
  strokes?: string[];
  medians?: number[][][];
}

export default function DictionaryPage() {
  const { lang } = useI18n();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DictPhrase[]>([]);
  const [selected, setSelected] = useState<CharacterLookup | null>(null);
  const [hanzi, setHanzi] = useState<HanziDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [animateStrokes, setAnimateStrokes] = useState(false);
  const [history, setHistory] = useState<{ selected: CharacterLookup; hanzi: HanziDetails | null }[]>([]);
  const [activeChar, setActiveChar] = useState<string | null>(null);
  const [activeCharMeaning, setActiveCharMeaning] = useState<string>('');
  const [etymologyVi, setEtymologyVi] = useState<string | null>(null);
  const [etymologyLoading, setEtymologyLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dict-recent');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [aiExamples, setAiExamples] = useState<{ sentence: string; pinyin: string; meaning: string }[] | null>(null);
  const [aiExamplesLoading, setAiExamplesLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const url = apiUrl(routes.learn.dictPhraseSearch, undefined, { q: trimmed, limit: 30 });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHanziForChar = useCallback(async (char: string) => {
    setActiveChar(char);
    setActiveCharMeaning('');
    setAnimateStrokes(true);

    try {
      const hanziUrl = apiUrl(routes.learn.hanziDetails, { char });
      const hanziRes = await fetch(hanziUrl);
      if (hanziRes.ok) {
        const data = await hanziRes.json();
        if (!data?.error) setHanzi(data);
        else setHanzi(null);
      } else {
        setHanzi(null);
      }
    } catch {
      setHanzi(null);
    }

    try {
      const lookupUrl = apiUrl(routes.learn.dictLookup, { word: char });
      const lookupRes = await fetch(lookupUrl);
      if (lookupRes.ok) {
        const data = await lookupRes.json();
        if (!data?.error) setActiveCharMeaning(data.meaning || '');
        else setActiveCharMeaning('');
      } else {
        setActiveCharMeaning('');
      }
    } catch {
      setActiveCharMeaning('');
    }
  }, []);

  const lookup = useCallback(async (word: string) => {
    setLoading(true);
    try {
      const url = apiUrl(routes.learn.dictLookup, { word });
      const res = await fetch(url);
      if (!res.ok) throw new Error('Lookup failed');
      const data = await res.json();

      if (!data?.char) {
        setSelected(null);
        setHanzi(null);
        setActiveChar(null);
        return;
      }

      if (selected) setHistory((h) => [...h, { selected, hanzi }]);
      setSelected(data);
      setResults([]);
      setSearched(false);
      setHanzi(null);
      setActiveChar(data.char.length === 1 ? data.char : null);

      const recentTerm = data.simplified || data.char;
      if (recentTerm) {
        setRecentSearches((prev) => {
          const next = [recentTerm, ...prev.filter((w) => w !== recentTerm)].slice(0, 10);
          localStorage.setItem('dict-recent', JSON.stringify(next));
          return next;
        });
      }

      if (data.char.length === 1) {
        await loadHanziForChar(data.char);
      }
    } catch {
      setSelected(null);
      setHanzi(null);
      setActiveChar(null);
    } finally {
      setLoading(false);
    }
  }, [selected, hanzi, loadHanziForChar]);

  const goBack = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setSelected(last.selected);
    setHanzi(last.hanzi);
    setActiveChar(last.selected.char.length === 1 ? last.selected.char : null);
  }, [history]);

  const translateEtymologyType = (type?: string): string => {
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
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    if (!hanzi?.character || !hanzi?.etymology?.hint) {
      setEtymologyVi(null);
      setEtymologyLoading(false);
      return;
    }
    if (lang === 'en') {
      setEtymologyVi(null);
      setEtymologyLoading(false);
      return;
    }

    let cancelled = false;
    setEtymologyVi(null);
    setEtymologyLoading(true);

    const fetchEtymology = async () => {
      try {
        const url = apiUrl(routes.learn.hanziEtymologyVi, { char: hanzi.character });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setEtymologyVi(data.translated || '');
        } else {
          if (!cancelled) setEtymologyVi(null);
        }
      } catch {
        if (!cancelled) setEtymologyVi(null);
      } finally {
        if (!cancelled) setEtymologyLoading(false);
      }
    };

    fetchEtymology();
    return () => {
      cancelled = true;
    };
  }, [hanzi, lang]);

  useEffect(() => {
    if (!selected?.char || selected.char.length !== 1) {
      setAiExamples(null);
      setAiExamplesLoading(false);
      return;
    }

    let cancelled = false;
    setAiExamples(null);
    setAiExamplesLoading(true);

    const fetchExamples = async () => {
      try {
        const url = apiUrl(routes.learn.dictExamples, { word: selected.char });
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setAiExamples(Array.isArray(data) ? data : null);
        } else {
          if (!cancelled) setAiExamples(null);
        }
      } catch {
        if (!cancelled) setAiExamples(null);
      } finally {
        if (!cancelled) setAiExamplesLoading(false);
      }
    };

    fetchExamples();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightWord = (text: string, word: string) => {
    if (!word || !text.includes(word)) return text;
    const parts = text.split(new RegExp(`(${escapeRegExp(word)})`, 'g'));
    return parts.map((part, i) =>
      part === word ? (
        <span key={i} className="text-rose-400 font-semibold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
        {/* Breadcrumb */}
        <div className="w-full px-4 sm:px-8 pt-4 pb-1 flex items-center justify-start gap-2 text-xs text-slate-400 font-semibold">
          <Link to="/" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faHouse} className="text-xs text-teal-400" />
            <span>{lang === 'en' ? 'Home' : 'Trang chủ'}</span>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-slate-600" />
          <span className="text-slate-200 font-bold">
            {lang === 'en' ? 'Dictionary' : 'Tra cứu từ vựng'}
          </span>
        </div>

        {/* Search bar + Chinese keyboard */}
        <div className="w-full px-4 sm:px-8 mt-6 mb-6">
          <div className="relative max-w-2xl mx-auto">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-400/60 text-sm"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={lang === 'en' ? 'Search by character, pinyin or meaning…' : 'Tìm theo chữ Hán, pinyin hoặc nghĩa…'}
              className="w-full h-12 rounded-2xl bg-slate-900/90 border border-teal-500/30 pl-12 pr-10 text-sm outline-none focus:border-teal-400 focus:shadow-lg focus:shadow-teal-500/20 transition-all"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setSearched(false);
                  setSelected(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
                aria-label="Clear"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            )}

            {/* Floating search results dropdown */}
            {isSearchFocused && (loading || (searched && results.length === 0) || results.length > 0) && (
              <div
                className="absolute z-20 left-0 right-0 top-full mt-2 bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden"
                onMouseDown={(e) => e.preventDefault()}
              >
                {loading && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="inline-block w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-semibold">
                      {lang === 'en' ? 'Searching…' : 'Đang tìm…'}
                    </p>
                  </div>
                )}
                {!loading && searched && results.length === 0 && (
                  <div className="px-5 py-4 text-left">
                    <p className="text-xs text-slate-500">
                      {lang === 'en' ? `No results for "${query}".` : `Không tìm thấy kết quả cho "${query}".`}
                    </p>
                  </div>
                )}
                {!loading && results.length > 0 && (
                  <div className="divide-y divide-slate-800/60 max-h-[360px] overflow-y-auto">
                    {results.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => lookup(r.simplified)}
                        className="w-full px-5 py-3.5 text-left transition-all hover:bg-slate-800/50 border-l-2 border-transparent"
                      >
                        <p className="text-sm text-slate-100">
                          {r.simplified}
                          {r.traditional && r.traditional !== r.simplified && (
                            <span className="text-slate-500 text-xs ml-1">/ {r.traditional}</span>
                          )}
                          <span className="text-teal-400 font-bold ml-2">【{r.pinyin}】</span>
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {lang === 'en' ? (r.english || r.vietnamese || '—') : (r.vietnamese || r.english || '—')}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {recentSearches.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Recent searches' : 'Tìm kiếm gần đây'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {recentSearches.map((w, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => lookup(w)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-sm border border-slate-700 hover:border-teal-400 hover:bg-teal-500/20 transition-all"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 w-full px-4 sm:px-8 pb-16">
          <div className="max-w-5xl mx-auto grid md:grid-cols-[1fr_420px] lg:grid-cols-[1fr_480px] gap-6">
            {/* Left: details, meanings and examples */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              {!selected && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-teal-400/30 mb-3" />
                  <p className="text-xs text-slate-500">
                    {lang === 'en' ? 'Select a word to see details.' : 'Chọn một từ để xem chi tiết.'}
                  </p>
                </div>
              )}
              {loading && !selected && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inline-block w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
              )}
              {selected && (
                <div className="space-y-5">
                  {/* Character/phrase header */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-20 flex items-center justify-center bg-slate-950 border border-teal-500/30 rounded-2xl shadow-lg shadow-teal-500/10 px-4 shrink-0 ${
                        selected.char.length === 1 ? 'w-20' : 'w-auto max-w-40'
                      }`}
                    >
                      <span
                        className={`font-bold text-slate-100 leading-none ${
                          selected.char.length === 1
                            ? 'text-5xl'
                            : selected.char.length === 2
                            ? 'text-4xl'
                            : 'text-3xl'
                        }`}
                      >
                        <span className="whitespace-nowrap">{selected.char}</span>
                      </span>
                    </div>
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        {history.length > 0 && (
                          <button
                            type="button"
                            onClick={goBack}
                            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs hover:bg-teal-400 hover:text-slate-950 transition-all"
                            title={lang === 'en' ? 'Back' : 'Quay lại'}
                          >
                            <FontAwesomeIcon icon={faArrowLeft} />
                          </button>
                        )}
                        <span className="text-base text-teal-400 font-bold">{selected.pinyin}</span>
                        <button
                          type="button"
                          onClick={() => speakText(selected.char)}
                          className="w-7 h-7 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center text-xs hover:bg-teal-400 hover:text-slate-950 transition-all"
                        >
                          <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                      </div>
                      {selected.hanViet && selected.char.length <= 2 && (
                        <p className="text-sm text-slate-300">
                          <span className="text-xs text-slate-500">Hán-Việt: </span>
                          <span className="font-semibold">{selected.hanViet}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meanings */}
                  {selected.meaning && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                        {lang === 'en' ? 'Vietnamese meaning' : 'Nghĩa tiếng Việt'}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">{selected.meaning}</p>
                    </div>
                  )}
                  {selected.meaningEn && lang === 'en' && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                        English meaning
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">{selected.meaningEn}</p>
                    </div>
                  )}

                  {/* Examples */}
                  {selected.examples.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                        {lang === 'en' ? 'Examples' : 'Ví dụ'}
                      </p>
                      <div className="space-y-2">
                        {selected.examples.map((ex, i) => (
                          <div
                            key={i}
                            className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1"
                          >
                            <p className="text-sm text-slate-200 font-semibold">{ex.sentence}</p>
                            <p className="text-xs text-teal-400/80">{ex.pinyin}</p>
                            <p className="text-xs text-slate-500 italic">{ex.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Examples */}
                  {(aiExamplesLoading || (aiExamples && aiExamples.length > 0)) && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                        {lang === 'en' ? 'AI examples' : 'Ví dụ bổ sung'}
                      </p>
                      {aiExamplesLoading ? (
                        <div className="space-y-2 animate-pulse">
                          <div className="h-4 bg-slate-800 rounded w-3/4" />
                          <div className="h-4 bg-slate-800 rounded w-1/2" />
                          <div className="h-4 bg-slate-800 rounded w-2/3" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {aiExamples?.map((ex, i) => (
                            <div
                              key={i}
                              className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1"
                            >
                              <p className="text-sm text-slate-200 font-semibold">{highlightWord(ex.sentence, selected?.char || '')}</p>
                              <p className="text-xs text-teal-400/80">{ex.pinyin}</p>
                              <p className="text-xs text-slate-500 italic">{ex.meaning}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!selected.meaning && !selected.meaningEn && selected.examples.length === 0 && (
                    <p className="text-xs text-slate-500">
                      {lang === 'en' ? 'No detailed information available.' : 'Không có thông tin chi tiết.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: stroke graph */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              {!selected && !loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-teal-400/30 mb-3" />
                  <p className="text-xs text-slate-500">
                    {lang === 'en' ? 'Select a word to see stroke order.' : 'Chọn một từ để xem bút tích.'}
                  </p>
                </div>
              )}
              {loading && !selected && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inline-block w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
              )}
              {selected && (
                <div className="space-y-6">
                  {/* Per-character tabs for phrases */}
                  {selected.char.length > 1 && (
                    <div className="space-y-0">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">
                        {lang === 'en' ? 'Tap a character to see stroke order' : 'Nhấn từng chữ để xem bút tích'}
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-3 mt-2">
                        {Array.from(selected.char).map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => loadHanziForChar(c)}
                            className={`w-11 h-11 rounded-xl font-bold text-2xl transition-all active:scale-90 cursor-pointer ${
                              activeChar === c
                                ? 'bg-teal-500/20 border border-teal-400 text-teal-100'
                                : 'bg-slate-800 hover:bg-teal-500/20 border border-slate-700 hover:border-teal-400 text-slate-100'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hanzi stroke graph */}
                  {hanzi?.strokes && hanzi.strokes.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-square bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
                        <svg viewBox="-60 -60 1144 1144" className="w-[92%] h-[92%] m-auto">
                          <line x1="0" y1="512" x2="1024" y2="512" className="stroke-slate-800/50" strokeWidth="2" />
                          <line x1="512" y1="0" x2="512" y2="1024" className="stroke-slate-800/50" strokeWidth="2" />
                          <g transform="scale(1, -1) translate(0, -1024)">
                            {hanzi.strokes.map((s, i) => (
                              <path
                                key={i}
                                d={s}
                                fill="none"
                                stroke={i === 0 ? '#f43f5e' : '#2dd4bf'}
                                strokeWidth={i === 0 ? 60 : 50}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`hanzi-stroke ${animateStrokes ? 'hanzi-stroke-anim' : ''}`}
                                style={{ animationDelay: `${i * 0.5}s` }}
                              />
                            ))}
                          </g>
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {lang === 'en' ? `${hanzi.strokes.length} strokes` : `${hanzi.strokes.length} nét`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAnimateStrokes(!animateStrokes)}
                          className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-300 flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                          title={animateStrokes ? (lang === 'en' ? 'Stop' : 'Dừng') : (lang === 'en' ? 'Animate' : 'Phát bút tích')}
                        >
                          <FontAwesomeIcon icon={animateStrokes ? faPause : faPlay} className="text-xs" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active character details */}
                  {hanzi?.strokes && hanzi.strokes.length > 0 && (
                    <div className="space-y-2">
                      {activeCharMeaning && (
                        <p className="text-sm text-slate-300 cjk-text">
                          <span className="text-xs text-slate-500">{lang === 'en' ? 'Meaning: ' : 'Nghĩa: '}</span>
                          <span className="font-semibold">{activeCharMeaning}</span>
                        </p>
                      )}
                      {hanzi.decomposition && (
                        <p className="text-sm text-slate-300 cjk-text">
                          <span className="text-xs text-slate-500">{lang === 'en' ? 'Decomposition: ' : 'Hình thái: '}</span>
                          <span className="font-semibold">{hanzi.decomposition}</span>
                        </p>
                      )}
                      {hanzi.radical && (
                        <p className="text-sm text-slate-300 cjk-text">
                          <span className="text-xs text-slate-500">{lang === 'en' ? 'Radical: ' : 'Bộ: '}</span>
                          <span className="font-semibold">{hanzi.radical}</span>
                        </p>
                      )}
                      {hanzi.etymology?.hint && (lang === 'en' || etymologyLoading || etymologyVi || translateEtymologyType(hanzi.etymology.type)) && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">
                            {lang === 'en' ? 'Etymology: ' : 'Lục thư: '}
                          </p>
                          {lang === 'en' ? (
                            <p className="text-sm text-slate-300 cjk-text">
                              <span className="font-semibold">
                                {translateEtymologyType(hanzi.etymology.type)} — {hanzi.etymology.hint}
                              </span>
                            </p>
                          ) : etymologyLoading ? (
                            <div className="space-y-2 animate-pulse">
                              <div className="h-4 bg-slate-800 rounded w-3/4" />
                              <div className="h-4 bg-slate-800 rounded w-1/2" />
                            </div>
                          ) : (
                            <p className="text-sm text-slate-300 cjk-text">
                              <span className="font-semibold">
                                {translateEtymologyType(hanzi.etymology.type)}
                                {etymologyVi ? ` — ${etymologyVi}` : ''}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
