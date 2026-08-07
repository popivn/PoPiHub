import { Container, Sprite, Texture, Graphics, Assets } from 'pixi.js'
import { type GridPoint } from '../utils/gridPathfinder'

export interface BeeMetadata {
  group_id: string
  states: Array<{
    character: {
      id: string
      name: string
      size: { width: number; height: number }
      directions: number
      view: string
    }
    folder: string
    frames: {
      rotations: Record<string, string>
      animations: Record<string, Record<string, string[]>>
    }
  }>
}

export interface BeeStatsOptions {
  tileSize?: number
  hp?: number
  maxHp?: number
  mp?: number
  maxMp?: number
  moveSpeed?: number
}

export class BeeController {
  public static readonly BASE_URL = '/assets/monster/bee'
  private static metadataCache: BeeMetadata | null = null

  public view: Container
  public sprite: Sprite
  public shadow: Graphics
  public tx: number
  public ty: number

  // Bee Monster Stats
  public hp: number
  public maxHp: number
  public mp: number
  public maxMp: number
  public moveSpeed: number
  private baseStepDuration: number = 220 // Bees fly faster than humans

  private metadata: BeeMetadata | null = null
  private texturesMap: Map<string, Texture> = new Map()
  public currentAnimation: string = 'Breathing_Idle'
  public currentDirection: string = 'south-west'
  private animationFrames: Texture[] = []
  private currentFrameIdx: number = 0
  private frameTimer: number = 0
  private frameDuration: number = 90 // ms per frame (faster wing flapping)
  private isLooping: boolean = true
  private isPlayingAnimation: boolean = false
  private tileSize: number

  // Flying hover effect
  private hoverTime: number = Math.random() * 100
  private hoverOffsetY: number = 0

  // Grid flying state
  private pathQueue: GridPoint[] = []
  public isWalking: boolean = false
  private stepTimer: number = 0
  private stepStartPos: { x: number; y: number } = { x: 0, y: 0 }
  private stepTargetPos: { x: number; y: number } = { x: 0, y: 0 }

  constructor(opts: number | BeeStatsOptions = 64) {
    const config: BeeStatsOptions = typeof opts === 'number' ? { tileSize: opts } : opts
    this.tileSize = config.tileSize ?? 64
    this.maxHp = config.maxHp ?? 200
    this.hp = config.hp ?? this.maxHp
    this.maxMp = config.maxMp ?? 100
    this.mp = config.mp ?? this.maxMp
    this.moveSpeed = config.moveSpeed ?? 120 // Fast movement

    this.tx = 0
    this.ty = 0

    this.view = new Container()
    
    // Shadow under feet/body
    this.shadow = new Graphics()
    this.shadow.ellipse(0, 0, 14, 6)
    this.shadow.fill({ color: 0x000000, alpha: 0.3 })
    this.view.addChild(this.shadow)

    // Bee sprite
    this.sprite = new Sprite(Texture.EMPTY)
    this.sprite.anchor.set(0.5, 0.9)
    this.view.addChild(this.sprite)
  }

  /**
   * Get dynamic step duration based on moveSpeed stat.
   */
  public getStepDuration(): number {
    const speedRatio = Math.max(10, this.moveSpeed) / 100
    return this.baseStepDuration / speedRatio
  }

  public isDead: boolean = false

  public setHp(val: number): void {
    this.hp = Math.max(0, Math.min(this.maxHp, val))
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return
    this.setHp(this.hp - amount)

    // Damage flash tint effect
    this.sprite.tint = 0xff5555
    setTimeout(() => {
      if (!this.isDead) this.sprite.tint = 0xffffff
    }, 150)

    if (this.hp <= 0) {
      this.isDead = true
      this.isWalking = false
      this.pathQueue = []
      this.playAnimation('Falling_Back_Death', 'south', false)

      // Fade out and destroy after death animation completes
      setTimeout(() => {
        let alphaElapsed = 0
        const fadeInterval = setInterval(() => {
          alphaElapsed += 50
          this.view.alpha = Math.max(0, 1 - alphaElapsed / 500)
          if (alphaElapsed >= 500) {
            clearInterval(fadeInterval)
            this.destroy()
          }
        }, 50)
      }, 800)
    }
  }

