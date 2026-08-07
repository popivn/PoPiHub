import { Application, Container, Sprite, Texture, Rectangle, Graphics } from 'pixi.js'
import { Assets } from 'pixi.js'
import { OceanBackground } from './OceanBackground'
import { FogOfWar } from './FogOfWar'
import { RiaController } from '../character/RiaController'
import { BeeController } from '../monster/BeeController'
import { WanderingController } from '../action/WanderingController'
import { findShortestPath } from '../utils/gridPathfinder'
import {
  type RegularGrid,
  type DualGridCell,
  createGrid,
  paintCell,
  computeDualGrid,
  MASK_TO_ATLAS,
} from './insideIslandAutoTile'

export interface InsideIslandMapEditorOptions {
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
  useIndividualTiles?: boolean
}

export interface SummonedCharacter {
  id: string
  name: string
  textureUrl: string
  tx: number
  ty: number
  container: Container
  sprite: Sprite
  shadow: Graphics
}

interface DualTileSprite {
  waterSprite: Sprite
  grassSprite: Sprite
  darkGrassSprite: Sprite
  dx: number
  dy: number
}

function makeNonWaterTransparent(sourceTex: Texture): Texture {
  const sourceEl = sourceTex.source?.resource as any
  if (!sourceEl || typeof document === 'undefined') return sourceTex

  try {
    const canvas = document.createElement('canvas')
    const width = sourceTex.width || sourceEl.width || 256
    const height = sourceTex.height || sourceEl.height || 256
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return sourceTex

    ctx.drawImage(sourceEl, 0, 0)
    const imgData = ctx.getImageData(0, 0, width, height)
    const data = imgData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      if (a > 0) {
        // Water pixels in water.png have blue dominance (b > r + 10 && b > g - 20) or light cyan
        const isWater = (b > r + 10 && b > g - 20) || (g > 170 && b > 190)
        if (!isWater) {
          data[i + 3] = 0 // Clear non-water pixels (grey dirt/rocks)
        }
      }
    }

    ctx.putImageData(imgData, 0, 0)
    return Texture.from(canvas)
  } catch (err) {
    console.warn('Failed to clean water texture transparent pixels:', err)
    return sourceTex
  }
}

