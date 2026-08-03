import './pendingScene.css'

export function mountPendingScene(app: HTMLElement): { unmount: () => void } {
  app.innerHTML = `
    <div class="pending-scene">
      <div class="pending-spinner"></div>
      <p class="pending-text">Đang tải...</p>
    </div>
  `
  return {
    unmount() {
      app.innerHTML = ''
    },
  }
}
