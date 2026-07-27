import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Home, Zap } from 'lucide-react';
import { UserIdentity } from '../utils/identityJWT';
import { CULTIVATION_CLASSES } from '../components/IdentityModal';

export interface AppLayoutProps {
  currentRoute: 'guild' | 'social';
  identity: UserIdentity | null;
  onOpenIdentityModal: () => void;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export function AppLayout({
  currentRoute,
  identity,
  onOpenIdentityModal,
  children,
  headerActions,
}: AppLayoutProps) {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const getClassInfo = (avatarId: number) => {
    return CULTIVATION_CLASSES.find((c) => c.id === avatarId) || CULTIVATION_CLASSES[0];
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-start selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Shared Emblem Watermark Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        <img
          src="/nks5dadide.png"
          alt="Guild Emblem Watermark"
          className="w-[380px] sm:w-[620px] md:w-[720px] max-w-none opacity-35 mix-blend-screen filter brightness-125 contrast-125 rounded-full drop-shadow-[0_0_60px_rgba(245,158,11,0.35)]"
          style={{
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 75%)',
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 75%)'
          }}
        />
      </div>

      {/* Shared Radial Ambient Lighting */}
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-red-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Shared AAA Header / Navbar */}
      <header className="w-full border-b border-amber-500/20 bg-[#0b0f19]/80 backdrop-blur-md sticky top-0 z-40 shadow-2xl">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2.5 flex justify-between items-center gap-1.5">
          {/* Logo & Server Name */}
          <div 
            className="flex items-center space-x-2 sm:space-x-3 min-w-0 cursor-pointer group"
            onClick={() => navigate('/guild')}
          >
            <img
              src="/logo.jpg"
              alt="Logo Server Ngọc Kinh S5"
              className="w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 rounded-xl object-cover border border-amber-400/50 shadow-md shadow-orange-500/30 shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              <h1 className="text-[11px] xs:text-xs sm:text-base font-black font-cinzel tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent truncate">
                SERVER NGỌC KINH S5
              </h1>
              <p className="text-[8px] xs:text-[10px] sm:text-xs text-amber-400/80 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_8px_#10b981]" />
                {currentRoute === 'social' ? 'Mạng Xã Hội Tông Sư' : 'Ta Làm Tông Sư'}
              </p>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Identity Button */}
            {identity ? (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenIdentityModal}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent hover:from-amber-500/25 border border-amber-500/40 rounded-xl sm:rounded-2xl px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-bold font-cinzel text-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
                title="Thay đổi danh tính Sư Tôn"
              >
                {(() => {
                  const currentClass = getClassInfo(identity.avatarId);
                  const Icon = currentClass.icon;
                  return <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />;
                })()}
                <span className="max-w-[70px] xs:max-w-[90px] sm:max-w-[110px] truncate">{identity.name}</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onOpenIdentityModal}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-cinzel px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-1"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Danh Tính</span>
              </motion.button>
            )}

            {/* Nút Home (Mạng Xã Hội) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/social')}
              title="Mạng Xã Hội Tông Sư"
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold font-cinzel flex items-center gap-1 transition-all cursor-pointer border ${
                currentRoute === 'social'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700/80'
              }`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Mạng Xã Hội</span>
            </motion.button>

            {/* Nút Bang Hội (Guild Page) */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/guild')}
              title="Danh Sách Bang Hội"
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold font-cinzel flex items-center gap-1 transition-all cursor-pointer border ${
                currentRoute === 'guild'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700/80'
              }`}
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">Bang Hội</span>
            </motion.button>

            {/* Extra Custom Action Buttons (như Nút Thêm Thành Viên ở Guild Page) */}
            {headerActions}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1">
        {children}
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-3 text-center text-[10px] text-slate-500 font-cinzel relative z-10">
        Server Ngọc Kinh S5 &bull; Game Ta Làm Tông Sư
      </footer>
    </div>
  );
}

export default AppLayout;
