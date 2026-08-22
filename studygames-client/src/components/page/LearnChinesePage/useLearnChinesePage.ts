import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../../i18n';
import { API_BASE_URL } from '../../../auth/authClient';

export interface ExampleSentence {
  sentence: string;
  pinyin: string;
  meaning: string;
  meaningEn?: string;
}

export interface ChineseCharacter {
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
  radicalEn?: string;
  strokeCount: number;
  examples: ExampleSentence[];
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  icon: string;
  count?: number;
}

export function useLearnChinesePage() {
  const { lang } = useI18n();
  const [characters, setCharacters] = useState<ChineseCharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');

  const [score, setScore] = useState<number>(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleCardFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent, id: string) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      toggleCardFlip(id);
    }
  };

  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState<boolean>(false);
  const activeCategoryObj = categories.find((c) => c.id === selectedCategory) || categories[0] || { id: 'all', name: '', nameEn: '', icon: 'faBookOpen' };

  const [isSticky, setIsSticky] = useState<boolean>(false);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY.current && currentScrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/learn/chinese/categories`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCharacters(selectedCategory);
  }, [selectedCategory]);

  const fetchCharacters = async (catId: string) => {
    setCharactersLoading(true);
    try {
      const url = catId === 'all'
        ? `${API_BASE_URL}/learn/chinese`
        : `${API_BASE_URL}/learn/chinese?category=${catId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCharacters(data);
          setCurrentIndex(0);
          setFlippedCards({});
          setCharactersLoading(false);
          return;
        }
      }
    } catch {
      // Lỗi mạng/API — để trống, UI sẽ hiển thị empty state
    }
    setCharacters([]);
    setCurrentIndex(0);
    setFlippedCards({});
    setCharactersLoading(false);
  };

  const currentChar = characters[currentIndex];

  useEffect(() => {
    if (characters.length > 0) {
      const current = characters[currentIndex];
      const getMeaning = (c: ChineseCharacter) =>
        lang === 'en' ? c.meaningEn || c.meaning : c.meaning;

      const correct = getMeaning(current);
      const otherMeanings = characters
        .filter((c) => c.id !== current.id)
        .map((c) => getMeaning(c));

      const shuffledOther = [...otherMeanings].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...shuffledOther, correct].sort(() => Math.random() - 0.5);
      setQuizOptions(options);
      setQuizAnswered(false);
      setSelectedOption(null);
    }
  }, [currentIndex, characters, mode, lang]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % characters.length);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuizAnswer = (option: string) => {
    if (quizAnswered) return;
    setSelectedOption(option);
    setQuizAnswered(true);
    const targetMeaning = lang === 'en' ? currentChar.meaningEn || currentChar.meaning : currentChar.meaning;
    if (option === targetMeaning) {
      setScore((prev) => prev + 10);
    }
  };

  return {
    lang,
    characters,
    charactersLoading,
    categories,
    selectedCategory,
    setSelectedCategory,
    mode,
    setMode,
    score,
    quizAnswered,
    selectedOption,
    quizOptions,
    flippedCards,
    toggleCardFlip,
    handleTouchStart,
    handleTouchEnd,
    isCatDropdownOpen,
    setIsCatDropdownOpen,
    isSticky,
    activeCategoryObj,
    currentChar,
    handleNext,
    speakText,
    handleQuizAnswer,
  };
}