  /**
   * Load Bee metadata and preload base textures, starting with Breathing_Idle.
   */
  public async init(): Promise<void> {
    if (!BeeController.metadataCache) {
      try {
        const res = await fetch(`${BeeController.BASE_URL}/metadata.json`)
        BeeController.metadataCache = (await res.json()) as BeeMetadata
      } catch (err) {
        console.error('Failed to load Bee metadata.json:', err)
      }
    }
    this.metadata = BeeController.metadataCache

    // Set default animation to Breathing_Idle
    await this.playAnimation('Breathing_Idle', 'south-west', true)
  }

  /**
   * Position character on grid.
   */
  public setGridPosition(tx: number, ty: number): void {
    this.tx = tx
    this.ty = ty
    this.view.x = (tx + 0.5) * this.tileSize
    this.view.y = (ty + 0.85) * this.tileSize
  }

  /**
   * Set grid path for the bee to fly along step by step.
   */
  public setPath(path: GridPoint[]): void {
    if (!path || path.length === 0) return

    const pathCopy = [...path]

    if (pathCopy.length > 0 && pathCopy[0].x === this.tx && pathCopy[0].y === this.ty) {
      pathCopy.shift()
    }

    if (pathCopy.length === 0) return

    this.pathQueue = pathCopy
    this.startNextStep()
  }

  private startNextStep(): void {
    if (this.pathQueue.length === 0) {
      this.isWalking = false
      this.playAnimation('Breathing_Idle', this.currentDirection, true)
      return
    }

    const nextTile = this.pathQueue[0]
    const dx = nextTile.x - this.tx
    const dy = nextTile.y - this.ty

    let dir = this.currentDirection
    if (dx > 0 && dy >= 0) dir = 'south-east'
    else if (dx < 0 && dy >= 0) dir = 'south-west'
    else if (dx > 0 && dy < 0) dir = 'south-east'
    else if (dx < 0 && dy < 0) dir = 'south-west'
    else if (dx === 0 && dy > 0) dir = 'south-west'
    else if (dx === 0 && dy < 0) dir = 'south-west'

    if (!this.isWalking || this.currentAnimation !== 'Flying_Kick' || this.currentDirection !== dir) {
      this.playAnimation('Flying_Kick', dir, true)
    }

    this.isWalking = true
    this.stepTimer = 0
    this.stepStartPos = {
      x: (this.tx + 0.5) * this.tileSize,
      y: (this.ty + 0.85) * this.tileSize,
    }
    this.stepTargetPos = {
      x: (nextTile.x + 0.5) * this.tileSize,
      y: (nextTile.y + 0.85) * this.tileSize,
    }
  }

  /**
   * Set static rotation direction.
   */
  public async setDirection(dir: string): Promise<void> {
    this.currentDirection = dir
    this.isPlayingAnimation = false
    const relPath = this.metadata?.states?.[0]?.frames?.rotations?.[dir] || `Idle/rotations/${dir}.png`
    const url = `${BeeController.BASE_URL}/${relPath}`

    let tex = this.texturesMap.get(`rotations:${dir}`)
    if (!tex) {
      try {
        tex = await Assets.load<Texture>(url)
        if (tex) {
          this.texturesMap.set(`rotations:${dir}`, tex)
        }
      } catch (err) {
        console.warn(`Failed to load bee rotation ${dir}:`, err)
        return
      }
    }
    if (tex) {
      this.sprite.texture = tex
    }
  }

