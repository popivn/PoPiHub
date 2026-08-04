import { Application, Container, Sprite, Texture } from 'pixi.js'

export interface FogOfWarOptions {
  app: Application
  width: number
  height: number
  tileSize: number
  paddingTiles?: number
  revealRadius?: number
  fogColor?: number
  fogAlpha?: number
}

/**
 * FogOfWar — hiệu ứng sương mù bao quanh hòn đảo.
 *
 * Cách hoạt động:
 * - Bản đồ mặc định phủ kín sương mù trên tất cả các ô grid.
 * - Chỉ những ô đã mua đảo (đã được painted từ DB) mới được xóa sương mù (reveal).
 * - Sử dụng culling theo viewport để tối ưu hiệu năng: chỉ vẽ các sprite sương mù hiển thị trong màn hình.
 * - Sử dụng WebCodecs ImageDecoder API để giải mã hoạt ảnh động mây c1.webp.
 */
export class FogOfWar {
  private app: Application
  private container: Container
  private spritesContainer: Container
  private width: number
  private height: number
  private tileSize: number
  private foggyCells: Set<number> = new Set()
  private time = 0
  private driftOffsetX = 0
  private driftOffsetY = 0
  
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private cloudTexture: Texture | null = null
  private decoder: any = null
  private frameCount = 0
  private timerId: number | null = null

  private lastWorldX = -99999
  private lastWorldY = -99999
  private lastWorldScaleX = -1
  private lastWorldScaleY = -1
  private dirty = true

