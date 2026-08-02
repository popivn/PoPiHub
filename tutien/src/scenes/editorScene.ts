import './editorScene.css'
import { MapEditor } from '../map/MapEditor'

/**
 * EditorScene — scene hiển thị map editor giống Meowa AI.
 *
 * - Click trái: vẽ tile (auto-tiling seamless)
 * - Click phải / Shift+drag: di chuyển camera
 * - Nút Save: lưu map qua API endpoint
 * - Nút Load: tải map từ API
 * - Nút Clear: xoá toàn bộ
 * - Nút Grid: bật/tắt grid overlay
 */
export function mountEditorScene(
  app: HTMLElement,
  onBack: () => void,
): void {
  app.innerHTML = ''

  const wrapper = document.createElement('div')
  wrapper.className = 'editor-wrapper'
  app.appendChild(wrapper)

  // === Toolbar ===
  const toolbar = document.createElement('div')
  toolbar.className = 'editor-toolbar'
  wrapper.appendChild(toolbar)

  const backBtn = document.createElement('button')
  backBtn.className = 'editor-btn'
  backBtn.textContent = '← Quay lại'
  toolbar.appendChild(backBtn)

  const title = document.createElement('span')
  title.className = 'editor-title'
  title.textContent = 'Map Editor'
  toolbar.appendChild(title)

  const spacer = document.createElement('div')
  spacer.className = 'editor-spacer'
  toolbar.appendChild(spacer)

  const mapIdInput = document.createElement('input')
  mapIdInput.className = 'editor-input'
  mapIdInput.type = 'text'
  mapIdInput.value = 'untitled'
  mapIdInput.placeholder = 'Map ID'
  toolbar.appendChild(mapIdInput)

  const loadBtn = document.createElement('button')
  loadBtn.className = 'editor-btn'
  loadBtn.textContent = 'Load'
  toolbar.appendChild(loadBtn)

  const saveBtn = document.createElement('button')
  saveBtn.className = 'editor-btn editor-btn-primary'
  saveBtn.textContent = 'Save'
  toolbar.appendChild(saveBtn)

  const clearBtn = document.createElement('button')
  clearBtn.className = 'editor-btn editor-btn-danger'
  clearBtn.textContent = 'Clear'
  toolbar.appendChild(clearBtn)

  const gridBtn = document.createElement('button')
  gridBtn.className = 'editor-btn'
  gridBtn.textContent = 'Grid'
  toolbar.appendChild(gridBtn)

  // === Canvas container + palette layout ===
  const contentArea = document.createElement('div')
  contentArea.className = 'editor-content'
  wrapper.appendChild(contentArea)

  // === Tile palette (left sidebar) ===
  const palette = document.createElement('div')
  palette.className = 'editor-palette'
  contentArea.appendChild(palette)

  const paletteTitle = document.createElement('div')
  paletteTitle.className = 'editor-palette-title'
  paletteTitle.textContent = 'Tile Palette'
  palette.appendChild(paletteTitle)

  const tilesetImg = document.createElement('img')
  tilesetImg.className = 'editor-tileset-preview'
  tilesetImg.src = '/Map/Map/assets/tilesets/texture-job_588abcca22eb4f8aa1243c608074889e.png'
  tilesetImg.draggable = false
  palette.appendChild(tilesetImg)

  const paletteHint = document.createElement('div')
  paletteHint.className = 'editor-palette-hint'
  paletteHint.innerHTML = 'Click trái: vẽ<br>Click phải: xoá<br>Shift+drag: di chuyển'
  palette.appendChild(paletteHint)

  // === Canvas container ===
  const canvasContainer = document.createElement('div')
  canvasContainer.className = 'editor-canvas-container'
  contentArea.appendChild(canvasContainer)

  // === Status bar ===
  const statusBar = document.createElement('div')
  statusBar.className = 'editor-status'
  wrapper.appendChild(statusBar)

  const statusText = document.createElement('span')
  statusText.textContent = 'Sẵn sàng. Click trái để vẽ, click phải để xoá, shift+drag để di chuyển.'
  statusBar.appendChild(statusText)

  // === Map size controls ===
  // (removed empty sizeRow)

  // === Init editor ===
  let editor: MapEditor | null = null

  async function initEditor(): Promise<void> {
    editor = new MapEditor({
      container: canvasContainer,
      width: 24,
      height: 16,
      tilesetSize: 64,
      tilesetUrl: '/Map/Map/assets/tilesets/texture-job_588abcca22eb4f8aa1243c608074889e.png',
      tilesetId: 'texture-job_588abcca22eb4f8aa1243c608074889e',
      mapId: mapIdInput.value || 'untitled',
    })
    await editor.init()
    statusText.textContent = 'Editor sẵn sàng. Click trái = vẽ, click phải = xoá, shift+drag = di chuyển.'
  }

  initEditor().catch((err) => {
    statusText.textContent = `Lỗi: ${err.message}`
    console.error('Editor init error:', err)
  })

  // === Event handlers ===
  backBtn.addEventListener('click', () => {
    editor?.destroy()
    editor = null
    onBack()
  })

  saveBtn.addEventListener('click', async () => {
    if (!editor) return
    try {
      statusText.textContent = 'Đang lưu...'
      const result = await editor.save()
      statusText.textContent = `Đã lưu map "${result.id}" thành công.`
    } catch (e: any) {
      statusText.textContent = `Lỗi lưu: ${e.message}`
    }
  })

  loadBtn.addEventListener('click', async () => {
    if (!editor) return
    const mapId = mapIdInput.value.trim()
    if (!mapId) {
      statusText.textContent = 'Nhập Map ID để load.'
      return
    }
    try {
      statusText.textContent = `Đang tải map "${mapId}"...`
      await editor.load(mapId)
      statusText.textContent = `Đã tải map "${mapId}" thành công.`
    } catch (e: any) {
      statusText.textContent = `Lỗi tải: ${e.message}`
    }
  })

  clearBtn.addEventListener('click', () => {
    editor?.clearMap()
    statusText.textContent = 'Đã xoá toàn bộ map.'
  })

  gridBtn.addEventListener('click', () => {
    editor?.toggleGrid()
  })
}

export function unmountEditorScene(): void {
  // Cleanup handled by back button
}
