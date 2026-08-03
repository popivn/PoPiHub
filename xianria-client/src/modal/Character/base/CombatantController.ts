/**
 * BaseCombatantController — base class cho mọi combatant trong demo scene.
 *
 * Mỗi controller (Ara, Rover, Enemy) kế thừa class này để tự quản lý:
 *  - Hộp collider (DOM element debug)
 *  - Thanh status (HP/MP) hiển thị trên đỉnh collider
 *  - Vị trí sprite/cube bên trong collider
 *
 * Scene chỉ cần gọi:
 *  1. mount() — tạo sprite
 *  2. createCollider() + createStatusBar() — tạo UI
 *  3. placeAt(x, y) — đặt vị trí theo slot
 *  4. updateStatus() — cập nhật HP/MP
 *  5. playAttack() / hitFlash() — điều khiển chiến đấu
 */

export interface ColliderSize {
  width: number
  height: number
}

export abstract class BaseCombatantController {
  protected container: HTMLElement | null = null
  protected colliderEl: HTMLDivElement | null = null
  protected statusEl: HTMLDivElement | null = null

  // Status bar inner refs
  protected hpBarEl: HTMLDivElement | null = null
  protected mpBarEl: HTMLDivElement | null = null
  protected hpTextEl: HTMLSpanElement | null = null
  protected mpTextEl: HTMLSpanElement | null = null

  // === Config — subclass override ===
  protected name = 'Unknown'
  protected colliderWidth = 90
  protected colliderHeight = 140
  protected hasMp = true
  /** CSS class thêm vào collider (vd: 'demo-collider-player') */
  protected colliderClass = ''
  /** CSS class thêm vào status bar (vd: 'demo-status-player') */
  protected statusClass = ''
  /** CSS class thêm vào HP fill (vd: 'demo-hp-fill-enemy') */
  protected hpFillClass = ''

  // === Stats — subclass override giá trị mặc định ===
  protected hp = 100
  protected maxHp = 100
  protected mp = 50
  protected maxMp = 50

  // === Abstract methods — subclass phải implement ===
  abstract mount(container: HTMLElement, config?: unknown): void
  abstract unmount(): void
  abstract playAttack(targetPos?: { x: number; y: number }): void
  abstract playAttack2(targetPos?: { x: number; y: number }): void
  abstract playSpecSkill(targetPos?: { x: number; y: number }): void
  abstract playIdle(): void

  // === Collider management ===
  createCollider(parent: HTMLElement): HTMLDivElement {
    if (this.colliderEl) this.colliderEl.remove()
    this.colliderEl = document.createElement('div')
    this.colliderEl.className = `demo-collider ${this.colliderClass}`.trim()
    parent.appendChild(this.colliderEl)
    return this.colliderEl
  }

  // === Status bar management ===
  createStatusBar(parent: HTMLElement): HTMLDivElement {
    if (this.statusEl) this.statusEl.remove()
    this.statusEl = document.createElement('div')
    this.statusEl.className = `demo-status ${this.statusClass}`.trim()
    this.statusEl.innerHTML = this.renderStatusBarHTML()
    parent.appendChild(this.statusEl)

    this.hpBarEl = this.statusEl.querySelector('.demo-hp-fill')
    this.mpBarEl = this.statusEl.querySelector('.demo-mp-fill')
    this.hpTextEl = this.statusEl.querySelector('.demo-hp-text')
    this.mpTextEl = this.statusEl.querySelector('.demo-mp-text')

    return this.statusEl
  }

  protected renderStatusBarHTML(): string {
    const hpFillCls = `demo-bar-fill demo-hp-fill ${this.hpFillClass}`.trim()
    const mpBar = this.hasMp
      ? `<div class="demo-bar-wrap">
          <div class="demo-bar-label">MP</div>
          <div class="demo-bar demo-mp-bar"><div class="demo-bar-fill demo-mp-fill"></div><span class="demo-mp-text">0/0</span></div>
        </div>`
      : ''
    return `
      <div class="demo-name">${this.name}</div>
      <div class="demo-bar-wrap">
        <div class="demo-bar-label">HP</div>
        <div class="demo-bar demo-hp-bar"><div class="${hpFillCls}"></div><span class="demo-hp-text">0/0</span></div>
      </div>
      ${mpBar}
    `
  }

