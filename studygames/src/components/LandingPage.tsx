import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import './LandingPage.css';

export default function LandingPage() {
  const { t, lang, setLang } = useI18n();

  const nextLang = lang === 'vi' ? 'en' : 'vi';
  const label = lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/50">
        <div className="flex items-center gap-2 text-xl font-bold text-teal-400">
          <img src="/logo.png" alt="SliStudy" className="w-12 h-12 object-contain p-0.5" />
          <span>SliStudy</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="#features" className="text-slate-300 hover:text-teal-400 transition-colors">{t('nav.features')}</a>
          <a href="#about" className="text-slate-300 hover:text-teal-400 transition-colors">{t('nav.about')}</a>
          <Link to="/social" className="rounded-full px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-semibold hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30 transition-all">
            {t('nav.play')}
          </Link>
          <button
            onClick={() => setLang(nextLang)}
            className="rounded-full px-3 py-1.5 border border-slate-600 text-slate-300 hover:border-teal-400 hover:text-teal-400 transition-all"
          >
            {label}
          </button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="flex flex-col md:flex-row items-center justify-center gap-12 px-4 py-24 min-h-[70vh] max-w-6xl mx-auto">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-5xl md:text-7xl font-extrabold text-teal-400 drop-shadow-[0_0_24px_rgba(45,212,191,0.25)] mb-6">
              {t('hero.title')}
            </h1>
            <p className="max-w-2xl text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
              {t('hero.subtitle')}
            </p>
            <Link
              to="/social"
              className="rounded-full px-8 py-4 text-lg font-bold bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-500/30 transition-all"
            >
              {t('hero.cta')}
            </Link>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <img
              src="/slime/logo.png"
              alt="SliStudy"
              className="w-64 h-64 md:w-96 md:h-96 object-contain drop-shadow-[0_0_40px_rgba(45,212,191,0.3)]"
            />
          </div>
        </section>

        <section id="features" className="px-4 py-20 bg-slate-900/40">
          <h2 className="text-center text-3xl font-bold text-slate-100 mb-12">{t('features.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="rounded-2xl p-8 bg-slate-800/60 border border-slate-700/50 hover:-translate-y-1 hover:border-teal-400/40 transition-all">
              <div className="text-5xl mb-4">🎮</div>
              <h3 className="text-lg font-semibold text-teal-400 mb-2">{t('feature.play.title')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('feature.play.desc')}</p>
            </div>
            <div className="rounded-2xl p-8 bg-slate-800/60 border border-slate-700/50 hover:-translate-y-1 hover:border-teal-400/40 transition-all">
              <div className="text-5xl mb-4">🧑‍🤝‍🧑</div>
              <h3 className="text-lg font-semibold text-teal-400 mb-2">{t('feature.social.title')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('feature.social.desc')}</p>
            </div>
            <div className="rounded-2xl p-8 bg-slate-800/60 border border-slate-700/50 hover:-translate-y-1 hover:border-teal-400/40 transition-all">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold text-teal-400 mb-2">{t('feature.custom.title')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('feature.custom.desc')}</p>
            </div>
          </div>
        </section>

        <section id="about" className="px-4 py-20 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-100 mb-6">{t('about.title')}</h2>
          <p className="text-slate-400 leading-relaxed">
            {t('about.desc')}
          </p>
        </section>
      </main>

      <footer className="px-6 py-6 text-center border-t border-slate-800/50 text-slate-500 text-sm">
        <p>{t('footer').replace('{year}', String(new Date().getFullYear()))}</p>
      </footer>
    </div>
  );
}
