/**
 * Tiện ích xử lý orientation (dọc/ngang) + fullscreen cho mobile.
 *
 * - Phát hiện thiết bị mobile và hướng màn hình hiện tại.
 * - Hiển thị overlay yêu cầu người chơi quay ngang khi đang ở portrait.
 * - Cung cấp nút "Toàn màn hình" và "Quay ngang".
 *
 * Lưu ý:
 *   + `screen.orientation.lock('landscape')` chỉ hoạt động khi đang ở fullscreen,
 *     và chỉ được hỗ trợ trên một số trình duyệt (Chrome Android). iOS Safari không hỗ trợ.
 *   + Với iOS, ta chỉ có thể hướng dẫn người dùng tự xoay thiết bị.
 */

export type OrientationState = {
  isMobile: boolean
  isPortrait: boolean
  isFullscreen: boolean
}

function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as unknown as { msMaxTouchPoints?: number }).msMaxTouchPoints !== undefined
  )
}

export function isMobileDevice(): boolean {
  // Kết hợp touch + kích thước màn hình để đoán mobile.
  const ua = navigator.userAgent || ''
  const uaMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua)
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) <= 820
  return uaMobile || (isTouchDevice() && smallScreen)
}

export function isPortraitOrientation(): boolean {
  // Ưu tiên matchMedia, fallback theo kích thước.
  if (window.matchMedia && window.matchMedia('(orientation: portrait)').matches) {
    return true
  }
  return window.innerHeight > window.innerWidth
}

export function isLandscapeOrientation(): boolean {
  return !isPortraitOrientation()
}

export function isInFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
  )
}

export function getState(): OrientationState {
  return {
    isMobile: isMobileDevice(),
    isPortrait: isPortraitOrientation(),
    isFullscreen: isInFullscreen(),
  }
}

/** Yêu cầu fullscreen cho một phần tử. Hỗ trợ prefix webkit. */
export async function requestFullscreen(el: Element): Promise<void> {
  const anyEl = el as Element & {
    webkitRequestFullscreen?: () => Promise<void>
  }
  if (el.requestFullscreen) {
    await el.requestFullscreen()
  } else if (anyEl.webkitRequestFullscreen) {
    await anyEl.webkitRequestFullscreen()
  } else {
    throw new Error('Fullscreen API không được hỗ trợ trên trình duyệt này.')
  }
}

/** Thoát fullscreen. */
export async function exitFullscreen(): Promise<void> {
  const anyDoc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>
  }
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if (anyDoc.webkitExitFullscreen) {
    await anyDoc.webkitExitFullscreen()
  }
}

/**
 * Cố gắng khoá hướng màn hình theo landscape.
 * Trả về true nếu thành công, false nếu không được hỗ trợ.
 */
export async function lockLandscape(): Promise<boolean> {
  const orientation = (screen as Screen & {
    orientation?: ScreenOrientation & { lock?: (o: string) => Promise<void> }
  }).orientation
  if (!orientation || typeof orientation.lock !== 'function') {
    return false
  }
  try {
    await orientation.lock('landscape')
    return true
  } catch {
    return false
  }
}

export async function unlockOrientation(): Promise<void> {
  const orientation = (screen as Screen & {
    orientation?: ScreenOrientation & { unlock?: () => void }
  }).orientation
  if (orientation && typeof orientation.unlock === 'function') {
    try {
      orientation.unlock()
    } catch {
      // ignore
    }
  }
}
