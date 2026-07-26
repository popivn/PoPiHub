import React, { useState, useEffect } from 'react';

interface SubmissionItem {
  timestamp?: string;
  zalo?: string;
  ingame?: string;
  raw: string;
}

export function App() {
  const [zalo, setZalo] = useState('');
  const [ingame, setInGame] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; isSuccess: boolean } | null>(null);

  const showToast = (message: string, isSuccess: boolean) => {
    setToast({ message, isSuccess });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/submissions');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data);
        setCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zalo.trim() || !ingame.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin Zalo và InGame!', false);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zalo, ingame }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, true);
        setZalo('');
        setInGame('');
        fetchSubmissions();
      } else {
        showToast(data.message, false);
      }
    } catch (err) {
      showToast('Lỗi kết nối đến máy chủ!', false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* Glow Background Effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-indigo-500/30 text-xl">
              N5
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                NKS5 Portal
              </h1>
              <p className="text-xs text-slate-400">Vite + React + TypeScript + Express</p>
            </div>
          </div>

          <a
            href="/api/download"
            download
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Tải về file .txt</span>
          </a>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Nhập Thông Tin
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Dữ liệu sẽ được tự động lưu vào <code className="text-indigo-300 bg-slate-800 px-1.5 py-0.5 rounded">submissions.txt</code> ở server.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="zalo" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Số / Tên Zalo <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="zalo"
                value={zalo}
                onChange={(e) => setZalo(e.target.value)}
                placeholder="Nhập SĐT hoặc tên Zalo..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="ingame" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Tên InGame <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                id="ingame"
                value={ingame}
                onChange={(e) => setInGame(e.target.value)}
                placeholder="Nhập tên nhân vật InGame..."
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{submitting ? 'Đang lưu...' : 'Lưu Thông Tin'}</span>
            </button>
          </form>

          {toast && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-medium border transition-all ${
                toast.isSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>

        {/* Right Column: Submissions Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Danh Sách Đã Lưu (<span className="text-indigo-400">{count}</span>)
              </h2>
              <button
                onClick={fetchSubmissions}
                className="text-xs text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Thời Gian</th>
                    <th className="px-4 py-3">Zalo</th>
                    <th className="px-4 py-3 rounded-r-lg">InGame</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">
                        Đang tải dữ liệu...
                      </td>
                    </tr>
                  ) : submissions.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">
                        Chưa có dữ liệu nào được lưu.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {item.timestamp || '-'}
                        </td>
                        <td className="px-4 py-3 font-medium text-indigo-300">
                          {item.zalo || item.raw}
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-400">
                          {item.ingame || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-4 text-center text-xs text-slate-500">
        NKS5 Project &bull; Vite + React + TypeScript + Tailwind CSS & Express
      </footer>
    </div>
  );
}

export default App;
