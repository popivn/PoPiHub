import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faXmark,
  faUserAstronaut,
  faChartLine,
  faFolderPlus,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import { CONFIG } from '../config';
import { clearAccessKey } from '../utils/auth';

export interface HeaderProps {
  onOpenProfile?: () => void;
  onOpenDashboard?: () => void;
  onOpenZoneModal?: () => void;
  onLogout?: () => void;
}

const formatInOffset = (date: Date, offsetHours: number): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const shifted = new Date(date.getTime() + offsetHours * 3600 * 1000);
  return `${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
};

export const Header: React.FC<HeaderProps> = ({
  onOpenProfile,
  onOpenDashboard,
  onOpenZoneModal,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clockTime, setClockTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAccessKey();
      window.location.href = '/';
    }
  };

  return (
    <header className="flex items-center justify-between py-3 border-b border-slate-800">
      <div className="flex items-center gap-3">
        <img
          src="/logo.jpg"
          alt="Logo"
          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md"
        />
        <div>
          <h1
            className="text-xl sm:text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent tracking-wider uppercase"
            style={{ fontFamily: "'Chakra Petch', sans-serif", letterSpacing: '0.08em' }}
          >
            {CONFIG.APP_NAME}
          </h1>
          <div
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 tracking-widest tabular-nums"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            <span title="Giờ app (UTC+7 Hà Nội)">
              {formatInOffset(clockTime, CONFIG.APP_UTC_OFFSET)}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500" title="Giờ UTC">
              UTC {formatInOffset(clockTime, 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Hamburger menu — mobile only */}
        <div className="relative lg:hidden">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`hamburger-btn ${menuOpen ? 'active' : ''} flex items-center justify-center w-10 h-10 bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl text-slate-200 transition-all active:scale-90 shadow-sm`}
            title="Menu"
          >
            <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="text-base" />
          </button>

          {menuOpen && (
            <>
              {/* Click-outside overlay */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown menu */}
              <div className="menu-dropdown absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    onOpenProfile?.();
                    setMenuOpen(false);
                  }}
                  className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left"
                >
                  <FontAwesomeIcon icon={faUserAstronaut} className="text-purple-400 w-5" />
                  <span className="text-sm font-bold text-slate-200">Hồ Sơ Tu Hành</span>
                </button>
                <button
                  onClick={() => {
                    onOpenDashboard?.();
                    setMenuOpen(false);
                  }}
                  className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-t border-slate-800/50"
                >
                  <FontAwesomeIcon icon={faChartLine} className="text-emerald-400 w-5" />
                  <span className="text-sm font-bold text-slate-200">Thiên Cơ Các</span>
                </button>
                <button
                  onClick={() => {
                    onOpenZoneModal?.();
                    setMenuOpen(false);
                  }}
                  className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-t border-slate-800/50"
                >
                  <FontAwesomeIcon icon={faFolderPlus} className="text-indigo-400 w-5" />
                  <span className="text-sm font-bold text-slate-200">Linh Vực Không Gian</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="menu-item w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left border-t border-slate-800/50"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} className="text-red-400 w-5" />
                  <span className="text-sm font-bold text-slate-200">Thoát Ly Thần Thức</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Desktop buttons — lg and up */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <FontAwesomeIcon icon={faUserAstronaut} className="text-purple-400" />
            <span>Hồ Sơ Tu Hành</span>
          </button>
          <button
            onClick={onOpenDashboard}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <FontAwesomeIcon icon={faChartLine} className="text-emerald-400" />
            <span>Thiên Cơ Các</span>
          </button>
          <button
            onClick={onOpenZoneModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <FontAwesomeIcon icon={faFolderPlus} className="text-indigo-400" />
            <span>Linh Vực Không Gian</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-red-500/30 hover:bg-red-500/5 rounded-xl text-xs font-bold text-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-red-400" />
            <span>Thoát Ly Thần Thức</span>
          </button>
        </div>
      </div>
    </header>
  );
};
