import { Container, Sprite, Texture, Graphics, Assets } from 'pixi.js'

export class CrystalBoomController {
  private static frameCache: Texture[] = []
  public view: Container
  public isFinished: boolean = false
  private sprite: Sprite
  private glow: Graphics
  private elapsed: number = 0
  private currentFrame: number = 0
  private frameDuration: number = 500 / 9 // ~55.5ms per frame (0.5s total animation)

  constructor(tileSize: number = 64) {
    this.view = new Container()

    // Purple crystal aura glow
    this.glow = new Graphics()
    this.glow.circle(0, 0, 45)
    this.glow.fill({ color: 0x9333ea, alpha: 0.65 })
    this.view.addChild(this.glow)

    this.sprite = new Sprite(Texture.EMPTY)
    this.sprite.anchor.set(0.5, 0.5)

    const scale = (tileSize * 2.8) / 120
    this.sprite.scale.set(scale)
    this.view.addChild(this.sprite)
  }

  public static async preloadTextures(): Promise<Texture[]> {
    if (CrystalBoomController.frameCache.length === 9) {
      return CrystalBoomController.frameCache
    }

    const loaded: Texture[] = []
    for (let i = 0; i <= 8; i++) {
      const idxStr = String(i).padStart(3, '0')
      const url = `/assets/Effect/crystal_boom/south/frame_${idxStr}.png`
      try {
        const tex = await Assets.load<Texture>(url)
        if (tex) loaded.push(tex)
      } catch (err) {
        console.warn(`Failed to load boom frame ${idxStr}:`, err)
      }
    }
    CrystalBoomController.frameCache = loaded
    return loaded
  }

  /**
   * Play the 0.5s 9-frame explosion animation on the target grid location.
   */
  public async playAt(tx: number, ty: number, tileSize: number, parentLayer: Container): Promise<void> {
    const textures = await CrystalBoomController.preloadTextures()
    if (textures.length === 0) return

    this.view.x = (tx + 0.5) * tileSize
    this.view.y = (ty + 0.5) * tileSize
    this.sprite.texture = textures[0]

    parentLayer.addChild(this.view)

    let frameTimer = 0
    let lastTime = performance.now()

    const animate = () => {
      if (this.isFinished) return
      const now = performance.now()
      const dt = now - lastTime
      lastTime = now

      this.elapsed += dt
      frameTimer += dt

      if (frameTimer >= this.frameDuration) {
        frameTimer -= this.frameDuration
        this.currentFrame++
        if (this.currentFrame < textures.length) {
          this.sprite.texture = textures[this.currentFrame]
          this.glow.alpha = 0.65 * (1 - this.currentFrame / textures.length)
        } else {
          this.destroy()
          return
        }
      }

      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  public destroy(): void {
    this.isFinished = true
    if (this.view.parent) {
      this.view.parent.removeChild(this.view)
    }
    this.view.destroy({ children: true })
  }
}
