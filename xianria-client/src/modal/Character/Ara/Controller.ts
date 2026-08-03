import { createAraCard } from './Card'
import { createAraView } from './View'
import { GameplayController } from '../base/GameplayController'

export interface AraControllerConfig {
  /** Mount inside this container */
  container: HTMLElement
  /** Display mode: 'card' = card frame + sprite, 'sprite' = sprite only, 'card-only' = card frame without sprite */
  mode?: 'card' | 'sprite' | 'card-only'
  /** Character name for card header */
  name?: string
  /** Realm label for card header */
  realm?: string
  /** Level for card footer */
  level?: number
  /** Combat power for card footer */
  combatPower?: string
  /** Realm name for card footer */
  realmName?: string
  /** Custom attack callback (default: play attack animation) */
  onAttack?: () => void
  /** Custom attack 2 callback (default: play attack 2 animation) */
  onAttack2?: () => void
  /** Custom spec skill callback (default: play spec skill animation) */
  onSpecSkill?: () => void
}

export class AraController extends GameplayController {
  protected name = 'Ara'
  protected hasMp = true
  protected colliderClass = 'demo-collider-player'
  protected statusClass = 'demo-status-player'
  protected hp = 100
  protected maxHp = 100
  protected mp = 500
  protected maxMp = 500

  private card: ReturnType<typeof createAraCard> | null = null
  private view: ReturnType<typeof createAraView> | null = null

  mount(container: HTMLElement, config?: Omit<AraControllerConfig, 'container'>): void {
    this.container = container
    const mode = config?.mode ?? 'card'

    if (config?.name) this.name = config.name

    if (mode === 'sprite') {
      this.view = createAraView({ container })
      // Cấu hình container cho demo scene
      this.configureSpriteContainer(container)
    } else if (mode === 'card-only') {
      this.card = createAraCard({ container, ...config })
    } else {
      // 'card' mode - card frame with sprite inside
      // Wire onAttack to play attack animation on the view
      const onAttack = config?.onAttack ?? (() => this.playAttack())
      const onAttack2 = config?.onAttack2 ?? (() => this.playAttack2())
      const onSpecSkill = config?.onSpecSkill ?? (() => this.playSpecSkill())
      this.card = createAraCard({ container, ...config, onAttack, onAttack2, onSpecSkill })
      this.view = createAraView({ container: this.card.displayEl })
    }
  }

  unmount(): void {
    if (this.view && this.card) {
      this.card.displayEl.removeChild(this.view.el)
    } else if (this.view && this.container) {
      this.container.removeChild(this.view.el)
    }
    if (this.card && this.container) {
      this.container.removeChild(this.card.el)
    }
    if (this.colliderEl) {
      this.colliderEl.remove()
      this.colliderEl = null
    }
    if (this.statusEl) {
      this.statusEl.remove()
      this.statusEl = null
    }
    this.view = null
    this.card = null
    this.container = null
  }

  get el(): HTMLDivElement | null {
    return this.card?.el ?? this.view?.el ?? null
  }

  get displayEl(): HTMLDivElement | null {
    return this.card?.displayEl ?? null
  }

  setImage(src: string): void {
    this.view?.setImage(src)
  }

  playAttack(_targetPos?: { x: number; y: number }): void {
    this.view?.playAttack()
  }

  playAttack2(_targetPos?: { x: number; y: number }): void {
    this.view?.playAttack2()
  }

  playSpecSkill(_targetPos?: { x: number; y: number }): void {
    this.view?.playSpecSkill()
  }

  playIdle(): void {
    this.view?.playIdle()
  }

  /** Trả về tọa độ màn hình của đỉnh sprite */
  getPosition(): { x: number; y: number } | null {
    return this.view?.getPosition() ?? null
  }

  /** Debug bounds của sprite để vẽ collider */
  getBounds(): { left: number; top: number; width: number; height: number } | null {
    return this.view?.getBounds() ?? null
  }

  // === Override placeSpriteAt — định vị sprite DOM bên trong collider ===
  protected placeSpriteAt(centerX: number, centerY: number): void {
    if (!this.container) return
    const w = this.colliderWidth
    const h = this.colliderHeight
    this.container.style.left = `${centerX - w / 2}px`
    this.container.style.top = `${centerY - h}px`
  }

  // === Cấu hình container cho demo scene (sprite mode) ===
  private configureSpriteContainer(container: HTMLElement): void {
    container.style.position = 'fixed'
    container.style.width = `${this.colliderWidth}px`
    container.style.height = `${this.colliderHeight}px`
    container.style.display = 'flex'
    container.style.alignItems = 'flex-end'
    container.style.justifyContent = 'center'
    container.style.zIndex = '2'
    container.style.pointerEvents = 'none'
    // Scale sprite (280px gốc) để vừa collider height
    const spriteNaturalHeight = 280
    const scale = this.colliderHeight / spriteNaturalHeight
    container.style.setProperty('--char-scale', scale.toFixed(3))
    container.style.transform = `scale(var(--char-scale))`
    container.style.transformOrigin = 'bottom center'
  }
}
