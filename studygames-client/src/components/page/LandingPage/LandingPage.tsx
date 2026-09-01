import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faGamepad,
  faBook,
  faLayerGroup,
  faMicrophone,
  faRepeat,
  faChartLine,
  faGlobe,
  faBolt,
  faGraduationCap,
  faPuzzlePiece,
  faHeart,
  faStar,
  faFire,
  faTrophy,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../../../i18n';
import { Navbar } from '../../layout';
import { Loading } from '../../helpers';
import { fetchTopicSettings, type TopicItem } from '../../../services/courseService';
import { fetchFeatures, type FeatureItem } from '../../../services/featuresService';
import './LandingPage.css';

/** Map icon name (string từ DB) → FontAwesome IconDefinition */
const ICON_MAP: Record<string, IconDefinition> = {
  faBook,
  faLayerGroup,
  faMicrophone,
  faRepeat,
  faChartLine,
  faGlobe,
  faBolt,
  faGamepad,
  faGraduationCap,
  faPuzzlePiece,
  faHeart,
  faStar,
  faFire,
  faTrophy,
};

function getIcon(name: string): IconDefinition {
  return ICON_MAP[name] ?? faBolt;
}

const renderHighlightedText = (text: string) => {
  const parts = text.split(/(SliStudy|Xianria|xianria)/g);
  return parts.map((part, i) =>
    part === 'SliStudy' || part === 'Xianria' || part === 'xianria' ? (
      <span key={i} className="text-teal-400 font-semibold drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const GAME_URL = (import.meta as any).env?.VITE_GAME_URL ?? 'http://localhost:3636';

export default function LandingPage() {
  const { t, lang } = useI18n();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);

  useEffect(() => {
    // Fetch topics
    let cancelled = false;
    fetchTopicSettings()
      .then((data) => {
        if (!cancelled) setTopics(data || []);
      })
      .catch((err) => {
        if (!cancelled) setTopicsError(err?.message ?? 'Không tải được chủ đề học');
      })
      .finally(() => {
        if (!cancelled) setTopicsLoading(false);
      });

    // Fetch features
    fetchFeatures()
      .then((data) => {
        if (!cancelled) setFeatures(data || []);
      })
      .catch(() => {
        // Silent fail — features không critical
      })
      .finally(() => {
        if (!cancelled) setFeaturesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      {/* Shared Header Navbar Component */}
      <Navbar showNavLinks={true} />

      <main className="flex-1 w-full">
        <section className="w-full px-4 sm:px-8 lg:px-12 py-16 sm:py-24 min-h-[70vh] flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* Logo Image: Order-1 on mobile (top), Order-2 on desktop (right) */}
          <div className="flex-1 flex justify-center md:justify-end order-1 md:order-2">
            <img
              src="/slime/logo.png"
              alt="SliStudy"
              draggable={false}
              className="w-64 h-64 sm:w-[460px] sm:h-[460px] md:w-[560px] md:h-[560px] object-contain animate-hero-logo select-none"
            />
          </div>

          {/* Text Content: Order-2 on mobile (below logo), Order-1 on desktop (left) */}
          <div className="flex-1 text-center md:text-left order-2 md:order-1">
            <h1
              className="font-pacifico italic text-4xl sm:text-6xl md:text-7xl leading-snug text-teal-400 drop-shadow-[0_0_24px_rgba(45,212,191,0.35)] mb-6 py-2 px-1"
              style={{ color: '#2dd4bf', forcedColorAdjust: 'none', WebkitTextFillColor: '#2dd4bf' }}
            >
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
              {renderHighlightedText(t('hero.subtitle'))}
            </p>
            <a
              href={GAME_URL}
              className="mt-4 sm:mt-6 inline-block group transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <img
                src="/slime/btn/1.png"
                alt={t('hero.cta')}
                draggable={false}
                className="h-36 sm:h-40 md:h-48 w-auto object-contain drop-shadow-[0_12px_28px_rgba(45,212,191,0.45)] group-hover:drop-shadow-[0_16px_36px_rgba(45,212,191,0.65)] transition-all select-none"
              />
            </a>
          </div>
        </section>

        {/* SECTION: TÍNH NĂNG */}
        <section id="features-overview" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16 bg-teal-400/5 border-t border-b border-teal-400/20">
          <div className="w-full space-y-8">
            <div className="mb-8 text-center md:text-left">
              <h2
                className="text-left text-3xl sm:text-4xl font-extrabold mb-4 uppercase tracking-wider flex items-center gap-3 text-teal-400"
                style={{ color: '#2dd4bf', forcedColorAdjust: 'none', WebkitTextFillColor: '#2dd4bf' }}
              >
                <span>{lang === 'en' ? 'Features' : 'Tính Năng'}</span>
              </h2>
              <div className="w-full h-0.5 bg-gradient-to-r from-teal-400 via-teal-500/40 to-slate-800/20 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuresLoading ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loading visual="ring" size="md" label="Đang tải tính năng…" />
                </div>
              ) : features.filter((f) => f.active !== false).length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm">
                  Chưa có tính năng nào.
                </div>
              ) : (
                features.filter((f) => f.active !== false).map((f) => (
                  <Link
                    key={f.id}
                    to={f.url}
                    className="group bg-slate-950/60 border border-teal-400/20 hover:border-teal-400/60 rounded-xl overflow-hidden flex flex-col transition-all duration-300 shadow-xl hover:shadow-teal-400/15"
                  >
                    {/* Banner ảnh nằm ngang — fallback icon nếu không có image */}
                    <div
                      className="w-full h-32 sm:h-36 relative overflow-hidden shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${f.colorFrom}30, ${f.colorTo}30)`,
                      }}
                    >
                      {f.image ? (
                        <img
                          src={f.image}
                          alt={lang === 'en' ? (f.titleEn || f.title) : f.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const img = e.currentTarget;
                            if (img.dataset.fallback) return;
                            img.dataset.fallback = '1';
                            img.src = '/slime/fallback/banner.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FontAwesomeIcon
                            icon={getIcon(f.icon)}
                            className="text-4xl"
                            style={{ color: f.colorFrom }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                          {lang === 'en' ? (f.titleEn || f.title) : f.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                          {lang === 'en' ? (f.descriptionEn || f.description) : f.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
                        <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 group-hover:text-teal-300 transition-colors">
                          <span>{lang === 'en' ? 'Explore' : 'Khám phá'}</span>
                          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        {/* SECTION: MINI GAME */}
        <section id="minigame" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-16">
          <div className="w-full space-y-8">
            <div className="mb-8 text-center md:text-left">
              <h2
                className="text-left text-3xl sm:text-4xl font-extrabold text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-3"
                style={{ color: '#f8fafc', forcedColorAdjust: 'none', WebkitTextFillColor: '#f8fafc' }}
              >
                <span>{t('minigame.title')}</span>
              </h2>
              <div className="w-full h-0.5 bg-gradient-to-r from-teal-400/80 via-teal-500/30 to-slate-800/20 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Slime Quiz Card */}
              <Link
                to="/learn/chinese"
                className="group bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 shadow-xl hover:shadow-teal-500/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faGamepad} className="text-2xl text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {lang === 'en' ? 'Slime Quiz' : 'Slime Quiz'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'en'
                      ? 'Guess the meaning of Chinese characters. Fast, fun, and addictive.'
                      : 'Đoán nghĩa chữ Hán nhanh chóng. Vui nhộn và gây nghiện.'}
                  </p>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 group-hover:text-teal-200 transition-colors">
                    <span>{t('minigame.play')}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </span>
                </div>
              </Link>

              {/* Play Xianria Card */}
              <a
                href={GAME_URL}
                className="group bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 shadow-xl hover:shadow-teal-500/10"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={faArrowRight} className="text-2xl text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                    {lang === 'en' ? 'Xianria World' : 'Thế Giới Xianria'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'en'
                      ? 'Jump into the slime world, explore and collect friends.'
                      : 'Nhảy vào thế giới slime, khám phá và kết bạn.'}
                  </p>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-slate-800/80">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 group-hover:text-teal-200 transition-colors">
                    <span>{t('minigame.play')}</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                  </span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* SECTION: BẠN MUỐN HỌC GÌ? */}
        <section id="features" className="w-full px-1 sm:px-4 lg:px-8 xl:px-16 py-16 bg-slate-900/40 border-t border-b border-teal-500/10">
          <div className="w-full space-y-8">
            <div className="mb-8 text-center md:text-left">
              <h2
                className="text-left text-3xl sm:text-4xl font-extrabold text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-3"
                style={{ color: '#f8fafc', forcedColorAdjust: 'none', WebkitTextFillColor: '#f8fafc' }}
              >
                <span>{t('features.title')}</span>
              </h2>
              <div className="w-full h-0.5 bg-gradient-to-r from-teal-400/80 via-teal-500/30 to-slate-800/20 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
            </div>

            {/* DYNAMIC FIELDSET LEGEND FOR EACH TOPIC */}
            {topicsLoading ? (
              <Loading visual="ring" size="lg" label="Đang tải chủ đề học…" minHeight={240} />
            ) : topicsError ? (
              <div className="text-center py-12 text-rose-400 text-sm">
                {topicsError}
              </div>
            ) : topics.filter((t) => t.active !== false).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Chưa có chủ đề học nào.
              </div>
            ) : (
              topics.filter((t) => t.active !== false).map((topic) => (
              <fieldset key={topic.id} className="border-y sm:border border-teal-500/40 rounded-xl p-2 sm:p-6 lg:p-8 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:border-teal-400/70 transition-all duration-300 w-full mb-8">
                <legend className="ml-4 sm:ml-8 px-3.5 py-1 rounded-full bg-slate-950 border border-teal-400/80 text-teal-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-teal-500/20">
                  <span className="text-xs">🇨🇳</span>
                  <span className="bg-gradient-to-r from-teal-300 to-cyan-400 bg-clip-text text-transparent font-extrabold">
                    {lang === 'en' ? (topic.nameEn || topic.name) : topic.name}
                  </span>
                </legend>

                {/* COURSES INSIDE THIS TOPIC */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
                  {Array.isArray(topic.courses) && topic.courses.filter((c) => c.active !== false).map((course) => (
                    <div key={course.id} className="bg-slate-950/60 border border-slate-800/80 hover:border-teal-500/40 rounded-xl p-2 sm:p-5 flex flex-row items-start sm:items-center gap-3 sm:gap-5 transition-all duration-300 shadow-xl group">
                      {/* Course Image */}
                      <div className="w-20 h-20 sm:w-44 sm:h-36 rounded-lg sm:rounded-2xl overflow-hidden border border-teal-500/30 shadow-md shrink-0 group/img bg-slate-900">
                        <img
                          src={course.image || '/chinese_course_thumb.jpg'}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Course Details */}
                      <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-3 min-w-0">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-lg font-bold text-slate-100 group-hover:text-teal-300 transition-colors truncate sm:whitespace-normal">
                            {lang === 'en' ? (course.titleEn || course.title) : course.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5 leading-relaxed line-clamp-2 sm:line-clamp-2">
                            {lang === 'en' ? (course.descriptionEn || course.description) : course.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-end pt-1.5 sm:pt-2 border-t border-slate-800/80">
                          <Link
                            to={course.link || '/learn/chinese'}
                            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-3 sm:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-[10px] sm:text-xs hover:shadow-lg hover:shadow-teal-400/30 hover:scale-105 active:scale-95 transition-all shadow-md"
                          >
                            <span>{lang === 'en' ? 'Start' : 'Học Ngay'}</span>
                            <FontAwesomeIcon icon={faArrowRight} className="text-[10px] sm:text-xs" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              ))
            )}
          </div>
        </section>

        {/* SECTION: GIỚI THIỆU ABOUT */}
        <section id="about" className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-20 text-center mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">{t('about.title')}</h2>
          <p className="text-slate-400 leading-relaxed">
            {renderHighlightedText(t('about.desc'))}
          </p>
        </section>
      </main>

      <footer className="w-full px-6 py-6 text-center border-t border-slate-800/50 text-slate-500 text-sm">
        <p>{renderHighlightedText(t('footer').replace('{year}', String(new Date().getFullYear())))}</p>
      </footer>
    </div>
  );
}
