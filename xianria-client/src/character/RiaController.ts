import { Container, Sprite, Texture, Graphics, Assets } from 'pixi.js'
import { type GridPoint } from '../utils/gridPathfinder'
import { CrystalBoomController } from '../effect/CrystalBoomController'

export interface RiaMetadata {
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

export interface RiaStatsOptions {
  tileSize?: number
  hp?: number
  maxHp?: number
  mp?: number
  maxMp?: number
  moveSpeed?: number
}

export class RiaController {
  public static readonly BASE_URL = '/assets/Character/Ria'
  private static metadataCache: RiaMetadata | null = null

  public view: Container
  public sprite: Sprite
  public shadow: Graphics
  public tx: number
  public ty: number

  // Character Stats (HP, MP, Move Speed)
  public hp: number
  public maxHp: number
  public mp: number
  public maxMp: number
  public moveSpeed: number
  private baseStepDuration: number = 220 // 220ms per tile (fast & agile movement speed)

  private metadata: RiaMetadata | null = null
  private texturesMap: Map<string, Texture> = new Map()
  public currentAnimation: string = 'Breathing_Idle'
  public currentDirection: string = 'south-west'
  private animationFrames: Texture[] = []
  private currentFrameIdx: number = 0
  private frameTimer: number = 0
  private frameDuration: number = 110 // ms per frame
  private isLooping: boolean = true
  private isPlayingAnimation: boolean = false
  private tileSize: number

  // Grid walking state
  private pathQueue: GridPoint[] = []
  public isWalking: boolean = false
  private stepTimer: number = 0
  private stepStartPos: { x: number; y: number } = { x: 0, y: 0 }
  private stepTargetPos: { x: number; y: number } = { x: 0, y: 0 }

  constructor(opts: number | RiaStatsOptions = 64) {
    const config: RiaStatsOptions = typeof opts === 'number' ? { tileSize: opts } : opts
    this.tileSize = config.tileSize ?? 64
    this.maxHp = config.maxHp ?? 1000
    this.hp = config.hp ?? this.maxHp
    this.maxMp = config.maxMp ?? 500
    this.mp = config.mp ?? this.maxMp
    this.moveSpeed = config.moveSpeed ?? 120 // Fast 120 movement speed

    this.tx = 0
    this.ty = 0

    this.view = new Container()
    
    // Shadow under feet
    this.shadow = new Graphics()
    this.shadow.ellipse(0, 0, 18, 7)
    this.shadow.fill({ color: 0x000000, alpha: 0.35 })
    this.view.addChild(this.shadow)

    // Character sprite
    this.sprite = new Sprite(Texture.EMPTY)
    this.sprite.anchor.set(0.5, 0.95)
    this.view.addChild(this.sprite)
  }

  /**
   * Get dynamic step duration based on moveSpeed stat.
   */
  public getStepDuration(): number {
    const speedRatio = Math.max(10, this.moveSpeed) / 100
    return this.baseStepDuration / speedRatio
  }

  public setHp(val: number): void {
    this.hp = Math.max(0, Math.min(this.maxHp, val))
  }

  public setMp(val: number): void {
    this.mp = Math.max(0, Math.min(this.maxMp, val))
  }

  public setMoveSpeed(speed: number): void {
    this.moveSpeed = Math.max(10, speed)
  }

  public takeDamage(amount: number): void {
    this.setHp(this.hp - amount)
    if (this.hp === 0) {
      this.playAnimation('Tired', this.currentDirection, true)
    }
  }

  public useMp(amount: number): boolean {
    if (this.mp >= amount) {
      this.setMp(this.mp - amount)
      return true
    }
    return false
  }

