import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faXmark, faStar, faCircleInfo, faGamepad, faLanguage, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';
import LanguageDropdown from './LanguageDropdown';
import './LandingPage.css';

const renderHighlightedText = (text: string) => {
  const parts = text.split(/(SliStudy|GENIUSIA)/g);
  return parts.map((part, i) =>
    part === 'SliStudy' || part === 'GENIUSIA' ? (
      <span key={i} className="text-teal-400 font-semibold drop-shadow-[0_0_10px_rgba(45,212,191,0.35)]">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export default function LandingPage() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <header className="sticky top-0 z-[9999] backdrop-blur-md bg-slate-950/80 border-b border-teal-500/20 shadow-sm shadow-teal-400/20">
        {/* Container Fluid Header */}
        <div className="w-full flex items-center justify-between px-4 sm:px-8 py-2.5">
          <div className="flex items-center gap-2 relative z-[99999]">
            <img src="/logo.png" alt="SliStudy" draggable={false} className="w-11 h-11 sm:w-12 sm:h-12 object-contain p-0.5 relative z-[99999] select-none" />
            <span className="inline-block font-pacifico italic text-xl sm:text-2xl tracking-wider pr-2.5 pb-1 pt-0.5 -mr-2.5 -mb-1 leading-normal bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(45,212,191,0.4)] select-none relative z-[99999] underline decoration-teal-400 decoration-[2px] underline-offset-4">
              SliStudy
            </span>
          </div>

          {/* Right Header Group */}
          <div className="flex items-center gap-2.5 md:gap-5">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <a href="#features" className="text-slate-300 hover:text-teal-400 transition-colors">
                {t('nav.features')}
              </a>
              <a href="#about" className="text-slate-300 hover:text-teal-400 transition-colors">
                {t('nav.about')}
              </a>
              <Link
                to="/social"
                className="rounded-full px-4 py-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-semibold text-xs hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30 transition-all"
              >
                {t('nav.play')}
              </Link>
            </nav>

            {/* Language Dropdown */}
            <LanguageDropdown />

            {/* Mobile Hamburger Button (Fixed W/H, perfectly rounded circle) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-slate-300 hover:text-teal-400 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer border border-slate-800/60 ${
                mobileMenuOpen ? 'hamburger-active-glow' : ''
              }`}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              <div key={mobileMenuOpen ? 'open' : 'closed'} className={`w-4 h-4 flex items-center justify-center ${mobileMenuOpen ? 'animate-hamburger-open' : 'animate-hamburger-close'}`}>
                <FontAwesomeIcon icon={mobileMenuOpen ? faXmark : faBars} className="text-xs" />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-6 py-5 flex flex-col gap-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 relative z-[9999]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-slate-200 hover:text-teal-400 text-base font-medium py-1.5 transition-colors border-b border-slate-800/40"
            >
              <FontAwesomeIcon icon={faStar} className="text-teal-400 text-sm w-4" />
              <span>{t('nav.features')}</span>
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 text-slate-200 hover:text-teal-400 text-base font-medium py-1.5 transition-colors border-b border-slate-800/40"
            >
              <FontAwesomeIcon icon={faCircleInfo} className="text-teal-400 text-sm w-4" />
              <span>{t('nav.about')}</span>
            </a>
            <div className="pt-2">
              <Link
                to="/social"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-full px-5 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-semibold text-center text-sm hover:shadow-lg hover:shadow-teal-500/30 transition-all"
              >
                <FontAwesomeIcon icon={faGamepad} className="text-sm" />
                <span>{t('nav.play')}</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Full-screen Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-[9990] md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 w-full">
        <section className="w-full px-4 sm:px-8 lg:px-12 py-24 min-h-[70vh] flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <h1 className="font-pacifico italic text-4xl sm:text-6xl md:text-7xl leading-snug text-teal-400 drop-shadow-[0_0_24px_rgba(45,212,191,0.35)] mb-6 py-2 px-1">
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
              {renderHighlightedText(t('hero.subtitle'))}
            </p>
            <Link
              to="/social"
              className="mt-6 inline-block group transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <img
                src="/slime/btn/1.png"
                alt={t('hero.cta')}
                draggable={false}
                className="h-24 sm:h-32 md:h-40 w-auto object-contain drop-shadow-[0_12px_28px_rgba(45,212,191,0.45)] group-hover:drop-shadow-[0_16px_36px_rgba(45,212,191,0.65)] transition-all select-none"
              />
            </Link>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <img
              src="/slime/logo.png"
              alt="SliStudy"
              draggable={false}
              className="w-88 h-88 sm:w-[460px] sm:h-[460px] md:w-[560px] md:h-[560px] object-contain animate-hero-logo select-none"
            />
          </div>
        </section>

        <section id="features" className="w-full px-4 sm:px-8 lg:px-12 py-20 bg-slate-900/40">
          <div className="mb-10">
            <h2 className="text-left text-3xl font-extrabold text-slate-100 mb-4 uppercase tracking-wider">
              {t('features.title')}
            </h2>
            <div className="w-full h-0.5 bg-gradient-to-r from-teal-400/80 via-teal-500/30 to-slate-800/20 rounded-full shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
          </div>
          <div className="max-w-2xl w-full">
            <div className="rounded-2xl p-8 bg-slate-800/60 border border-slate-700/50 hover:-translate-y-1 hover:border-teal-400/40 transition-all flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-teal-400/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-2xl mb-5 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                  <FontAwesomeIcon icon={faLanguage} />
                </div>
                <h3 className="text-xl font-semibold text-teal-400 mb-2">{t('feature.chinese.title')}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{renderHighlightedText(t('feature.chinese.desc'))}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-slate-700/40 flex justify-end">
                <Link
                  to="/learn/chinese"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-sm hover:shadow-lg hover:shadow-teal-400/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  <span>{t('action.learn')}</span>
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="w-full px-4 sm:px-8 lg:px-12 py-20 text-center max-w-4xl mx-auto">
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
