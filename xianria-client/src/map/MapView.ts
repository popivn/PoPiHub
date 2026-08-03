import { Application, Container, Sprite, Texture, Rectangle, Graphics } from 'pixi.js'
import type { MeowaMapData } from './types'

export interface MapViewOptions {
  container: HTMLElement
  mapData: MeowaMapData
  tilesetTexture: Texture
  characterTexture?: Texture
}

export class MapView {
  app: Application
  world: Container
  tileLayer: Container
  characterLayer: Container
  character: Sprite | null = null
  private mapData: MeowaMapData
  private tilesetTexture: Texture
  private tileSize: number
  private mapWidthPx: number
  private mapHeightPx: number
  private tileTextures: Map<string, Texture> = new Map()
  private moveTarget: { x: number; y: number } | null = null
  private moveSpeed = 3
  private gridOverlay: Graphics | null = null
  private showGrid = false

  constructor(opts: MapViewOptions) {
    this.mapData = opts.mapData
    this.tilesetTexture = opts.tilesetTexture
    this.tileSize = opts.mapData.map.tileSize
    this.mapWidthPx = opts.mapData.map.widthTiles * this.tileSize
    this.mapHeightPx = opts.mapData.map.heightTiles * this.tileSize

    this.app = new Application()
    this.world = new Container()
    this.tileLayer = new Container()
    this.characterLayer = new Container()
  }

  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.app.renderer ? undefined : undefined,
      width: this.mapWidthPx,
      height: this.mapHeightPx,
      backgroundColor: 0x909090,
      antialias: false,
    })

    // Setup camera (world container)
    this.world.addChild(this.tileLayer)
    this.world.addChild(this.characterLayer)

    // Build tile textures from atlas
    this.buildTileTextures()

    // Render tiles
    this.renderTiles()

    // Add character if texture provided
    if (this.characterTexture) {
      this.character = new Sprite(this.characterTexture)
      this.character.anchor.set(0.5, 0.8)
      const startTile = this.findFirstWalkableTile()
      if (startTile) {
        this.character.x = startTile.x * this.tileSize + this.tileSize / 2
        this.character.y = startTile.y * this.tileSize + this.tileSize / 2
      } else {
        this.character.x = this.mapWidthPx / 2
        this.character.y = this.mapHeightPx / 2
      }
      this.characterLayer.addChild(this.character)
    }

    // Grid overlay (toggle with G key)
    this.gridOverlay = new Graphics()
    this.drawGridOverlay()
    this.gridOverlay.visible = false
    this.world.addChild(this.gridOverlay)
  }

  private characterTexture?: Texture

  private buildTileTextures(): void {
    const ts = this.tilesetTexture
    const tsWidth = ts.width
    const tsHeight = ts.height
    const cols = Math.floor(tsWidth / this.tileSize)
    const rows = Math.floor(tsHeight / this.tileSize)

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

  private renderTiles(): void {
    const { grid, widthTiles } = this.mapData.map

    for (let i = 0; i < grid.length; i++) {
      const tile = grid[i]
      if (!tile) continue

      const tx = i % widthTiles
      const ty = Math.floor(i / widthTiles)
      const key = `${tile.atlasX},${tile.atlasY}`
      const tex = this.tileTextures.get(key)
      if (!tex) continue

      const sprite = new Sprite(tex)
      sprite.x = tx * this.tileSize
      sprite.y = ty * this.tileSize
      this.tileLayer.addChild(sprite)
    }
  }

  private findFirstWalkableTile(): { x: number; y: number } | null {
    const { grid, widthTiles } = this.mapData.map
    for (let i = 0; i < grid.length; i++) {
      if (grid[i]) {
        return {
          x: i % widthTiles,
          y: Math.floor(i / widthTiles),
        }
      }
    }
    return null
  }

  private drawGridOverlay(): void {
    if (!this.gridOverlay) return
    this.gridOverlay.clear()
    this.gridOverlay.setStrokeStyle({ width: 1, color: 0x000000, alpha: 0.3 })
    for (let x = 0; x <= this.mapData.map.widthTiles; x++) {
      this.gridOverlay.moveTo(x * this.tileSize, 0)
      this.gridOverlay.lineTo(x * this.tileSize, this.mapHeightPx)
    }
    for (let y = 0; y <= this.mapData.map.heightTiles; y++) {
      this.gridOverlay.moveTo(0, y * this.tileSize)
      this.gridOverlay.lineTo(this.mapWidthPx, y * this.tileSize)
    }
    this.gridOverlay.stroke()
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid
    if (this.gridOverlay) this.gridOverlay.visible = this.showGrid
  }

  setMoveTarget(worldX: number, worldY: number): void {
    this.moveTarget = { x: worldX, y: worldY }
  }

  update(): void {
    if (!this.character || !this.moveTarget) return

    const dx = this.moveTarget.x - this.character.x
    const dy = this.moveTarget.y - this.character.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < this.moveSpeed) {
      this.character.x = this.moveTarget.x
      this.character.y = this.moveTarget.y
      this.moveTarget = null
      return
    }

    const vx = (dx / dist) * this.moveSpeed
    const vy = (dy / dist) * this.moveSpeed
    this.character.x += vx
    this.character.y += vy

    // Flip sprite based on direction
    if (Math.abs(dx) > 1) {
      this.character.scale.x = dx > 0 ? 1 : -1
    }
  }

  centerCameraOnCharacter(): void {
    if (!this.character) return
    const viewWidth = this.app.screen.width
    const viewHeight = this.app.screen.height

    let camX = this.character.x - viewWidth / 2
    let camY = this.character.y - viewHeight / 2

    // Clamp camera to map bounds
    const maxX = Math.max(0, this.mapWidthPx - viewWidth)
    const maxY = Math.max(0, this.mapHeightPx - viewHeight)
    camX = Math.max(0, Math.min(camX, maxX))
    camY = Math.max(0, Math.min(camY, maxY))

    // If map smaller than view, center it
    if (this.mapWidthPx < viewWidth) {
      camX = (this.mapWidthPx - viewWidth) / 2
    }
    if (this.mapHeightPx < viewHeight) {
      camY = (this.mapHeightPx - viewHeight) / 2
    }

    this.world.x = -camX
    this.world.y = -camY
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX - this.world.x,
      y: screenY - this.world.y,
    }
  }

  destroy(): void {
    this.tileTextures.forEach((t) => t.destroy(true))
    this.tileTextures.clear()
    this.app.destroy(true)
  }
}
