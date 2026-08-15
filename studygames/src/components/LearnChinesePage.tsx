import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRotate,
  faChevronRight,
  faVolumeHigh,
  faGamepad,
  faLayerGroup,
  faCheckCircle,
  faXmarkCircle,
  faLightbulb,
  faGlobe,
  faBuilding,
  faHouse,
  faLaptopCode,
  faBook,
  faChevronDown,
  faCheck,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';
import LanguageDropdown from './LanguageDropdown';

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
  nameEn: string;
  icon: IconDefinition;
  count?: number;
}

const FALLBACK_CHARACTERS: ChineseCharacter[] = [
    {
        "id": "cn_it_001",
        "char": "码",
        "pinyin": "mǎ",
        "hanViet": "Mã",
        "meaning": "Mã, ký hiệu, con số (trong Mã code)",
        "meaningEn": "Code, symbol, number (in Source code)",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryEn": "IT Sector",
        "categoryId": "it",
        "radical": "石 (Thạch - bộ 112)",
        "radicalEn": "石 (Stone - Radical 112)",
        "strokeCount": 8,
        "examples": [
            {
                "sentence": "写代码。",
                "pinyin": "Xiě dàimǎ.",
                "meaning": "Viết mã code.",
                "meaningEn": "Write source code."
            },
            {
                "sentence": "源码已经更新。",
                "pinyin": "Yuánmǎ yǐjīng gēngxīn.",
                "meaning": "Mã nguồn đã được cập nhật.",
                "meaningEn": "Source code has been updated."
            }
        ]
    },
    {
        "id": "cn_it_002",
        "char": "网",
        "pinyin": "wǎng",
        "hanViet": "Võng",
        "meaning": "Mạng, lưới, internet",
        "meaningEn": "Network, web, internet",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryEn": "IT Sector",
        "categoryId": "it",
        "radical": "冂 (Quynh - bộ 13) / 网 (Võng)",
        "radicalEn": "冂 (Net / Enclosure - Radical 13)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "上网查资料。",
                "pinyin": "Shàngwǎng chá zīliào.",
                "meaning": "Lên mạng tra cứu tài liệu.",
                "meaningEn": "Go online to research information."
            },
            {
                "sentence": "网络连接正常。",
                "pinyin": "Wǎnglù liánjiē zhèngcháng.",
                "meaning": "Kết nối mạng bình thường.",
                "meaningEn": "Network connection is normal."
            }
        ]
    },
    {
        "id": "cn_it_003",
        "char": "电",
        "pinyin": "diàn",
        "hanViet": "Điện",
        "meaning": "Điện, máy tính, thiết bị điện tử",
        "meaningEn": "Electricity, computer, electronic device",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryEn": "IT Sector",
        "categoryId": "it",
        "radical": "田 (Điền - bộ 102)",
        "radicalEn": "田 (Field - Radical 102)",
        "strokeCount": 5,
        "examples": [
            {
                "sentence": "电脑关机了。",
                "pinyin": "Diànnǎo guānjī le.",
                "meaning": "Máy tính đã tắt nguồn.",
                "meaningEn": "Computer is powered off."
            },
            {
                "sentence": "电子邮件。",
                "pinyin": "Diànzǐ yóujiàn.",
                "meaning": "Thư điện tử (Email).",
                "meaningEn": "Email message."
            }
        ]
    },
    {
        "id": "cn_it_004",
        "char": "库",
        "pinyin": "kù",
        "hanViet": "Khố",
        "meaning": "Kho, cơ sở dữ liệu (Database)",
        "meaningEn": "Warehouse, database, repository",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryEn": "IT Sector",
        "categoryId": "it",
        "radical": "广 (Quảng - bộ 53)",
        "radicalEn": "广 (Shelter - Radical 53)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "数据库连接成功。",
                "pinyin": "Shùjùkù liánjiē chénggōng.",
                "meaning": "Kết nối cơ sở dữ liệu thành công.",
                "meaningEn": "Database connected successfully."
            }
        ]
    },
    {
        "id": "cn_it_005",
        "char": "端",
        "pinyin": "duān",
        "hanViet": "Đoan",
        "meaning": "Đầu, mút, giao diện (Frontend/Backend)",
        "meaningEn": "End, extremity, interface (Frontend/Backend)",
        "level": "IT",
        "category": "Lĩnh Vực IT",
        "categoryEn": "IT Sector",
        "categoryId": "it",
        "radical": "立 (Lập - bộ 117)",
        "radicalEn": "立 (Stand - Radical 117)",
        "strokeCount": 14,
        "examples": [
            {
                "sentence": "前端开发。",
                "pinyin": "Qiánduān kāifā.",
                "meaning": "Phát triển Frontend.",
                "meaningEn": "Frontend development."
            },
            {
                "sentence": "后端接口。",
                "pinyin": "Hòuduān jiēkǒu.",
                "meaning": "Endpoint API Backend.",
                "meaningEn": "Backend API endpoint."
            }
        ]
    },
    {
        "id": "cn_off_001",
        "char": "公",
        "pinyin": "gōng",
        "hanViet": "Công",
        "meaning": "Công ty, công sở, chung, công cộng",
        "meaningEn": "Company, public, official, business",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryEn": "Office & Work",
        "categoryId": "office",
        "radical": "八 (Bát - bộ 12)",
        "radicalEn": "八 (Eight - Radical 12)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "我在科技公司工作。",
                "pinyin": "Wǒ zài kējì gōngsī gōngzuò.",
                "meaning": "Tôi làm việc ở công ty công nghệ.",
                "meaningEn": "I work at a tech company."
            },
            {
                "sentence": "办公室在五楼。",
                "pinyin": "Bàngōngshì zài wǔ lóu.",
                "meaning": "Văn phòng ở tầng 5.",
                "meaningEn": "The office is on the 5th floor."
            }
        ]
    },
    {
        "id": "cn_off_002",
        "char": "会",
        "pinyin": "huì",
        "hanViet": "Hội",
        "meaning": "Cuộc họp, hội nghị, biết làm",
        "meaningEn": "Meeting, conference, to know how to",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryEn": "Office & Work",
        "categoryId": "office",
        "radical": "人 (Nhân - bộ 9)",
        "radicalEn": "人 (Person - Radical 9)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "我们九点开会。",
                "pinyin": "Wǒmen jiǔ diǎn kāihuì.",
                "meaning": "Chúng tôi họp lúc 9 giờ.",
                "meaningEn": "We have a meeting at 9 o’clock."
            }
        ]
    },
    {
        "id": "cn_off_003",
        "char": "报",
        "pinyin": "bào",
        "hanViet": "Báo",
        "meaning": "Báo cáo, thông báo",
        "meaningEn": "Report, announce, newspaper",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryEn": "Office & Work",
        "categoryId": "office",
        "radical": "扌 (Thủ - bộ 64)",
        "radicalEn": "扌 (Hand - Radical 64)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "这是月度工作报告。",
                "pinyin": "Zhè shì yuèdù gōngzuò bàoɡào.",
                "meaning": "Đây là báo cáo công việc hàng tháng.",
                "meaningEn": "This is the monthly work report."
            }
        ]
    },
    {
        "id": "cn_off_004",
        "char": "办",
        "pinyin": "bàn",
        "hanViet": "Biện",
        "meaning": "Làm, xử lý, giải quyết công việc",
        "meaningEn": "To handle, manage, process affairs",
        "level": "Work",
        "category": "Nơi Công Sở",
        "categoryEn": "Office & Work",
        "categoryId": "office",
        "radical": "力 (Lực - bộ 19)",
        "radicalEn": "力 (Power / Force - Radical 19)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "马上办理。",
                "pinyin": "Mǎshàng bànlǐ.",
                "meaning": "Xử lý ngay lập tức.",
                "meaningEn": "Process immediately."
            },
            {
                "sentence": "怎么办？",
                "pinyin": "Zěnme bàn?",
                "meaning": "Giải quyết thế nào đây?",
                "meaningEn": "What should we do?"
            }
        ]
    },
    {
        "id": "cn_hm_001",
        "char": "家",
        "pinyin": "jiā",
        "hanViet": "Gia",
        "meaning": "Nhà, gia đình",
        "meaningEn": "Home, house, family",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryEn": "Home Life",
        "categoryId": "home",
        "radical": "宀 (Miên - bộ 40)",
        "radicalEn": "宀 (Roof - Radical 40)",
        "strokeCount": 10,
        "examples": [
            {
                "sentence": "我下班回家了。",
                "pinyin": "Wǒ xiàbān huí jiā le.",
                "meaning": "Tôi tan làm về nhà rồi.",
                "meaningEn": "I went home after work."
            },
            {
                "sentence": "家人都很健康。",
                "pinyin": "Jiārén dōu hěn jiànkāng.",
                "meaning": "Người nhà đều khỏe mạnh.",
                "meaningEn": "Family members are all healthy."
            }
        ]
    },
    {
        "id": "cn_hm_002",
        "char": "饭",
        "pinyin": "fàn",
        "hanViet": "Phạn",
        "meaning": "Cơm, bữa ăn",
        "meaningEn": "Cooked rice, meal, food",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryEn": "Home Life",
        "categoryId": "home",
        "radical": "饣 (Thực - bộ 184)",
        "radicalEn": "饣 (Food - Radical 184)",
        "strokeCount": 7,
        "examples": [
            {
                "sentence": "吃晚饭。",
                "pinyin": "Chī wǎnfàn.",
                "meaning": "Ăn cơm tối.",
                "meaningEn": "Eat dinner."
            }
        ]
    },
    {
        "id": "cn_hm_003",
        "char": "睡",
        "pinyin": "shuì",
        "hanViet": "Thụy",
        "meaning": "Ngủ",
        "meaningEn": "To sleep",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryEn": "Home Life",
        "categoryId": "home",
        "radical": "目 (Mục - bộ 109)",
        "radicalEn": "目 (Eye - Radical 109)",
        "strokeCount": 13,
        "examples": [
            {
                "sentence": "早点睡觉。",
                "pinyin": "Zǎodiǎn shuìjiào.",
                "meaning": "Đi ngủ sớm nhé.",
                "meaningEn": "Go to sleep early."
            }
        ]
    },
    {
        "id": "cn_hm_004",
        "char": "亲",
        "pinyin": "qīn",
        "hanViet": "Thân",
        "meaning": "Thân thiết, bố mẹ, người thân",
        "meaningEn": "Parents, relative, close, intimate",
        "level": "Home",
        "category": "Giao Tiếp Tại Nhà",
        "categoryEn": "Home Life",
        "categoryId": "home",
        "radical": "立 (Lập - bộ 117)",
        "radicalEn": "立 (Stand - Radical 117)",
        "strokeCount": 9,
        "examples": [
            {
                "sentence": "父亲和母亲。",
                "pinyin": "Fùqīn hé mǔqīn.",
                "meaning": "Bố và mẹ.",
                "meaningEn": "Father and mother."
            }
        ]
    },
    {
        "id": "cn_bs_001",
        "char": "爱",
        "pinyin": "ài",
        "hanViet": "Ái",
        "meaning": "Yêu, thương, yêu thích",
        "meaningEn": "To love, affection, to be fond of",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "爪 (Trảo - bộ 87)",
        "radicalEn": "爪 (Claw - Radical 87)",
        "strokeCount": 10,
        "examples": [
            {
                "sentence": "我爱你。",
                "pinyin": "Wǒ ài nǐ.",
                "meaning": "Tôi yêu bạn.",
                "meaningEn": "I love you."
            }
        ]
    },
    {
        "id": "cn_bs_002",
        "char": "学",
        "pinyin": "xué",
        "hanViet": "Học",
        "meaning": "Học tập, nghiên cứu",
        "meaningEn": "To learn, study",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "子 (Tử - bộ 39)",
        "radicalEn": "子 (Child - Radical 39)",
        "strokeCount": 8,
        "examples": [
            {
                "sentence": "我喜欢学汉语。",
                "pinyin": "Wǒ xǐhuān xué Hànyǔ.",
                "meaning": "Tôi thích học tiếng Trung.",
                "meaningEn": "I like studying Chinese."
            }
        ]
    },
    {
        "id": "cn_bs_003",
        "char": "好",
        "pinyin": "hǎo",
        "hanViet": "Hảo",
        "meaning": "Tốt, đẹp, hay, khỏe",
        "meaningEn": "Good, fine, well, nice",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "女 (Nữ - bộ 38)",
        "radicalEn": "女 (Woman - Radical 38)",
        "strokeCount": 6,
        "examples": [
            {
                "sentence": "你好！",
                "pinyin": "Nǐ hǎo!",
                "meaning": "Xin chào!",
                "meaningEn": "Hello!"
            }
        ]
    },
    {
        "id": "cn_bs_004",
        "char": "水",
        "pinyin": "shuǐ",
        "hanViet": "Thủy",
        "meaning": "Nước",
        "meaningEn": "Water",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "水 (Thủy - bộ 85)",
        "radicalEn": "水 (Water - Radical 85)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "喝水。",
                "pinyin": "Hē shuǐ.",
                "meaning": "Uống nước.",
                "meaningEn": "Drink water."
            }
        ]
    },
    {
        "id": "cn_bs_005",
        "char": "书",
        "pinyin": "shū",
        "hanViet": "Thư",
        "meaning": "Sách, văn bản",
        "meaningEn": "Book, document",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "乙 (Ất - bộ 5)",
        "radicalEn": "乙 (Second / Hook - Radical 5)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "看书。",
                "pinyin": "Kàn shū.",
                "meaning": "Đọc sách.",
                "meaningEn": "Read a book."
            }
        ]
    },
    {
        "id": "cn_bs_006",
        "char": "心",
        "pinyin": "xīn",
        "hanViet": "Tâm",
        "meaning": "Tim, lòng, tâm trí",
        "meaningEn": "Heart, mind, feelings",
        "level": "HSK1",
        "category": "Căn Bản HSK",
        "categoryEn": "Basic HSK",
        "categoryId": "basic",
        "radical": "心 (Tâm - bộ 61)",
        "radicalEn": "心 (Heart - Radical 61)",
        "strokeCount": 4,
        "examples": [
            {
                "sentence": "开心。",
                "pinyin": "Kāixīn.",
                "meaning": "Vui vẻ.",
                "meaningEn": "Happy, joyful."
            }
        ]
    }
];

