import { MapController } from '../map'

/**
 * MapScene — scene hiển thị bản đồ seamless với PixiJS.
 *
 * Click/tap trên map → nhân vật di chuyển tới điểm đó.
 * Camera tự follow nhân vật, scroll seamless.
 * Nhấn G để bật/tắt grid overlay.
 */
export function mountMapScene(
  app: HTMLElement,
  onBack: () => void,
): void {
  app.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'map-container'
  app.appendChild(wrapper)

  // HUD buttons
  const hud = document.createElement('div')
  hud.className = 'map-hud'
  wrapper.appendChild(hud)

  const backBtn = document.createElement('button')
  backBtn.className = 'map-hud-btn'
  backBtn.textContent = '← Quay lại'
  hud.appendChild(backBtn)

  const gridBtn = document.createElement('button')
  gridBtn.className = 'map-hud-btn'
  gridBtn.textContent = 'Grid (G)'
  hud.appendChild(gridBtn)

  // Map container (canvas will be appended here)
  const mapContainer = document.createElement('div')
  mapContainer.style.position = 'absolute'
  mapContainer.style.inset = '0'
  wrapper.appendChild(mapContainer)

  const ctrl = new MapController()
  ctrl.mount(mapContainer, {
    container: mapContainer,
    mapJsonPath: '/Map/Map/meowa-map.json',
    tilesetBasePath: '/Map/Map/assets/tilesets/',
    characterSpritePath: '/Map/Map/preview.png',
  }).catch((err) => {
    console.error('Map load error:', err)
  })

  backBtn.addEventListener('click', () => {
    ctrl.unmount()
    onBack()
  })

  gridBtn.addEventListener('click', () => {
    // Toggle grid via keyboard event simulation
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }))
  })
}

export function unmountMapScene(): void {
  // Controller cleanup handled by back button
}
