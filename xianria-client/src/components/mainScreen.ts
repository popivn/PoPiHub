import './mainScreen.css'

interface GameTile {
  id: string
  title: string
  icon: string
  color: string
}

const TILES: GameTile[] = [
  { id: 'land', title: 'Mua Đất', icon: '🗺', color: '#22c55e' },
  { id: 'ara', title: 'Ara', icon: '⚔', color: '#e94560' },
  { id: 'rover', title: 'Rover', icon: '�', color: '#4a9eff' },
  { id: 'editor', title: 'Map Editor', icon: '✏', color: '#d4af37' },
]

export function mountMainScreen(app: HTMLElement): void {
  app.innerHTML = `
    <div class="ms-container">
      <div class="ms-header">
        <h1 class="ms-title">Xianria</h1>
        <p class="ms-subtitle">Chọn game để bắt đầu</p>
      </div>
      <div class="ms-grid" id="ms-grid"></div>
    </div>
  `

  const grid = app.querySelector<HTMLDivElement>('#ms-grid')!
  grid.innerHTML = TILES.map(t => `
    <div class="ms-tile" data-id="${t.id}" style="--tile-color: ${t.color}">
      <div class="ms-tile-icon">${t.icon}</div>
      <div class="ms-tile-title">${t.title}</div>
    </div>
  `).join('')

  grid.querySelectorAll<HTMLElement>('.ms-tile').forEach(tile => {
    tile.addEventListener('click', () => {
      const id = tile.dataset.id
      if (id === 'land') {
        window.location.hash = '/land'
      } else if (id === 'ara' || id === 'rover') {
        window.location.hash = '/game'
      } else if (id === 'editor') {
        window.location.hash = '/editor'
      }
    })
  })
}
