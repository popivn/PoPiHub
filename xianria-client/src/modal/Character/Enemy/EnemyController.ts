import { Application, Container, Graphics } from 'pixi.js'
import { GameplayController } from '../base/GameplayController'

/**
 * EnemyController — quản lý enemy cube (PixiJS).
 *
 * Tự quản lý:
 *  - PixiJS Application + cube 3D giả
 *  - Rotation, hit flash, attack animation
 *  - Collider + status bar (HP only)
 *  - Quy đổi tọa độ viewport ↔ PixiJS stage
 */

// === Cube config ===
const CUBE_SIZE = 80
const CUBE_HALF = CUBE_SIZE / 2

// Base width của cube gốc (trước scale)
const ENEMY_BASE_WIDTH = 80

export interface EnemyControllerConfig {
  /** Tên hiển thị */
  name?: string
}

export class EnemyController extends GameplayController {
  protected name = 'Cube'
  protected hasMp = false
  protected colliderClass = 'demo-collider-enemy'
  protected statusClass = 'demo-status-enemy'
  protected hpFillClass = 'demo-hp-fill-enemy'
  protected hp = 120
  protected maxHp = 120
  protected mp = 0
  protected maxMp = 0

  private pixiApp: Application | null = null
  private cubeContainer: Container | null = null
  private cubeFaces: Graphics[] = []
  private cubeRotation = 0
  private cubeHitFlash = 0
  private cubeAttackAnim = 0

  // Lưu vị trí slot hiện tại để tính offset attack
  private slotX = 0
  private slotY = 0

  mount(container: HTMLElement, config?: EnemyControllerConfig): void {
    this.container = container
    if (config?.name) this.name = config.name

    // Tạo PixiJS app
    this.pixiApp = new Application()
    this.pixiApp.init({
      backgroundAlpha: 0,
      width: container.clientWidth,
      height: container.clientHeight,
      antialias: true,
    }).then(() => {
      if (!this.pixiApp) return
      container.appendChild(this.pixiApp.canvas)
      this.initCube()
      this.pixiApp.ticker.add(() => this.updateCube())
    })
  }

  unmount(): void {
    if (this.pixiApp) {
      this.pixiApp.destroy(true, { children: true })
      this.pixiApp = null
    }
    this.cubeContainer = null
    this.cubeFaces = []
    if (this.colliderEl) {
      this.colliderEl.remove()
      this.colliderEl = null
    }
    if (this.statusEl) {
      this.statusEl.remove()
      this.statusEl = null
    }
    this.container = null
  }

  // === Cube creation ===
  private createCubeFace(color: number, alpha: number): Graphics {
    const g = new Graphics()
    g.rect(-CUBE_HALF, -CUBE_HALF, CUBE_SIZE, CUBE_SIZE)
    g.fill({ color, alpha })
    g.stroke({ color: 0xd4af37, width: 2, alpha: 0.6 })
    return g
  }

  private initCube(): void {
    if (!this.pixiApp) return
    this.cubeContainer = new Container()
    this.pixiApp.stage.addChild(this.cubeContainer)

    this.cubeFaces.push(this.createCubeFace(0xe94560, 0.85)) // trước
    this.cubeFaces.push(this.createCubeFace(0x8b2030, 0.7))  // sau
    this.cubeFaces.push(this.createCubeFace(0x4a9eff, 0.6))  // trên
    this.cubeFaces.push(this.createCubeFace(0x1a4060, 0.6))  // dưới
    this.cubeFaces.push(this.createCubeFace(0xd4af37, 0.5))  // trái
    this.cubeFaces.push(this.createCubeFace(0x8b7020, 0.5))  // phải

    this.cubeFaces.forEach((f) => this.cubeContainer!.addChild(f))
  }