  constructor(opts: FogOfWarOptions) {
    this.app = opts.app
    this.width = opts.width
    this.height = opts.height
    this.tileSize = opts.tileSize

    this.spritesContainer = new Container()

    this.container = new Container()
    this.container.addChild(this.spritesContainer)
    this.container.visible = false

    // Khởi tạo toàn bộ bản đồ phủ kín sương mù mặc định
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.foggyCells.add(y * this.width + x)
      }
    }

    const ImageDecoderClass = (window as any).ImageDecoder

    if (!ImageDecoderClass) {
      console.warn('Trình duyệt không hỗ trợ ImageDecoder để phát WebP động. Sử dụng ảnh tĩnh làm fallback.')
      this.rebuild()
      return
    }

    // Thiết lập canvas vẽ khung hình
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    if (ctx) {
      this.canvas = canvas
      this.ctx = ctx
      this.cloudTexture = Texture.from(canvas)
    }

    // Tải WebP và giải mã
    fetch('/assets/cloud/c1.webp')
      .then(async (response) => {
        if (!response.body) throw new Error('Không có readable stream body')
        
        this.decoder = new ImageDecoderClass({
          data: response.body,
          type: 'image/webp'
        })

        await this.decoder.tracks.ready
        const track = this.decoder.tracks.selectedTrack
        this.frameCount = track.frameCount

        // Bắt đầu vòng lặp giải mã khung hình
        this.decodeFrame(0)
      })
      .catch(err => {
        console.error('Lỗi giải mã ảnh sương mù WebP động:', err)
      })

    this.rebuild()
  }

  /**
   * Giải mã và hiển thị khung hình tại chỉ mục cụ thể.
   */
  private async decodeFrame(index: number): Promise<void> {
    if (!this.decoder) return
    try {
      const result = await this.decoder.decode({ frameIndex: index })
      const frame = result.image

      if (this.canvas && this.ctx) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(frame, 0, 0, this.canvas.width, this.canvas.height)
        if (this.cloudTexture) {
          this.cloudTexture.update()
        }
      }

      // Thời lượng khung hình tính bằng micro giây -> đổi ra mili giây nhân 3.0 để làm chậm
      const delayMs = (frame.duration || 100000) / 1000.0 * 3.0
      frame.close() // Giải phóng tài nguyên GPU

      // Tạo lại mây khi đã có frame đầu tiên
      if (index === 0) {
        this.dirty = true
      }

      const nextIndex = (index + 1) % this.frameCount
      this.timerId = window.setTimeout(() => this.decodeFrame(nextIndex), delayMs)
    } catch (err) {
      console.error('Lỗi khi vẽ frame WebP:', err)
    }
  }

  /**
   * Khai phá một tile — xóa sương mù xung quanh nó.
   */
  reveal(tx: number, ty: number): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return
    const idx = ty * this.width + tx
    if (!this.foggyCells.has(idx)) return
    this.foggyCells.delete(idx)
    this.dirty = true
  }

  /**
   * Ẩn một tile — khôi phục sương mù xung quanh nó.
   */
  hide(tx: number, ty: number): void {
    if (tx < 0 || tx >= this.width || ty < 0 || ty >= this.height) return
    const idx = ty * this.width + tx
    if (this.foggyCells.has(idx)) return
    this.foggyCells.add(idx)
    this.dirty = true
  }

  /**
   * Khai phá nhiều tile cùng lúc.
   */
  revealAll(cells: Array<{ x: number; y: number }>): void {
    for (const { x, y } of cells) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.foggyCells.delete(y * this.width + x)
      }
    }
    this.dirty = true
  }

  /**
   * Xóa toàn bộ vùng đã khai phá — khôi phục sương mù.
   */
  clearRevealed(): void {
    this.foggyCells.clear()
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.foggyCells.add(y * this.width + x)
      }
    }
    this.dirty = true
  }

  /**
   * Rebuild sương mù: vẽ các hình ảnh đám mây c1.webp đè lên trên ô lưới có sương mù (sử dụng culling).
   */
  private rebuild(): void {
    // Hủy các cloud sprites cũ để vẽ lại
    this.spritesContainer.removeChildren().forEach(child => child.destroy())

    if (this.foggyCells.size === 0 || !this.cloudTexture) return

    const cloudTexture = this.cloudTexture

    // Tính toán giới hạn khung nhìn (viewport culling) để tối ưu hiệu năng
    const world = this.container.parent
    let viewportMinX = -99999
    let viewportMinY = -99999
    let viewportMaxX = 99999
    let viewportMaxY = 99999

    if (world) {
      const screenWidth = this.app.renderer.width
      const screenHeight = this.app.renderer.height
      const scaleX = world.scale.x || 1
      const scaleY = world.scale.y || 1

      // Biên của màn hình trong hệ tọa độ thế giới (world coords)
      const minX = -world.x / scaleX
      const minY = -world.y / scaleY
      const maxX = (-world.x + screenWidth) / scaleX
      const maxY = (-world.y + screenHeight) / scaleY

      // Thêm lề đệm 2 ô grid để tránh mây bị giật khi cuộn camera nhanh
      const margin = 2 * this.tileSize
      viewportMinX = minX - margin
      viewportMinY = minY - margin
      viewportMaxX = maxX + margin
      viewportMaxY = maxY + margin
    }

    for (const idx of this.foggyCells) {
      const px = idx % this.width
      const py = Math.floor(idx / this.width)
      
      const cx = px * this.tileSize
      const cy = py * this.tileSize

      // Kiểm tra culling: nếu ô lưới nằm hoàn toàn ngoài viewport đệm thì không tạo Sprite
      if (
        cx + this.tileSize < viewportMinX ||
        cx > viewportMaxX ||
        cy + this.tileSize < viewportMinY ||
        cy > viewportMaxY
      ) {
        continue
      }

      // Tạo Sprite đám mây đè lên trên ô grid
      const cloudSprite = new Sprite(cloudTexture)
      cloudSprite.anchor.set(0.5)
      cloudSprite.width = this.tileSize * 1.3 // Hơi to hơn ô lưới 30% để tạo hiệu ứng xốp tự nhiên
      cloudSprite.height = this.tileSize * 1.3
      cloudSprite.x = cx + this.tileSize / 2
      cloudSprite.y = cy + this.tileSize / 2

      this.spritesContainer.addChild(cloudSprite)
    }
  }

  /**
   * Animation: sương mù trôi nhẹ.
   */
  update(deltaTime: number): void {
    this.time += deltaTime
    this.driftOffsetX = Math.sin(this.time * 0.0004) * 4
    this.driftOffsetY = Math.cos(this.time * 0.0003) * 3
    this.spritesContainer.x = this.driftOffsetX
    this.spritesContainer.y = this.driftOffsetY

    // Kiểm tra camera thay đổi (pan/zoom) để kích hoạt rebuild culling
    const world = this.container.parent
    if (world) {
      if (
        world.x !== this.lastWorldX ||
        world.y !== this.lastWorldY ||
        world.scale.x !== this.lastWorldScaleX ||
        world.scale.y !== this.lastWorldScaleY
      ) {
        this.lastWorldX = world.x
        this.lastWorldY = world.y
        this.lastWorldScaleX = world.scale.x
        this.lastWorldScaleY = world.scale.y
        this.dirty = true
      }
    }

    if (this.dirty) {
      this.rebuild()
      this.dirty = false
    }
  }

  get view(): Container {
    return this.container
  }

  destroy(): void {
    if (this.timerId) {
      window.clearTimeout(this.timerId)
    }
    if (this.decoder) {
      this.decoder.close()
    }
    this.spritesContainer.destroy({ children: true })
    this.container.destroy({ children: false })
  }
}
