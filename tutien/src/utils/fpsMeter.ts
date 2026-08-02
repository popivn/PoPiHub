import './fpsMeter.css'
import { devLog, enableDevLog } from './devLog'

/**
 * Bộ đếm FPS + Ping hiển thị góc dưới bên trái.
 * - FPS: đo frames mỗi giây bằng requestAnimationFrame.
 * - Ping: đo thời gian round-trip fetch tới chính server.
 * - Khi FPS thấp, gửi log chẩn đoán ra terminal (npm run dev).
 *
 * Gọi `mountFpsMeter()` một lần khi khởi động.
 */

let fpsEl: HTMLDivElement | null = null
let pingEl: HTMLDivElement | null = null
let rafId = 0
let pingTimer: ReturnType<typeof setInterval> | null = null

// Theo dõi jank
let lastFrameTime = performance.now()
let longFrames: number[] = [] // danh sách frame > 20ms
let totalFrames = 0
let reportCount = 0

function build(): void {
  if (fpsEl) return

  const el = document.createElement('div')
  el.className = 'kh-fps-meter'
  el.innerHTML = `
    <div class="kh-fps-row"><span class="kh-fps-label">FPS</span><span class="kh-fps-value kh-fps-value-fps">--</span></div>
    <div class="kh-fps-row"><span class="kh-fps-label">PING</span><span class="kh-fps-value kh-fps-value-ping">--</span></div>
  `
  document.body.appendChild(el)
  fpsEl = el.querySelector<HTMLSpanElement>('.kh-fps-value-fps') as HTMLDivElement
  pingEl = el.querySelector<HTMLSpanElement>('.kh-fps-value-ping') as HTMLDivElement
}

function diagnoseLowFps(fps: number): void {
  // Phân tích nguyên nhân FPS thấp
  const avgLongFrame = longFrames.length > 0
    ? Math.round(longFrames.reduce((a, b) => a + b, 0) / longFrames.length)
    : 0
  const maxLongFrame = longFrames.length > 0 ? Math.round(Math.max(...longFrames)) : 0
  const longFrameCount = longFrames.length

  // Đếm element nặng (backdrop-filter, filter, animation)
  const heavyElements = document.querySelectorAll(
    '[style*="backdrop-filter"], [style*="filter"], .ara-card, .ara-view-sprite, .rover-view-sprite, .kh-swiper-track'
  ).length

  // Đếm animation đang chạy
  const animatedElements = document.querySelectorAll(
    '.ara-view-sprite, .rover-view-sprite, .kh-cloud, .kh-stars, .kh-platform-ring'
  ).length

  // Kiểm tra visibility các slide
  const slides = document.querySelectorAll('.kh-swiper-slide')
  const visibleSlides = Array.from(slides).filter((s) => {
    const style = window.getComputedStyle(s)
    return style.visibility !== 'hidden' && style.display !== 'none'
  }).length

  const diagnosis = {
    fps,
    totalFrames,
    longFrameCount,
    avgLongFrameMs: avgLongFrame,
    maxLongFrameMs: maxLongFrame,
    heavyElementCount: heavyElements,
    animatedElementCount: animatedElements,
    totalSlides: slides.length,
    visibleSlides,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  }

  // Gửi ra terminal
  devLog(`FPS thấp: ${fps}`, diagnosis, 'warn', 'FPS-DIAG')

  // Chẩn đoán nguyên nhân
  if (longFrameCount > totalFrames * 0.3) {
    devLog('→ Nguyên nhân: quá nhiều frame chậm (>20ms), có thể do animation/filter nặng', {
      longFrameRatio: `${Math.round((longFrameCount / totalFrames) * 100)}%`,
    }, 'warn', 'FPS-DIAG')
  }
  if (heavyElements > 10) {
    devLog('→ Nguyên nhân: quá nhiều element nặng (backdrop-filter/filter)', {
      count: heavyElements,
    }, 'warn', 'FPS-DIAG')
  }
  if (visibleSlides > 1) {
    devLog('→ Nguyên nhân: nhiều slide cùng hiển thị, GPU vẽ dư', {
      visible: visibleSlides,
      total: slides.length,
    }, 'warn', 'FPS-DIAG')
  }
  if (window.devicePixelRatio > 2) {
    devLog('→ Lưu ý: devicePixelRatio cao, GPU phải vẽ nhiều pixel hơn', {
      dpr: window.devicePixelRatio,
    }, 'info', 'FPS-DIAG')
  }
}

function startFpsCounter(): void {
  let frames = 0
  let lastTime = performance.now()

  function tick(now: number): void {
    frames++
    totalFrames++

    // Đo thời gian mỗi frame
    const frameDelta = now - lastFrameTime
    lastFrameTime = now
    if (frameDelta > 20) {
      longFrames.push(frameDelta)
      // Giữ danh sách không quá dài
      if (longFrames.length > 200) longFrames.shift()
    }

    const elapsed = now - lastTime
    if (elapsed >= 500) {
      const fps = Math.round((frames * 1000) / elapsed)
      reportCount++

      if (fpsEl) {
        fpsEl.textContent = String(fps)
        fpsEl.classList.remove('is-good', 'is-mid', 'is-bad')
        if (fps >= 50) fpsEl.classList.add('is-good')
        else if (fps >= 30) fpsEl.classList.add('is-mid')
        else fpsEl.classList.add('is-bad')
      }

      // Log ra terminal khi FPS thấp (lần đầu + mỗi 5 lần báo cáo)
      if (fps < 40 && (reportCount === 1 || reportCount % 5 === 0)) {
        diagnoseLowFps(fps)
      }

      frames = 0
      lastTime = now
      // Reset longFrames mỗi chuỗi báo cáo để không tích lũy
      if (fps >= 50) longFrames = []
    }
    rafId = requestAnimationFrame(tick)
  }
  rafId = requestAnimationFrame(tick)
}

async function measurePing(): Promise<void> {
  if (!pingEl) return
  try {
    const url = window.location.href
    const t0 = performance.now()
    await fetch(url, { cache: 'no-store', mode: 'no-cors' })
    const t1 = performance.now()
    const ms = Math.round(t1 - t0)
    pingEl.textContent = `${ms}ms`
    pingEl.classList.remove('is-good', 'is-mid', 'is-bad')
    if (ms <= 80) pingEl.classList.add('is-good')
    else if (ms <= 200) pingEl.classList.add('is-mid')
    else pingEl.classList.add('is-bad')
  } catch {
    pingEl.textContent = 'N/A'
  }
}

function startPingCounter(): void {
  measurePing()
  pingTimer = setInterval(measurePing, 3000)
}

export function mountFpsMeter(): void {
  // Bật devLog (gửi log ra terminal npm run dev)
  enableDevLog()
  build()
  startFpsCounter()
  startPingCounter()
}

export function unmountFpsMeter(): void {
  cancelAnimationFrame(rafId)
  if (pingTimer) clearInterval(pingTimer)
  pingTimer = null
}
