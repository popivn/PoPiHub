import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Đường dẫn bí mật: hỗ trợ cả topsecret và topsecreate
  if (
    currentPath.includes('/topsecret/134679002/dashboard') || 
    currentPath.includes('/topsecreate/134679002/dashboard')
  ) {
    return <AdminDashboardPage />;
  }

  return <HomePage />;
}

export default App;
