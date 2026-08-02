/**
 * Tự động thu nhỏ tỉ lệ thẻ card theo chiều cao màn hình điện thoại.
 *
 * Cách hoạt động:
 * 1. Đo chiều cao "tự nhiên" của card (scrollHeight, khi scale = 1).
 * 2. Đo khoảng trống khả dụng = window.innerHeight - bottomOffset - topMargin.
 * 3. Set --ara-scale = min(MAX, available / natural) lên chính element card.
 *
 * Hỗ trợ nhiều card cùng lúc (swiper): tất cả dùng chung tỉ lệ
 * dựa trên chiều cao tự nhiên LỚN NHẤT để các card đồng đều.
 */

const BOTTOM_OFFSET = 60 // trùng với `bottom` của .ara-card
const TOP_MARGIN = 24 // khoảng trống tối thiểu phía trên card
const MIN_SCALE = 0.3 // không thu nhỏ quá mức này
// Mobile: cho phép phóng to tối đa 1.3x | Desktop (lg): giữ nhỏ, tối đa 0.85x
const MAX_SCALE_MOBILE = 1.3
const MAX_SCALE_DESKTOP = 0.85
// Hệ số "thừa": mobile dùng 90% khoảng trống | desktop dùng 70% để card gọn
const FILL_FACTOR_MOBILE = 0.9
const FILL_FACTOR_DESKTOP = 0.7

const cardEls: Set<HTMLElement> = new Set()
let rafId = 0

function computeAndApply(): void {
  if (cardEls.size === 0) return
  // Desktop (lg): chiều rộng > 1024px
  const isDesktop = window.innerWidth > 1024
  const maxScale = isDesktop ? MAX_SCALE_DESKTOP : MAX_SCALE_MOBILE
  const fillFactor = isDesktop ? FILL_FACTOR_DESKTOP : FILL_FACTOR_MOBILE
  const available = (window.innerHeight - BOTTOM_OFFSET - TOP_MARGIN) * fillFactor
  if (available <= 0) {
    cardEls.forEach((el) => el.style.setProperty('--ara-scale', String(MIN_SCALE)))
    return
  }
  // Đo chiều cao tự nhiên của tất cả card, lấy max để đồng đều.
  let maxNatural = 0
  cardEls.forEach((el) => {
    el.style.setProperty('--ara-scale', '1')
    const h = el.scrollHeight
    if (h > maxNatural) maxNatural = h
  })
  // Tính tỉ lệ chung
  const scale = Math.max(MIN_SCALE, Math.min(maxScale, available / maxNatural))
  const scaleStr = scale.toFixed(3)
  cardEls.forEach((el) => el.style.setProperty('--ara-scale', scaleStr))
  console.info('[cardFit]', {
    cardCount: cardEls.size,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    isDesktop,
    available,
    maxNatural,
    scale: scaleStr,
  })
}

function scheduleCompute(): void {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(computeAndApply)
}

export function fitCardScale(el: HTMLElement): void {
  cardEls.add(el)
  // Tính ngay + tính lại sau khi ảnh sprite load (card có thể cao hơn).
  computeAndApply()
  window.addEventListener('load', computeAndApply)
  window.addEventListener('resize', scheduleCompute)
  window.addEventListener('orientationchange', () => {
    setTimeout(computeAndApply, 150)
  })
  if (screen.orientation) {
    screen.orientation.addEventListener('change', () => {
      setTimeout(computeAndApply, 150)
    })
  }
  // Đo lại sau 1s (phòng sprite webp load chậm).
  setTimeout(computeAndApply, 1000)
}
