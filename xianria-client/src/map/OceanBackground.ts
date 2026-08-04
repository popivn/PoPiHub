import { Container, Graphics, Texture, TilingSprite } from 'pixi.js'

export interface OceanBackgroundOptions {
  width: number
  height: number
  tileSize: number
  waterTexture?: Texture
  baseColor?: number
  paddingTiles?: number
}

export class OceanBackground {
  private container: Container
  private base: Graphics
  private tilingSprite: TilingSprite | null = null
  private width: number
  private height: number
  private tileSize: number
  private baseColor: number
  private paddingTiles: number
  private waterTexture: Texture | null = null

  constructor(opts: OceanBackgroundOptions) {
    this.width = opts.width
    this.height = opts.height
    this.tileSize = opts.tileSize
    this.baseColor = opts.baseColor ?? 0x56b7ea
    this.paddingTiles = opts.paddingTiles ?? 25
    this.waterTexture = opts.waterTexture ?? null

    this.container = new Container()
    this.base = new Graphics()
    this.container.addChild(this.base)
  }

  init(): void {
    this.drawBase()
    if (this.waterTexture) {
      this.setWaterTexture(this.waterTexture)
    }
  }

  private drawBase(): void {
    const pad = this.paddingTiles * this.tileSize
    const startX = -pad - this.tileSize / 2
    const startY = -pad - this.tileSize / 2
    const totalW = (this.width + this.paddingTiles * 2) * this.tileSize + this.tileSize
    const totalH = (this.height + this.paddingTiles * 2) * this.tileSize + this.tileSize

    this.base.clear()
    this.base.rect(startX, startY, totalW, totalH)
    this.base.fill({ color: this.baseColor, alpha: 1 })
  }

  setWaterTexture(texture: Texture): void {
    this.waterTexture = texture
    if (this.tilingSprite) {
      this.tilingSprite.destroy()
      this.tilingSprite = null
    }

    const pad = this.paddingTiles * this.tileSize
    const startX = -pad - this.tileSize / 2
    const startY = -pad - this.tileSize / 2
    const totalW = (this.width + this.paddingTiles * 2) * this.tileSize + this.tileSize
    const totalH = (this.height + this.paddingTiles * 2) * this.tileSize + this.tileSize

    this.tilingSprite = new TilingSprite({
      texture: this.waterTexture,
      width: totalW,
      height: totalH,
    })
    this.tilingSprite.x = startX
    this.tilingSprite.y = startY

    this.container.addChild(this.tilingSprite)
  }

  get view(): Container {
    return this.container
  }

  destroy(): void {
    if (this.tilingSprite) {
      this.tilingSprite.destroy()
      this.tilingSprite = null
    }
    this.base.destroy()
    this.container.destroy({ children: false })
  }
}
