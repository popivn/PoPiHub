import { type GridPoint, findShortestPath, isPassableTile } from '../utils/gridPathfinder'

export interface IWanderableCharacter {
  tx: number
  ty: number
  setPath(path: GridPoint[]): void
  isWalking?: boolean
  isCastingSkill?: boolean
  currentDirection?: string
  playAnimation?(animName: string, direction?: string, loop?: boolean): Promise<void>
  playAttackEffectOnTarget?(target: { tx: number; ty: number }): void
  castUlti?(target: { tx: number; ty: number; takeDamage?: (amt: number) => void }): void
  takeDamage?(amount: number): void
  hp?: number
  maxHp?: number
  isDead?: boolean
}

export interface WanderingControllerOptions {
  character: IWanderableCharacter
  gridCells: (string | null)[]
  width: number
  height: number
  minRestTimeMs?: number
  maxRestTimeMs?: number
  maxRadius?: number
  targets?: IWanderableCharacter[] // Potential targets/monsters
  detectionRange?: number           // Target detection radius in tiles (default: 8)
  attackRange?: number              // Attack range in tiles (default: 1)
  attackCooldownMs?: number         // Cooldown between attacks in ms (default: 1000)
  attackDamage?: number             // Damage dealt per attack (default: 50)
}

export class WanderingController {
  private character: IWanderableCharacter
  private gridCells: (string | null)[]
  private width: number
  private height: number

  private minRestTimeMs: number
  private maxRestTimeMs: number
  private maxRadius: number

  public targets: IWanderableCharacter[] = []
  private detectionRange: number
  private attackRange: number
  private attackCooldownMs: number
  private attackDamage: number

  private isEnabled: boolean = true
  private restTimer: number = 0
  private attackTimer: number = 0
  public currentTarget: IWanderableCharacter | null = null
  public lockedTarget: IWanderableCharacter | null = null
  private transitionTimer: number = 0 // 0.5s transition pause timer
  private isTransitioning: boolean = false

  constructor(opts: WanderingControllerOptions) {
    this.character = opts.character
    this.gridCells = opts.gridCells
    this.width = opts.width
    this.height = opts.height

    this.minRestTimeMs = opts.minRestTimeMs ?? 2500
    this.maxRestTimeMs = opts.maxRestTimeMs ?? 6000
    this.maxRadius = opts.maxRadius ?? 6

    this.targets = opts.targets ?? []
    this.detectionRange = opts.detectionRange ?? 8
    this.attackRange = opts.attackRange ?? 1
    this.attackCooldownMs = opts.attackCooldownMs ?? 1000
    this.attackDamage = opts.attackDamage ?? 50

    this.resetRestTimer()
  }

  /**
   * Update grid environment if map changes.
   */
  public updateGrid(gridCells: (string | null)[], width: number, height: number): void {
    this.gridCells = gridCells
    this.width = width
    this.height = height
  }

  /**
   * Update target list dynamically.
   */
  public setTargets(targets: IWanderableCharacter[]): void {
    this.targets = targets
  }

  /**
   * Enable wandering & combat AI.
   */
  public start(): void {
    this.isEnabled = true
    this.resetRestTimer()
  }

  /**
   * Disable wandering & combat AI.
   */
  public stop(): void {
    this.isEnabled = false
  }

