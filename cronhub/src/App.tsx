import { useEffect, useState } from 'react'
import Layout from './components/Layout'
import type { View } from './components/Header'
import Dashboard from './pages/Dashboard'
import Logs from './pages/Logs'
import Placeholder from './pages/Placeholder'

function viewFromHash(): View {
  const h = window.location.hash.replace(/^#/, '')
  if (h === 'jobs' || h === 'logs' || h === 'settings' || h === 'dashboard') {
    return h
  }
  return 'dashboard'
}

function App() {
  const [view, setView] = useState<View>(() => viewFromHash())

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const navigate = (next: View) => {
    if (next !== view) {
      window.location.hash = next
      setView(next)
    }
  }

  return (
    <Layout view={view} onNavigate={navigate}>
      {view === 'dashboard' && <Dashboard />}
      {view === 'logs' && <Logs />}
      {view === 'jobs' && (
        <Placeholder
          title="Cron jobs"
          description="Quản lý và lên lịch các cron job — đang chờ phát triển."
        />
      )}
      {view === 'settings' && (
        <Placeholder
          title="Cài đặt"
          description="Cấu hình CronHub và Firebase — đang chờ phát triển."
        />
      )}
    </Layout>
  )
}

export default App
