import { I18nProvider } from './i18n';
import Homepage from './components/Homepage';

function App() {
  return (
    <I18nProvider>
      <Homepage />
    </I18nProvider>
  );
}

export default App;

