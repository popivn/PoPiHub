import './theme/colors.css'
import './style.css'
import { mountOrientationUI } from './utils/orientationUI'
import { mountMainUI } from './components/mainUI'
import { mountEditorScene } from './scenes/editorScene'
import { mountMapScene } from './scenes/mapScene'

// Mount orientation + fullscreen controls (mobile landscape prompt)
mountOrientationUI()

const app = document.querySelector<HTMLDivElement>('#app')!

function router(): void {
  const hash = window.location.hash.slice(1) // remove #

  app.innerHTML = ''

  if (hash === '/editor') {
    mountEditorScene(app, () => {
      window.location.hash = ''
    })
  } else if (hash === '/map') {
    mountMapScene(app, () => {
      window.location.hash = ''
    })
  } else {
    mountMainUI(app)
  }
}

window.addEventListener('hashchange', router)
router()
