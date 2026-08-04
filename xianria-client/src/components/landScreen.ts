import './landScreen.css'
import { authApi } from '../server/authApi'
import { getMainGameUI } from './mainGameUI'
import { MapEditor } from '../map/MapEditor'
import { mountInsideIsland } from './insideIsland'

const API_BASE = 'http://localhost:3000'

const GRID_SIZE = 100
const TILE_SIZE = 64
const LAND_PRICE = 100

const TILESET_URL = '/Map/Map/assets/tilesets/texture-job_588abcca22eb4f8aa1243c608074889e.png'
const TILESET_ID = 'texture-job_588abcca22eb4f8aa1243c608074889e'

export interface LandPlot {
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
      <div class="ls-viewport" id="ls-viewport">
        <!-- Lớp mây trôi SVG phủ lên trên bản đồ -->
        <div class="ls-cloud-overlay">
          <svg viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="goo" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur" />
                <feColorMatrix in="blur" mode="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 22 -9" result="goo" />
                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
              </filter>

              <filter id="soft-shadow" x="-60%" y="-60%" width="220%" height="220%">
                <feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="#4a6a8a" flood-opacity="0.18"/>
              </filter>

              <symbol id="cloud-detailed" viewBox="0 0 340 220">
                <g filter="url(#soft-shadow)">
                  <g filter="url(#goo)">
                    <circle cx="55"  cy="130" r="40" fill="#ffffff"/>
                    <circle cx="95"  cy="105" r="52" fill="#ffffff"/>
                    <circle cx="150" cy="90"  r="58" fill="#ffffff"/>
                    <circle cx="205" cy="95"  r="54" fill="#ffffff"/>
                    <circle cx="255" cy="110" r="46" fill="#ffffff"/>
                    <circle cx="292" cy="135" r="34" fill="#ffffff"/>
                    <circle cx="30"  cy="150" r="28" fill="#ffffff"/>

                    <circle cx="120" cy="62" r="34" fill="#ffffff"/>
                    <circle cx="168" cy="52" r="38" fill="#ffffff"/>
                    <circle cx="212" cy="60" r="32" fill="#ffffff"/>
                    <circle cx="80"  cy="78"  r="24" fill="#ffffff"/>
                    <circle cx="240" cy="75"  r="26" fill="#ffffff"/>

                    <circle cx="150" cy="150" r="42" fill="#d3e4f2"/>
                    <circle cx="205" cy="155" r="44" fill="#cfe1f0"/>
                    <circle cx="255" cy="145" r="36" fill="#d6e6f3"/>
                    <circle cx="90"  cy="150" r="30" fill="#dcebf6"/>
                    <circle cx="270" cy="155" r="26" fill="#d3e4f2"/>

                    <circle cx="105" cy="60" r="26" fill="#ffffff"/>
                    <circle cx="145" cy="48" r="22" fill="#ffffff"/>
                  </g>
                </g>
              </symbol>
            </defs>

            <g class="drift-slow" opacity="0.4" style="animation-delay: -10s;">
              <use href="#cloud-detailed" class="float-slow" x="0" y="40" width="200" height="130"/>
            </g>
            <g class="drift-mid" opacity="0.45" style="animation-delay: -25s;">
              <use href="#cloud-detailed" class="float-slow2" x="0" y="160" width="300" height="195"/>
            </g>
            <g class="drift-fast" opacity="0.35" style="animation-delay: -5s;">
              <use href="#cloud-detailed" class="float-slow3" x="0" y="280" width="420" height="272"/>
            </g>
            <g class="drift-mid" opacity="0.4" style="animation-delay: -45s;">
              <use href="#cloud-detailed" class="float-slow" x="0" y="420" width="360" height="234"/>
            </g>
            <g class="drift-slow" opacity="0.45" style="animation-delay: -60s;">
              <use href="#cloud-detailed" class="float-slow2" x="0" y="540" width="280" height="182"/>
            </g>
          </svg>
        </div>
      </div>
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
      onCameraMove: () => {
        const existingPopover = viewport.querySelector('.ls-island-popover')
        if (existingPopover) {
          existingPopover.remove()
        }
      }
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

    // Remove existing popover if any
    const existingPopover = viewport.querySelector('.ls-island-popover')
    if (existingPopover) {
      existingPopover.remove()
    }

    if (land?.ownerId) {
      if (land.ownerId === user?.uid) {
        infoEl.textContent = `Đất của bạn tại (${x}, ${y})`
      } else {
        infoEl.textContent = `Đất đã thuộc về ${land.ownerName} tại (${x}, ${y})`
      }
      showIslandPopover(x, y, land)
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

  function showIslandPopover(x: number, y: number, land: LandPlot): void {
    const popover = document.createElement('div')
    popover.className = 'ls-island-popover'

    // Calculate position
    const worldX = editor ? editor.world.x : 0
    const worldY = editor ? editor.world.y : 0
    const scale = editor ? editor.world.scale.x : 1
    const screenX = (x + 0.5) * TILE_SIZE * scale + worldX
    const screenY = y * TILE_SIZE * scale + worldY

    popover.style.left = `${screenX}px`
    popover.style.top = `${screenY}px`

    const isMine = land.ownerId === user?.uid
    const ownerText = isMine ? 'Đất của bạn' : `Sở hữu: ${land.ownerName}`

    popover.innerHTML = `
      <div class="ls-popover-header">
        <span class="ls-popover-coord">📍 Toạ độ: (${x}, ${y})</span>
        <span class="ls-popover-owner">${ownerText}</span>
      </div>
      <div class="ls-popover-actions">
        <button class="ls-popover-btn ls-enter-btn">Vào</button>
        <button class="ls-popover-btn ls-info-btn">Thông Tin</button>
      </div>
    `

    const enterBtn = popover.querySelector<HTMLButtonElement>('.ls-enter-btn')!
    const infoBtn = popover.querySelector<HTMLButtonElement>('.ls-info-btn')!

    enterBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      popover.remove()
      showInnerIslandView(x, y, land.ownerName ?? 'Unknown', land)
    })

    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      infoEl.textContent = `Thông tin chi tiết: Đảo thuộc về ${land.ownerName} tại toạ độ (${x}, ${y}). Được mua với giá ${land.price} coins.`
    })

    viewport.appendChild(popover)
  }

  async function showInnerIslandView(x: number, y: number, ownerName: string, land: LandPlot): Promise<void> {
    if (editor) {
      editor.destroy()
      editor = null
    }

    await mountInsideIsland({
      app,
      x,
      y,
      ownerName,
      land,
      user,
      onBack: () => {
        mountLandScreen(app, onBack)
      }
    })
  }

  // Back button
  app.querySelector('#ls-back')?.addEventListener('click', onBack)

  initEditor().catch((err) => {
    console.error('Land editor init error:', err)
    infoEl.textContent = 'Lỗi khởi tạo bản đồ'
  })
}
