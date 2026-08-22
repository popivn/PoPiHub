import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faLayerGroup,
  faArrowRight,
  faMagnifyingGlass,
  faWandMagicSparkles,
  faFilter,
} from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';
import MainLayout from './MainLayout';
import { API_BASE_URL } from '../auth/authClient';

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

const DEFAULT_LESSONS: LessonItem[] = [
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

export default function LessonsPage() {
  const { lang } = useI18n();
  const [lessons, setLessons] = useState<LessonItem[]>(DEFAULT_LESSONS);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/learn/lessons`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLessons(data);
        }
      })
      .catch(() => {});
  }, []);

  // Extract unique topics for filter bar
  const topicsList = Array.from(
    new Set(lessons.map((l) => (lang === 'en' ? l.topicNameEn || l.topicName : l.topicName)))
  );

  // Filter lessons by selected topic and search query
  const filteredLessons = lessons.filter((lesson) => {
    const topic = lang === 'en' ? lesson.topicNameEn || lesson.topicName : lesson.topicName;
    const title = lang === 'en' ? lesson.titleEn || lesson.title : lesson.title;
    const desc = lang === 'en' ? lesson.descriptionEn || lesson.description : lesson.description;

    const matchesTopic = selectedTopic === 'all' || topic === selectedTopic;
    const matchesSearch =
      searchQuery.trim() === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTopic && matchesSearch && lesson.active !== false;
  });

  return (
    <MainLayout>
      <div className="w-full min-h-screen py-10 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto space-y-10">
        
        {/* BREADCRUMB & HERO HEADER */}
        <div className="space-y-4 text-center sm:text-left border-b border-slate-800/80 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs font-bold shadow-sm">
            <FontAwesomeIcon icon={faWandMagicSparkles} className="text-teal-300" />
            <span>{lang === 'en' ? 'Structured Course Path' : 'Lộ Trình Học Theo Bài Học'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-100 tracking-tight leading-tight">
            {lang === 'en' ? (
              <>
                Master Chinese <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Lesson by Lesson</span>
              </>
            ) : (
              <>
                Danh Sách Bài Học <span className="bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Theo Chủ Đề</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
            {lang === 'en'
              ? 'Each lesson is carefully curated with a specific real-world learning topic, Flashcard 3D decks, pronunciation, and Slime Quiz games.'
              : 'Mỗi bài học mang một chủ đề thực tế riêng biệt, kết hợp lướt thẻ từ vựng 3D, âm thanh chuẩn bản ngữ và trò chơi Slime Quiz tương tác.'}
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'en' ? 'Search lessons by topic or keyword...' : 'Tìm kiếm bài học theo chủ đề hoặc từ khóa...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 font-medium focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedTopic === 'all'
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'en' ? 'All Topics' : 'Tất Cả Bài Học'}
            </button>

            {topicsList.map((topicName) => (
              <button
                key={topicName}
                onClick={() => setSelectedTopic(topicName)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedTopic === topicName
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {topicName}
              </button>
            ))}
          </div>
        </div>

        {/* LESSONS GRID CONTAINER (2 Columns on Desktop lg, 1 Column on Mobile/Tablet) */}
        {filteredLessons.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-3">
            <FontAwesomeIcon icon={faFilter} className="text-3xl text-slate-600" />
            <p className="text-slate-400 text-sm font-semibold">
              {lang === 'en' ? 'No lessons found matching your filter.' : 'Không tìm thấy bài học phù hợp với bộ lọc.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredLessons.map((lesson) => {
              const topic = lang === 'en' ? lesson.topicNameEn || lesson.topicName : lesson.topicName;
              const title = lang === 'en' ? lesson.titleEn || lesson.title : lesson.title;
              const desc = lang === 'en' ? lesson.descriptionEn || lesson.description : lesson.description;

              return (
                <div
                  key={lesson.id}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-teal-400/50 rounded-3xl p-6 transition-all duration-300 shadow-xl flex flex-col justify-between gap-6 group hover:shadow-2xl hover:shadow-teal-500/10 backdrop-blur-xl relative overflow-hidden"
                >
                  <div className="space-y-4">
                    {/* TOPIC BADGE & LESSON NUMBER */}
                    <div className="flex items-center justify-between">
                      <span className="px-3.5 py-1.5 rounded-full bg-slate-950 border border-teal-500/30 text-teal-300 text-xs font-extrabold flex items-center gap-2">
                        <span>{lesson.icon}</span>
                        <span>{topic}</span>
                      </span>

                      <span className="px-3 py-1 rounded-full bg-teal-400/10 border border-teal-500/20 text-teal-400 font-mono font-bold text-xs">
                        {lesson.level}
                      </span>
                    </div>

                    {/* LESSON TITLE & DESCRIPTION */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                        {title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed line-clamp-3">
                        {desc}
                      </p>
                    </div>
                  </div>

                  {/* BOTTOM META INFO & ACTION BUTTON */}
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faClock} className="text-teal-400" />
                        <span>{lesson.durationMinutes} {lang === 'en' ? 'mins' : 'phút'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-teal-400" />
                        <span>{lesson.totalCards} {lang === 'en' ? 'cards' : 'thẻ'}</span>
                      </span>
                    </div>

                    <Link
                      to={`/learn/chinese?category=${lesson.category}`}
                      className="px-6 py-2.5 rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs sm:text-sm hover:shadow-xl hover:shadow-teal-400/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer self-end sm:self-auto"
                    >
                      <span>{lang === 'en' ? 'Start Lesson' : 'Học Bài Này'}</span>
                      <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
