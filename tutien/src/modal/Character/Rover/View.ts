import './Rover.css'
import idle1 from './Assets/indle/1.webp'
import atkBasic1 from './Assets/Atk_basic/1.webp'
import atkBasic2 from './Assets/Atk_basic_2/1.webp'
import specSkill1 from './Assets/Spec_Skill/1.webp'
import specSkill2 from './Assets/Spec_Skill/2.webp'

export interface RoverViewConfig {
  container: HTMLElement
  width?: number
  height?: number
}

export function createRoverView(config: RoverViewConfig): {
  el: HTMLDivElement
  setImage: (src: string) => void
  playAttack: (targetPos?: { x: number; y: number }) => void
  playAttack2: (targetPos?: { x: number; y: number }) => void
  playSpecSkill: (targetPos?: { x: number; y: number }) => void
  playIdle: () => void
  getPosition: () => { x: number; y: number }
  getBounds: () => { left: number; top: number; width: number; height: number }
  destroy: () => void
} {
  const el = document.createElement('div')
  el.className = 'rover-view'

  const frame = document.createElement('div')
  frame.className = 'rover-view-frame'

  const img = document.createElement('img')
  img.className = 'rover-view-sprite'
  img.src = idle1
  img.alt = 'Rover'
  img.draggable = false

  const shadow = document.createElement('div')
  shadow.className = 'rover-view-shadow'

  frame.appendChild(img)
  el.appendChild(shadow)
  el.appendChild(frame)
  config.container.appendChild(el)

  // === Thanh kiếm spec skill (2.webp) — bay từ trên xuống enemy theo góc 45° ===
  // === Biến thời gian (ms) — dễ chỉnh ===
  const SWORD_FLY_DURATION = 3500   // thời gian kiếm bay từ trên xuống enemy (tăng từ 2000ms lên 3500ms để bay chậm đẹp hơn)
  const SWORD_LINGER_DURATION = 1500 // thời gian kiếm tồn tại sau khi đâm (nhấp nháy + mờ dần)
  const SWORD_DURATION = SWORD_FLY_DURATION + SWORD_LINGER_DURATION // tổng thời gian (5000ms)
  const sword = document.createElement('img')
  sword.className = 'rover-spec-sword'
  sword.src = specSkill2
  sword.alt = ''
  sword.draggable = false
  document.body.appendChild(sword)

  // === Hiệu ứng flash sáng khi kiếm va chạm enemy ===
  const impactFlash = document.createElement('div')
  impactFlash.className = 'rover-sword-impact'
  document.body.appendChild(impactFlash)

  let swordTimer: ReturnType<typeof setTimeout> | null = null
  let impactTimer: ReturnType<typeof setTimeout> | null = null
  let attackTimer: ReturnType<typeof setTimeout> | null = null
  let dashTimer: ReturnType<typeof setTimeout> | null = null

  // === Biến thời gian animation (ms) — dễ chỉnh ===
  const ATTACK_DURATION = 1500      // tổng thời gian 1 đòn đánh
  const DASH_DURATION = 300          // thời gian dịch chuyển tới enemy
  const DASH_RETURN_DURATION = 400  // thời gian dịch chuyển về vị trí ban đầu
  const DASH_OFFSET_X = 60          // khoảng cách dừng bên PHẢI tâm enemy (px) — giúp Rover đứng sát viền phải collider kẻ địch

  function playAttack(targetPos?: { x: number; y: number }): void {
    console.info('[Rover] playAttack', { targetPos })
    if (attackTimer) clearTimeout(attackTimer)
    img.src = atkBasic1
    img.classList.add('rover-attacking')
    shadow.classList.add('rover-shadow-attacking')

    // Dash tới enemy
    if (targetPos) dashToEnemy(targetPos)

    attackTimer = setTimeout(() => {
      playIdle()
    }, ATTACK_DURATION)
  }

  function playAttack2(targetPos?: { x: number; y: number }): void {
    console.info('[Rover] playAttack2', { targetPos })
    if (attackTimer) clearTimeout(attackTimer)
    img.src = atkBasic2
    img.classList.add('rover-attacking')
    img.classList.add('rover-attacking-2')
    shadow.classList.add('rover-shadow-attacking')

    // Dash tới enemy
    if (targetPos) dashToEnemy(targetPos)

    attackTimer = setTimeout(() => {
      playIdle()
    }, ATTACK_DURATION)
  }

  function playSpecSkill(targetPos?: { x: number; y: number }): void {
    console.info('[Rover] playSpecSkill', { targetPos })
    if (attackTimer) clearTimeout(attackTimer)
    img.src = specSkill1
    img.classList.add('rover-attacking')
    img.classList.add('rover-spec-skill')
    shadow.classList.add('rover-shadow-attacking')
    shadow.classList.add('rover-shadow-spec')

    // === Kích hoạt thanh kiếm bay từ trên xuống enemy theo góc 45° ===
    if (targetPos) {
      launchSword(targetPos)
    }

    attackTimer = setTimeout(() => {
      playIdle()
    }, 2000)
  }

  /**
   * Thanh kiếm (2.webp) xuất hiện phía trên enemy, góc 45°, lao xuống trọng tâm enemy.
   * Góc dưới-phải của ảnh (đầu kiếm) sẽ trúng đúng trọng tâm enemy.
   * @param target  Tọa độ trọng tâm enemy (viewport)
   */
  function launchSword(target: { x: number; y: number }): void {
    if (swordTimer) clearTimeout(swordTimer)

    // Kích thước thực tế của ảnh kiếm
    const swordW = sword.offsetWidth || 600
    const swordH = sword.offsetHeight || 600

    // Điểm xuất phát: phía trên + lệch sang phải (góc 45° từ trên xuống)
    const flyDistance = 1500
    const startX = target.x + flyDistance  // lệch phải
    const startY = target.y - flyDistance   // phía trên

    // Điểm kết thúc: dịch target để góc dưới-trái (đầu kiếm) trúng trọng tâm enemy
    // translate(-50%, -50%) đặt tâm ảnh tại target → góc dưới-trái = target + (-W/2, H/2)
    // Muốn góc dưới-trái = target → tâm ảnh = target + (W/2, -H/2)
    // + Đâm sâu thêm: dịch điểm kết thúc theo hướng kiếm bay (45° xuống-trái)
    const PIERCE_DEPTH = 120 // px — đâm sâu vào enemy
    const pierceX = -PIERCE_DEPTH * Math.SQRT1_2 // ≈ -0.707 * depth
    const pierceY = PIERCE_DEPTH * Math.SQRT1_2
    const endX = target.x + swordW / 2 + pierceX
    const endY = target.y - swordH / 2 + pierceY

    // Điểm va chạm thực tế (đầu kiếm sau khi đâm sâu)
    const impactX = target.x + pierceX
    const impactY = target.y + pierceY

    // Đặt kiếm tại điểm xuất phát
    sword.style.left = `${startX}px`
    sword.style.top = `${startY}px`
    sword.style.transform = 'translate(-50%, -50%)'
    sword.style.opacity = '0'
    sword.classList.remove('is-flying')

    // Force reflow để restart animation
    void sword.offsetWidth

    // Kích hoạt animation
    sword.style.setProperty('--sword-duration', `${SWORD_DURATION}ms`)
    sword.style.setProperty('--sword-target-x', `${endX}px`)
    sword.style.setProperty('--sword-target-y', `${endY}px`)
    sword.style.setProperty('--sword-start-x', `${startX}px`)
    sword.style.setProperty('--sword-start-y', `${startY}px`)
    sword.classList.add('is-flying')

    // === Hiệu ứng flash sáng tại điểm va chạm (đầu kiếm đã đâm sâu) ===
    // Kiếm chạm enemy tại cuối giai đoạn bay
    const impactDelay = SWORD_FLY_DURATION * 0.95
    if (impactTimer) clearTimeout(impactTimer)
    impactFlash.style.left = `${impactX}px`
    impactFlash.style.top = `${impactY}px`
    impactFlash.classList.remove('is-active')
    // Force reflow
    void impactFlash.offsetWidth
    impactTimer = setTimeout(() => {
      impactFlash.classList.add('is-active')
    }, impactDelay)

    // Xóa kiếm sau khi animation xong
    swordTimer = setTimeout(() => {
      sword.classList.remove('is-flying')
      sword.style.opacity = '0'
    }, SWORD_DURATION)
  }

  function playIdle(): void {
    img.src = idle1
    img.classList.remove('rover-attacking')
    img.classList.remove('rover-attacking-2')
    img.classList.remove('rover-spec-skill')
    shadow.classList.remove('rover-shadow-attacking')
    shadow.classList.remove('rover-shadow-spec')
    // Reset dash transform
    el.style.transform = ''
  }

  /**
   * Dash sprite Rover tới gần enemy rồi quay về.
   * Player ở bên phải, enemy ở bên trái → dash sang trái (translateX âm).
   */
  function dashToEnemy(target: { x: number; y: number }): void {
    if (dashTimer) clearTimeout(dashTimer)

    // Vị trí hiện tại của sprite (viewport)
    const rect = el.getBoundingClientRect()
    const currentX = rect.left + rect.width / 2

    // Khoảng cách cần dịch trong screen-space (viewport px)
    // Rover ở bên phải, enemy ở bên trái.
    // Chúng ta muốn Rover dừng ở bên PHẢI tâm enemy 1 khoảng DASH_OFFSET_X (ví dụ: target.x + 60px)
    const deltaScreen = (target.x + DASH_OFFSET_X) - currentX

    // Vì container của Rover có transform scale (var(--char-scale)) để vừa collider,
    // nên dịch chuyển translateX trên child cũng bị nhân với scale.
    // Ta cần chia delta cho scale để bù trừ, giúp Rover di chuyển đúng khoảng cách thực tế trên màn hình.
    const scaleStr = config.container.style.getPropertyValue('--char-scale') || '1'
    const scale = parseFloat(scaleStr) || 0.5 // default 0.5 nếu chưa kịp set
    const deltaLocal = deltaScreen / scale

    // Set CSS variables cho animation
    el.style.setProperty('--dash-distance', `${deltaLocal}px`)
    el.style.setProperty('--dash-duration', `${DASH_DURATION}ms`)
    el.style.setProperty('--dash-return-duration', `${DASH_RETURN_DURATION}ms`)

    // Kích hoạt dash
    el.classList.remove('is-dashing')
    void el.offsetWidth // force reflow
    el.classList.add('is-dashing')

    // Quay về sau khi đánh xong
    dashTimer = setTimeout(() => {
      el.classList.remove('is-dashing')
      el.style.transform = ''
    }, ATTACK_DURATION)
  }

  return {
    el,
    setImage: (src: string) => { img.src = src },
    playAttack,
    playAttack2,
    playSpecSkill,
    playIdle,
    getPosition: () => {
      const rect = img.getBoundingClientRect()
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top),
      }
    },
    getBounds: () => {
      const rect = img.getBoundingClientRect()
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }
    },
    destroy: () => {
      if (attackTimer) clearTimeout(attackTimer)
      if (swordTimer) clearTimeout(swordTimer)
      if (impactTimer) clearTimeout(impactTimer)
      if (dashTimer) clearTimeout(dashTimer)
      sword.remove()
      impactFlash.remove()
    },
  }
}
