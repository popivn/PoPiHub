import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { AccessDenied } from './components/AccessDenied';
import { checkAccess, type AuthResult } from './utils/auth';

function App() {
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  useEffect(() => {
    let mounted = true;
    checkAccess().then((result) => {
      if (mounted) setAuthResult(result);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Lắng nghe popstate (back/forward) để re-check
  useEffect(() => {
    const handler = () => {
      checkAccess().then((result) => setAuthResult(result));
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (authResult === null) {
    // Loading state (tránh flash) — chờ async checkAccess
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  if (authResult === 'authorized') {
    return <HomePage />;
  }

  return <AccessDenied wrongKey={authResult === 'denied_wrong'} />;
}

export default App;
