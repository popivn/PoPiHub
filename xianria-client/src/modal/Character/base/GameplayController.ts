import { BaseCombatantController } from './CombatantController'

/**
 * Skill interface chung cho mọi combatant.
 * play() nhận tọa độ trọng tâm target (viewport) — dùng cho skill có projectile (vd: kiếm).
 */
export interface GameplaySkill {
  name: string
  mpCost: number
  damage: number
  play: (targetPos?: { x: number; y: number }) => void
}

/**
 * GameplayController — quản lý luồng "chọn mục tiêu → chọn skill".
 *
 * Luồng tấn công:
 *  1. Player click vào enemy collider → selectTarget(enemy)
 *  2. Player click skill button → executeSkill(skill)
 *  3. Nếu chưa chọn mục tiêu → từ chối + thông báo
 *  4. Nếu đã chọn → play animation + áp dụng sát thương lên target
 *
 * Mỗi controller (Ara, Rover, Enemy) kế thừa class này để:
 *  - Tự quản lý mục tiêu của mình
 *  - Tự highlight khi bị chọn làm mục tiêu
 *  - Collider có thể click để chọn (khi là target hợp lệ)
 */
export abstract class GameplayController extends BaseCombatantController {
  // === Target state ===
  private _target: GameplayController | null = null
  private _selectable = true
  private _selected = false

  // === Callbacks — scene đăng ký để cập nhật UI ===
  /** Gọi khi target thay đổi (chọn mới / clear) */
  onTargetChange?: (target: GameplayController | null) => void
  /** Gọi khi một skill được thực thi thành công */
  onAttackExecuted?: (target: GameplayController, skill: GameplaySkill) => void
  /** Gọi khi cố tình tấn công mà chưa chọn mục tiêu */
  onNoTarget?: () => void

  // === Target selection ===
  /** Chọn mục tiêu — highlight target + clear highlight target cũ */
  selectTarget(target: GameplayController | null): void {
    // Clear highlight trên target cũ
    if (this._target && this._target !== target) {
      this._target.setSelected(false)
    }

    this._target = target

    // Highlight target mới
    if (target) {
      target.setSelected(true)
    }

    this.onTargetChange?.(target)
  }

  /** Clear mục tiêu đã chọn */
  clearTarget(): void {
    if (this._target) {
      this._target.setSelected(false)
    }
    this._target = null
    this.onTargetChange?.(null)
  }

  /** Kiểm tra đã chọn mục tiêu chưa */
  hasTarget(): boolean {
    return this._target !== null
  }

  /** Lấy mục tiêu hiện tại */
  getTarget(): GameplayController | null {
    return this._target
  }

  // === Selectable (có thể được chọn làm mục tiêu) ===
  isSelectable(): boolean { return this._selectable }
  setSelectable(value: boolean): void {
    this._selectable = value
    // Cập nhật cursor + pointer-events trên collider
    if (this.colliderEl) {
      this.colliderEl.style.cursor = value ? 'pointer' : 'default'
      this.colliderEl.style.pointerEvents = value ? 'auto' : 'none'
    }
  }

  // === Selected (đang bị chọn làm mục tiêu — highlight) ===
  isSelected(): boolean { return this._selected }
  private setSelected(value: boolean): void {
    this._selected = value
    if (this.colliderEl) {
      this.colliderEl.classList.toggle('is-targeted', value)
    }
  }

  // === Skill execution — yêu cầu mục tiêu ===
  /**
   * Thực thi skill — bắt buộc đã chọn mục tiêu.
   * @returns true nếu thành công, false nếu chưa chọn mục tiêu
   */
  executeSkill(skill: GameplaySkill): boolean {
    if (!this._target) {
      this.onNoTarget?.()
      return false
    }

    // Lấy trọng tâm collider của target (viewport tọa độ)
    const targetEl = this._target.getColliderEl()
    let targetPos: { x: number; y: number } | undefined
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect()
      targetPos = {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      }
    }

    // Play animation trên attacker — truyền tọa độ target cho spec skill
    if (targetPos) {
      skill.play(targetPos)
    } else {
      skill.play()
    }

    // Hit flash trên target
    this._target.hitFlash?.()

    // Thông báo cho scene áp dụng sát thương
    this.onAttackExecuted?.(this._target, skill)

    return true
  }

  // === Collider click → chọn mục tiêu ===
  /**
   * Bind click vào collider để scene biết "player muốn chọn controller này làm target".
   * Scene sẽ gọi playerController.selectTarget(this).
   */
  bindColliderClick(onClick: () => void): void {
    if (!this.colliderEl) return
    this.colliderEl.addEventListener('click', onClick)
  }

  /** Bỏ bind click khỏi collider */
  unbindColliderClick(): void {
    if (!this.colliderEl) return
    // Clone node để xóa toàn bộ event listeners
    const newEl = this.colliderEl.cloneNode(false) as HTMLDivElement
    // Copy style + class
    newEl.style.cssText = this.colliderEl.style.cssText
    newEl.className = this.colliderEl.className
    this.colliderEl.parentNode?.replaceChild(newEl, this.colliderEl)
    this.colliderEl = newEl
  }
}
