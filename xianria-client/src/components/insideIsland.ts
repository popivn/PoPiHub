import './insideIsland.css'
import { InsideIslandMapEditor } from '../map/InsideIslandMapEditor'
import { type LandPlot } from './landScreen'
import { type AuthUser } from '../server/authApi'

export interface InsideIslandOptions {
  app: HTMLElement
  x: number
  y: number
  ownerName: string
  land: LandPlot
  user: AuthUser | null
  onBack: () => void
}

export async function mountInsideIsland(opts: InsideIslandOptions): Promise<void> {
  const { app, x, y, ownerName, land, user, onBack } = opts

  const isMine = land.ownerId === user?.uid || (land.ownerName && user?.username && land.ownerName === user.username)
  console.log('Inside Island Component - Owner verification:', {
    landOwnerId: land.ownerId,
    landOwnerName: land.ownerName,
    userId: user?.uid,
    userName: user?.username,
    isMine
  })

  app.innerHTML = `
    <div class="ii-container">
      <div class="ii-topbar">
        <button class="ii-back-btn" id="ii-back">← Quay lại Bản đồ</button>
        <div class="ii-title-center">🏝️ Đảo (${x}, ${y}) - Chủ: ${ownerName}</div>
        <div class="ii-topbar-right">
          ${isMine ? `<button class="ii-mode-btn" id="ii-edit-toggle">🛠️ Thiết kế</button>` : ''}
          <button class="ii-confirm-btn" id="ii-save" style="display: none;">Lưu Thiết Kế</button>
          <button class="ii-clear-btn" id="ii-clear" style="display: none;">Xoá</button>
        </div>
      </div>
      <div class="ii-viewport" id="ii-viewport-inner"></div>
      <div class="ii-palette" id="ii-palette" style="display: none;">
        <div class="ii-palette-title">Công cụ vẽ:</div>
        <button class="ii-palette-item active" id="ii-tool-grass" title="Cỏ Nhạt">
          <img src="/inside_island/assets/tiles/grass-2-1.png" class="ii-palette-icon" />
          <span>Cỏ Nhạt</span>
        </button>
        <button class="ii-palette-item" id="ii-tool-dark-grass" title="Cỏ Đậm">
          <img src="/inside_island/assets/tiles/060440_dual_grid_template_dual_grid_template-tileset-2-1.png" class="ii-palette-icon" />
          <span>Cỏ Đậm</span>
        </button>
        <button class="ii-palette-item" id="ii-tool-water" title="Vẽ Nước">
          <img src="/inside_island/assets/tiles/water-2-1.png" class="ii-palette-icon" />
          <span>Vẽ Nước</span>
        </button>
      </div>
      <div class="ii-info" id="ii-info">Mẹo: Kéo chuột hoặc vuốt màn hình để di chuyển xem đảo!</div>
    </div>
  `

  const innerViewport = app.querySelector<HTMLDivElement>('#ii-viewport-inner')!
  const innerInfo = app.querySelector<HTMLDivElement>('#ii-info')!
  const innerBack = app.querySelector<HTMLButtonElement>('#ii-back')!
  const innerEditToggle = app.querySelector<HTMLButtonElement>('#ii-edit-toggle')
  const innerSave = app.querySelector<HTMLButtonElement>('#ii-save')!
  const innerClear = app.querySelector<HTMLButtonElement>('#ii-clear')!
  const innerPalette = app.querySelector<HTMLDivElement>('#ii-palette')!
  const btnToolGrass = app.querySelector<HTMLButtonElement>('#ii-tool-grass')!
  const btnToolDarkGrass = app.querySelector<HTMLButtonElement>('#ii-tool-dark-grass')!
  const btnToolWater = app.querySelector<HTMLButtonElement>('#ii-tool-water')!

  const INNER_GRID_SIZE = 32
  const innerEditor = new InsideIslandMapEditor({
    container: innerViewport,
    width: INNER_GRID_SIZE,
    height: INNER_GRID_SIZE,
    tilesetSize: 64,
    tilesetUrl: '/inside_island/assets/tilesets/grass.png',
    tilesetId: 'grass',
    showFogOfWar: false,
    useIndividualTiles: true,
  })

  await innerEditor.init()
  // @ts-expect-error centerCamera is private
  innerEditor.centerCamera()

  const storageKey = `inner_island_${x}_${y}`
  const savedData = localStorage.getItem(storageKey)
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData)
      innerEditor.loadFromData(parsed)
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu đảo:', err)
    }
  } else {
    innerEditor.clearMap()
  }

  let isDesign = false
  function setDesignMode(isDesignMode: boolean): void {
    isDesign = isDesignMode
    innerEditor.readOnly = !isDesignMode
    innerEditor.setGridVisible(isDesignMode)

    if (isDesignMode) {
      innerBack.style.display = 'none'
      if (innerEditToggle) {
        innerEditToggle.textContent = '🚪 Thoát Thiết Kế'
      }
      innerSave.style.display = 'block'
      innerClear.style.display = 'block'
      innerPalette.style.display = 'flex'

      // Reset to grass tool by default when entering Design Mode
      innerEditor.activeTool = 'grass'
      btnToolGrass.classList.add('active')
      btnToolDarkGrass.classList.remove('active')
      btnToolWater.classList.remove('active')

      innerInfo.textContent = 'Mẹo: Chọn Cỏ Nhạt, Cỏ Đậm hoặc Nước bên dưới rồi vẽ lên bản đồ! (Nhấn Shift + Kéo để di chuyển)'
    } else {
      innerBack.style.display = 'block'
      if (innerEditToggle) {
        innerEditToggle.textContent = '🛠️ Thiết kế'
      }
      innerSave.style.display = 'none'
      innerClear.style.display = 'none'
      innerPalette.style.display = 'none'
      innerInfo.textContent = 'Mẹo: Kéo chuột hoặc vuốt màn hình để di chuyển xem đảo!'
    }
  }

  // Set default mode to Normal Mode (read-only, no grid)
  setDesignMode(false)

  innerBack.addEventListener('click', async () => {
    innerEditor.destroy()
    onBack()
  })

  innerSave.addEventListener('click', () => {
    try {
      const exported = innerEditor.exportMap()
      localStorage.setItem(storageKey, JSON.stringify(exported))
      innerInfo.innerHTML = `<span class="ii-success">✅ Lưu thiết kế đảo thành công!</span>`
      setTimeout(() => {
        innerInfo.textContent = isDesign
          ? 'Mẹo: Chọn Cỏ Nhạt, Cỏ Đậm hoặc Nước bên dưới rồi vẽ lên bản đồ! (Nhấn Shift + Kéo để di chuyển)'
          : 'Mẹo: Kéo chuột hoặc vuốt màn hình để di chuyển xem đảo!'
      }, 3000)
    } catch (err) {
      innerInfo.innerHTML = `<span class="ii-error">❌ Lưu thiết kế thất bại: ${err instanceof Error ? err.message : 'Lỗi'}</span>`
    }
  })

  innerClear.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn xoá toàn bộ thiết kế bên trong đảo không?')) {
      innerEditor.clearMap()
      innerInfo.innerHTML = `<span class="ii-success">🧹 Đã xoá toàn bộ bản đồ.</span>`
      setTimeout(() => {
        innerInfo.textContent = isDesign 
          ? 'Mẹo: Chọn Cỏ Nhạt, Cỏ Đậm hoặc Nước bên dưới rồi vẽ lên bản đồ! (Nhấn Shift + Kéo để di chuyển)'
          : 'Mẹo: Kéo chuột hoặc vuốt màn hình để di chuyển xem đảo!'
      }, 3000)
    }
  })

  if (innerEditToggle) {
    innerEditToggle.addEventListener('click', () => {
      setDesignMode(!isDesign)
    })
  }

  btnToolGrass.addEventListener('click', () => {
    innerEditor.activeTool = 'grass'
    btnToolGrass.classList.add('active')
    btnToolDarkGrass.classList.remove('active')
    btnToolWater.classList.remove('active')
  })

  btnToolDarkGrass.addEventListener('click', () => {
    innerEditor.activeTool = 'dark-grass'
    btnToolDarkGrass.classList.add('active')
    btnToolGrass.classList.remove('active')
    btnToolWater.classList.remove('active')
  })

  btnToolWater.addEventListener('click', () => {
    innerEditor.activeTool = 'water'
    btnToolWater.classList.add('active')
    btnToolGrass.classList.remove('active')
    btnToolDarkGrass.classList.remove('active')
  })
}
