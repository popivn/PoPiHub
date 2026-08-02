import './mainUI.css'
import { AraController } from '../modal/Character/Ara'
import { RoverController } from '../modal/Character/Rover'
import { createSwiper } from './swiper'
import { fitCardScale } from '../utils/cardFit'
import { mountFpsMeter, unmountFpsMeter } from '../utils/fpsMeter'
import { mountDemoScene, unmountDemoScene, type DemoCharacter } from '../scenes/demoScene'

/**
 * MainUI — component chính chịu trách nhiệm render toàn bộ giao diện homepage.
 *
 * Bao gồm:
 *  - Cảnh nền (moon, stars, mountains, clouds, ground)
 *  - Swiper chứa các card nhân vật (Ara, Rover...)
 *  - Bộ đếm FPS + Ping góc dưới bên trái
 *  - Nút "Demo" trên mỗi card → chuyển sang scene demo test animation
 *
 * Gọi `mountMainUI(appContainer)` từ main.ts.
 */
export function mountMainUI(app: HTMLElement): void {
  renderHomepage(app)
}

function renderHomepage(app: HTMLElement): void {
  // Dọn FPS meter cũ nếu có (khi quay lại từ demo)
  unmountFpsMeter()

  app.innerHTML = `
  <div id="kiem-hiep-scene">
    <div class="kh-moon"></div>
    <div class="kh-stars"></div>
    <div class="kh-mountains">
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,300 L0,180 L100,120 L200,160 L300,80 L400,140 L500,60 L600,130 L700,90 L800,150 L900,70 L1000,130 L1100,100 L1200,160 L1200,300 Z" fill="#1a1a3e" opacity="0.6"/>
        <path d="M0,300 L0,220 L150,160 L280,200 L400,140 L520,190 L640,150 L780,200 L900,160 L1050,190 L1200,170 L1200,300 Z" fill="#0d0d2a" opacity="0.8"/>
      </svg>
    </div>
    <div class="kh-clouds">
      <div class="kh-cloud kh-cloud-1"></div>
      <div class="kh-cloud kh-cloud-2"></div>
      <div class="kh-cloud kh-cloud-3"></div>
    </div>
    <div class="kh-ground"></div>

    <div id="swiper-container" style="position:absolute;inset:0;"></div>
  </div>
  `

  // === Swiper với các card nhân vật ===
  const swiperContainer = app.querySelector<HTMLDivElement>('#swiper-container')!

  // Lưu controller để wire nút Demo
  const controllers: Array<{ name: DemoCharacter; ctrl: AraController | RoverController }> = []

  const swiper = createSwiper({
    slides: [
      {
        label: 'Ara',
        mount: (container) => {
          const ara = new AraController()
          ara.mount(container)
          controllers.push({ name: 'Ara', ctrl: ara })
          return ara.el!
        },
      },
      {
        label: 'Rover',
        mount: (container) => {
          const rover = new RoverController()
          rover.mount(container)
          controllers.push({ name: 'Rover', ctrl: rover })
          return rover.el!
        },
      },
    ],
  })

  swiperContainer.appendChild(swiper.el)

  // Tự thu nhỏ tỉ lệ card theo chiều cao màn hình (mobile landscape)
  swiper.getSlideElements().forEach((el) => fitCardScale(el))

  // === Nút "Vào Demo" — nằm trên đỉnh card, thêm vào mỗi slide ===
  const demoBtns: HTMLButtonElement[] = []
  swiper.getSlideElements().forEach((slideEl, i) => {
    const demoBtn = document.createElement('button')
    demoBtn.className = 'kh-demo-btn'
    demoBtn.textContent = 'Vào Demo'
    demoBtn.addEventListener('click', () => {
      const character = controllers[i]?.name ?? 'Ara'
      goToDemo(app, character)
    })
    slideEl.appendChild(demoBtn)
    demoBtns.push(demoBtn)
  })

  // Đo chiều cao card thực tế (sau scale) để căn nút Demo trên đỉnh card
  // Áp dụng cho tất cả slide (card đồng đều nhờ cardFit)
  const positionDemoBtns = (): void => {
    swiper.getSlideElements().forEach((slideEl, i) => {
      const cardEl = slideEl.querySelector('.ara-card') as HTMLElement | null
      if (!cardEl) return
      const rect = cardEl.getBoundingClientRect()
      const slideRect = slideEl.getBoundingClientRect()
      const cardTopFromBottom = slideRect.bottom - rect.top
      demoBtns[i]?.style.setProperty('--card-height', `${cardTopFromBottom}px`)
    })
  }
  // Đo sau khi mount + sau khi ảnh load
  setTimeout(positionDemoBtns, 100)
  setTimeout(positionDemoBtns, 1000)
  window.addEventListener('resize', positionDemoBtns)
  window.addEventListener('orientationchange', () => setTimeout(positionDemoBtns, 200))

  // === Bộ đếm FPS + Ping ===
  mountFpsMeter()
}

function goToDemo(app: HTMLElement, character: DemoCharacter): void {
  // Dọn homepage + FPS meter
  unmountFpsMeter()
  app.innerHTML = ''

  // Mount demo scene, khi bấm "Quay lại" → render lại homepage
  mountDemoScene(app, character, () => {
    unmountDemoScene()
    renderHomepage(app)
  })
}