  /**
   * Load character metadata and preload base textures, starting with Breathing_Idle.
   */
  public async init(): Promise<void> {
    if (!RiaController.metadataCache) {
      try {
        const res = await fetch(`${RiaController.BASE_URL}/metadata.json`)
        RiaController.metadataCache = (await res.json()) as RiaMetadata
      } catch (err) {
        console.error('Failed to load Ria metadata.json:', err)
      }
    }
    this.metadata = RiaController.metadataCache

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

  public isCastingSkill: boolean = false

  /**
   * Set grid path for the character to walk along step by step.
   */
  public setPath(path: GridPoint[]): void {
    if (this.isCastingSkill) return // Cannot move while casting Ulti skill!

    if (!path || path.length === 0) {
      this.pathQueue = []
      this.isWalking = false
      return
    }

    // Clone path array
    const pathCopy = [...path]

    // If path starts at current position, remove start tile
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

    // Determine 8-way direction from dx and dy
    let dir = this.currentDirection
    if (dx > 0 && dy >= 0) dir = 'south-east'
    else if (dx < 0 && dy >= 0) dir = 'south-west'
    else if (dx > 0 && dy < 0) dir = 'north-east'
    else if (dx < 0 && dy < 0) dir = 'north-west'
    else if (dx === 0 && dy > 0) dir = 'south-west'
    else if (dx === 0 && dy < 0) dir = 'north-west'

    if (!this.isWalking || this.currentAnimation !== 'Walking' || this.currentDirection !== dir) {
      this.playAnimation('Walking', dir, true)
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
    const url = `${RiaController.BASE_URL}/${relPath}`

    let tex = this.texturesMap.get(`rotations:${dir}`)
    if (!tex) {
      try {
        tex = await Assets.load<Texture>(url)
        if (tex) {
          this.texturesMap.set(`rotations:${dir}`, tex)
        }
      } catch (err) {
        console.warn(`Failed to load rotation ${dir}:`, err)
        return
      }
    }
    if (tex) {
      this.sprite.texture = tex
    }
  }

  /**
   * Play named animation (e.g. 'Breathing_Idle', 'Walking', 'Basic_atk1', 'Greating', 'Unti', 'buff', 'Tired').
   */
  public async playAnimation(animName: string, direction: string = 'south-west', loop: boolean = true): Promise<void> {
    this.currentAnimation = animName
    this.currentDirection = direction
    this.isLooping = loop
    this.currentFrameIdx = 0
    this.frameTimer = 0

    const animDict = this.metadata?.states?.[0]?.frames?.animations?.[animName]
    
    // Resolve target direction (if exact direction folder does not exist, map east -> south-east, west -> south-west)
    let targetDir = direction
    if (animDict && !animDict[targetDir]) {
      if (targetDir.includes('east')) {
        targetDir = 'south-east'
      } else {
        targetDir = 'south-west'
      }
    }

    const framesList = animDict?.[targetDir] || animDict?.['south-west'] || animDict?.['south-east']
    if (!framesList || framesList.length === 0) {
      console.warn(`Animation ${animName} [${direction}] not found in metadata`)
      return
    }

    const loadedTextures: Texture[] = []
    for (const framePath of framesList) {
      const cacheKey = `anim:${animName}:${targetDir}:${framePath}`
      let tex = this.texturesMap.get(cacheKey)
      if (!tex) {
        try {
          tex = await Assets.load<Texture>(`${RiaController.BASE_URL}/${framePath}`)
          if (tex) {
            this.texturesMap.set(cacheKey, tex)
          }
        } catch (err) {
          console.warn(`Failed to load frame ${framePath}:`, err)
        }
      }
      if (tex) loadedTextures.push(tex)
    }

    if (loadedTextures.length > 0 && loadedTextures[0]) {
      this.animationFrames = loadedTextures
      this.sprite.texture = loadedTextures[0]

      const targetHeight = this.tileSize * 1.35
      const scale = targetHeight / (loadedTextures[0].height || 120)
      this.sprite.scale.set(scale)

      this.isPlayingAnimation = true
    }
  }

  /**
   * Ticker update for animation playback and grid movement interpolation.
   */
  public update(deltaMS: number): void {
    // 1. Step-by-step Grid Movement Update
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

    // 2. Frame Animation Update
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
   * Trigger spawn pop & aura animation effect.
   */
  public triggerSpawnEffect(ticker: { add: (fn: any) => void; remove: (fn: any) => void }): void {
    const aura = new Graphics()
    aura.ellipse(0, 0, 26, 11)
    aura.setStrokeStyle({ width: 3, color: 0xffd700, alpha: 0.9 })
    aura.stroke()
    this.view.addChild(aura)

    this.view.scale.set(0)
    let elapsed = 0
    const duration = 350

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
   * Play crystal boom animated explosion sequence on target grid tile location.
   */
  public async playAttackEffectOnTarget(target: { tx: number; ty: number }, parentLayer?: Container): Promise<void> {
    const layer = parentLayer || this.view.parent
    if (!layer) return

    // Preload sliced frames frame_000.png to frame_008.png
    const frameTextures: Texture[] = []
    for (let i = 0; i <= 8; i++) {
      const idxStr = String(i).padStart(3, '0')
      const url = `/assets/Effect/crystal_boom/south/frame_${idxStr}.png`
      try {
        let tex = this.texturesMap.get(`effect_boom:${idxStr}`)
        if (!tex) {
          tex = await Assets.load<Texture>(url)
          if (tex) this.texturesMap.set(`effect_boom:${idxStr}`, tex)
        }
        if (tex) frameTextures.push(tex)
      } catch (err) {
        console.warn(`Failed to load boom frame ${idxStr}:`, err)
      }
    }

    if (frameTextures.length === 0) return

    const effectContainer = new Container()
    effectContainer.x = (target.tx + 0.5) * this.tileSize
    effectContainer.y = (target.ty + 0.5) * this.tileSize

    const boomSprite = new Sprite(frameTextures[0])
    boomSprite.anchor.set(0.5, 0.5)

    // Scale boom effect for high visibility
    const targetSize = this.tileSize * 2.8
    const scale = targetSize / (frameTextures[0].height || 120)
    boomSprite.scale.set(scale)
    effectContainer.addChild(boomSprite)

    // Crystal purple aura glow
    const glow = new Graphics()
    glow.circle(0, 0, 45)
    glow.fill({ color: 0x9333ea, alpha: 0.65 })
    effectContainer.addChildAt(glow, 0)

    layer.addChild(effectContainer)

    let currentFrame = 0
    let frameTimer = 0
    const frameDuration = 50 // ms per frame (~450ms total playback)

    const animate = () => {
      frameTimer += 16
      if (frameTimer >= frameDuration) {
        frameTimer -= frameDuration
        currentFrame++
        if (currentFrame < frameTextures.length) {
          boomSprite.texture = frameTextures[currentFrame]
          glow.alpha = 0.65 * (1 - currentFrame / frameTextures.length)
        } else {
          if (effectContainer.parent) {
            effectContainer.parent.removeChild(effectContainer)
          }
          effectContainer.destroy({ children: true })
          return
        }
      }
      requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }

  /**
   * Cast Ulti skill (1.5s total duration, stationary, invokes CrystalBoomController 3 times).
   */
  public async castUlti(target: { tx: number; ty: number; takeDamage?: (amt: number) => void }, parentLayer?: Container): Promise<void> {
    if (this.isCastingSkill) return

    this.isCastingSkill = true
    this.isWalking = false
    this.pathQueue = []

    // Calculate facing direction toward target
    const dx = target.tx - this.tx
    const dy = target.ty - this.ty
    let dir = 'south-west'
    if (dx > 0 && dy >= 0) dir = 'south-east'
    else if (dx < 0 && dy >= 0) dir = 'south-west'
    else if (dx > 0 && dy < 0) dir = 'north-east'
    else if (dx < 0 && dy < 0) dir = 'north-west'

    // 1. Play Unti animation for 1.5s (1500ms)
    await this.playAnimation('Unti', dir, true)

    const layer = parentLayer || this.view.parent

    // 2. Invoke 0.5s Crystal Boom 3 times during the 1.5s Ulti casting duration
    // 1st boom at 200ms
    setTimeout(() => {
      if (layer) {
        const boom1 = new CrystalBoomController(this.tileSize)
        boom1.playAt(target.tx, target.ty, this.tileSize, layer)
        if (target.takeDamage) target.takeDamage(25)
      }
    }, 200)

    // 2nd boom at 700ms
    setTimeout(() => {
      if (layer) {
        const boom2 = new CrystalBoomController(this.tileSize)
        boom2.playAt(target.tx, target.ty, this.tileSize, layer)
        if (target.takeDamage) target.takeDamage(30)
      }
    }, 700)

    // 3rd boom at 1200ms
    setTimeout(() => {
      if (layer) {
        const boom3 = new CrystalBoomController(this.tileSize)
        boom3.playAt(target.tx, target.ty, this.tileSize, layer)
        if (target.takeDamage) target.takeDamage(35)
      }
    }, 1200)

    // 3. Unlock movement and return to idle after 1.5s (1500ms)
    setTimeout(() => {
      this.isCastingSkill = false
      this.playAnimation('Breathing_Idle', this.currentDirection, true)
    }, 1500)
  }

  /**
   * Destroy character view and cleanup.
   */
  public destroy(): void {
    if (this.view.parent) {
      this.view.parent.removeChild(this.view)
    }
    this.view.destroy({ children: true })
  }
}
