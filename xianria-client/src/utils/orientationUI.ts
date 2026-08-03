import './orientationUI.css'
import { authApi } from '../server/authApi'
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
let controlsOverlayEl: HTMLDivElement | null = null
let mainToggleBtn: HTMLButtonElement | null = null
let fullscreenBtn: HTMLButtonElement | null = null
let rotateBtn: HTMLButtonElement | null = null

export function registerMainToggle(btn: HTMLButtonElement | null): void {
  mainToggleBtn = btn
}

function shouldShowOverlay(): boolean {
  // Chỉ hiện overlay khi là mobile và đang ở portrait.
  return isMobileDevice() && isPortraitOrientation()
}

function updateOverlay(): void {
  if (!overlayEl) return
  overlayEl.classList.toggle('is-visible', shouldShowOverlay())
}

export function updateControls(): void {
  if (!controlsEl) return
  const isPortrait = isPortraitOrientation()
  if (isPortrait) {
    // Đảm bảo đóng thanh công cụ khi về portrait.
    controlsEl.classList.remove('is-open')
  }
}

export function toggleToolbar(btn?: HTMLButtonElement | null): void {
  if (!controlsEl) return
  const isOpen = controlsEl.classList.toggle('is-open')
  // Đổi icon: đóng -> mũi tên xuống, mở -> mũi tên lên.
  const toggle = btn ?? mainToggleBtn
  if (toggle) {
    toggle.textContent = isOpen ? '▲' : '▼'
    toggle.setAttribute('aria-expanded', String(isOpen))
    toggle.classList.toggle('is-active', isOpen)
  }
  if (controlsOverlayEl) {
    controlsOverlayEl.classList.toggle('is-visible', isOpen)
  }
  // Cập nhật user info khi mở toolbar
  if (isOpen) updateUserInfo()
}

function updateUserInfo(): void {
  if (!controlsEl) return
  const user = authApi.getStoredUser()
  const badge = controlsEl.querySelector('.kh-ctrl-user')
  if (!badge) return
  if (user) {
    badge.innerHTML = `
      <div class="kh-ctrl-user-avatar">${user.isGuest ? '👤' : '⚔'}</div>
      <div class="kh-ctrl-user-info">
        <span class="kh-ctrl-user-name">${user.username ?? 'Unknown'}</span>
        <span class="kh-ctrl-user-tag">${user.isGuest ? 'Khách' : 'Thành viên'}</span>
      </div>
    `
  } else {
    badge.innerHTML = `
      <div class="kh-ctrl-user-avatar">?</div>
      <div class="kh-ctrl-user-info">
        <span class="kh-ctrl-user-name">Chưa đăng nhập</span>
        <span class="kh-ctrl-user-tag">—</span>
      </div>
    `
  }
}

async function handleFullscreen(): Promise<void> {
  try {
    await requestFullscreen(document.documentElement)
  } catch (err) {
    console.warn('[orientationUI] fullscreen error:', err)
  }
}

function handleLogout(): void {
  authApi.logout()
  window.location.hash = ''
  window.location.reload()
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

  // === Thanh công cụ (kéo xuống từ trên) ===
  controlsEl = document.createElement('div')
  controlsEl.className = 'kh-orientation-controls'
  const user = authApi.getStoredUser()
  const userBadge = user
    ? `<div class="kh-ctrl-user">
        <div class="kh-ctrl-user-avatar">${user.isGuest ? '👤' : '⚔'}</div>
        <div class="kh-ctrl-user-info">
          <span class="kh-ctrl-user-name">${user.username ?? 'Unknown'}</span>
          <span class="kh-ctrl-user-tag">${user.isGuest ? 'Khách' : 'Thành viên'}</span>
        </div>
      </div>`
    : `<div class="kh-ctrl-user">
        <div class="kh-ctrl-user-avatar">?</div>
        <div class="kh-ctrl-user-info">
          <span class="kh-ctrl-user-name">Chưa đăng nhập</span>
          <span class="kh-ctrl-user-tag">—</span>
        </div>
      </div>`

  controlsEl.innerHTML = `
    ${userBadge}
    <div class="kh-ctrl-divider"></div>
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
    <div class="kh-ctrl-divider"></div>
    <button class="kh-ctrl-btn kh-ctrl-logout" type="button" aria-label="Đăng xuất" title="Đăng xuất">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      <span>Đăng xuất</span>
    </button>
  `
  document.body.appendChild(controlsEl)

  // === Overlay đóng thanh công cụ khi click ra ngoài ===
  controlsOverlayEl = document.createElement('div')
  controlsOverlayEl.className = 'kh-controls-overlay'
  controlsOverlayEl.addEventListener('click', () => toggleToolbar())
  document.body.appendChild(controlsOverlayEl)

  fullscreenBtn = controlsEl.querySelector<HTMLButtonElement>('.kh-ctrl-fullscreen')
  rotateBtn = controlsEl.querySelector<HTMLButtonElement>('.kh-ctrl-rotate')

  fullscreenBtn?.addEventListener('click', handleFullscreen)
  rotateBtn?.addEventListener('click', handleRotate)

  const logoutBtn = controlsEl.querySelector<HTMLButtonElement>('.kh-ctrl-logout')
  logoutBtn?.addEventListener('click', handleLogout)
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