  // === Positioning — đặt collider + status + sprite tại slot ===
  /**
   * Đặt toàn bộ (collider, status bar, sprite) tại vị trí slot.
   * @param centerX  Tọa độ X tâm slot (viewport)
   * @param centerY  Tọa độ Y tâm slot = đáy collider (viewport)
   * @param coordBox El hiển thị tọa độ (optional, scene quản lý)
   */
  placeAt(centerX: number, centerY: number, coordBox?: HTMLDivElement | null): void {
    const w = this.colliderWidth
    const h = this.colliderHeight

    // Collider: đáy trùng (centerX, centerY)
    if (this.colliderEl) {
      this.colliderEl.style.left = `${centerX - w / 2}px`
      this.colliderEl.style.top = `${centerY - h}px`
      this.colliderEl.style.width = `${w}px`
      this.colliderEl.style.height = `${h}px`
    }

    // Status bar: trên đỉnh collider
    const statusH = this.statusEl?.offsetHeight ?? 0
    if (this.statusEl) {
      this.statusEl.style.left = `${centerX}px`
      this.statusEl.style.top = `${centerY - h - 4}px`
    }

    // Coord box: trên đỉnh status bar
    if (coordBox) {
      coordBox.style.left = `${centerX}px`
      coordBox.style.top = `${centerY - h - 4 - statusH - 4}px`
    }

    // Sprite — subclass override
    this.placeSpriteAt(centerX, centerY)
  }

  /** Subclass override để định vị sprite/cube bên trong collider */
  protected placeSpriteAt(_centerX: number, _centerY: number): void {
    // default: không làm gì — subclass tự xử lý
  }

  // === Status update — dùng internal stats ===
  /** Cập nhật thanh HP/MP từ stats nội bộ */
  refreshStatus(): void {
    if (this.hpBarEl) this.hpBarEl.style.width = `${Math.max(0, (this.hp / this.maxHp) * 100)}%`
    if (this.mpBarEl && this.hasMp && this.maxMp > 0) this.mpBarEl.style.width = `${Math.max(0, (this.mp / this.maxMp) * 100)}%`
    if (this.hpTextEl) this.hpTextEl.textContent = `${Math.max(0, this.hp)}/${this.maxHp}`
    if (this.mpTextEl && this.hasMp && this.maxMp > 0) this.mpTextEl.textContent = `${Math.max(0, this.mp)}/${this.maxMp}`
  }

  // === Combat methods ===
  /** Nhận sát thương → giảm HP + refresh bar. Trả về HP còn lại */
  takeDamage(dmg: number): number {
    this.hp = Math.max(0, this.hp - dmg)
    this.refreshStatus()
    return this.hp
  }

  /** Tiêu hao MP. Trả về true nếu đủ MP */
  useMp(cost: number): boolean {
    if (this.mp < cost) return false
    this.mp -= cost
    this.refreshStatus()
    return true
  }

  /** Hồi MP. Trả về MP sau khi hồi */
  regenMp(amount: number): number {
    this.mp = Math.min(this.maxMp, this.mp + amount)
    this.refreshStatus()
    return this.mp
  }

  /** Reset stats về full */
  resetStats(): void {
    this.hp = this.maxHp
    this.mp = this.maxMp
    this.refreshStatus()
  }

  /** Kiểm tra đã chết */
  isDead(): boolean { return this.hp <= 0 }

  // === Getters ===
  getColliderEl(): HTMLDivElement | null { return this.colliderEl }
  getStatusEl(): HTMLDivElement | null { return this.statusEl }
  getColliderSize(): ColliderSize { return { width: this.colliderWidth, height: this.colliderHeight } }
  getName(): string { return this.name }
  getHp(): number { return this.hp }
  getMaxHp(): number { return this.maxHp }
  getMp(): number { return this.mp }
  getMaxMp(): number { return this.maxMp }

  // === Optional hooks — subclass có thể override ===
  /** Per-frame update (vd: cube rotation) */
  update?(): void
  /** Hit flash effect */
  hitFlash?(): void
  /** Bắt đầu animation tấn công (vd: cube lao sang phải) */
  playEnemyAttack?(): void
}