  // === Cube animation ===
  private updateCube(): void {
    if (!this.cubeContainer || !this.cubeFaces.length) return

    const speed = this.cubeAttackAnim > 0 ? 0.05 : 0.012
    this.cubeRotation += speed
    const rotY = this.cubeRotation
    const rotX = this.cubeRotation * 0.6

    const cosY = Math.cos(rotY)
    const sinY = Math.sin(rotY)
    const cosX = Math.cos(rotX)
    const sinX = Math.sin(rotX)

    // Mặt trước
    this.cubeFaces[0].x = sinY * CUBE_HALF
    this.cubeFaces[0].y = -sinX * CUBE_HALF
    this.cubeFaces[0].scale.x = cosY
    this.cubeFaces[0].scale.y = cosX
    this.cubeFaces[0].alpha = 0.85 * Math.max(0.2, cosY * cosX)

    // Mặt sau
    this.cubeFaces[1].x = -sinY * CUBE_HALF
    this.cubeFaces[1].y = sinX * CUBE_HALF
    this.cubeFaces[1].scale.x = -cosY
    this.cubeFaces[1].scale.y = cosX
    this.cubeFaces[1].alpha = 0.5 * Math.max(0.1, -cosY * cosX)

    // Mặt phải
    this.cubeFaces[5].x = cosY * CUBE_HALF
    this.cubeFaces[5].y = sinX * sinY * CUBE_HALF
    this.cubeFaces[5].scale.x = Math.abs(sinY)
    this.cubeFaces[5].scale.y = cosX
    this.cubeFaces[5].alpha = 0.6 * Math.max(0.2, Math.abs(sinY))

    // Mặt trái
    this.cubeFaces[4].x = -cosY * CUBE_HALF
    this.cubeFaces[4].y = -sinX * sinY * CUBE_HALF
    this.cubeFaces[4].scale.x = Math.abs(sinY)
    this.cubeFaces[4].scale.y = cosX
    this.cubeFaces[4].alpha = 0.4 * Math.max(0.1, Math.abs(sinY))

    // Mặt trên
    this.cubeFaces[2].x = sinY * sinX * CUBE_HALF
    this.cubeFaces[2].y = -cosX * CUBE_HALF
    this.cubeFaces[2].scale.x = cosY
    this.cubeFaces[2].scale.y = Math.abs(sinX)
    this.cubeFaces[2].alpha = 0.6 * Math.max(0.2, Math.abs(sinX))

    // Mặt dưới
    this.cubeFaces[3].x = -sinY * sinX * CUBE_HALF
    this.cubeFaces[3].y = cosX * CUBE_HALF
    this.cubeFaces[3].scale.x = cosY
    this.cubeFaces[3].scale.y = Math.abs(sinX)
    this.cubeFaces[3].alpha = 0.4 * Math.max(0.1, Math.abs(sinX))

    this.cubeContainer.sortableChildren = true

    // Scale theo quy chuẩn collider width
    const baseScale = this.colliderWidth / ENEMY_BASE_WIDTH

    if (this.cubeHitFlash > 0) {
      this.cubeHitFlash -= 0.05
      const flash = this.cubeHitFlash
      this.cubeFaces.forEach((f) => { f.tint = 0xffffff - Math.floor(flash * 0x4444) })
      this.cubeContainer.scale.set(baseScale * (1 + flash * 0.15))
    } else {
      this.cubeFaces.forEach((f) => { f.tint = 0xffffff })
      this.cubeContainer.scale.set(baseScale)
    }

    if (this.cubeAttackAnim > 0) {
      this.cubeAttackAnim -= 0.04
    }

    // Cập nhật vị trí cube trong stage (quy đổi từ viewport)
    this.syncCubePosition()
  }

  // === Quy đổi tọa độ viewport → PixiJS stage ===
  private syncCubePosition(): void {
    if (!this.cubeContainer || !this.pixiApp) return
    const canvas = this.pixiApp.canvas
    const canvasRect = canvas.getBoundingClientRect()
    const scaleX = canvasRect.width / this.pixiApp.screen.width
    const scaleY = canvasRect.height / this.pixiApp.screen.height

    // Attack offset
    let attackOffset = 0
    if (this.cubeAttackAnim > 0) {
      const phase = 1 - this.cubeAttackAnim
      attackOffset = Math.sin(phase * Math.PI) * (this.pixiApp.screen.width * 0.32)
    }

    const targetLocalX = (this.slotX - canvasRect.left) * scaleX + (attackOffset * scaleX)
    const targetLocalY = (this.slotY - canvasRect.top) * scaleY - (this.colliderHeight / 2) * scaleY

    this.cubeContainer.x = targetLocalX
    this.cubeContainer.y = targetLocalY
  }

  // === Override placeSpriteAt — lưu slot position cho syncCubePosition ===
  protected placeSpriteAt(centerX: number, centerY: number): void {
    this.slotX = centerX
    this.slotY = centerY
  }

  // === Combat actions ===
  playAttack(_targetPos?: { x: number; y: number }): void { /* Enemy không dùng skill button */ }
  playAttack2(_targetPos?: { x: number; y: number }): void { /* Enemy không dùng skill button */ }
  playSpecSkill(_targetPos?: { x: number; y: number }): void { /* Enemy không dùng skill button */ }
  playIdle(): void { /* Cube luôn xoay — không có idle */ }

  hitFlash(): void {
    this.cubeHitFlash = 1
  }

  playEnemyAttack(): void {
    this.cubeAttackAnim = 1
  }
}
