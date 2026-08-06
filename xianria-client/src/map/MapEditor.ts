import { Application, Container, Sprite, Texture, Rectangle, Graphics } from 'pixi.js'
import { Assets } from 'pixi.js'
import { OceanBackground } from './OceanBackground'
import { FogOfWar } from './FogOfWar'
import {
  type RegularGrid,
  createGrid,
  paintCell,
  computeDualGrid,
  MASK_TO_ATLAS,
} from './autoTile'

export interface MapEditorOptions {
  container: HTMLElement
  width: number
  height: number
  tilesetSize: number
  tilesetUrl: string
  tilesetId: string
  mapId?: string
  onTileClick?: (tx: number, ty: number) => void
  showFogOfWar?: boolean
  onCameraMove?: () => void
  waterTextureUrl?: string
  useIndividualTiles?: boolean
}

interface DualTileSprite {
  sprite: Sprite
  dx: number
  dy: number
}

export class MapEditor {
  app: Application
  world: Container
  ocean: OceanBackground | null = null
  fog: FogOfWar | null = null
  tileLayer: Container
  gridOverlay: Graphics
  hoverHighlight: Graphics
  private container: HTMLElement
  private width: number
  private height: number
  private tileSize: number
  private tilesetUrl: string
  private tilesetId: string
  private mapId: string
  private onTileClick?: (tx: number, ty: number) => void
  private onCameraMove?: () => void
  private showFogOfWar = true
  private tilesetTexture: Texture | null = null
  private tileTextures: Map<string, Texture> = new Map()
  private waterTextureUrl?: string
  private useIndividualTiles = false
  private grid: RegularGrid
  private dualSprites: DualTileSprite[] = []
  private isPainting = false
  private isErasing = false
  private showGrid = true
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private cameraStartX = 0
  private cameraStartY = 0
  private _panMode = false

  get panMode(): boolean {
    return this._panMode
  }

