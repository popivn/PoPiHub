
import { I18nProvider } from './i18n';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Homepage from './components/Homepage';
import LandingPage from './components/LandingPage';
import LearnChinesePage from './components/LearnChinesePage';
import LessonsPage from './components/LessonsPage';

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn/chinese" element={<LearnChinesePage />} />
        <Route path="/learn/lessons" element={<LessonsPage />} />
        <Route path="/social" element={<Homepage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <I18nProvider>
      <Router />
    </I18nProvider>
  );
}

export default App;
