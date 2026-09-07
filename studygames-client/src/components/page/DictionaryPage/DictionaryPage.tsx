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
  faFire,
  faBookOpen,
  faUtensils,
  faUsers,
  faGraduationCap,
  faBriefcase,
  faPlane,
  faShoppingBag,
  faHeartPulse,
  faCloudSun,
  faFutbol,
  faLaptopCode,
  faHouseChimney,
  faHand,
  faUserTie,
  faHashtag,
  faClock,
  faPersonWalking,
  faCompass,
  faCar,
  faBagShopping,
  faComments,
  faBoxOpen,
  faFaceSmile,
  faPaw,
  faBook,
  faFeather,
  faScroll,
  faAward,
  faTrophy,
  faCrown,
  faDatabase,
  faLayerGroup,
  faGamepad,
  faSpinner,
  faTags,
  faRightLeft,
} from '@fortawesome/free-solid-svg-icons';
import { MainLayout } from '../../layout';
import { useI18n } from '../../../i18n';
import { useDictionary, type DictPhrase, type HotKeyword, type Topic, type ExampleSentence } from './useDictionary.tsx';
import { pinyinToVietnamese } from './pinyinVietnameseHelper';
import './DictionaryPage.css';

export default function DictionaryPage() {
  const { lang } = useI18n();
  const { state, actions, hotKeywords, topics, translateEtymologyType, highlightWord } = useDictionary(lang);

  const iconMap: Record<string, any> = {
    faUtensils,
    faUsers,
    faGraduationCap,
    faBriefcase,
    faPlane,
    faShoppingBag,
    faHeartPulse,
    faCloudSun,
    faFutbol,
    faLaptopCode,
    faHouseChimney,
    faHand,
    faUserTie,
    faHashtag,
    faClock,
    faPersonWalking,
    faCompass,
    faCar,
    faBagShopping,
    faComments,
    faBoxOpen,
    faFaceSmile,
    faPaw,
    faBook,
    faFeather,
    faScroll,
    faAward,
    faTrophy,
    faCrown,
    faDatabase,
    faLayerGroup,
    faGamepad,
    faBookOpen,
  };

  const thematicTopics = topics.filter(
    (t) => !t.id.startsWith('hsk') && t.id !== 'all' && t.id !== 'everything',
  );
  const hskTopics = topics.filter((t) => t.id.startsWith('hsk'));

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
              value={state.query}
              onChange={(e) => actions.setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const trimmed = state.query.trim();
                  if (trimmed) {
                    actions.lookup(trimmed);
                    actions.setIsSearchFocused(false);
                  }
                }
              }}
              onFocus={() => actions.setIsSearchFocused(true)}
              onBlur={() => actions.setIsSearchFocused(false)}
              placeholder={lang === 'en' ? 'Search by character, pinyin or meaning…' : 'Tìm theo chữ Hán, pinyin hoặc nghĩa…'}
              className="w-full h-12 rounded-2xl bg-slate-900/90 border border-teal-500/30 pl-12 pr-10 text-sm outline-none focus:border-teal-400 focus:shadow-lg focus:shadow-teal-500/20 transition-all"
              autoFocus
            />
            {state.query && (
              <button
                type="button"
                onClick={actions.clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
                aria-label="Clear"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            )}

            {/* Floating search results dropdown */}
            {state.isSearchFocused && (state.loading || (state.searched && state.results.length === 0) || state.results.length > 0) && (
              <div
                className="absolute z-20 left-0 right-0 top-full mt-2 bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden"
                onMouseDown={(e) => e.preventDefault()}
              >
                {state.loading && (
                  <div className="flex flex-col items-center justify-center py-6 gap-2">
                    <div className="inline-block w-6 h-6 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                    <p className="text-slate-400 text-xs font-semibold">
                      {lang === 'en' ? 'Searching…' : 'Đang tìm…'}
                    </p>
                  </div>
                )}
                {!state.loading && state.searched && state.results.length === 0 && (
                  <div className="px-5 py-4 text-left">
                    <p className="text-xs text-slate-500">
                      {lang === 'en' ? `No results for "${state.query}".` : `Không tìm thấy kết quả cho "${state.query}".`}
                    </p>
                  </div>
                )}
                {!state.loading && state.results.length > 0 && (
                  <div className="divide-y divide-slate-800/60 max-h-[360px] overflow-y-auto">
                    {state.results.map((r: DictPhrase, i: number) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => actions.lookup(r.simplified)}
                        className="w-full px-5 py-3.5 text-left transition-all hover:bg-slate-800/50 border-l-2 border-transparent"
                      >
                        <p className="text-sm text-slate-100 flex items-center flex-wrap gap-x-2">
                          <span className="font-semibold text-base text-slate-100">{r.simplified}</span>
                          {r.traditional && r.traditional !== r.simplified && (
                            <span className="text-slate-500 text-xs">/ {r.traditional}</span>
                          )}
                          <span className="text-teal-400 font-bold text-xs">【{r.pinyin}】</span>
                          {r.pinyin && (
                            <span className="text-amber-300/80 text-xs font-normal">
                              đọc: {pinyinToVietnamese(r.pinyin)}
                            </span>
                          )}
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
          {state.recentSearches.length > 0 && (
            <div className="max-w-2xl mx-auto mt-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Recent searches' : 'Tìm kiếm gần đây'}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {state.recentSearches.map((w: string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => actions.lookup(w)}
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
          <div className="w-full grid md:grid-cols-[440px_1fr_380px] lg:grid-cols-[480px_1fr_420px] gap-6">
            {/* Left column wrapper */}
            <div className="space-y-6">
              {/* Hot keywords */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 h-fit">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFire} className="text-orange-500" />
                  {lang === 'en' ? 'Hot Keywords' : 'Từ khóa hot'}
                </p>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {hotKeywords.map((keyword: HotKeyword, index: number) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        actions.setQuery(keyword.word);
                        actions.lookup(keyword.word);
                        actions.search(keyword.word);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-4 py-3 rounded-lg bg-slate-800/50 text-center hover:bg-teal-500/20 border border-slate-700/50 hover:border-teal-400/50 transition-all group"
                    >
                      <span className="text-lg text-slate-100 font-semibold group-hover:text-teal-300 transition-colors">
                        {keyword.word}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vocabulary by topic */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 h-fit space-y-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} className="text-teal-400" />
                    {lang === 'en' ? 'Vocabulary by Topic' : 'Từ vựng theo chủ đề'}
                  </p>
                  {state.topicsLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                  )}
                </div>

                {/* Section 1: Chủ Đề Thường Nhật */}
                {thematicTopics.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faHouseChimney} className="text-teal-400 text-xs" />
                        {lang === 'en' ? 'Daily & Thematic Topics' : 'Chủ Đề Thường Nhật'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {thematicTopics.length} {lang === 'en' ? 'topics' : 'chủ đề'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {thematicTopics.map((topic: Topic) => {
                        const isSelected = state.selectedTopic?.id === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                actions.setSelectedTopic(null);
                              } else {
                                actions.setSelectedTopic(topic);
                                actions.fetchTopicWords(topic.id);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-lg text-center border transition-all group cursor-pointer ${
                              isSelected
                                ? 'bg-teal-500/20 border-teal-400 ring-1 ring-teal-400/50 shadow-md shadow-teal-500/10'
                                : 'bg-slate-800/50 hover:bg-teal-500/20 border-slate-700/50 hover:border-teal-400/50'
                            }`}
                          >
                            <div className="text-2xl mb-1 text-teal-400 group-hover:scale-110 transition-transform">
                              <FontAwesomeIcon icon={iconMap[topic.icon] || faBookOpen} />
                            </div>
                            <p className="text-xs text-slate-100 font-semibold group-hover:text-teal-300 transition-colors truncate">
                              {lang === 'en' ? topic.nameEn : topic.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{topic.wordCount} từ</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Section 2: Cấp Độ HSK */}
                {hskTopics.length > 0 && (
                  <div className="space-y-2.5 pt-3 border-t border-slate-800/70">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faGraduationCap} className="text-sky-400 text-xs" />
                        {lang === 'en' ? 'HSK Levels' : 'Cấp Độ HSK (Chuẩn 3.0)'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {hskTopics.length} {lang === 'en' ? 'levels' : 'cấp độ'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {hskTopics.map((topic: Topic) => {
                        const isSelected = state.selectedTopic?.id === topic.id;
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                actions.setSelectedTopic(null);
                              } else {
                                actions.setSelectedTopic(topic);
                                actions.fetchTopicWords(topic.id);
                              }
                            }}
                            className={`px-3 py-2.5 rounded-lg text-center border transition-all group cursor-pointer ${
                              isSelected
                                ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50 shadow-md shadow-sky-500/10'
                                : 'bg-slate-800/50 hover:bg-sky-500/20 border-slate-700/50 hover:border-sky-400/50'
                            }`}
                          >
                            <div className="text-2xl mb-1 text-sky-400 group-hover:scale-110 transition-transform">
                              <FontAwesomeIcon icon={iconMap[topic.icon] || faGraduationCap} />
                            </div>
                            <p className="text-xs text-slate-100 font-semibold group-hover:text-sky-300 transition-colors truncate">
                              {lang === 'en' ? topic.nameEn : topic.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{topic.wordCount} từ</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Selected Topic Words Drawer */}
                {state.selectedTopic && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-teal-400">
                          {lang === 'en' ? state.selectedTopic.nameEn : state.selectedTopic.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {state.topicWords.length} từ
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => actions.setSelectedTopic(null)}
                        className="text-xs text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title={lang === 'en' ? 'Close' : 'Đóng'}
                      >
                        <FontAwesomeIcon icon={faXmark} />
                      </button>
                    </div>

                    {state.topicWordsLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {state.topicWords.map((wordItem: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              actions.setQuery(wordItem.char);
                              actions.lookup(wordItem.char);
                              actions.search(wordItem.char);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 rounded-lg bg-slate-800/40 hover:bg-teal-500/15 border border-slate-700/40 hover:border-teal-400/40 text-left transition-all group cursor-pointer"
                          >
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                                {wordItem.char}
                              </span>
                              <span className="text-[10px] text-teal-400/80 font-mono">
                                {wordItem.pinyin}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {wordItem.hanViet ? `${wordItem.hanViet} • ` : ''}{wordItem.meaning}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Middle: details, meanings and examples */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              {!state.selected && !state.loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-teal-400/30 mb-3" />
                  <p className="text-xs text-slate-500">
                    {lang === 'en' ? 'Select a word to see details.' : 'Chọn một từ để xem chi tiết.'}
                  </p>
                </div>
              )}
              {state.loading && !state.selected && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inline-block w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
              )}
              {state.selected && (
                <div className="space-y-5">
                  {/* Character/phrase header */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-20 flex items-center justify-center bg-slate-950 border border-teal-500/30 rounded-2xl shadow-lg shadow-teal-500/10 px-4 shrink-0 ${
                        state.selected.char.length === 1 ? 'w-20' : 'w-auto max-w-40'
                      }`}
                    >
                      <span
                        className={`font-bold text-slate-100 leading-none ${
                          state.selected.char.length === 1
                            ? 'text-5xl'
                            : state.selected.char.length === 2
                            ? 'text-4xl'
                            : 'text-3xl'
                        }`}
                      >
                        <span className="whitespace-nowrap">{state.selected.char}</span>
                      </span>
                    </div>
                    <div className="flex-1 space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        {state.history.length > 0 && (
                          <button
                            type="button"
                            onClick={actions.goBack}
                            className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs hover:bg-teal-400 hover:text-slate-950 transition-all"
                            title={lang === 'en' ? 'Back' : 'Quay lại'}
                          >
                            <FontAwesomeIcon icon={faArrowLeft} />
                          </button>
                        )}
                        <span className="text-base text-teal-400 font-bold">{state.selected.pinyin}</span>
                        {lang === 'vi' && state.selected.pinyin && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                            đọc: {pinyinToVietnamese(state.selected.pinyin)}
                          </span>
                        )}
                        {state.selected.posVi && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {state.selected.posVi}
                          </span>
                        )}
                        {state.selected.hskLevel && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            HSK {state.selected.hskLevel}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => state.selected && actions.speakText(state.selected.char)}
                          className="w-7 h-7 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center text-xs hover:bg-teal-400 hover:text-slate-950 transition-all"
                        >
                          <FontAwesomeIcon icon={faVolumeHigh} />
                        </button>
                      </div>
                      {state.selected.hanViet && state.selected.char.length <= 2 && (
                        <p className="text-sm text-slate-300">
                          <span className="text-xs text-slate-500">Hán-Việt: </span>
                          <span className="font-semibold">{state.selected.hanViet}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meanings */}
                  {state.selected.meaning && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                        {lang === 'en' ? 'Vietnamese meaning' : 'Nghĩa tiếng Việt'}
                      </p>
                      <p className="text-sm text-slate-200 leading-relaxed">{state.selected.meaning}</p>
                    </div>
                  )}
                  {state.selected.meaningEn && lang === 'en' && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                        English meaning
                      </p>
                      <p className="text-sm text-slate-400 leading-relaxed">{state.selected.meaningEn}</p>
                    </div>
                  )}

                  {/* Synonyms (Từ cận nghĩa / Đồng nghĩa) */}
                  {state.selected.synonyms && state.selected.synonyms.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faTags} className="text-sky-400 text-xs" />
                        {lang === 'en' ? 'Synonyms' : 'Từ cận nghĩa (Đồng nghĩa)'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {state.selected.synonyms.map((syn: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              actions.lookup(syn);
                              actions.setQuery(syn);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 border border-sky-500/20 hover:border-sky-400/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                          >
                            {syn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antonyms (Từ trái nghĩa) */}
                  {state.selected.antonyms && state.selected.antonyms.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faRightLeft} className="text-rose-400 text-xs" />
                        {lang === 'en' ? 'Antonyms' : 'Từ trái nghĩa'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {state.selected.antonyms.map((ant: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              actions.lookup(ant);
                              actions.setQuery(ant);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/20 hover:border-rose-400/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
                          >
                            {ant}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compounds (Từ ghép liên quan) */}
                  {state.selected.compounds && state.selected.compounds.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLayerGroup} className="text-teal-400 text-xs" />
                        {lang === 'en' ? 'Compound words' : 'Từ ghép liên quan'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {state.selected.compounds.map((cmp: { word: string; pinyin: string; meaning: string }, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              actions.lookup(cmp.word);
                              actions.setQuery(cmp.word);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-teal-500/10 border border-slate-800/80 hover:border-teal-500/30 text-left transition-all active:scale-[0.98] cursor-pointer group"
                          >
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
                                {cmp.word}
                              </span>
                              <span className="text-[11px] text-teal-400/80 font-mono">
                                {cmp.pinyin}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {cmp.meaning}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {state.selected.examples.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
                        {lang === 'en' ? 'Examples' : 'Ví dụ'}
                      </p>
                      <div className="space-y-2">
                        {state.selected.examples.map((ex: { sentence: string; pinyin: string; meaning: string }, i: number) => (
                          <div
                            key={i}
                            className="group bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1 hover:border-slate-700 transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-slate-200 font-semibold">{ex.sentence}</p>
                              <button
                                type="button"
                                onClick={() => actions.speakText(ex.sentence)}
                                className="shrink-0 w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 flex items-center justify-center text-xs transition-all active:scale-90 cursor-pointer"
                                title={lang === 'en' ? 'Listen' : 'Nghe phát âm'}
                                aria-label="Listen"
                              >
                                <FontAwesomeIcon icon={faVolumeHigh} className="text-[11px]" />
                              </button>
                            </div>
                            <p className="text-xs text-teal-400/80">{ex.pinyin}</p>
                            <p className="text-xs text-slate-500 italic">{ex.meaning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Context Examples */}
                  {(state.aiExamplesLoading || (state.aiExamples && state.aiExamples.length > 0)) && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faBookOpen} className="text-teal-400 text-xs" />
                        {lang === 'en' ? 'Example sentences' : 'Ví dụ ngữ cảnh'}
                      </p>
                      {state.aiExamplesLoading ? (
                        <div className="space-y-2">
                          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-2 animate-pulse">
                            <div className="h-4 bg-slate-800 rounded w-2/5" />
                            <div className="h-3 bg-slate-800/70 rounded w-1/4" />
                            <div className="pt-1 flex items-center gap-2">
                              <div className="h-3.5 bg-slate-800/50 rounded w-3/5" />
                              <span className="text-[11px] text-teal-400/80 font-medium flex items-center gap-1 shrink-0">
                                <FontAwesomeIcon icon={faSpinner} className="text-[10px] animate-spin" />
                                {lang === 'en' ? 'SliStudy is loading...' : 'SliStudy đang load nè...'}
                              </span>
                            </div>
                          </div>
                          <div className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {state.aiExamples?.map((ex: ExampleSentence, i: number) => (
                            <div
                              key={i}
                              className="group bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 space-y-1 transition-all hover:border-slate-700"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-slate-200 font-semibold leading-relaxed">
                                  {highlightWord(ex.sentence, state.selected?.char ?? '')}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => actions.speakText(ex.sentence)}
                                  className="shrink-0 w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-teal-500/20 text-slate-400 hover:text-teal-300 flex items-center justify-center text-xs transition-all active:scale-90 cursor-pointer"
                                  title={lang === 'en' ? 'Listen' : 'Nghe phát âm'}
                                  aria-label="Listen"
                                >
                                  <FontAwesomeIcon icon={faVolumeHigh} className="text-[11px]" />
                                </button>
                              </div>
                              <p className="text-xs text-teal-400/90 font-mono">{ex.pinyin}</p>
                              
                              {/* Vietnamese translation with skeleton loading */}
                              {ex.isTranslating ? (
                                <div className="pt-1 flex items-center gap-2">
                                  <div className="h-3.5 bg-slate-800/90 rounded animate-pulse w-3/5" />
                                  <span className="text-[11px] text-teal-400/80 font-medium flex items-center gap-1.5 shrink-0 animate-pulse">
                                    <FontAwesomeIcon icon={faSpinner} className="text-[10px] animate-spin" />
                                    {lang === 'en' ? 'SliStudy is loading...' : 'SliStudy đang load nè...'}
                                  </span>
                                </div>
                              ) : (
                                <div className="pt-0.5 space-y-0.5">
                                  {ex.meaningVi ? (
                                    <p className="text-xs text-slate-200 font-medium">{ex.meaningVi}</p>
                                  ) : (
                                    <p className="text-xs text-slate-400 italic">{ex.meaning || ex.meaningEn}</p>
                                  )}
                                  {ex.meaningVi && ex.meaningEn && (
                                    <p className="text-[11px] text-slate-500 italic">{ex.meaningEn}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!state.selected.meaning && !state.selected.meaningEn && state.selected.examples.length === 0 && (
                    <p className="text-xs text-slate-500">
                      {lang === 'en' ? 'No detailed information available.' : 'Không có thông tin chi tiết.'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right: stroke graph */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
              {!state.selected && !state.loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-teal-400/30 mb-3" />
                  <p className="text-xs text-slate-500">
                    {lang === 'en' ? 'Select a word to see stroke order.' : 'Chọn một từ để xem bút tích.'}
                  </p>
                </div>
              )}
              {state.loading && !state.selected && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="inline-block w-8 h-8 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                </div>
              )}
              {state.selected && (
                <div className="space-y-6">
                  {/* Per-character tabs for phrases */}
                  {state.selected.char.length > 1 && (
                    <div className="space-y-0">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">
                        {lang === 'en' ? 'Tap a character to see stroke order' : 'Nhấn từng chữ để xem bút tích'}
                      </p>
                      <div className="flex flex-wrap gap-x-2 gap-y-3 mt-2">
                        {[...state.selected.char].map((c: string, i: number) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => actions.loadHanziForChar(c)}
                            className={`w-11 h-11 rounded-xl font-bold text-2xl transition-all active:scale-90 cursor-pointer ${
                              state.activeChar === c
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
                  {state.hanzi?.strokes && state.hanzi.strokes.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-square bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden">
                        <svg viewBox="-60 -60 1144 1144" className="w-[92%] h-[92%] m-auto">
                          <line x1="0" y1="512" x2="1024" y2="512" className="stroke-slate-800/50" strokeWidth="2" />
                          <line x1="512" y1="0" x2="512" y2="1024" className="stroke-slate-800/50" strokeWidth="2" />
                          <g transform="scale(1, -1) translate(0, -1024)">
                            {state.hanzi.strokes.map((s: string, i: number) => (
                              <path
                                key={i}
                                d={s}
                                fill="none"
                                stroke={i === 0 ? '#f43f5e' : '#2dd4bf'}
                                strokeWidth={i === 0 ? 60 : 50}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`hanzi-stroke ${state.animateStrokes ? 'hanzi-stroke-anim' : ''}`}
                                style={{ animationDelay: `${i * 0.5}s` }}
                              />
                            ))}
                          </g>
                        </svg>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {lang === 'en' ? `${state.hanzi.strokes.length} strokes` : `${state.hanzi.strokes.length} nét`}
                        </span>
                        <button
                          type="button"
                          onClick={actions.toggleStrokeAnimation}
                          className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-300 flex items-center justify-center hover:bg-teal-500/20 transition-colors"
                          title={state.animateStrokes ? (lang === 'en' ? 'Stop' : 'Dừng') : (lang === 'en' ? 'Animate' : 'Phát bút tích')}
                        >
                          <FontAwesomeIcon icon={state.animateStrokes ? faPause : faPlay} className="text-xs" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Active character details */}
                  {state.hanzi?.strokes && state.hanzi.strokes.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-800/80">
                      {/* Bính âm / Pinyin */}
                      {((state.hanzi.pinyin && state.hanzi.pinyin.length > 0) || state.activeCharPinyin) && (() => {
                        const rawPinyin = state.hanzi.pinyin && state.hanzi.pinyin.length > 0
                          ? state.hanzi.pinyin.join(', ')
                          : state.activeCharPinyin;
                        const viReading = pinyinToVietnamese(rawPinyin);

                        return (
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                              {lang === 'en' ? 'Pinyin:' : 'Bính âm:'}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-base text-teal-300 font-bold font-mono tracking-wide">
                                {rawPinyin}
                              </span>
                              {lang === 'vi' && viReading && (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30">
                                  đọc: {viReading}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Nghĩa / Meaning */}
                      {state.activeCharMeaning && (
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                            {lang === 'en' ? 'Meaning:' : 'Nghĩa:'}
                          </p>
                          <p className="text-sm text-slate-200 font-medium leading-relaxed">
                            {state.activeCharMeaning}
                          </p>
                        </div>
                      )}

                      {/* Hình thái / Decomposition */}
                      {state.hanzi.decomposition && (
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                            {lang === 'en' ? 'Decomposition:' : 'Hình thái:'}
                          </p>
                          <p className="text-sm text-slate-300 font-medium">
                            {state.hanzi.decomposition}
                          </p>
                        </div>
                      )}

                      {/* Lục thư / Etymology */}
                      {state.hanzi.etymology?.hint && (lang === 'en' || state.etymologyLoading || state.etymologyVi || translateEtymologyType(state.hanzi.etymology.type)) && (
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
                            {lang === 'en' ? 'Etymology:' : 'Lục thư:'}
                          </p>
                          {lang === 'en' ? (
                            <p className="text-sm text-slate-300">
                              <span className="font-semibold">
                                {translateEtymologyType(state.hanzi.etymology.type)} — {state.hanzi.etymology.hint}
                              </span>
                            </p>
                          ) : state.etymologyLoading ? (
                            <div className="space-y-1.5 animate-pulse">
                              <div className="h-4 bg-slate-800 rounded w-3/4" />
                              <div className="h-4 bg-slate-800 rounded w-1/2" />
                            </div>
                          ) : (
                            <p className="text-sm text-slate-300">
                              <span className="font-semibold">
                                {translateEtymologyType(state.hanzi.etymology.type)}
                                {state.etymologyVi ? ` — ${state.etymologyVi}` : ''}
                              </span>
                            </p>
                          )}
                        </div>
                      )}

                      {/* Bộ / Radical */}
                      {state.hanzi.radical && (
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                            {lang === 'en' ? 'Radical:' : 'Bộ:'}
                          </p>
                          <p className="text-sm text-slate-300 font-medium">
                            {state.hanzi.radical}
                          </p>
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
