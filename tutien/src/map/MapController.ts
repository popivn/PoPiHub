import { Texture, Assets } from 'pixi.js'
import { MapView } from './MapView'
import { loadMapData } from './loader'
import type { MapConfig } from './types'

export class MapController {
  private view: MapView | null = null
  private canvasEl: HTMLCanvasElement | null = null
  private tickerBound = false
  private clickHandler: ((e: PointerEvent) => void) | null = null
  private keyHandler: ((e: KeyboardEvent) => void) | null = null

  async mount(container: HTMLElement, config: MapConfig): Promise<void> {
    // Load map data
    const mapData = await loadMapData(config.mapJsonPath)

    // Load tileset texture
    const tileset = mapData.map.tilesets[0]
    const tilesetPath = config.tilesetBasePath + tileset.url.split('/').pop()
    const tilesetTexture = await Assets.load(tilesetPath)

    // Load character sprite (optional)
    let characterTexture: Texture | undefined
    if (config.characterSpritePath) {
      characterTexture = await Assets.load(config.characterSpritePath)
    }

    // Create view
    this.view = new MapView({
      container,
      mapData,
      tilesetTexture,
      characterTexture,
    })
    await this.view.init()

    // Append canvas
    this.canvasEl = this.view.app.canvas
    this.canvasEl.style.width = '100%'
    this.canvasEl.style.height = '100%'
    this.canvasEl.style.display = 'block'
    this.canvasEl.style.touchAction = 'none'
    container.appendChild(this.canvasEl)

    // Center camera
    this.view.centerCameraOnCharacter()

    // Start game loop
    this.tickerBound = true
    this.view.app.ticker.add(this.onTick)

    // Click-to-move
    this.clickHandler = (e: PointerEvent) => this.onPointerDown(e)
    this.canvasEl.addEventListener('pointerdown', this.clickHandler)

    // Keyboard shortcuts
    this.keyHandler = (e: KeyboardEvent) => this.onKeyDown(e)
    window.addEventListener('keydown', this.keyHandler)
  }

  private onTick = (): void => {
    if (!this.view) return
    this.view.update()
    this.view.centerCameraOnCharacter()
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.view || !this.canvasEl) return
    const rect = this.canvasEl.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = this.view.screenToWorld(screenX, screenY)
    this.view.setMoveTarget(world.x, world.y)
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'g' || e.key === 'G') {
      this.view?.toggleGrid()
    }
  }

  unmount(): void {
    if (this.view && this.tickerBound) {
      this.view.app.ticker.remove(this.onTick)
    }
    if (this.canvasEl && this.clickHandler) {
      this.canvasEl.removeEventListener('pointerdown', this.clickHandler)
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler)
    }
    this.view?.destroy()
    this.view = null
    this.canvasEl = null
    this.tickerBound = false
    this.clickHandler = null
    this.keyHandler = null
  }

  get el(): HTMLCanvasElement | null {
    return this.canvasEl
  }
}
