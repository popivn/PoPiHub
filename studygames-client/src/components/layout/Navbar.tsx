import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faXmark,
  faGamepad,
  faRightToBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../../i18n';
import { LanguageDropdown } from '../helpers';
import LoginModal from '../LoginModal';
import PlayerManager from '../PlayerManager';
import { getAuthState, clearAuth, type AuthState } from '../../auth/authClient';
import { listPlayers, type Player } from '../../players/playersClient';

const GAME_URL = (import.meta as any).env?.VITE_GAME_URL ?? 'http://localhost:3636';

interface Props {
  showNavLinks?: boolean;
  tagline?: string;
  currentPlayer?: Player | null;
  onPlayerSelected?: (player: Player) => void;
}

/**
 * Navbar — Header duy nhất dùng chung cho toàn bộ ứng dụng (LandingPage, Homepage /social, LearnChinesePage).
 */
export default function Navbar({
  showNavLinks = true,
  tagline,
  currentPlayer,
  onPlayerSelected,
}: Props) {
  const { t, lang } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>(() => getAuthState());
  const [loginOpen, setLoginOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activePlayer, setActivePlayer] = useState<Player | null>(currentPlayer || null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!auth.accessToken;
  const accountLabel = auth.username
    ? auth.username
    : auth.provider === 'anonymous'
      ? 'Guest'
      : 'Sign in';

  useEffect(() => {
    setActivePlayer(currentPlayer || null);
  }, [currentPlayer]);

  // Tự động load player nếu đã auth
  useEffect(() => {
    if (isLoggedIn && !activePlayer) {
      listPlayers()
        .then(({ players, selectedId }) => {
          const found = players.find((p) => p.id === selectedId) || players[0];
          if (found) {
            setActivePlayer(found);
            onPlayerSelected?.(found);
          }
        })
        .catch(() => {});
    }
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setAuth(getAuthState());
    setActivePlayer(null);
  };

  const handleSelectPlayer = (p: Player) => {
    setActivePlayer(p);
    onPlayerSelected?.(p);
    setPlayersOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-[9999] backdrop-blur-md bg-slate-950/85 border-b border-teal-500/20 shadow-sm shadow-teal-400/20 px-4 sm:px-8 py-2.5 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <Link to="/" className="flex items-center gap-2 select-none group">
          <img
            src="/logo.png"
            alt="SliStudy"
            draggable={false}
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain p-0.5"
          />
          <span className="font-pacifico italic text-xl sm:text-2xl bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]">
            SliStudy
          </span>
          {tagline && (
            <span className="text-[10px] sm:text-xs bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/30 ml-1 hidden lg:inline">
              {tagline}
            </span>
          )}
        </Link>

        {/* Center Nav Links */}
        {showNavLinks && (
          <nav className="hidden md:flex items-center gap-4 text-xs font-semibold ml-auto lg:mr-3">
            <a
              href={GAME_URL}
              className="rounded-full px-3.5 py-1.5 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-xs hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/30 transition-all flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faGamepad} className="text-xs" />
              <span>{t('nav.play')}</span>
            </a>
            <span className="h-5 w-px bg-teal-500/30 shrink-0" aria-hidden="true" />
          </nav>
        )}

        {/* Right Controls: LanguageDropdown -> Mobile Hamburger -> Auth/User Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. Language Dropdown luôn ở đầu */}
          <LanguageDropdown />

          {/* 2. Mobile Hamburger Button (bên trái nút Auth, có keyframe hover scale & neon glow) */}
          {showNavLinks && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden group w-8 h-8 rounded-full bg-slate-900/90 border border-teal-500/50 text-teal-300 hover:border-teal-400 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400 flex items-center justify-center shrink-0 shadow-sm shadow-teal-500/15 hover:shadow-lg hover:shadow-teal-400/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              <FontAwesomeIcon
                icon={mobileMenuOpen ? faXmark : faBars}
                className="text-xs text-teal-400 group-hover:text-slate-950 transition-colors"
              />
            </button>
          )}

          {/* 3. User Profile / Auth Button (bên phải nút Hamburger, chuẩn kích thước w-8 h-8 ngang với hamburger) */}
          {isLoggedIn ? (
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className={`group bg-slate-900/90 border border-teal-500/40 text-teal-300 hover:border-teal-400 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400 font-semibold flex items-center justify-center shadow-sm shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ${
                  activePlayer ? 'w-8 h-8 sm:w-auto sm:h-8 sm:px-3 rounded-full text-xs' : 'w-8 h-8 lg:w-auto lg:h-8 lg:px-3 rounded-full p-0 lg:rounded-full text-xs'
                }`}
              >
                {activePlayer ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-sm leading-none">{activePlayer.avatar || '🦊'}</span>
                    <span className="font-bold hidden sm:inline">{activePlayer.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 justify-center">
                    <FontAwesomeIcon
                      icon={faUser}
                      className="text-teal-400 text-xs group-hover:text-slate-950 transition-colors"
                    />
                    <span className="font-bold hidden lg:inline">{accountLabel}</span>
                  </div>
                )}
              </button>

              {/* User Popover Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900/95 border border-teal-500/30 backdrop-blur-xl p-2 shadow-2xl z-[99999] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
                    <div className="font-bold text-slate-200">{activePlayer?.name || accountLabel}</div>
                    <div className="text-[10px] text-teal-400">@{accountLabel}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setPlayersOpen(true);
                    }}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-teal-500/20 hover:text-teal-300 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faUser} className="text-teal-400" />
                    <span>{lang === 'en' ? 'Profile / Slimes' : 'Hồ Sơ / Nhân Vật'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRightToBracket} />
                    <span>{lang === 'en' ? 'Log out' : 'Đăng xuất'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="group w-8 h-8 lg:w-auto lg:h-8 lg:px-3 rounded-full bg-slate-900/90 border border-teal-500/50 text-teal-300 hover:border-teal-400 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400 flex items-center justify-center gap-1.5 transition-all duration-200 shadow-md shadow-teal-500/15 hover:shadow-lg hover:shadow-teal-400/30 hover:scale-105 active:scale-95 cursor-pointer shrink-0 text-xs font-bold"
              title={lang === 'en' ? 'Login / Register' : 'Đăng nhập / Đăng ký'}
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-xs text-teal-400 group-hover:text-slate-950 transition-colors" />
              <span className="hidden lg:inline">{lang === 'en' ? 'Sign in' : 'Đăng nhập'}</span>
            </button>
          )}
        </div>

        {/* Modals duy nhất dùng chung */}
        <LoginModal
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onAuthed={(s) => {
            setAuth(s);
            setLoginOpen(false);
          }}
        />

        <PlayerManager
          open={playersOpen}
          onClose={() => setPlayersOpen(false)}
          onSelected={handleSelectPlayer}
        />
      </header>

      {/* Mobile Drawer Menu */}
      {showNavLinks && mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-3 shadow-2xl relative z-[9998] animate-in fade-in slide-in-from-top-2">
          <a
            href={GAME_URL}
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20"
          >
            <FontAwesomeIcon icon={faGamepad} className="text-xs" />
            <span>{t('nav.play')}</span>
          </a>
        </div>
      )}
    </>
  );
}
