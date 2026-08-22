import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightToBracket,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '../i18n';
import LanguageDropdown from './LanguageDropdown';
import LoginModal from './LoginModal';
import PlayerManager from './PlayerManager';
import { getAuthState, clearAuth, type AuthState } from '../auth/authClient';
import { listPlayers, type Player } from '../players/playersClient';

interface Props {
  tagline?: string;
  currentPlayer?: Player | null;
  onPlayerSelected?: (player: Player) => void;
}

/**
 * Navbar — Header duy nhất cho ứng dụng game.
 */
export default function Navbar({
  tagline,
  currentPlayer,
  onPlayerSelected,
}: Props) {
  const { lang } = useI18n();
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
        <a href="/" className="flex items-center gap-2 select-none group">
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
        </a>

        {/* Right Controls: LanguageDropdown -> Auth/User Button */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. Language Dropdown */}
          <LanguageDropdown />

          {/* 2. User Profile / Auth Button */}
          {isLoggedIn ? (
            <div className="relative inline-block text-left" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className={`group bg-slate-900/90 border border-teal-500/40 text-teal-300 hover:border-teal-400 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400 font-semibold flex items-center justify-center shadow-sm shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shrink-0 ${
                  activePlayer ? 'w-8 h-8 sm:w-auto sm:h-8 sm:px-3 rounded-full text-xs' : 'w-8 h-8 rounded-full p-0'
                }`}
              >
                {activePlayer ? (
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-sm leading-none">{activePlayer.avatar || '🦊'}</span>
                    <span className="font-bold hidden sm:inline">{activePlayer.name}</span>
                  </div>
                ) : (
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-teal-400 text-xs group-hover:text-slate-950 transition-colors"
                  />
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
              className="group w-8 h-8 rounded-full bg-slate-900/90 border border-teal-500/50 text-teal-300 hover:border-teal-400 hover:text-slate-950 hover:bg-gradient-to-r hover:from-teal-400 hover:to-cyan-400 flex items-center justify-center transition-all duration-200 shadow-md shadow-teal-500/15 hover:shadow-lg hover:shadow-teal-400/30 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title={lang === 'en' ? 'Login / Register' : 'Đăng nhập / Đăng ký'}
            >
              <FontAwesomeIcon icon={faRightToBracket} className="text-xs text-teal-400 group-hover:text-slate-950 transition-colors" />
            </button>
          )}
        </div>
      </header>

      {/* Modals */}
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
    </>
  );
}
