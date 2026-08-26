import React from 'react';
import { CONFIG } from '../config';

interface LoadingProps {
  /** Text hiển thị dưới vòng loading. Mặc định: "Đang kết nối thần thức..." */
  message?: string;
  /** Full màn hình hay chỉ bao phủ container hiện tại */
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Đang kết nối thần thức...',
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-slate-950 px-4 transition-all z-50 ${
        fullScreen ? 'fixed inset-0 min-h-screen' : 'absolute inset-0 w-full h-full'
      }`}
    >
      {/* CSS Keyframes Inline - Plug and Play */}
      <style>{`
        @keyframes spin-glow {
          0% {
            transform: rotate(0deg);
            border-color: #6366f1;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(99, 102, 241, 0.2);
          }
          50% {
            border-color: #ec4899;
            box-shadow: 0 0 35px rgba(236, 72, 153, 0.6), inset 0 0 35px rgba(236, 72, 153, 0.3);
          }
          100% {
            transform: rotate(360deg);
            border-color: #6366f1;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(99, 102, 241, 0.2);
          }
        }

        @keyframes pulse-logo {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 25px rgba(236, 72, 153, 0.6));
          }
        }

        @keyframes text-blink {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .loading-ring {
          animation: spin-glow 3s linear infinite;
        }

        .loading-logo {
          animation: pulse-logo 2s ease-in-out infinite;
        }

        .loading-text {
          animation: text-blink 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Container của hiệu ứng Ring & Logo */}
      <div className="relative flex items-center justify-center w-36 h-36">
        {/* Vòng xoay ngoài (Loading Ring) */}
        <div className="loading-ring absolute inset-0 rounded-full border-[3px] border-transparent border-t-transparent border-b-transparent" />

        {/* Logo nằm ở trung tâm có hiệu ứng nhịp thở */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-slate-800 shadow-2xl">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="loading-logo w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Text thông báo trạng thái */}
      <div className="mt-8 text-center space-y-2">
        <p
          className="loading-text text-sm sm:text-base font-extrabold text-indigo-400 tracking-widest uppercase font-mono"
          style={{ fontFamily: "'Chakra Petch', sans-serif", letterSpacing: '0.15em' }}
        >
          {message}
        </p>
        <p className="text-[10px] text-slate-500 font-mono tracking-wider">
          {CONFIG.APP_NAME} · System Online
        </p>
      </div>
    </div>
  );
};
