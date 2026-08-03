import './loading.css'

export interface LoadingHandle {
  update(text: string): void
  unmount(): void
}

export function mountLoading(
  container: HTMLElement = document.body,
  text = 'Đang tải...',
): LoadingHandle {
  const overlay = document.createElement('div')
  overlay.className = 'loading-overlay'
  overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-text">${text}</p>
  `
  container.appendChild(overlay)

  return {
    update(newText: string) {
      const el = overlay.querySelector('.loading-text')
      if (el) el.textContent = newText
    },
    unmount() {
      overlay.remove()
    },
  }
}
