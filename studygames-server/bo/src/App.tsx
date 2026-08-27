import { BrowserRouter, Routes, Route, NavLink, useSearchParams } from 'react-router-dom';
import { useEffect, useState, type FormEvent } from 'react';
import Dashboard from './pages/dashboard';
import Users from './pages/users';
import Logs from './pages/logs';
import Topics from './pages/topics';
import Loading from './components/Loading';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users', end: false },
  { to: '/topics', label: 'Chủ đề', end: false },
  { to: '/logs', label: 'Logs', end: false },
];

function Layout({ token, onLogout }: { token: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">
      <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-14 px-4 flex items-center border-b border-slate-800">
          <span className="text-sm font-semibold text-slate-100">SliStudy BO</span>
        </div>
        <nav className="flex flex-col p-2 gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
          <span className="text-sm text-slate-400">BackOffice</span>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs font-medium text-teal-400 hover:text-teal-300">Mở Client →</a>
            <span className="text-slate-700">|</span>
            <button onClick={onLogout} className="text-xs font-medium text-rose-400 hover:text-rose-300">Đăng xuất</button>
          </div>
        </header>
        <div className="flex-1 p-4 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard token={token} />} />
            <Route path="/users" element={<Users token={token} />} />
            <Route path="/topics" element={<Topics token={token} />} />
            <Route path="/logs" element={<Logs token={token} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function Login({ onLogin }: { onLogin: (token: string, role: number, permissions: string) => void }) {
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
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Đăng nhập thất bại');
        return;
      }
      localStorage.setItem('sg_access_token', data.accessToken);
      localStorage.setItem('sg_role', String(data.role ?? 0));
      localStorage.setItem('sg_permissions', data.permissions ?? '');
      onLogin(data.accessToken, data.role ?? 0, data.permissions ?? '');
    } catch {
      setError('Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200 p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-md p-5 space-y-4 relative">
        {loading && (
          <Loading variant="overlay" size="md" label="Đang đăng nhập…" />
        )}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <img src="EyeContact.webp" alt="SliStudy" className="w-9 h-9 object-contain rounded-md" />
          <div>
            <h1 className="text-base font-semibold text-slate-100">SliStudy BO</h1>
            <p className="text-xs text-slate-500">Hệ thống quản trị</p>
          </div>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 rounded-md bg-slate-950 border border-slate-700 px-3 text-sm outline-none focus:border-teal-500"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-9 rounded-md bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 text-sm font-semibold"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
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

  return (
    <Layout
      token={token}
      onLogout={() => {
        localStorage.removeItem('sg_access_token');
        setToken('');
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/bo">
      <AppContent />
    </BrowserRouter>
  );
}
