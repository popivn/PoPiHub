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
import { useI18n } from '../../../i18n';
import { MainLayout } from '../../layout';
import { apiUrl, routes } from '../../../services/routes';

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

export default function LessonsPage() {
  const { lang } = useI18n();
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch(apiUrl(routes.learn.lessons), { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLessons(data);
        }
      })
      .catch(() => {})
      .finally(() => setLessonsLoading(false));
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
        {lessonsLoading ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800/60 rounded-3xl space-y-3">
            <div className="inline-block w-10 h-10 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm font-semibold">
              {lang === 'en' ? 'Loading lessons...' : 'Đang tải bài học...'}
            </p>
          </div>
        ) : filteredLessons.length === 0 ? (
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
