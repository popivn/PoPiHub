import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { AccessDenied } from './components/AccessDenied';
import { checkAccess, type AuthResult } from './utils/auth';

function App() {
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  useEffect(() => {
    const result = checkAccess();
    setAuthResult(result);
  }, []);

  // Lắng nghe popstate (back/forward) để re-check
  useEffect(() => {
    const handler = () => setAuthResult(checkAccess());
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  if (authResult === null) {
    // Loading state (tránh flash)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (authResult === 'authorized') {
    return <HomePage />;
  }

  return <AccessDenied wrongKey={authResult === 'denied_wrong'} />;
}

export default App;