  set panMode(val: boolean) {
    this._panMode = val
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = val ? 'grab' : 'default'
    }
    if (val) {
      this.hoverHighlight.visible = false
    }
  }

  private _readOnly = false

  get readOnly(): boolean {
    return this._readOnly
  }

  set readOnly(val: boolean) {
    this._readOnly = val
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = val ? 'grab' : 'default'
    }
    if (val) {
      this.hoverHighlight.visible = false
    }
  }

  public activeTool: 'land' | 'water' = 'land'

  constructor(opts: MapEditorOptions) {
    this.container = opts.container
    this.width = opts.width
    this.height = opts.height
    this.tileSize = opts.tilesetSize
    this.tilesetUrl = opts.tilesetUrl
    this.tilesetId = opts.tilesetId
    this.mapId = opts.mapId ?? 'untitled'
    this.onTileClick = opts.onTileClick
    this.onCameraMove = opts.onCameraMove
    this.showFogOfWar = opts.showFogOfWar ?? true
    this.waterTextureUrl = opts.waterTextureUrl
    this.useIndividualTiles = opts.useIndividualTiles ?? false

    this.app = new Application()
    this.world = new Container()
    this.tileLayer = new Container()
    this.gridOverlay = new Graphics()
    this.hoverHighlight = new Graphics()
    this.grid = createGrid(this.width, this.height)
  }

  async init(): Promise<void> {
    await this.app.init({
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      backgroundColor: 0x9ee2ff,
      antialias: false,
      resizeTo: this.container,
    })

    // Load tileset
    if (this.useIndividualTiles) {
      await this.loadIndividualTextures()
    } else {
      this.tilesetTexture = await Assets.load(this.tilesetUrl)
      this.buildTileTextures()
    }

    // Setup world water texture
    let waterTexture = this.tileTextures.get('0,3')
    if (this.waterTextureUrl) {
      try {
        waterTexture = await Assets.load(this.waterTextureUrl)
      } catch (err) {
        console.error('Failed to load water texture:', err)
      }
    }

    this.ocean = new OceanBackground({
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      waterTexture,
      baseColor: 0x56b7ea,
    })
    this.ocean.init()
    this.world.addChild(this.ocean.view)
    this.world.addChild(this.tileLayer)

    // Fog of war — sương mù bao quanh đảo, trên tile layer nhưng dưới grid overlay
    this.fog = new FogOfWar({
      app: this.app,
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
    })
    if (this.showFogOfWar) {
      this.world.addChild(this.fog.view)
    }

    this.world.addChild(this.gridOverlay)
    this.world.addChild(this.hoverHighlight)
    this.app.stage.addChild(this.world)
    this.drawGridOverlay()
    this.hoverHighlight.visible = false

    // Create dual-grid sprites (width+1) x (height+1)
    this.createDualSprites()

    // Canvas setup
    const canvas = this.app.canvas
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.touchAction = 'none'
    this.container.appendChild(canvas)

    // Event listeners
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e))
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e))
    canvas.addEventListener('pointerup', () => this.onPointerUp())
    canvas.addEventListener('pointerleave', () => { this.onPointerUp(); this.hoverHighlight.visible = false })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    // Fog animation ticker
    if (this.showFogOfWar) {
      this.app.ticker.add((ticker) => {
        this.fog?.update(ticker.deltaMS)
      })
    }

    // Center camera after canvas is in DOM
    requestAnimationFrame(() => {
      this.centerCamera()
    })
  }

  private buildTileTextures(): void {
    if (!this.tilesetTexture) return
    const ts = this.tilesetTexture
    const cols = Math.floor(ts.width / this.tileSize)
    const rows = Math.floor(ts.height / this.tileSize)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const frame = new Rectangle(
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize,
        )
        const tex = new Texture({ source: ts.source, frame })
        this.tileTextures.set(`${x},${y}`, tex)
      }
    }
  }

  private async loadIndividualTextures(): Promise<void> {
    const promises: Promise<void>[] = []
    
    // We map each mask to its atlas coords
    for (const [maskStr, coords] of Object.entries(MASK_TO_ATLAS)) {
      const mask = parseInt(maskStr)
      if (mask === 0) continue // Empty is transparent
      
      const [atlasX, atlasY] = coords
      let fileUrl = ''
      if (mask === 15) {
        fileUrl = `/inside_island2/assets/tiles/${this.tilesetId}-2-1.png`
      } else {
        // Skip diagonal masks if they don't exist on disk
        if (mask === 6 || mask === 9) continue
        fileUrl = `/inside_island2/assets/tiles/${this.tilesetId}-${atlasX}-${atlasY}-mask-${mask}.png`
      }
      
      const loadPromise = (async () => {
        try {
          const tex = await Assets.load(fileUrl)
          this.tileTextures.set(`${atlasX},${atlasY}`, tex)
        } catch (err) {
          console.warn(`Failed to load individual tile texture: ${fileUrl}`, err)
        }
      })()
      promises.push(loadPromise)
    }
    
    await Promise.all(promises)
  }

  private createDualSprites(): void {
    const dualWidth = this.width + 1
    const dualHeight = this.height + 1

    for (let dy = 0; dy < dualHeight; dy++) {
      for (let dx = 0; dx < dualWidth; dx++) {
        const sprite = new Sprite(Texture.EMPTY)
        sprite.x = (dx - 0.5) * this.tileSize
        sprite.y = (dy - 0.5) * this.tileSize
        sprite.visible = false
        this.tileLayer.addChild(sprite)
        this.dualSprites.push({ sprite, dx, dy })
      }
    }
  }

  private drawGridOverlay(): void {
    this.gridOverlay.clear()
    this.gridOverlay.setStrokeStyle({ width: 1, color: 0xeafbff, alpha: 0.4 })

    for (let x = 0; x <= this.width; x++) {
      this.gridOverlay.moveTo(x * this.tileSize, 0)
      this.gridOverlay.lineTo(x * this.tileSize, this.height * this.tileSize)
    }
    for (let y = 0; y <= this.height; y++) {
      this.gridOverlay.moveTo(0, y * this.tileSize)
      this.gridOverlay.lineTo(this.width * this.tileSize, y * this.tileSize)
    }
    this.gridOverlay.stroke()
    this.gridOverlay.visible = this.showGrid
  }

  private getDualSprite(dx: number, dy: number): DualTileSprite | undefined {
    return this.dualSprites.find((d) => d.dx === dx && d.dy === dy)
  }

  private updateDualCell(dx: number, dy: number, atlasX: number, atlasY: number, filled: boolean): void {
    const ds = this.getDualSprite(dx, dy)
    if (!ds) return
    const tex = this.tileTextures.get(`${atlasX},${atlasY}`)
    if (tex) {
      ds.sprite.texture = tex
      ds.sprite.visible = filled
    } else {
      ds.sprite.visible = false
    }
  }

  private screenToTile(e: PointerEvent): { tx: number; ty: number } {
    const canvas = this.app.canvas
    const rect = canvas.getBoundingClientRect()
    // Canvas is sized to container, so scale = canvas.width / rect.width
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY
    // Convert screen to world coords (subtract world position)
    const worldX = screenX - this.world.x
    const worldY = screenY - this.world.y
    return {
      tx: Math.floor(worldX / this.tileSize),
      ty: Math.floor(worldY / this.tileSize),
    }
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.shiftKey || this._panMode || this._readOnly) {
      // Shift+drag or panMode or readOnly = pan camera
      this.isDragging = true
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.cameraStartX = this.world.x
      this.cameraStartY = this.world.y
      if (this.app && this.app.canvas) {
        this.app.canvas.style.cursor = 'grabbing'
      }
      return
    }

    const { tx, ty } = this.screenToTile(e)
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return

    if (e.button === 0) {
      // Left click = paint or trigger external click handler (single click)
      if (this.onTileClick) {
        this.onTileClick(tx, ty)
      } else {
        const isWaterTool = this.activeTool === 'water'
        const tilesetIsWater = this.tilesetId === 'water'
        const shouldPaint = (isWaterTool && tilesetIsWater) || (!isWaterTool && !tilesetIsWater)

        if (shouldPaint) {
          this.isPainting = true
          this.paintAt(tx, ty)
        } else {
          this.isErasing = true
          this.eraseAt(tx, ty)
        }
      }
    } else if (e.button === 2) {
      // Right click = erase
      this.isErasing = true
      this.eraseAt(tx, ty)
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.isDragging) {
      if ((e.buttons & 1) === 0 && (e.buttons & 2) === 0) {
        this.onPointerUp()
      } else {
        const dx = e.clientX - this.dragStartX
        const dy = e.clientY - this.dragStartY
        this.world.x = this.cameraStartX + dx
        this.world.y = this.cameraStartY + dy
        this.clampCamera()
        if (this.onCameraMove) {
          this.onCameraMove()
        }
        return
      }
    }

    if (this._panMode || this._readOnly) {
      this.hoverHighlight.visible = false
      return
    }

    const { tx, ty } = this.screenToTile(e)

    // Update hover highlight
    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.hoverHighlight.clear()
      this.hoverHighlight.rect(tx * this.tileSize, ty * this.tileSize, this.tileSize, this.tileSize)
      this.hoverHighlight.fill({ color: 0xe8c860, alpha: 0.2 })
      this.hoverHighlight.setStrokeStyle({ width: 2, color: 0xe8c860, alpha: 0.8 })
      this.hoverHighlight.stroke()
      this.hoverHighlight.visible = true
    } else {
      this.hoverHighlight.visible = false
    }

    if (this.isPainting && (e.buttons & 1) === 0) {
      // Left button no longer pressed, stop painting
      this.isPainting = false
    }
    if (this.isErasing && (e.buttons & 2) === 0) {
      // Right button no longer pressed, stop erasing
      this.isErasing = false
    }

    if (this.isPainting) {
      if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
        this.paintAt(tx, ty)
      }
    } else if (this.isErasing) {
      if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
        this.eraseAt(tx, ty)
      }
    }
  }

  private onPointerUp(): void {
    this.isPainting = false
    this.isErasing = false
    this.isDragging = false
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = (this._panMode || this._readOnly) ? 'grab' : 'default'
    }
  }

  paintAt(tx: number, ty: number): void {
    const updates = paintCell(this.grid, tx, ty, this.tilesetId)
    for (const { dx, dy, cell } of updates) {
      this.updateDualCell(dx, dy, cell.atlasX, cell.atlasY, cell.filled)
    }
    this.fog?.reveal(tx, ty)
  }

  private eraseAt(tx: number, ty: number): void {
    const updates = paintCell(this.grid, tx, ty, null)
    for (const { dx, dy, cell } of updates) {
      this.updateDualCell(dx, dy, cell.atlasX, cell.atlasY, cell.filled)
    }
    this.fog?.hide(tx, ty)
  }

  private clampCamera(): void {
    const viewWidth = this.app.screen.width
    const viewHeight = this.app.screen.height
    const mapWidthPx = this.width * this.tileSize
    const mapHeightPx = this.height * this.tileSize

    if (mapWidthPx <= viewWidth) {
      this.world.x = (viewWidth - mapWidthPx) / 2
    } else {
      this.world.x = Math.max(viewWidth - mapWidthPx, Math.min(0, this.world.x))
    }

    if (mapHeightPx <= viewHeight) {
      this.world.y = (viewHeight - mapHeightPx) / 2
    } else {
      this.world.y = Math.max(viewHeight - mapHeightPx, Math.min(0, this.world.y))
    }
  }

  private centerCamera(): void {
    const viewWidth = this.app.screen.width
    const viewHeight = this.app.screen.height
    const mapWidthPx = this.width * this.tileSize
    const mapHeightPx = this.height * this.tileSize
    // Center the map in the viewport
    this.world.x = (viewWidth - mapWidthPx) / 2
    this.world.y = (viewHeight - mapHeightPx) / 2
    this.clampCamera()
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid
    this.gridOverlay.visible = this.showGrid
  }

  setGridVisible(visible: boolean): void {
    this.showGrid = visible
    this.gridOverlay.visible = visible
  }

  clearMap(): void {
    this.grid = createGrid(this.width, this.height)
    for (const ds of this.dualSprites) {
      ds.sprite.visible = false
    }
    this.fog?.clearRevealed()
  }

  /**
   * Load map data from API or provided data.
   */
  loadFromData(data: {
    grid?: Array<{ tilesetId: string; atlasX: number; atlasY: number; mode: string } | null>
    map?: {
      grid?: Array<{ tilesetId: string; atlasX: number; atlasY: number; mode: string } | null>
    }
    canvasElement?: { width: number; height: number }
  }): void {
    const gridArray = data.grid || data.map?.grid
    if (!gridArray) return
    this.clearMap()

    const totalCells = gridArray.length
    let originalWidth = this.width
    let originalHeight = this.height

    if (data.canvasElement?.width) {
      originalWidth = Math.round(data.canvasElement.width / this.tileSize)
    } else {
      const side = Math.round(Math.sqrt(totalCells))
      if (side * side === totalCells) {
        originalWidth = side - 1
      }
    }

    if (data.canvasElement?.height) {
      originalHeight = Math.round(data.canvasElement.height / this.tileSize)
    } else {
      const side = Math.round(Math.sqrt(totalCells))
      if (side * side === totalCells) {
        originalHeight = side - 1
      }
    }

    const originalDualWidth = originalWidth + 1
    const offsetX = Math.max(0, Math.floor((this.width - originalWidth) / 2))
    const offsetY = Math.max(0, Math.floor((this.height - originalHeight) / 2))

    // Reconstruct regular grid cells and paint them at the offset position
    for (let ty = 0; ty < originalHeight; ty++) {
      for (let tx = 0; tx < originalWidth; tx++) {
        const corners = [
          ty * originalDualWidth + tx,
          ty * originalDualWidth + tx + 1,
          (ty + 1) * originalDualWidth + tx,
          (ty + 1) * originalDualWidth + tx + 1,
        ]
        const anyFilled = corners.some((idx) => gridArray[idx] != null)
        if (anyFilled) {
          const targetX = tx + offsetX
          const targetY = ty + offsetY
          if (targetX >= 0 && targetX < this.width && targetY >= 0 && targetY < this.height) {
            paintCell(this.grid, targetX, targetY, this.tilesetId)
          }
        }
      }
    }

    // Now render all dual cells for the current grid
    const dualWidth = this.width + 1
    const dual = computeDualGrid(this.grid)
    for (let i = 0; i < dual.length; i++) {
      const dx = i % dualWidth
      const dy = Math.floor(i / dualWidth)
      this.updateDualCell(dx, dy, dual[i].atlasX, dual[i].atlasY, dual[i].filled)
    }

    // Reveal fog for painted tiles if present
    const revealedCells: Array<{ x: number; y: number }> = []
    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        if (this.grid.cells[ty * this.width + tx]) {
          revealedCells.push({ x: tx, y: ty })
        }
      }
    }
    this.fog?.revealAll(revealedCells)
  }

  /**
   * Export current map as meowa-map.json format.
   */
  exportMap(): Record<string, unknown> {
    const dual = computeDualGrid(this.grid)

    const exportedGrid = dual.map((cell) => {
      if (!cell.filled) return null
      return {
        tilesetId: this.tilesetId,
        atlasX: cell.atlasX,
        atlasY: cell.atlasY,
        mode: 'auto',
      }
    })

    return {
      format: 'meowa-map',
      version: 1,
      exportedAt: new Date().toISOString(),
      canvasElement: {
        id: `${Date.now()}-editor`,
        name: 'Map Editor',
        width: this.width * this.tileSize,
        height: this.height * this.tileSize,
        naturalWidth: this.width * this.tileSize,
        naturalHeight: this.height * this.tileSize,
        sourceKind: 'map-editor',
      },
      map: {
        version: 1,
        mapType: 'topdown',
        widthTiles: this.width,
        heightTiles: this.height,
        tileSize: this.tileSize,
        tilesets: [
          {
            id: this.tilesetId,
            name: this.tilesetId,
            type: 'dual-grid-15',
            url: this.tilesetUrl,
            mimeType: 'image/png',
          },
        ],
        layers: [
          {
            id: 'map-background-layer',
            kind: 'background',
            name: 'background layer',
            isLocked: true,
            backgroundColor: 'rgb(144, 144, 144)',
            grid: new Array(this.width * this.height).fill(null),
            objectPlacements: [],
            objectGrid: new Array(this.width * this.height).fill(null),
          },
        ],
        grid: exportedGrid,
        objects: [],
        walls: [],
      },
    }
  }

  /**
   * Save map to server via API.
   */
  async save(): Promise<{ ok: boolean; id: string }> {
    const data = this.exportMap()
    const res = await fetch(`/api/maps/${this.mapId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(`Save failed: ${res.status}`)
    return res.json()
  }

  /**
   * Load map from server via API.
   */
  async load(mapId: string): Promise<void> {
    this.mapId = mapId
    const res = await fetch(`/api/maps/${mapId}`)
    if (!res.ok) throw new Error(`Load failed: ${res.status}`)
    const data = await res.json()
    if (data.map?.grid) {
      // Clear current state
      this.clearMap()
      // Rebuild regular grid from dual grid data
      const dualWidth = this.width + 1
      const dualGrid = data.map.grid
      // Reconstruct regular grid: a cell is filled if any of its 4 dual corners is filled
      for (let ty = 0; ty < this.height; ty++) {
        for (let tx = 0; tx < this.width; tx++) {
          const corners = [
            ty * dualWidth + tx,           // TL corner
            ty * dualWidth + tx + 1,       // TR corner
            (ty + 1) * dualWidth + tx,     // BL corner
            (ty + 1) * dualWidth + tx + 1, // BR corner
          ]
          const anyFilled = corners.some((idx) => dualGrid[idx] != null)
          if (anyFilled) {
            paintCell(this.grid, tx, ty, this.tilesetId)
          }
        }
      }
      // Now render all dual cells
      const dual = computeDualGrid(this.grid)
      for (let i = 0; i < dual.length; i++) {
        const dx = i % dualWidth
        const dy = Math.floor(i / dualWidth)
        this.updateDualCell(dx, dy, dual[i].atlasX, dual[i].atlasY, dual[i].filled)
      }
      // Reveal fog around all painted tiles
      const revealedCells: Array<{ x: number; y: number }> = []
      for (let ty = 0; ty < this.height; ty++) {
        for (let tx = 0; tx < this.width; tx++) {
          if (this.grid.cells[ty * this.width + tx]) {
            revealedCells.push({ x: tx, y: ty })
          }
        }
      }
      this.fog?.revealAll(revealedCells)
    }
  }

  destroy(): void {
    this.fog?.destroy()
    this.ocean?.destroy()
    this.tileTextures.forEach((t) => t.destroy(true))
    this.tileTextures.clear()
    this.app.destroy(true)
  }
}