  /**
   * Ticker update method. Call this on every frame ticker.
   */
  public update(deltaMS: number): void {
    if (!this.isEnabled) return

    // If character is currently casting skill (Ulti), pause AI updates
    if (this.character.isCastingSkill) return

    if (this.attackTimer > 0) {
      this.attackTimer -= deltaMS
    }

    // 0. Smooth 0.5s Breathing_Idle transition delay
    if (this.isTransitioning) {
      this.transitionTimer -= deltaMS
      if (this.transitionTimer <= 0) {
        this.isTransitioning = false
      } else {
        return // Pause in Breathing_Idle for 0.5s before moving
      }
    }

    // 1. Target Lock-On & Combat System
    // Validate current locked target: must be alive and still in target list
    if (this.lockedTarget) {
      if (
        this.lockedTarget.isDead ||
        (this.lockedTarget.hp !== undefined && this.lockedTarget.hp <= 0) ||
        !this.targets.includes(this.lockedTarget)
      ) {
        // Locked target is dead or removed -> Pause 0.5s in Breathing_Idle before picking new target
        this.lockedTarget = null
        this.triggerBreathingPause(500)
        return
      }
    }

    // If no target is currently locked on, pick the closest living target within detectionRange
    if (!this.lockedTarget && this.targets.length > 0) {
      let closestTarget: IWanderableCharacter | null = null
      let minDistance = Infinity

      for (const target of this.targets) {
        if (target.isDead || (target.hp !== undefined && target.hp <= 0)) continue
        const dist = Math.abs(target.tx - this.character.tx) + Math.abs(target.ty - this.character.ty)
        if (dist <= this.detectionRange && dist < minDistance) {
          minDistance = dist
          closestTarget = target
        }
      }

      if (closestTarget) {
        this.lockedTarget = closestTarget

        // Start smooth 0.5s Breathing_Idle pause before pursuing new target
        this.triggerBreathingPause(500)
        return
      }
    }

    // Process Chasing & Combat for the locked target
    if (this.lockedTarget) {
      const activeTarget = this.lockedTarget
      this.currentTarget = activeTarget
      const dist = Math.abs(activeTarget.tx - this.character.tx) + Math.abs(activeTarget.ty - this.character.ty)

      // Target is within attack range -> Stop and Attack!
      if (dist <= this.attackRange) {
        this.character.setPath([]) // Stop walking

        if (this.attackTimer <= 0) {
          this.attackTimer = this.attackCooldownMs
          this.executeAttack(activeTarget)
        }
        return
      }

      // Target is out of attack range -> Chase locked target!
      // Only recalculate path when character is NOT walking (finishes current grid step)
      if (!this.character.isWalking) {
        const path = findShortestPath(
          this.gridCells,
          this.width,
          this.height,
          { x: this.character.tx, y: this.character.ty },
          { x: activeTarget.tx, y: activeTarget.ty }
        )

        if (path.length > 1) {
          const cutoff = Math.max(1, this.attackRange)
          while (path.length > 1 && Math.abs(path[path.length - 1].x - activeTarget.tx) + Math.abs(path[path.length - 1].y - activeTarget.ty) < cutoff) {
            path.pop()
          }
          this.character.setPath(path)
        }
      }
      return
    } else {
      this.currentTarget = null
    }

    // 2. Normal Wandering AI (when no monster is locked on)
    if (this.character.isWalking) {
      return
    }

    this.restTimer -= deltaMS
    if (this.restTimer <= 0) {
      this.triggerWanderStep()
    }
  }

  private executeAttack(target: IWanderableCharacter): void {
    if (this.character.castUlti) {
      this.character.castUlti(target)
      return
    }

    const dx = target.tx - this.character.tx
    const dy = target.ty - this.character.ty

    let dir = 'south-west'
    if (dx > 0 && dy >= 0) dir = 'south-east'
    else if (dx < 0 && dy >= 0) dir = 'south-west'
    else if (dx > 0 && dy < 0) dir = 'south-east'
    else if (dx < 0 && dy < 0) dir = 'south-west'

    // Trigger attack skill animation on character (ONLY Unti)
    if (this.character.playAnimation) {
      this.character.playAnimation('Unti', dir, false)
    }

    // Trigger ranged attack effect on target
    if (this.character.playAttackEffectOnTarget) {
      this.character.playAttackEffectOnTarget(target)
    }

    // Deal damage to target
    if (target.takeDamage) {
      target.takeDamage(this.attackDamage)
    }
  }

  /**
   * Pause movement and switch to Breathing_Idle animation for a smooth transition delay.
   */
  private triggerBreathingPause(durationMs: number = 500): void {
    this.isTransitioning = true
    this.transitionTimer = durationMs
    this.character.setPath([])
    if (this.character.playAnimation) {
      this.character.playAnimation('Breathing_Idle', this.character.currentDirection, true)
    }
  }

  /**
   * Pick a random passable grid destination and command the character to walk there.
   */
  private triggerWanderStep(): void {
    const startX = this.character.tx
    const startY = this.character.ty

    const candidates: GridPoint[] = []

    const minX = Math.max(0, startX - this.maxRadius)
    const maxX = Math.min(this.width - 1, startX + this.maxRadius)
    const minY = Math.max(0, startY - this.maxRadius)
    const maxY = Math.min(this.height - 1, startY + this.maxRadius)

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x === startX && y === startY) continue
        const dist = Math.abs(x - startX) + Math.abs(y - startY)
        if (dist <= this.maxRadius && isPassableTile(this.gridCells, this.width, this.height, x, y)) {
          candidates.push({ x, y })
        }
      }
    }

    if (candidates.length === 0) {
      this.restTimer = 1500
      return
    }

    const target = candidates[Math.floor(Math.random() * candidates.length)]

    const path = findShortestPath(
      this.gridCells,
      this.width,
      this.height,
      { x: startX, y: startY },
      target
    )

    if (path.length > 1) {
      this.character.setPath(path)
      this.resetRestTimer()
    } else {
      this.restTimer = 1000
    }
  }

  private resetRestTimer(): void {
    const range = this.maxRestTimeMs - this.minRestTimeMs
    this.restTimer = this.minRestTimeMs + Math.random() * range
  }
}
