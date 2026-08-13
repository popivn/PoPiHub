import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldHalved, faKey, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { CONFIG } from '../config';

interface AccessDeniedProps {
  /** Có nhập key sai không (true) hay chưa nhập gì (false) */
  wrongKey?: boolean;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ wrongKey = false }) => {
  const [keyInput, setKeyInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      // Chuyển sang URL /key để App xử lý
      window.location.href = `/${keyInput.trim()}`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-950 via-slate-950 to-red-950 px-4">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center">
        {/* Shield icon */}
        <div className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center shadow-2xl shadow-red-900/50">
          <FontAwesomeIcon
            icon={faShieldHalved}
            className="text-5xl text-red-500"
            shake
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-red-400 mb-3 tracking-tight">
          TRUY CẬP BỊ TỪ CHỐI
        </h1>

        {/* Warning message */}
        <div className="bg-red-950/40 border border-red-800/50 rounded-2xl p-4 mb-6">
          <p className="text-red-300 text-sm font-semibold flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} />
            <span>Bạn không có quyền truy cập. Đừng cố!</span>
          </p>
          {wrongKey && (
            <p className="text-red-400/80 text-xs mt-2">
              Key bạn nhập không đúng. Vui lòng thử lại.
            </p>
          )}
        </div>

        {/* Key input form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <FontAwesomeIcon
              icon={faKey}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-red-500/60"
            />
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Nhập access key..."
              className="w-full bg-slate-900/80 border-2 border-red-800/40 focus:border-red-500 rounded-xl pl-12 pr-4 py-3.5 text-center text-slate-100 placeholder-red-400/40 font-mono text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!keyInput.trim()}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            Xác thực truy cập
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-red-500/30 text-xs mt-6 font-mono">
          {CONFIG.APP_NAME} · Protected
        </p>
      </div>
    </div>
  );
};
