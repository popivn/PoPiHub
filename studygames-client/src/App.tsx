
import { I18nProvider } from './i18n';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage, LearnChinesePage, LessonsPage, DictionaryPage } from './components/page';
import LoadingPreviewPage from './components/preview/LoadingPreviewPage';

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/learn/chinese" element={<LearnChinesePage />} />
        <Route path="/learn/lessons" element={<LessonsPage />} />
        <Route path="/learn/dictionary" element={<DictionaryPage />} />
        <Route path="/view/loading" element={<LoadingPreviewPage />} />
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
