export function SocialPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-start selection:bg-amber-500 selection:text-white relative overflow-x-hidden">
      {/* Background Lighting */}
      <div className="fixed -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-r from-amber-600/15 via-orange-600/10 to-red-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 flex justify-between items-center gap-2">
          <div 
            className="flex items-center space-x-2.5 min-w-0 cursor-pointer"
            onClick={() => {
              window.history.pushState({}, '', '/guild');
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            <img
              src="/logo.jpg"
              alt="Logo Server Ngọc Kinh S5"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-amber-400/40 shadow-md shadow-orange-500/30 shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base font-black tracking-wide bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent truncate">
                SERVER NGỌC KINH S5
              </h1>
              <p className="text-[9px] sm:text-[11px] text-amber-400/80 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                Ta Làm Tông Sư
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Nút Home (Mạng Xã Hội) */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/social');
                window.dispatchEvent(new Event('popstate'));
              }}
              title="Mạng Xã Hội (Feature Pending)"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden xs:inline">Home</span>
            </button>

            {/* Nút Khiên (Quay về Guild / Danh sách Bang Hội) */}
            <button
              onClick={() => {
                window.history.pushState({}, '', '/guild');
                window.dispatchEvent(new Event('popstate'));
              }}
              title="Danh Sách Bang Hội"
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700/80 hover:border-amber-500/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="hidden xs:inline">Bang Hội</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-7xl w-full mx-auto px-2.5 sm:px-4 pt-3 pb-6 space-y-3 z-10">
        <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-8 sm:p-12 text-center shadow-2xl my-6 relative overflow-hidden group">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          
          <div className="max-w-md mx-auto space-y-4 relative z-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 animate-pulse">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Tính Năng Đang Phát Triển
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Mạng Xã Hội Tông Sư
            </h2>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Không gian giao lưu, chia sẻ kinh nghiệm võ học và kết nối cộng đồng các Tông Sư tại <strong className="text-amber-300">Server Ngọc Kinh S5</strong> đang được xây dựng. Hãy quay lại sau nhé!
            </p>

            <div className="pt-2">
              <button
                onClick={() => {
                  window.history.pushState({}, '', '/guild');
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Quay Lại Trang Bang Hội
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-2 text-center text-[10px] text-slate-500">
        Server Ngọc Kinh S5 &bull; Game Ta Làm Tông Sư
      </footer>
    </div>
  );
}

export default SocialPage;
