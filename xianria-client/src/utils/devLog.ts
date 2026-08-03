/**
 * Gửi log từ browser tới terminal nơi chạy `npm run dev`.
 * Chỉ hoạt động ở dev mode (Vite plugin /__devlog).
 *
 * Cách dùng:
 *   devLog('FPS thấp', { fps: 28, jank: 45 })
 *   devLog('jank detected', { frameTime: 50 }, 'warn')
 */

let enabled = false
let endpoint = '/__devlog'
let queue: Array<{ message: string; extra?: unknown; level?: string; tag?: string }> = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function flush(): void {
  if (queue.length === 0) return
  const batch = queue
  queue = []
  // Gửi từng log (đơn giản, không cần batch phức tạp)
  batch.forEach((item) => {
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tag: item.tag ?? 'BROWSER',
          level: item.level ?? 'info',
          message: item.message,
          extra: item.extra,
        }),
        mode: 'no-cors',
      }).catch(() => {})
    } catch {
      // ignore
    }
  })
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    flush()
  }, 200)
}

export function devLog(message: string, extra?: unknown, level?: 'info' | 'warn' | 'error', tag?: string): void {
  if (!enabled) return
  queue.push({ message, extra, level, tag })
  scheduleFlush()
}

/** Bật devLog (chỉ nên gọi ở dev mode). */
export function enableDevLog(): void {
  enabled = true
  // Test kết nối
  devLog('devLog enabled — logs sẽ hiện ở terminal', undefined, 'info', 'DEVLOG')
}

/** Tắt devLog. */
export function disableDevLog(): void {
  enabled = false
}
