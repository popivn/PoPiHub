import { BrowserRouter, Routes, Route, NavLink, useSearchParams } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Logs from './pages/Logs';

function Layout({ token, onLogout }: { token: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col gap-6">
        <div className="text-teal-400 font-extrabold text-lg tracking-wide">SliStudy BO</div>
        <nav className="flex flex-col gap-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-teal-400/15 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-teal-400/15 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/logs"
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-teal-400/15 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            Logs
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between">
          <span className="text-sm font-bold text-slate-100">BackOffice</span>
          <div className="flex items-center gap-4">
            <a href="/" className="text-xs font-bold text-teal-400 hover:text-teal-300">Mở Client →</a>
            <button onClick={onLogout} className="text-xs font-bold text-red-400 hover:text-red-300">Đăng xuất</button>
          </div>
        </header>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/users" element={<Users token={token} />} />
            <Route path="/logs" element={<Logs token={token} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Đăng nhập thất bại');
        return;
      }
      localStorage.setItem('sg_access_token', data.accessToken);
      onLogin(data.accessToken);
    } catch {
      setError('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-200">
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center p-10 bg-gradient-to-br from-slate-900 to-slate-800">
        <img src="EyeContact.webp" alt="SliStudy" className="w-40 h-40 object-contain mb-4 rounded-2xl" />
        <h1 className="text-5xl font-black text-teal-400 tracking-tight">SliStudy</h1>
        <p className="mt-3 text-slate-400 text-lg">Hệ thống quản trị</p>
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
          <div className="md:hidden flex flex-col items-center mb-4">
            <img src="EyeContact.webp" alt="SliStudy" className="w-24 h-24 object-contain mb-2 rounded-2xl" />
            <h1 className="text-3xl font-black text-teal-400">SliStudy</h1>
          </div>
          <h2 className="text-2xl font-black text-teal-400 hidden md:block">Đăng nhập BO</h2>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-teal-500" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-teal-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold py-2.5">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppContent() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string>(() => localStorage.getItem('sg_access_token') ?? '');

  useEffect(() => {
    const fromUrl = searchParams.get('token');
    const fromStorage = localStorage.getItem('sg_access_token');
    const t = fromUrl ?? fromStorage ?? '';
    if (t) {
      setToken(t);
      if (fromUrl) {
        localStorage.setItem('sg_access_token', fromUrl);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [searchParams]);

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return <Layout token={token} onLogout={() => { localStorage.removeItem('sg_access_token'); setToken(''); }} />;
}

export default function App() {
  return (
    <BrowserRouter basename="/bo">
      <AppContent />
    </BrowserRouter>
  );
}
