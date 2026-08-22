import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRotate,
  faChevronRight,
  faVolumeHigh,
  faCheckCircle,
  faXmarkCircle,
  faLightbulb,
  faHouse,
  faChevronDown,
  faCheck,
  faBookOpen,
  faGamepad,
  faLayerGroup,
  faBriefcase,
  faHouseChimney,
  faLaptopCode,
} from '@fortawesome/free-solid-svg-icons';
import { MainLayout } from '../../layout';
import { useLearnChinesePage } from './useLearnChinesePage';
import './LearnChinesePage.css';

const CATEGORY_ICONS: Record<string, any> = {
  faLayerGroup,
  faBriefcase,
  faHouseChimney,
  faLaptopCode,
  faBookOpen,
};

export default function LearnChinesePage() {
  const {
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
  } = useLearnChinesePage();

  return (
    <MainLayout>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
        {/* Breadcrumb Navigation Bar */}
        <div className="w-full px-4 sm:px-8 pt-4 pb-1 flex items-center justify-start gap-2 text-xs text-slate-400 font-semibold">
          <Link to="/" className="hover:text-teal-400 transition-colors flex items-center gap-1.5">
            <FontAwesomeIcon icon={faHouse} className="text-xs text-teal-400" />
            <span>{lang === 'en' ? 'Home' : 'Trang chủ'}</span>
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-slate-600" />
          <span className="text-slate-200 font-bold">
            {lang === 'en' ? 'Chinese Learning' : 'Học Chữ Hán'}
          </span>
        </div>

      {/* Topic Category Filter & Mode Switcher Sticky Bar */}
      <div className={`${isSticky ? 'sticky top-[64px] sm:top-[72px] z-40' : ''} w-full bg-slate-950/90 backdrop-blur-md py-2.5 px-4 sm:px-8 border-b border-slate-800/60 mt-4 sm:mt-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg transition-all duration-300`}>
        {/* MOBILE VIEW: Custom Sleek Category Dropdown Popover (< sm) */}
        <div className="w-full block sm:hidden relative">
          <button
            type="button"
            onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
            className="w-full bg-slate-900/90 border border-teal-500/50 text-teal-300 font-bold text-xs rounded-xl px-3.5 py-2.5 flex items-center justify-between shadow-lg shadow-teal-500/10 cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5 truncate">
              <FontAwesomeIcon icon={CATEGORY_ICONS[activeCategoryObj.icon] || faBookOpen} className="text-teal-400 text-xs" />
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
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  const catTitle = lang === 'en' ? (cat.nameEn || cat.name) : cat.name;
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
                        <FontAwesomeIcon icon={CATEGORY_ICONS[cat.icon] || faBookOpen} className="text-sm leading-none" />
                        <span>{catTitle}</span>
                      </div>
                      {isSelected && (
                        <FontAwesomeIcon icon={faCheck} className="text-slate-950 text-xs" />
                      )}
                    </button>
                  );
                })}

                {/* Border ngăn cách & Mode Switcher Items trong Dropdown trên Mobile */}
                <div className="border-t border-slate-800/90 pt-1.5 mt-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('flashcard');
                      setIsCatDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      mode === 'flashcard'
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FontAwesomeIcon icon={faBookOpen} className={mode === 'flashcard' ? 'text-slate-950' : 'text-teal-400'} />
                      <span>{lang === 'en' ? 'Vocabulary Feed' : 'Bảng Tin Từ Vựng'}</span>
                    </div>
                    {mode === 'flashcard' && (
                      <FontAwesomeIcon icon={faCheck} className="text-slate-950 text-xs" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('quiz');
                      setIsCatDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      mode === 'quiz'
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 shadow-md shadow-teal-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FontAwesomeIcon icon={faGamepad} className={mode === 'quiz' ? 'text-slate-950' : 'text-teal-400'} />
                      <span>{lang === 'en' ? `Slime Quiz (${score})` : `Slime Quiz (${score}đ)`}</span>
                    </div>
                    {mode === 'quiz' && (
                      <FontAwesomeIcon icon={faCheck} className="text-slate-950 text-xs" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* DESKTOP VIEW: Horizontal Category Pills List (>= sm) */}
        <div className="hidden sm:flex items-center gap-2.5 overflow-x-auto scrollbar-none justify-start flex-1 py-1">
          {categories.map((cat) => {
            const catTitle = lang === 'en' ? (cat.nameEn || cat.name) : cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 border-teal-300 shadow-lg shadow-teal-500/30 ring-1 ring-teal-300/50'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <FontAwesomeIcon icon={CATEGORY_ICONS[cat.icon] || faBookOpen} className="text-xs leading-none" />
                <span>{catTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Mode Switcher Buttons */}
        <div className="hidden sm:flex bg-slate-900/90 border border-slate-800/90 p-1 rounded-full gap-1 text-xs font-semibold shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setMode('flashcard')}
            className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'flashcard'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{lang === 'en' ? 'Vocabulary Feed' : 'Bảng Tin Từ Vựng'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('quiz')}
            className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'quiz'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-extrabold shadow-md shadow-teal-400/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{lang === 'en' ? `Slime Quiz (${score})` : `Slime Quiz (${score}đ)`}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-8 py-4 flex flex-col items-center">

        {/* MODE 1: FLASHCARD SOCIAL FEED */}
        {mode === 'flashcard' && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
            {charactersLoading ? (
              <div className="col-span-full text-center py-16 space-y-3">
                <div className="inline-block w-10 h-10 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-semibold">
                  {lang === 'en' ? 'Loading vocabulary...' : 'Đang tải từ vựng...'}
                </p>
              </div>
            ) : characters.length === 0 ? (
              <div className="col-span-full text-center py-16 space-y-3">
                <p className="text-slate-400 text-sm font-semibold">
                  {lang === 'en' ? 'No vocabulary available for this topic.' : 'Không có từ vựng cho chủ đề này.'}
                </p>
              </div>
            ) : (
              characters.map((char, index) => {
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
                      {/* FRONT SIDE */}
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

                      {/* BACK SIDE */}
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
            }))}
          </div>
        )}

        {/* MODE 2: SLIME QUIZ GAME */}
        {mode === 'quiz' && (
          <div className="w-full max-w-lg flex flex-col items-center gap-6">
            {charactersLoading || !currentChar ? (
              <div className="w-full bg-slate-900/90 border border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-3">
                {charactersLoading ? (
                  <div className="inline-block w-10 h-10 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
                ) : null}
                <p className="text-slate-400 text-sm font-semibold">
                  {charactersLoading
                    ? (lang === 'en' ? 'Loading vocabulary...' : 'Đang tải từ vựng...')
                    : (lang === 'en' ? 'No vocabulary available for this topic.' : 'Không có từ vựng cho chủ đề này.')}
                </p>
              </div>
            ) : (
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
                  {lang === 'en' ? 'Next Question ➡' : 'Câu tiếp theo ➡'}
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </main>
    </div>
    </MainLayout>
  );
}
