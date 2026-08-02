import './swiper.css'

export interface SwiperSlide {
  /** Tên hiển thị ở tab indicator */
  label: string
  /** Factory tạo nội dung slide: nhận container, trả về element chính (card) */
  mount: (container: HTMLElement) => HTMLElement
}

export interface SwiperOptions {
  slides: SwiperSlide[]
  /** Index bắt đầu (mặc định 0) */
  initialIndex?: number
}

/**
 * Carousel dạng swiper: trượt ngang qua lại giữa các card nhân vật.
 * Hỗ trợ kéo chuột/chạm + nút prev/next + tab indicator.
 */
export function createSwiper(options: SwiperOptions): {
  el: HTMLDivElement
  goTo: (index: number) => void
  next: () => void
  prev: () => void
  getCurrentIndex: () => number
  getSlideElements: () => HTMLElement[]
} {
  const { slides, initialIndex = 0 } = options
  let currentIndex = Math.max(0, Math.min(initialIndex, slides.length - 1))

  const el = document.createElement('div')
  el.className = 'kh-swiper'

  // === Track (dải trượt) ===
  const track = document.createElement('div')
  track.className = 'kh-swiper-track'

  const slideEls: HTMLElement[] = []
  const mountedEls: HTMLElement[] = []

  slides.forEach((slide, i) => {
    const slideEl = document.createElement('div')
    slideEl.className = 'kh-swiper-slide'
    if (i === currentIndex) slideEl.classList.add('is-active')
    slideEl.dataset.index = String(i)

    const inner = document.createElement('div')
    slideEl.appendChild(inner)

    track.appendChild(slideEl)
    slideEls.push(slideEl)

    // Mount nội dung slide
    const mainEl = slide.mount(inner)
    mountedEls.push(mainEl)
  })

  // === Tab indicators ===
  const tabs = document.createElement('div')
  tabs.className = 'kh-swiper-tabs'
  const tabBtns: HTMLButtonElement[] = []
  slides.forEach((slide, i) => {
    const tab = document.createElement('button')
    tab.className = 'kh-swiper-tab'
    tab.textContent = slide.label
    tab.addEventListener('click', () => goTo(i))
    tabs.appendChild(tab)
    tabBtns.push(tab)
  })

  // === Nút prev/next ===
  const prevBtn = document.createElement('button')
  prevBtn.className = 'kh-swiper-nav kh-swiper-prev'
  prevBtn.setAttribute('aria-label', 'Trước')
  prevBtn.innerHTML = '&lsaquo;'

  const nextBtn = document.createElement('button')
  nextBtn.className = 'kh-swiper-nav kh-swiper-next'
  nextBtn.setAttribute('aria-label', 'Sau')
  nextBtn.innerHTML = '&rsaquo;'

  prevBtn.addEventListener('click', () => prev())
  nextBtn.addEventListener('click', () => next())

  el.appendChild(track)
  el.appendChild(tabs)
  el.appendChild(prevBtn)
  el.appendChild(nextBtn)

  // === Logic trượt ===
  let animTimer: ReturnType<typeof setTimeout> | null = null

  function update(): void {
    // Bật class animating để CSS ẩn slide không active (giảm vẽ GPU)
    track.classList.add('is-animating')
    slideEls.forEach((s, i) => s.classList.toggle('is-active', i === currentIndex))
    track.style.transform = `translateX(-${currentIndex * 100}%)`
    tabBtns.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === currentIndex)
    })
    prevBtn.disabled = currentIndex === 0
    nextBtn.disabled = currentIndex === slides.length - 1
    // Tắt animating sau khi transition xong (300ms)
    if (animTimer) clearTimeout(animTimer)
    animTimer = setTimeout(() => {
      track.classList.remove('is-animating')
    }, 320)
  }

  function goTo(index: number): void {
    currentIndex = Math.max(0, Math.min(index, slides.length - 1))
    update()
  }

  function next(): void {
    goTo(currentIndex + 1)
  }

  function prev(): void {
    goTo(currentIndex - 1)
  }

  // === Kéo bằng chuột/chạm ===
  let isDragging = false
  let startX = 0
  let currentX = 0
  let trackWidth = 0

  function onPointerDown(e: PointerEvent): void {
    // Bỏ qua drag khi bấm vào nút (vd: nút Demo) để click hoạt động bình thường
    if ((e.target as HTMLElement).closest('.kh-demo-btn')) return
    isDragging = true
    startX = e.clientX
    currentX = startX
    trackWidth = track.offsetWidth
    track.classList.add('is-dragging')
    // Hiện cả 2 slide khi đang kéo để thấy trượt
    track.classList.add('is-animating')
    track.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging) return
    currentX = e.clientX
    const delta = currentX - startX
    const offsetPercent = (delta / trackWidth) * 100
    track.style.transform = `translateX(calc(-${currentIndex * 100}% + ${offsetPercent}px))`
  }

  function onPointerUp(): void {
    if (!isDragging) return
    isDragging = false
    track.classList.remove('is-dragging')
    const delta = currentX - startX
    const threshold = trackWidth * 0.15 // kéo quá 15% thì đổi slide
    if (delta < -threshold && currentIndex < slides.length - 1) {
      next()
    } else if (delta > threshold && currentIndex > 0) {
      prev()
    } else {
      update()
    }
  }

  track.addEventListener('pointerdown', onPointerDown)
  track.addEventListener('pointermove', onPointerMove)
  track.addEventListener('pointerup', onPointerUp)
  track.addEventListener('pointercancel', onPointerUp)

  // === Bàn phím ===
  el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  })
  el.tabIndex = 0

  update()

  return {
    el,
    goTo,
    next,
    prev,
    getCurrentIndex: () => currentIndex,
    getSlideElements: () => mountedEls,
  }
}
