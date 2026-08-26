import { BrowserRouter, Routes, Route, NavLink, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Logs from './pages/Logs';

function Layout() {
  const [token, setToken] = useState<string>('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fromUrl = searchParams.get('token');
    const fromStorage = localStorage.getItem('sg_access_token');
    const t = fromUrl ?? fromStorage ?? '';
    setToken(t);
    if (fromUrl) {
      localStorage.setItem('sg_access_token', fromUrl);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col gap-6">
        <div className="text-teal-400 font-extrabold text-lg tracking-wide">SliStudy BO</div>
        <nav className="flex flex-col gap-2">
          <NavLink
            to="/bo"
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
            to="/bo/users"
            className={({ isActive }) =>
              `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive ? 'bg-teal-400/15 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            Users
          </NavLink>
          <NavLink
            to="/bo/logs"
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
          <a href="/" className="text-xs font-bold text-teal-400 hover:text-teal-300">Mở Client →</a>
        </header>
        <div className="p-6">
          <Routes>
            <Route path="/bo" element={<Dashboard token={token} />} />
            <Route path="/bo/users" element={<Users token={token} />} />
            <Route path="/bo/logs" element={<Logs token={token} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
