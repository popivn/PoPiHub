import './theme/colors.css'
import './style.css'
import { mountOrientationUI } from './utils/orientationUI'
import { mountMainUI } from './components/mainUI'

// Mount orientation + fullscreen controls (mobile landscape prompt)
mountOrientationUI()

// Render toàn bộ giao diện chính (scene + swiper + FPS/Ping)
mountMainUI(document.querySelector<HTMLDivElement>('#app')!)
