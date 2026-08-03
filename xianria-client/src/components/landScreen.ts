import './landScreen.css'
import { authApi } from '../server/authApi'
import { getMainGameUI } from './mainGameUI'
import { MapEditor } from '../map/MapEditor'

const API_BASE = 'http://localhost:3000'

const GRID_SIZE = 100
const TILE_SIZE = 64
const LAND_PRICE = 100

const TILESET_URL = '/Map/Map/assets/tilesets/texture-job_588abcca22eb4f8aa1243c608074889e.png'
const TILESET_ID = 'texture-job_588abcca22eb4f8aa1243c608074889e'

interface LandPlot {
  id: string
  x: number
  y: number
  ownerId: string | null
  ownerName: string | null
  price: number
  purchasedAt: number | null
}

export function mountLandScreen(app: HTMLElement, onBack: () => void): void {
  const user = authApi.getStoredUser()
  const coins = user?.coins ?? 0

  app.innerHTML = `
    <div class="ls-container">
      <div class="ls-topbar">
        <button class="ls-back-btn" id="ls-back">← Quay lại</button>
        <div class="ls-topbar-right" id="ls-topbar-right">
          <div class="ls-coins">
            <span class="ls-coins-icon">🪙</span>
            <span class="ls-coins-amount" id="ls-coins">${coins}</span>
          </div>
        </div>
      </div>
      <div class="ls-viewport" id="ls-viewport"></div>
      <div class="ls-info" id="ls-info"></div>
    </div>
  `

  const viewport = app.querySelector<HTMLDivElement>('#ls-viewport')!
  const infoEl = app.querySelector<HTMLDivElement>('#ls-info')!
  const coinsEl = app.querySelector<HTMLSpanElement>('#ls-coins')!
  const topbarRight = app.querySelector<HTMLDivElement>('#ls-topbar-right')!

  const gameUI = getMainGameUI()
  if (gameUI) topbarRight.appendChild(gameUI.toggle)

  let landMap: Record<string, LandPlot> = {}
  let editor: MapEditor | null = null

  async function initEditor(): Promise<void> {
    editor = new MapEditor({
      container: viewport,
      width: GRID_SIZE,
      height: GRID_SIZE,
      tilesetSize: TILE_SIZE,
      tilesetUrl: TILESET_URL,
      tilesetId: TILESET_ID,
      mapId: 'land-world',
      onTileClick: handleTileClick,
    })
    await editor.init()
    // Center camera after init
    // @ts-expect-error centerCamera is private
    editor.centerCamera()
    await loadLand()
  }

  // Load land data
  async function loadLand(): Promise<void> {
    if (!editor) return
    try {
      const res = await fetch(`${API_BASE}/api/land`)
      const lands: LandPlot[] = await res.json()
      landMap = {}
      for (const l of lands) {
        landMap[`${l.x}_${l.y}`] = l
        if (l.x >= 0 && l.x < GRID_SIZE && l.y >= 0 && l.y < GRID_SIZE) {
          editor.paintAt(l.x, l.y)
        }
      }
    } catch {
      infoEl.textContent = 'Không thể tải dữ liệu đất'
    }
  }

  // Click tile to buy / show info
  function handleTileClick(x: number, y: number): void {
    const key = `${x}_${y}`
    const land = landMap[key]

    if (land?.ownerId) {
      if (land.ownerId === user?.uid) {
        infoEl.textContent = `Đất của bạn tại (${x}, ${y})`
      } else {
        infoEl.textContent = `Đất đã thuộc về ${land.ownerName} tại (${x}, ${y})`
      }
      return
    }

    // Buy
    infoEl.textContent = `Mua đất tại (${x}, ${y}) với ${LAND_PRICE} coins?`
    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'ls-confirm-btn'
    confirmBtn.textContent = 'Xác nhận mua'
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true
      confirmBtn.textContent = 'Đang xử lý...'
      try {
        const token = authApi.getToken()
        const res = await fetch(`${API_BASE}/api/land/buy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ x, y }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message ?? 'Mua đất thất bại')

        // Update local state
        landMap[key] = data.land
        editor?.paintAt(x, y)

        // Update coins
        coinsEl.textContent = String(data.coins)
        if (user) {
          user.coins = data.coins
          authApi.setStoredUser(user)
        }

        infoEl.innerHTML = `<span class="ls-success">✅ Mua đất thành công tại (${x}, ${y})! Còn ${data.coins} coins</span>`
      } catch (err) {
        infoEl.innerHTML = `<span class="ls-error">❌ ${err instanceof Error ? err.message : 'Lỗi không xác định'}</span>`
      }
    })

    infoEl.innerHTML = ''
    infoEl.appendChild(confirmBtn)
  }

  // Back button
  app.querySelector('#ls-back')?.addEventListener('click', onBack)

  initEditor().catch((err) => {
    console.error('Land editor init error:', err)
    infoEl.textContent = 'Lỗi khởi tạo bản đồ'
  })
}
