import { createAraCard } from './Card'
import { createAraView } from './View'

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

export class AraController {
  private card: ReturnType<typeof createAraCard> | null = null
  private view: ReturnType<typeof createAraView> | null = null
  private container: HTMLElement | null = null

  mount(container: HTMLElement, config?: Omit<AraControllerConfig, 'container'>): void {
    this.container = container
    const mode = config?.mode ?? 'card'

    if (mode === 'sprite') {
      this.view = createAraView({ container })
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

  playAttack(): void {
    this.view?.playAttack()
  }

  playAttack2(): void {
    this.view?.playAttack2()
  }

  playSpecSkill(): void {
    this.view?.playSpecSkill()
  }

  playIdle(): void {
    this.view?.playIdle()
  }
}