export class InsideIslandMapEditor {
  app: Application
  world: Container
  ocean: OceanBackground | null = null
  fog: FogOfWar | null = null
  tileLayer: Container
  characterLayer: Container
  gridOverlay: Graphics
  hoverHighlight: Graphics
  characters: SummonedCharacter[] = []
  riaControllers: RiaController[] = []
  beeControllers: BeeController[] = []
  wanderingControllers: Map<RiaController | BeeController, WanderingController> = new Map()
  private beeSpawnTimer: number = 0
  private beeSpawnInterval: number = 5000 // 5 seconds
  private maxBeeCount: number = 15
  private container: HTMLElement
  private width: number
  private height: number
  private tileSize: number
  private mapId: string
  private onTileClick?: (tx: number, ty: number) => void
  private onCameraMove?: () => void
  private showFogOfWar = true
  private tileTextures: Map<string, Texture> = new Map()
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
    if (val) {
      this.isPainting = false
      this.isErasing = false
      this.hoverHighlight.visible = false
    }
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = val ? 'grab' : 'default'
    }
  }

  private _readOnly = false

  get readOnly(): boolean {
    return this._readOnly
  }

  set readOnly(val: boolean) {
    this._readOnly = val
    if (val) {
      this.isPainting = false
      this.isErasing = false
      this.hoverHighlight.visible = false
    }
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = val ? 'grab' : 'default'
    }
  }

  public activeTool: 'grass' | 'dark-grass' | 'water' = 'grass'

  constructor(opts: InsideIslandMapEditorOptions) {
    this.container = opts.container
    this.width = opts.width
    this.height = opts.height
    this.tileSize = opts.tilesetSize
    this.mapId = opts.mapId ?? 'untitled'
    this.onTileClick = opts.onTileClick
    this.onCameraMove = opts.onCameraMove
    this.showFogOfWar = opts.showFogOfWar ?? true
    this.useIndividualTiles = opts.useIndividualTiles ?? false

    this.app = new Application()
    this.world = new Container()
    this.tileLayer = new Container()
    this.characterLayer = new Container()
    this.gridOverlay = new Graphics()
    this.hoverHighlight = new Graphics()
    this.grid = createGrid(this.width, this.height)
  }

  async init(): Promise<void> {
    await this.app.init({
      width: this.container.clientWidth,
      height: this.container.clientHeight,
      backgroundColor: 0x909090, // Dark grey background to match map layer
      antialias: false,
      resizeTo: this.container,
    })

    // Load tileset
    if (this.useIndividualTiles) {
      await this.loadIndividualTextures()
    } else {
      await this.loadAtlasTextures()
    }

    // Initialize dark grey ocean background
    this.ocean = new OceanBackground({
      width: this.width,
      height: this.height,
      tileSize: this.tileSize,
      waterTexture: undefined,
      baseColor: 0x909090, // rgb(144,144,144) dark grey
    })
    this.ocean.init()
    this.world.addChild(this.ocean.view)
    this.world.addChild(this.tileLayer)
    this.world.addChild(this.characterLayer)

    // Fog of war
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
    canvas.style.cursor = (this._panMode || this._readOnly) ? 'grab' : 'default'
    this.container.appendChild(canvas)

    // Event listeners
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e))
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e))
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e))
    canvas.addEventListener('pointerleave', (e) => { this.onPointerUp(e); this.hoverHighlight.visible = false })
    canvas.addEventListener('contextmenu', (e) => e.preventDefault())

    // Animation & Bee Spawner ticker loop
    this.app.ticker.add((ticker) => {
      if (this.showFogOfWar) {
        this.fog?.update(ticker.deltaMS)
      }

      // Every 5 seconds, spawn 1 Bee monster
      this.beeSpawnTimer += ticker.deltaMS
      if (this.beeSpawnTimer >= this.beeSpawnInterval) {
        this.beeSpawnTimer -= this.beeSpawnInterval
        if (this.beeControllers.length < this.maxBeeCount) {
          this.spawnBee()
        }
      }

      for (const ria of this.riaControllers) {
        ria.update(ticker.deltaMS)
        const wander = this.wanderingControllers.get(ria)
        if (wander) wander.update(ticker.deltaMS)
      }

      // Clean up dead bees
      this.beeControllers = this.beeControllers.filter((b) => !b.isDead)

      for (const bee of this.beeControllers) {
        bee.update(ticker.deltaMS)
        const wander = this.wanderingControllers.get(bee)
        if (wander) wander.update(ticker.deltaMS)
      }
    })

    // Center camera after canvas is in DOM
    requestAnimationFrame(() => {
      this.centerCamera()
    })
  }

  private async loadIndividualTextures(): Promise<void> {
    const promises: Promise<void>[] = []
    
    // Load atlas textures to crop diagonal tiles (6 and 9)
    let grassAtlas: Texture | null = null
    let darkGrassAtlas: Texture | null = null
    let waterAtlas: Texture | null = null
    try {
      grassAtlas = await Assets.load('/inside_island2/assets/tilesets/grass.png')
    } catch (err) {
      console.error('Failed to load grass atlas:', err)
    }
    try {
      darkGrassAtlas = await Assets.load('/inside_island2/assets/tilesets/texture-job_e510e767f70e488b9a4ed95f6caaf33c.png')
    } catch (err) {
      console.error('Failed to load dark grass atlas:', err)
    }
    try {
      const rawWaterAtlas = await Assets.load('/inside_island2/assets/tilesets/water.png')
      waterAtlas = makeNonWaterTransparent(rawWaterAtlas)
    } catch (err) {
      console.error('Failed to load water atlas:', err)
    }

    // We map each mask to its atlas coords
    for (const [maskStr, coords] of Object.entries(MASK_TO_ATLAS)) {
      const mask = parseInt(maskStr)
      if (mask === 0) continue // Empty is transparent
      
      const [atlasX, atlasY] = coords
      
      // Load Grass tile
      const loadGrass = (async () => {
        if (mask === 15) {
          const fileUrl = `/inside_island2/assets/tiles/grass-2-1.png`
          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`grass:${atlasX},${atlasY}`, tex)
          } catch (err) {
            if (grassAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: grassAtlas.source, frame })
              this.tileTextures.set(`grass:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load grass texture: ${fileUrl}`, err)
            }
          }
        } else {
          const fileUrl = `/inside_island2/assets/tiles/grass-${atlasX}-${atlasY}-mask-${mask}.png`
          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`grass:${atlasX},${atlasY}`, tex)
          } catch (err) {
            if (grassAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: grassAtlas.source, frame })
              this.tileTextures.set(`grass:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load grass texture: ${fileUrl}`, err)
            }
          }
        }
      })()
      promises.push(loadGrass)

      // Load Dark Grass tile
      const loadDarkGrass = (async () => {
        if (mask === 15) {
          const fileUrl = `/inside_island2/assets/tiles/2-1.png`
          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`dark-grass:${atlasX},${atlasY}`, tex)
          } catch (err) {
            if (darkGrassAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: darkGrassAtlas.source, frame })
              this.tileTextures.set(`dark-grass:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load dark grass texture: ${fileUrl}`, err)
            }
          }
        } else {
          const fileUrl = `/inside_island2/assets/tiles/${atlasX}-${atlasY}-mask-${mask}.png`
          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`dark-grass:${atlasX},${atlasY}`, tex)
          } catch (err) {
            if (darkGrassAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: darkGrassAtlas.source, frame })
              this.tileTextures.set(`dark-grass:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load dark grass texture: ${fileUrl}`, err)
            }
          }
        }
      })()
      promises.push(loadDarkGrass)

      // Load Water tile
      const loadWater = (async () => {
        if (mask === 15) {
          const fileUrl = `/inside_island2/assets/tiles/water-2-1.png`
          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`water:${atlasX},${atlasY}`, makeNonWaterTransparent(tex))
          } catch (err) {
            if (waterAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: waterAtlas.source, frame })
              this.tileTextures.set(`water:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load water texture: ${fileUrl}`, err)
            }
          }
        } else {
          const fileUrl = `/inside_island2/assets/tiles/water-${atlasX}-${atlasY}-mask-${mask}.png`

          try {
            const tex = await Assets.load(fileUrl)
            this.tileTextures.set(`water:${atlasX},${atlasY}`, makeNonWaterTransparent(tex))
          } catch (err) {
            if (waterAtlas) {
              const frame = new Rectangle(atlasX * this.tileSize, atlasY * this.tileSize, this.tileSize, this.tileSize)
              const tex = new Texture({ source: waterAtlas.source, frame })
              this.tileTextures.set(`water:${atlasX},${atlasY}`, tex)
            } else {
              console.warn(`Failed to load water texture: ${fileUrl}`, err)
            }
          }
        }
      })()
      promises.push(loadWater)
    }
    
    await Promise.all(promises)
  }

  private async loadAtlasTextures(): Promise<void> {
    try {
      const grassAtlas = await Assets.load('/inside_island2/assets/tilesets/grass.png')
      this.buildTileTexturesFromAtlas('grass', grassAtlas)
    } catch (err) {
      console.error('Failed to load grass atlas:', err)
    }

    try {
      const darkGrassAtlas = await Assets.load('/inside_island2/assets/tilesets/texture-job_e510e767f70e488b9a4ed95f6caaf33c.png')
      this.buildTileTexturesFromAtlas('dark-grass', darkGrassAtlas)
    } catch (err) {
      console.error('Failed to load dark grass atlas:', err)
    }

    try {
      const rawWaterAtlas = await Assets.load('/inside_island2/assets/tilesets/water.png')
      const waterAtlas = makeNonWaterTransparent(rawWaterAtlas)
      this.buildTileTexturesFromAtlas('water', waterAtlas)
    } catch (err) {
      console.error('Failed to load water atlas:', err)
    }
  }

  private buildTileTexturesFromAtlas(id: string, atlas: Texture): void {
    const cols = Math.floor(atlas.width / this.tileSize)
    const rows = Math.floor(atlas.height / this.tileSize)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const frame = new Rectangle(
          x * this.tileSize,
          y * this.tileSize,
          this.tileSize,
          this.tileSize
        )
        const tex = new Texture({ source: atlas.source, frame })
        this.tileTextures.set(`${id}:${x},${y}`, tex)
      }
    }
  }

  private createDualSprites(): void {
    const dualWidth = this.width + 1
    const dualHeight = this.height + 1

    for (let dy = 0; dy < dualHeight; dy++) {
      for (let dx = 0; dx < dualWidth; dx++) {
        // Dark Grass sprite (grey dirt) sits at the bottom layer
        const darkGrassSprite = new Sprite(Texture.EMPTY)
        darkGrassSprite.x = (dx - 0.5) * this.tileSize
        darkGrassSprite.y = (dy - 0.5) * this.tileSize
        darkGrassSprite.visible = false
        this.tileLayer.addChild(darkGrassSprite)

        // Grass sprite sits on top of grey dirt
        const grassSprite = new Sprite(Texture.EMPTY)
        grassSprite.x = (dx - 0.5) * this.tileSize
        grassSprite.y = (dy - 0.5) * this.tileSize
        grassSprite.visible = false
        this.tileLayer.addChild(grassSprite)

        // Water sprite sits on top of grass
        const waterSprite = new Sprite(Texture.EMPTY)
        waterSprite.x = (dx - 0.5) * this.tileSize
        waterSprite.y = (dy - 0.5) * this.tileSize
        waterSprite.visible = false
        this.tileLayer.addChild(waterSprite)

        this.dualSprites.push({ waterSprite, grassSprite, darkGrassSprite, dx, dy })
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

  private updateDualCell(dx: number, dy: number, cell: DualGridCell): void {
    const ds = this.getDualSprite(dx, dy)
    if (!ds) return

    // Update water sprite
    const waterTex = this.tileTextures.get(`water:${cell.waterAtlasX},${cell.waterAtlasY}`)
    if (waterTex) {
      ds.waterSprite.texture = waterTex
      ds.waterSprite.visible = cell.waterFilled
    } else {
      ds.waterSprite.visible = false
    }

    // Update grass sprite
    const grassTex = this.tileTextures.get(`grass:${cell.grassAtlasX},${cell.grassAtlasY}`)
    if (grassTex) {
      ds.grassSprite.texture = grassTex
      ds.grassSprite.visible = cell.grassFilled
    } else {
      ds.grassSprite.visible = false
    }

    // Update dark grass sprite
    const darkGrassTex = this.tileTextures.get(`dark-grass:${cell.darkGrassAtlasX},${cell.darkGrassAtlasY}`)
    if (darkGrassTex) {
      ds.darkGrassSprite.texture = darkGrassTex
      ds.darkGrassSprite.visible = cell.darkGrassFilled
    } else {
      ds.darkGrassSprite.visible = false
    }
  }

  private screenToTile(e: PointerEvent): { tx: number; ty: number } {
    const canvas = this.app.canvas
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const screenX = (e.clientX - rect.left) * scaleX
    const screenY = (e.clientY - rect.top) * scaleY
    const worldX = screenX - this.world.x
    const worldY = screenY - this.world.y
    return {
      tx: Math.floor(worldX / this.tileSize),
      ty: Math.floor(worldY / this.tileSize),
    }
  }

  /**
   * Command active Ria to find shortest grid path and walk to target tile.
   */
  public moveRiaToTile(tx: number, ty: number): void {
    if (this.riaControllers.length === 0) return
    const activeRia = this.riaControllers[this.riaControllers.length - 1]
    const path = findShortestPath(
      this.grid.cells,
      this.width,
      this.height,
      { x: activeRia.tx, y: activeRia.ty },
      { x: tx, y: ty }
    )
    if (path.length > 0) {
      activeRia.setPath(path)
    }
  }

  private pointerDownPos: { x: number; y: number; tx: number; ty: number } | null = null

  private onPointerDown(e: PointerEvent): void {
    const { tx, ty } = this.screenToTile(e)
    this.pointerDownPos = { x: e.clientX, y: e.clientY, tx, ty }

    if (e.shiftKey || this._panMode || this._readOnly) {
      this.isDragging = true
      this.isPainting = false
      this.isErasing = false
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY
      this.cameraStartX = this.world.x
      this.cameraStartY = this.world.y
      if (this.app && this.app.canvas) {
        this.app.canvas.style.cursor = 'grabbing'
      }
      return
    }

    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return

    if (e.button === 0) {
      if (this.onTileClick) {
        this.onTileClick(tx, ty)
      } else {
        this.isPainting = true
        this.paintAt(tx, ty)
      }
    } else if (e.button === 2) {
      this.isErasing = true
      this.eraseAt(tx, ty)
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.isDragging) {
      if ((e.buttons & 1) === 0 && (e.buttons & 2) === 0) {
        this.onPointerUp(e)
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
      this.isPainting = false
    }
    if (this.isErasing && (e.buttons & 2) === 0) {
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

  private onPointerUp(e?: PointerEvent): void {
    if (e && this.pointerDownPos) {
      const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y)
      // If user clicked (did not drag camera), pathfind Ria to clicked tile
      if (dist < 8 && this.pointerDownPos.tx >= 0 && this.pointerDownPos.tx < this.width && this.pointerDownPos.ty >= 0 && this.pointerDownPos.ty < this.height) {
        if (this._readOnly || this._panMode || !this.isPainting) {
          this.moveRiaToTile(this.pointerDownPos.tx, this.pointerDownPos.ty)
        }
      }
    }

    this.isPainting = false
    this.isErasing = false
    this.isDragging = false
    this.pointerDownPos = null
    if (this.app && this.app.canvas) {
      this.app.canvas.style.cursor = (this._panMode || this._readOnly) ? 'grab' : 'default'
    }
  }

  paintAt(tx: number, ty: number): void {
    if (this._readOnly || this._panMode) return

    let tilesetId = 'grass'
    if (this.activeTool === 'dark-grass') {
      tilesetId = 'texture-job_e510e767f70e488b9a4ed95f6caaf33c'
    } else if (this.activeTool === 'water') {
      tilesetId = 'water'
    }
    const updates = paintCell(this.grid, tx, ty, tilesetId)
    for (const { dx, dy, cell } of updates) {
      this.updateDualCell(dx, dy, cell)
    }
    this.fog?.reveal(tx, ty)
    for (const wander of this.wanderingControllers.values()) {
      wander.updateGrid(this.grid.cells, this.width, this.height)
    }
  }

  private eraseAt(tx: number, ty: number): void {
    if (this._readOnly || this._panMode) return

    const updates = paintCell(this.grid, tx, ty, null)
    for (const { dx, dy, cell } of updates) {
      this.updateDualCell(dx, dy, cell)
    }
    this.fog?.hide(tx, ty)
    for (const wander of this.wanderingControllers.values()) {
      wander.updateGrid(this.grid.cells, this.width, this.height)
    }
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

  /**
   * Summon Ria character on the island using RiaController.
   */
  async summonRia(opts?: { tx?: number; ty?: number }): Promise<RiaController | null> {
    const ria = new RiaController(this.tileSize)
    await ria.init()

    let tx = opts?.tx ?? Math.floor(this.width / 2)
    let ty = opts?.ty ?? Math.floor(this.height / 2)

    const offsetIndex = this.riaControllers.length
    if (opts?.tx === undefined && opts?.ty === undefined) {
      tx = Math.min(this.width - 1, Math.max(0, tx + (offsetIndex % 3) - 1))
      ty = Math.min(this.height - 1, Math.max(0, ty + Math.floor(offsetIndex / 3) - 1))
    }

    ria.setGridPosition(tx, ty)
    this.characterLayer.addChild(ria.view)
    ria.triggerSpawnEffect(this.app.ticker)
    this.riaControllers.push(ria)

    const wanderCtrl = new WanderingController({
      character: {
        get tx() { return ria.tx },
        get ty() { return ria.ty },
        get isWalking() { return ria.isWalking },
        get isCastingSkill() { return ria.isCastingSkill },
        get currentDirection() { return ria.currentDirection },
        setPath: (p) => ria.setPath(p),
        playAnimation: (anim, dir, loop) => ria.playAnimation(anim, dir, loop),
        playAttackEffectOnTarget: (target) => ria.playAttackEffectOnTarget(target, this.characterLayer),
        castUlti: (target) => ria.castUlti(target, this.characterLayer),
        takeDamage: (amt) => ria.takeDamage(amt),
        get hp() { return ria.hp },
        get maxHp() { return ria.maxHp },
      },
      gridCells: this.grid.cells,
      width: this.width,
      height: this.height,
      targets: this.beeControllers,
      detectionRange: 8,
      attackRange: 3, // Ranged attack: 3 tiles distance!
      attackCooldownMs: 2000, // 2s cooldown so 1.5s cast completes nicely
      attackDamage: 70,
    })
    this.wanderingControllers.set(ria, wanderCtrl)

    return ria
  }

  /**
   * Spawn a Bee monster on the island using BeeController.
   */
  async spawnBee(opts?: { tx?: number; ty?: number }): Promise<BeeController | null> {
    const bee = new BeeController(this.tileSize)
    await bee.init()

    let tx = opts?.tx ?? Math.floor(this.width / 2)
    let ty = opts?.ty ?? Math.floor(this.height / 2)

    const offsetIndex = this.beeControllers.length
    if (opts?.tx === undefined && opts?.ty === undefined) {
      tx = Math.min(this.width - 1, Math.max(0, tx + (offsetIndex % 3) - 1))
      ty = Math.min(this.height - 1, Math.max(0, ty + Math.floor(offsetIndex / 3) - 1))
    }

    bee.setGridPosition(tx, ty)
    this.characterLayer.addChild(bee.view)
    bee.triggerSpawnEffect(this.app.ticker)
    this.beeControllers.push(bee)

    // Update targets for all Ria wandering controllers
    for (const ria of this.riaControllers) {
      const wander = this.wanderingControllers.get(ria)
      if (wander) wander.setTargets(this.beeControllers)
    }

    const wanderCtrl = new WanderingController({
      character: bee,
      gridCells: this.grid.cells,
      width: this.width,
      height: this.height,
      minRestTimeMs: 1500,
      maxRestTimeMs: 4000,
      maxRadius: 8,
    })
    this.wanderingControllers.set(bee, wanderCtrl)

    return bee
  }

  /**
   * Summon character compatibility wrapper.
   */
  async summonCharacter(opts?: { name?: string; textureUrl?: string; tx?: number; ty?: number }): Promise<SummonedCharacter | null> {
    const ria = await this.summonRia({ tx: opts?.tx, ty: opts?.ty })
    if (!ria) return null
    return {
      id: `${Date.now()}`,
      name: opts?.name ?? 'Ria',
      textureUrl: opts?.textureUrl ?? '/assets/Character/Ria/Idle/rotations/south.png',
      tx: ria.tx,
      ty: ria.ty,
      container: ria.view,
      sprite: ria.sprite,
      shadow: ria.shadow,
    }
  }

  clearMap(): void {
    this.grid = createGrid(this.width, this.height)
    for (const ds of this.dualSprites) {
      ds.grassSprite.visible = false
      ds.darkGrassSprite.visible = false
      ds.waterSprite.visible = false
    }

    for (const c of this.characters) {
      if (c.container.parent) this.characterLayer.removeChild(c.container)
      c.container.destroy({ children: true })
    }
    this.characters = []

    for (const ria of this.riaControllers) {
      ria.destroy()
    }
    this.riaControllers = []

    for (const bee of this.beeControllers) {
      bee.destroy()
    }
    this.beeControllers = []

    this.wanderingControllers.clear()

    const dualWidth = this.width + 1
    const dual = computeDualGrid(this.grid)
    for (let i = 0; i < dual.length; i++) {
      const dx = i % dualWidth
      const dy = Math.floor(i / dualWidth)
      this.updateDualCell(dx, dy, dual[i])
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
      summons?: Array<{ id: string; name: string; textureUrl: string; tx: number; ty: number }>
    }
    canvasElement?: { width: number; height: number }
    summons?: Array<{ id: string; name: string; textureUrl: string; tx: number; ty: number }>
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

    for (let ty = 0; ty < originalHeight; ty++) {
      for (let tx = 0; tx < originalWidth; tx++) {
        const corners = [
          ty * originalDualWidth + tx,
          ty * originalDualWidth + tx + 1,
          (ty + 1) * originalDualWidth + tx,
          (ty + 1) * originalDualWidth + tx + 1,
        ]
        const anyDarkGrass = corners.some((idx) => gridArray[idx]?.tilesetId === 'texture-job_e510e767f70e488b9a4ed95f6caaf33c')
        const anyGrass = corners.some((idx) => gridArray[idx]?.tilesetId === 'grass')
        
        const targetX = tx + offsetX
        const targetY = ty + offsetY
        if (targetX >= 0 && targetX < this.width && targetY >= 0 && targetY < this.height) {
          if (anyDarkGrass) {
            paintCell(this.grid, targetX, targetY, 'texture-job_e510e767f70e488b9a4ed95f6caaf33c')
          } else if (anyGrass) {
            paintCell(this.grid, targetX, targetY, 'grass')
          }
        }
      }
    }

    const dualWidth = this.width + 1
    const dual = computeDualGrid(this.grid)
    for (let i = 0; i < dual.length; i++) {
      const dx = i % dualWidth
      const dy = Math.floor(i / dualWidth)
      this.updateDualCell(dx, dy, dual[i])
    }

    const revealedCells: Array<{ x: number; y: number }> = []
    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        if (this.grid.cells[ty * this.width + tx]) {
          revealedCells.push({ x: tx, y: ty })
        }
      }
    }
    this.fog?.revealAll(revealedCells)

    const summonsArray = data.summons || data.map?.summons
    if (Array.isArray(summonsArray)) {
      for (const s of summonsArray) {
        this.summonRia({
          tx: s.tx,
          ty: s.ty,
        })
      }
    }
  }

  /**
   * Export current map as meowa-map.json format.
   */
  exportMap(): Record<string, unknown> {
    const dual = computeDualGrid(this.grid)

    const exportedGrid = dual.map((cell) => {
      if (cell.darkGrassFilled) {
        return {
          tilesetId: 'texture-job_e510e767f70e488b9a4ed95f6caaf33c',
          atlasX: cell.darkGrassAtlasX,
          atlasY: cell.darkGrassAtlasY,
          mode: 'auto',
        }
      }
      if (cell.grassFilled) {
        return {
          tilesetId: 'grass',
          atlasX: cell.grassAtlasX,
          atlasY: cell.grassAtlasY,
          mode: 'auto',
        }
      }
      return null
    })

    const summonsList = this.riaControllers.map(r => ({
      id: 'ria',
      name: 'Ria',
      textureUrl: '/assets/Character/Ria/Idle/rotations/south.png',
      tx: r.tx,
      ty: r.ty,
    }))

    return {
      format: 'meowa-map',
      version: 1,
      exportedAt: new Date().toISOString(),
      summons: summonsList,
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
        summons: summonsList,
        tilesets: [
          {
            id: 'grass',
            name: 'grass',
            type: 'dual-grid-15',
            url: '/inside_island2/assets/tilesets/grass.png',
            mimeType: 'image/png',
          },
          {
            id: 'texture-job_e510e767f70e488b9a4ed95f6caaf33c',
            name: 'texture-job_e510e767f70e488b9a4ed95f6caaf33c',
            type: 'dual-grid-15',
            url: '/inside_island2/assets/tilesets/texture-job_e510e767f70e488b9a4ed95f6caaf33c.png',
            mimeType: 'image/png',
          }
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
      this.clearMap()
      const dualWidth = this.width + 1
      const dualGrid = data.map.grid
      for (let ty = 0; ty < this.height; ty++) {
        for (let tx = 0; tx < this.width; tx++) {
          const corners = [
            ty * dualWidth + tx,
            ty * dualWidth + tx + 1,
            (ty + 1) * dualWidth + tx,
            (ty + 1) * dualWidth + tx + 1,
          ]
          const anyDarkGrass = corners.some((idx) => dualGrid[idx]?.tilesetId === 'texture-job_e510e767f70e488b9a4ed95f6caaf33c')
          const anyGrass = corners.some((idx) => dualGrid[idx]?.tilesetId === 'grass')
          if (anyDarkGrass) {
            paintCell(this.grid, tx, ty, 'texture-job_e510e767f70e488b9a4ed95f6caaf33c')
          } else if (anyGrass) {
            paintCell(this.grid, tx, ty, 'grass')
          }
        }
      }
      const dual = computeDualGrid(this.grid)
      for (let i = 0; i < dual.length; i++) {
        const dx = i % dualWidth
        const dy = Math.floor(i / dualWidth)
        this.updateDualCell(dx, dy, dual[i])
      }
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
