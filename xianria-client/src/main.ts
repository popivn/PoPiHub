import './theme/colors.css'
import './style.css'
import { mountOrientationUI, toggleToolbar, registerMainToggle } from './utils/orientationUI'
import { mountMainGameUI, getMainGameUI } from './components/mainGameUI'
import { mountLandScreen } from './components/landScreen'
import { mountEditorScene } from './scenes/editorScene'
import { mountMapScene } from './scenes/mapScene'
import { mountLoading } from './components/loading'
import { mountAuthModal } from './components/authModal'
import { authApi } from './server/authApi'

// Mount global UI
mountOrientationUI()
const gameUI = mountMainGameUI((btn) => toggleToolbar(btn))
registerMainToggle(gameUI.toggle)

const app = document.querySelector<HTMLDivElement>('#app')!

export function navigate(path: string): void {
  const url = new URL(path, window.location.origin)
  history.pushState(null, '', url)
  router()
}

// === Auth flow ===
// 1. Show pending scene
// 2. Verify token (if any)
// 3. If valid → navigate to /land
// 4. If invalid → show auth modal → on success → navigate to /land

async function bootstrap(): Promise<void> {
  const loading = mountLoading(document.body, 'Đang xác thực...')

  // Check if URL has a token (e.g. /game?token=xxx)
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    authApi.setToken(token)
  }

  const verifyResult = await authApi.verify()

  if (verifyResult.valid && verifyResult.user) {
    authApi.setStoredUser(verifyResult.user)
    loading.unmount()
    // Always navigate to /land after login, keep token if present
    navigate(token ? `/land?token=${token}` : '/land')
  } else {
    loading.unmount()
    showAuth()
  }
}

function showAuth(): void {
  mountAuthModal(app, (launchUrl: string) => {
    const url = new URL(launchUrl)
    const launchParams = new URLSearchParams(url.search)
    const launchToken = launchParams.get('token')
    navigate(launchToken ? `/land?token=${launchToken}` : '/land')
  })
}

function router(): void {
  const path = window.location.pathname
  const params = new URLSearchParams(window.location.search)

  // Pull global toggle out of any screen before clearing app
  const gameUI = getMainGameUI()
  if (gameUI) document.body.appendChild(gameUI.toggle)

  app.innerHTML = ''

  // /game?token=xxx or /land — process token then mount land grid directly
  if (path === '/game' || path === '/land') {
    const token = params.get('token')
    if (token) {
      authApi.setToken(token)
    }
    mountLandScreen(app, () => {
      navigate('/land')
    })
  } else if (path === '/editor') {
    mountEditorScene(app, () => {
      navigate('/land')
    })
  } else if (path === '/map') {
    mountMapScene(app, () => {
      navigate('/land')
    })
  } else {
    mountLandScreen(app, () => {
      navigate('/land')
    })
  }
}

window.addEventListener('popstate', router)
bootstrap()