const CATEGORIES: Category[] = [
  { id: 'all', name: 'Tất cả chủ đề', nameEn: 'All Topics', icon: faGlobe },
  { id: 'office', name: 'Nơi Công Sở', nameEn: 'Office & Work', icon: faBuilding },
  { id: 'home', name: 'Giao Tiếp Tại Nhà', nameEn: 'Home Life', icon: faHouse },
  { id: 'it', name: 'Lĩnh Vực IT', nameEn: 'IT Sector', icon: faLaptopCode },
  { id: 'basic', name: 'Căn Bản HSK', nameEn: 'Basic HSK', icon: faBook },
];

export default function LearnChinesePage() {
  const { lang } = useI18n();
  const [characters, setCharacters] = useState<ChineseCharacter[]>(FALLBACK_CHARACTERS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');

  // Quiz state
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

  // Touch gesture refs for horizontal swipe flip on mobile
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

    // Horizontal swipe gesture check: swipe distance > 40px and horizontal movement > vertical movement
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      toggleCardFlip(id);
    }
  };

  // Mobile Category Dropdown Popover state
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState<boolean>(false);
  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];

  useEffect(() => {
    fetchCharacters(selectedCategory);
  }, [selectedCategory]);

  const fetchCharacters = async (catId: string) => {
    try {
      const url = catId === 'all'
        ? 'http://localhost:3000/learn/chinese'
        : `http://localhost:3000/learn/chinese?category=${catId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCharacters(data);
          setCurrentIndex(0);
          setFlippedCards({});
          return;
        }
      }
    } catch {
      // Fallback local filtering
    }

    let filtered = FALLBACK_CHARACTERS;
    if (catId !== 'all') {
      filtered = FALLBACK_CHARACTERS.filter((c) => c.categoryId === catId);
    }
    setCharacters(filtered.length > 0 ? filtered : FALLBACK_CHARACTERS);
    setCurrentIndex(0);
    setFlippedCards({});
  };

  const currentChar = characters[currentIndex] || FALLBACK_CHARACTERS[0];

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-teal-500/20 px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-lg shadow-teal-500/10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-pacifico italic text-base sm:text-xl text-teal-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.4)]">
              SliStudy
            </span>
            <span className="text-[10px] sm:text-xs bg-teal-500/20 text-teal-300 font-semibold px-1.5 sm:px-2 py-0.5 rounded-full border border-teal-500/30 whitespace-nowrap">
              {lang === 'en' ? 'Chinese Learn' : 'Học Chữ Hán'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-full flex gap-1 text-xs font-semibold">
            <button
              onClick={() => setMode('flashcard')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'flashcard'
                  ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'en' ? 'Vocabulary Feed' : 'Bảng Tin Từ Vựng'}
            >
              <FontAwesomeIcon icon={faLayerGroup} />
              <span className="hidden sm:inline">
                {lang === 'en' ? 'Vocabulary Feed' : 'Bảng Tin Từ Vựng'}
              </span>
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'quiz'
                  ? 'bg-teal-400 text-slate-950 shadow-md shadow-teal-400/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={lang === 'en' ? `Slime Quiz (${score} pts)` : `Slime Quiz (${score} đ)`}
            >
              <FontAwesomeIcon icon={faGamepad} />
              <span className="hidden sm:inline">
                {lang === 'en' ? `Slime Quiz (${score} pts)` : `Slime Quiz (${score} đ)`}
              </span>
            </button>
          </div>

          <LanguageDropdown />
        </div>
      </header>

      {/* Breadcrumb Navigation Bar */}
      <nav className="w-full px-4 sm:px-8 pt-4 pb-1 flex items-center justify-start gap-2 text-xs text-slate-400 font-semibold">
        <Link to="/" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
          <FontAwesomeIcon icon={faHouse} className="text-xs text-teal-400" />
          <span>{lang === 'en' ? 'Home' : 'Trang chủ'}</span>
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-slate-600" />
        <span className="text-slate-200 font-bold">
          {lang === 'en' ? 'Chinese Learning' : 'Học Chữ Hán'}
        </span>
      </nav>

      {/* Topic Category Filter Section (Mobile Dropdown & Desktop Pills) */}
      <div className="sticky top-[57px] sm:top-[61px] z-40 w-full bg-slate-950/90 backdrop-blur-md py-2.5 px-4 sm:px-8 border-b border-slate-800/60 mb-6 flex items-center justify-center shadow-lg">
        {/* MOBILE VIEW: Custom Sleek Category Dropdown Popover (< sm) */}
        <div className="w-full max-w-xs block sm:hidden relative">
          <button
            type="button"
            onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
            className="w-full bg-slate-900/90 border border-teal-500/50 text-teal-300 font-bold text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-lg shadow-teal-500/10 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FontAwesomeIcon icon={activeCategoryObj.icon} className="text-teal-400 text-xs" />
              <span className="truncate">
                {lang === 'en' ? activeCategoryObj.nameEn : activeCategoryObj.name}
              </span>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-teal-400 text-xs transition-transform duration-200 ${
                isCatDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Popover Menu Items */}
          {isCatDropdownOpen && (
            <>
              {/* Backdrop listener to close when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsCatDropdownOpen(false)}
              />

              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/95 backdrop-blur-xl border border-teal-500/40 rounded-2xl shadow-2xl overflow-hidden p-1.5 space-y-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catTitle = lang === 'en' ? cat.nameEn : cat.name;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsCatDropdownOpen(false);
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-teal-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FontAwesomeIcon icon={cat.icon} className={isSelected ? 'text-slate-950' : 'text-teal-400'} />
                        <span>{catTitle}</span>
                      </div>
                      {isSelected && (
                        <FontAwesomeIcon icon={faCheck} className="text-slate-950 text-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* DESKTOP VIEW: Horizontal Pills List (>= sm) */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-none justify-center">
          {CATEGORIES.map((cat) => {
            const catTitle = lang === 'en' ? cat.nameEn : cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 border-teal-300 shadow-md shadow-teal-500/25 scale-105'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={cat.icon} className="text-xs" />
                <span>{catTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 py-4 flex flex-col items-center">

        {/* MODE 1: FLASHCARD SOCIAL FEED / LƯỚT TỪ VỰNG KIỂU MẠNG XÃ HỘI */}
        {mode === 'flashcard' && (
          <div className="w-full max-w-md flex flex-col items-center gap-8 pb-16">
            {characters.map((char, index) => {
              const flipped = !!flippedCards[char.id];
              const categoryTitle = lang === 'en' ? (char.categoryEn || char.category) : char.category;
              const displayMeaning = lang === 'en' ? (char.meaningEn || char.meaning) : char.meaning;
              const displayRadical = lang === 'en' ? (char.radicalEn || char.radical) : char.radical;
              const strokeText = lang === 'en' ? 'strokes' : 'nét';

              return (
                <div key={char.id} className="w-full flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-0 font-semibold">
                    <span className="text-teal-400">#{index + 1} • {categoryTitle}</span>
                    <span className="text-teal-300 font-bold">
                      {char.level}
                    </span>
                  </div>

                  {/* 3D Flip Card */}
                  <div
                    onClick={() => toggleCardFlip(char.id)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => handleTouchEnd(e, char.id)}
                    className="w-full h-96 sm:h-[420px] relative card-flip-perspective cursor-pointer group"
                  >
                    <div className={`card-flip-inner ${flipped ? 'is-flipped' : ''}`}>
                      {/* FRONT SIDE: CHỮ HÁN LỚN & SLIME MASCOT */}
                      <div className="card-face card-face-front border border-teal-500/30 bg-slate-900/90 shadow-2xl p-7 flex flex-col items-center justify-between">
                        <div className="w-full flex justify-between items-center text-xs text-slate-500">
                          <span className="text-slate-400 font-medium">
                            {lang === 'en' ? 'Vocabulary Feed' : 'Lướt từ vựng'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardFlip(char.id);
                            }}
                            className="w-8 h-8 rounded-full bg-teal-400/10 hover:bg-teal-400/20 text-teal-300 border border-teal-500/30 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                            title={lang === 'en' ? 'Flip card for meaning' : 'Lật thẻ xem nghĩa'}
                          >
                            <FontAwesomeIcon icon={faRotate} className="text-xs" />
                          </button>
                        </div>

                        {/* Character & Sound */}
                        <div className="flex flex-col items-center gap-4 my-auto">
                          <div className="relative">
                            <span className="text-8xl sm:text-9xl font-black text-slate-100 drop-shadow-[0_0_30px_rgba(45,212,191,0.4)] tracking-wide select-none">
                              {char.char}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakText(char.char);
                              }}
                              className="absolute -right-10 top-2 w-10 h-10 rounded-full bg-teal-400/20 text-teal-300 border border-teal-500/40 hover:bg-teal-400 hover:text-slate-950 flex items-center justify-center transition-all shadow-md"
                              title="Nghe phát âm"
                            >
                              <FontAwesomeIcon icon={faVolumeHigh} className="text-sm" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-teal-400 tracking-widest">
                              {char.pinyin}
                            </span>
                            <span className="text-sm bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium border border-slate-700">
                              Hán Việt: {char.hanViet}
                            </span>
                          </div>
                        </div>

                        {/* Slime Mascot Hint Banner */}
                        <div className="w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex items-center gap-3">
                          <img
                            src="/slime/logo.png"
                            alt="Slime Mascot"
                            draggable={false}
                            className="w-10 h-10 object-contain shrink-0 select-none"
                          />
                          <p className="text-xs text-slate-300 leading-snug">
                            <strong className="text-teal-400">
                              {lang === 'en' ? 'Slime Hint:' : 'Gợi ý Slime:'}
                            </strong>{' '}
                            {lang === 'en' ? 'Radical:' : 'Bộ thủ:'}{' '}
                            <span className="text-teal-300 font-semibold">{displayRadical}</span> ({char.strokeCount} {strokeText}).
                          </p>
                        </div>
                      </div>

                      {/* BACK SIDE: NGHĨA TIẾNG VIỆT/ANH, BỘ THỦ & VÍ DỤ */}
                      <div className="card-face card-face-back border border-teal-400/40 bg-slate-900/95 shadow-2xl p-7 flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-3xl font-bold text-teal-400">{char.char}</span>
                            <span className="text-lg text-slate-300">({char.pinyin})</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCardFlip(char.id);
                            }}
                            className="w-8 h-8 rounded-full bg-teal-400/10 hover:bg-teal-400/20 text-teal-300 border border-teal-500/30 flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
                            title={lang === 'en' ? 'View character' : 'Xem mặt chữ'}
                          >
                            <FontAwesomeIcon icon={faRotate} className="text-xs" />
                          </button>
                        </div>

                        <div className="my-auto space-y-4 text-left">
                          <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                              {lang === 'en' ? 'English Meaning:' : 'Nghĩa Tiếng Việt:'}
                            </span>
                            <p className="text-xl font-bold text-slate-100">{displayMeaning}</p>
                          </div>

                          <div>
                            <span className="text-xs text-slate-400 uppercase tracking-wider block font-semibold mb-1">
                              {lang === 'en' ? 'Radical & Structure:' : 'Bộ thủ & Cấu tạo:'}
                            </span>
                            <p className="text-sm text-teal-300 font-medium">
                              {displayRadical} • {char.strokeCount} {strokeText}
                            </p>
                          </div>

                          {char.examples && char.examples.length > 0 && (
                            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                              <span className="text-xs text-slate-400 font-semibold block mb-1">
                                {lang === 'en' ? 'Usage Example:' : 'Ví dụ ứng dụng:'}
                              </span>
                              <p className="text-sm font-semibold text-slate-200">{char.examples[0].sentence}</p>
                              <p className="text-xs text-teal-400">{char.examples[0].pinyin}</p>
                              <p className="text-xs text-slate-400 italic mt-0.5">
                                ➡ {lang === 'en' ? (char.examples[0].meaningEn || char.examples[0].meaning) : char.examples[0].meaning}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODE 2: SLIME QUIZ GAME / GAME NHẬN DIỆN MẶT CHỮ */}
        {mode === 'quiz' && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            <div className="w-full bg-slate-900/90 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center gap-6">
              {/* Header Info */}
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-400/10 text-teal-300 border border-teal-500/30">
                  {lang === 'en' ? 'Slime Quiz Challenge' : 'Thử thách Slime Quiz'}
                </span>
                <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
                  <FontAwesomeIcon icon={faLightbulb} />
                  <span>{lang === 'en' ? `Score: ${score}` : `Điểm: ${score}`}</span>
                </span>
              </div>

              {/* Target Character */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-7xl sm:text-8xl font-black text-slate-100 drop-shadow-[0_0_24px_rgba(45,212,191,0.4)]">
                  {currentChar.char}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-teal-400">{currentChar.pinyin}</span>
                  <button
                    type="button"
                    onClick={() => speakText(currentChar.char)}
                    className="w-7 h-7 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center text-xs hover:bg-teal-400 hover:text-slate-950 transition-all"
                  >
                    <FontAwesomeIcon icon={faVolumeHigh} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-300 text-center font-medium">
                {lang === 'en' ? 'Choose the most accurate meaning:' : 'Hãy chọn nghĩa đúng nhất của chữ Hán trên:'}
              </p>

              {/* Options Grid */}
              <div className="w-full grid grid-cols-1 gap-3">
                {quizOptions.map((opt, i) => {
                  const correctMeaning = lang === 'en' ? (currentChar.meaningEn || currentChar.meaning) : currentChar.meaning;
                  let btnStyle =
                    'bg-slate-800/80 border-slate-700 text-slate-200 hover:border-teal-400/60 hover:bg-slate-800';
                  if (quizAnswered) {
                    if (opt === correctMeaning) {
                      btnStyle = 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold shadow-lg shadow-teal-500/20';
                    } else if (opt === selectedOption) {
                      btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                    } else {
                      btnStyle = 'bg-slate-900/50 border-slate-800 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={quizAnswered}
                      onClick={() => handleQuizAnswer(opt)}
                      className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizAnswered && opt === correctMeaning && (
                        <FontAwesomeIcon icon={faCheckCircle} className="text-teal-400 text-base" />
                      )}
                      {quizAnswered && opt === selectedOption && opt !== correctMeaning && (
                        <FontAwesomeIcon icon={faXmarkCircle} className="text-rose-400 text-base" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Next Question Button */}
              {quizAnswered && (
                <button
                  onClick={handleNext}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  {lang === 'en' ? 'Next Question ➔' : 'Câu tiếp theo ➔'}
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