  /**
   * Play named animation (e.g. 'Breathing_Idle', 'Flying_Kick', 'Falling_Back_Death').
   */
  public async playAnimation(animName: string, direction: string = 'south-west', loop: boolean = true): Promise<void> {
    this.currentAnimation = animName
    this.currentDirection = direction
    this.isLooping = loop
    this.currentFrameIdx = 0
    this.frameTimer = 0

    const animDict = this.metadata?.states?.[0]?.frames?.animations?.[animName]
    const framesList = animDict?.[direction] || animDict?.['south-west'] || animDict?.['south-east'] || animDict?.['south']
    if (!framesList || framesList.length === 0) {
      console.warn(`Bee Animation ${animName} [${direction}] not found in metadata`)
      return
    }

    const loadedTextures: Texture[] = []
    for (const framePath of framesList) {
      const cacheKey = `anim:${animName}:${direction}:${framePath}`
      let tex = this.texturesMap.get(cacheKey)
      if (!tex) {
        try {
          tex = await Assets.load<Texture>(`${BeeController.BASE_URL}/${framePath}`)
          if (tex) {
            this.texturesMap.set(cacheKey, tex)
          }
        } catch (err) {
          console.warn(`Failed to load bee frame ${framePath}:`, err)
        }
      }
      if (tex) loadedTextures.push(tex)
    }

    if (loadedTextures.length > 0 && loadedTextures[0]) {
      this.animationFrames = loadedTextures
      this.sprite.texture = loadedTextures[0]

      const targetHeight = this.tileSize * 1.1
      const scale = targetHeight / (loadedTextures[0].height || 120)
      this.sprite.scale.set(scale)

      this.isPlayingAnimation = true
    }
  }

  /**
   * Trigger spawn pop animation.
   */
  public triggerSpawnEffect(ticker: { add: (fn: any) => void; remove: (fn: any) => void }): void {
    const aura = new Graphics()
    aura.ellipse(0, 0, 20, 8)
    aura.setStrokeStyle({ width: 2, color: 0xf59e0b, alpha: 0.9 })
    aura.stroke()
    this.view.addChild(aura)

    this.view.scale.set(0)
    let elapsed = 0
    const duration = 300

    const tickerFn = (dt: any) => {
      elapsed += dt.deltaMS
      const progress = Math.min(1, elapsed / duration)
      const s = Math.sin(progress * Math.PI * 0.5) * 1.15
      const finalS = Math.min(1, s)
      this.view.scale.set(finalS)

      aura.alpha = 1 - progress
      aura.scale.set(1 + progress * 0.8)

      if (progress >= 1) {
        this.view.scale.set(1)
        if (aura.parent) this.view.removeChild(aura)
        ticker.remove(tickerFn)
      }
    }

    ticker.add(tickerFn)
  }

  /**
   * Ticker update for floating hover effect, animation playback, and grid movement interpolation.
   */
  public update(deltaMS: number): void {
    // 1. Hover / Bobbing flight effect
    this.hoverTime += deltaMS * 0.005
    this.hoverOffsetY = Math.sin(this.hoverTime * 2) * 6
    this.sprite.y = -10 + this.hoverOffsetY

    // 2. Step-by-step Grid Movement Update
    if (this.isWalking && this.pathQueue.length > 0) {
      this.stepTimer += deltaMS
      const stepDuration = this.getStepDuration()
      const progress = Math.min(1, this.stepTimer / stepDuration)

      this.view.x = this.stepStartPos.x + (this.stepTargetPos.x - this.stepStartPos.x) * progress
      this.view.y = this.stepStartPos.y + (this.stepTargetPos.y - this.stepStartPos.y) * progress

      if (progress >= 1) {
        const arrivedTile = this.pathQueue.shift()!
        this.tx = arrivedTile.x
        this.ty = arrivedTile.y
        this.startNextStep()
      }
    }

    // 3. Frame Animation Update
    if (!this.isPlayingAnimation || this.animationFrames.length === 0) return

    this.frameTimer += deltaMS
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer -= this.frameDuration
      this.currentFrameIdx++

      if (this.currentFrameIdx >= this.animationFrames.length) {
        if (this.isLooping) {
          this.currentFrameIdx = 0
        } else {
          this.currentFrameIdx = this.animationFrames.length - 1
          this.isPlayingAnimation = false
        }
      }

      const frameTex = this.animationFrames[this.currentFrameIdx]
      if (frameTex) {
        this.sprite.texture = frameTex
      }
    }
  }

  /**
   * Destroy bee view and cleanup.
   */
  public destroy(): void {
    if (this.view.parent) {
      this.view.parent.removeChild(this.view)
    }
    this.view.destroy({ children: true })
  }
}
