import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import SocialPage from './pages/SocialPage';
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

  if (currentPath === '/social') {
    return <SocialPage />;
  }

  // /guild hoặc đường dẫn mặc định (/)
  return <HomePage />;
}

export default App;
