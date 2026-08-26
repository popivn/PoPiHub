import { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { AccessDenied } from './components/AccessDenied';
import { Loading } from './components/Loading';
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
    return <Loading message="Đang xác thực thần thức..." />;
  }

  if (authResult === 'authorized') {
    return <HomePage />;
  }

  return <AccessDenied wrongKey={authResult === 'denied_wrong'} />;
}

export default App;
