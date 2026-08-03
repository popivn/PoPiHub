import './orientationUI.css'
import {
  getState,
  isMobileDevice,
  isPortraitOrientation,
  isInFullscreen,
  requestFullscreen,
  lockLandscape,
  unlockOrientation,
} from './orientation'

/**
 * Overlay yêu cầu xoay ngang + thanh công cụ có thể thu gọn.
 *
 * - Portrait (mobile): hiện overlay hướng dẫn xoay.
 * - Landscape: hiện nút toggle (mũi tên) góc trên phải; bấm để mở
 *   thanh công cụ chứa nút "Toàn màn hình" (và "Quay ngang").
 * Gọi `mountOrientationUI()` một lần khi vào homepage.
 */

let overlayEl: HTMLDivElement | null = null
let controlsEl: HTMLDivElement | null = null
let toggleBtn: HTMLButtonElement | null = null
let fullscreenBtn: HTMLButtonElement | null = null
let rotateBtn: HTMLButtonElement | null = null

function shouldShowOverlay(): boolean {
  // Chỉ hiện overlay khi là mobile và đang ở portrait.
  return isMobileDevice() && isPortraitOrientation()
}

function updateOverlay(): void {
  if (!overlayEl) return
  overlayEl.classList.toggle('is-visible', shouldShowOverlay())
}

function updateControls(): void {
  if (!controlsEl || !toggleBtn) return
  const isPortrait = isPortraitOrientation()
  // Portrait: ẩn cả toggle lẫn thanh công cụ (overlay đã lo).
  // Landscape: hiện toggle (mũi tên), thanh công cụ giữ trạng thái đóng/mở.
  toggleBtn.hidden = isPortrait
  if (isPortrait) {
    // Đảm bảo đóng thanh công cụ khi về portrait.
    controlsEl.classList.remove('is-open')
  }
}

function toggleToolbar(): void {
  if (!controlsEl || !toggleBtn) return
  const isOpen = controlsEl.classList.toggle('is-open')
  // Đổi icon + vị trí: đóng -> mũi tên xuống (trên đỉnh), mở -> mũi tên lên (trượt theo panel).
  toggleBtn.textContent = isOpen ? '▲' : '▼'
  toggleBtn.setAttribute('aria-expanded', String(isOpen))
  toggleBtn.classList.toggle('is-active', isOpen)
}

async function handleFullscreen(): Promise<void> {
  try {
    await requestFullscreen(document.documentElement)
  } catch (err) {
    console.warn('[orientationUI] fullscreen error:', err)
  }
}

async function handleRotate(): Promise<void> {
  // Cần vào fullscreen trước rồi mới lock landscape được.
  if (!isInFullscreen()) {
    try {
      await requestFullscreen(document.documentElement)
    } catch (err) {
      console.warn('[orientationUI] fullscreen before rotate error:', err)
    }
  }
  await lockLandscape()
  updateControls()
}

function build(): void {
  if (overlayEl) return

  // === Overlay yêu cầu xoay ngang ===
  overlayEl = document.createElement('div')
  overlayEl.className = 'kh-rotate-overlay'
  overlayEl.innerHTML = `
    <div class="kh-rotate-card">
      <div class="kh-rotate-icon" aria-hidden="true">↻</div>
      <h2 class="kh-rotate-title">Vui lòng xoay ngang thiết bị</h2>
      <p class="kh-rotate-desc">Trò chơi trải nghiệm tốt nhất ở chế độ màn hình ngang.</p>
      <button class="kh-rotate-action" type="button">Quay ngang màn hình</button>
    </div>
  `
  document.body.appendChild(overlayEl)

  const actionBtn = overlayEl.querySelector<HTMLButtonElement>('.kh-rotate-action')
  actionBtn?.addEventListener('click', handleRotate)

  // === Nút toggle (mũi tên) góc trên phải ===
  toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'kh-ctrl-toggle'
  toggleBtn.setAttribute('aria-label', 'Mở thanh công cụ')
  toggleBtn.setAttribute('aria-expanded', 'false')
  toggleBtn.textContent = '▼'
  toggleBtn.hidden = true
  document.body.appendChild(toggleBtn)
  toggleBtn.addEventListener('click', toggleToolbar)

  // === Thanh công cụ (kéo xuống từ trên) ===
  controlsEl = document.createElement('div')
  controlsEl.className = 'kh-orientation-controls'
  controlsEl.innerHTML = `
    <button class="kh-ctrl-btn kh-ctrl-fullscreen" type="button" aria-label="Toàn màn hình" title="Toàn màn hình">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>
      </svg>
      <span>Toàn màn hình</span>
    </button>
    <button class="kh-ctrl-btn kh-ctrl-rotate" type="button" aria-label="Quay ngang" title="Quay ngang">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 9a7 7 0 0 1 14 0"/>
        <path d="M19 9V4M19 9h-5"/>
        <path d="M19 15a7 7 0 0 1-14 0"/>
        <path d="M5 15v5M5 15h5"/>
      </svg>
      <span>Quay ngang</span>
    </button>
  `
  document.body.appendChild(controlsEl)

  fullscreenBtn = controlsEl.querySelector<HTMLButtonElement>('.kh-ctrl-fullscreen')
  rotateBtn = controlsEl.querySelector<HTMLButtonElement>('.kh-ctrl-rotate')

  fullscreenBtn?.addEventListener('click', handleFullscreen)
  rotateBtn?.addEventListener('click', handleRotate)
}

function attachListeners(): void {
  // Lắng nghe thay đổi hướng màn hình.
  if (screen.orientation) {
    screen.orientation.addEventListener('change', () => {
      updateOverlay()
      updateControls()
    })
  }
  window.addEventListener('resize', () => {
    updateOverlay()
    updateControls()
  })
  window.addEventListener('orientationchange', () => {
    updateOverlay()
    updateControls()
  })

  document.addEventListener('fullscreenchange', () => {
    if (!isInFullscreen()) {
      // Khi thoát fullscreen, giải phóng lock orientation (nếu có).
      unlockOrientation()
    }
  })
  // webkit fallback
  document.addEventListener('webkitfullscreenchange', () => {
    if (!isInFullscreen()) unlockOrientation()
  })
}

export function mountOrientationUI(): void {
  build()
  attachListeners()
  updateOverlay()
  updateControls()

  // Log trạng thái ban đầu (hữu ích khi debug).
  const state = getState()
  console.info('[orientationUI] initial state:', state)
}
