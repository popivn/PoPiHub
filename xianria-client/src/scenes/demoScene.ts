import './demoScene.css'
import { AraController } from '../modal/Character/Ara'
import { RoverController } from '../modal/Character/Rover'
import { EnemyController } from '../modal/Character/Enemy'
import { GameplayController, type GameplaySkill } from '../modal/Character/base/GameplayController'

export type DemoCharacter = 'Ara' | 'Rover'

/**
 * Demo Scene — chiến đấu theo lượt (turn-based).
 *
 * Scene chỉ orchestrate:
 *  - Tạo controller cho player + enemy
 *  - Gọi placeAt() mỗi frame để đồng bộ vị trí theo slot
 *  - Quản lý lượt, skill, log, kết quả
 *
 * Mỗi controller tự quản lý:
 *  - Sprite/cube
 *  - Hộp collider
 *  - Thanh HP/MP
 */

// === State ===
let appEl: HTMLElement | null = null
let playerController: GameplayController | null = null
let enemyController: EnemyController | null = null
let onBackCallback: (() => void) | null = null

let currentTurn: 'player' | 'enemy' = 'player'
let battleEnded = false
let logEntries: string[] = []

// === DOM refs ===
let turnIndicator: HTMLDivElement | null = null
let logEl: HTMLDivElement | null = null
let skillBar: HTMLDivElement | null = null
let resultEl: HTMLDivElement | null = null
let playerCoordEl: HTMLSpanElement | null = null
let enemyCoordEl: HTMLSpanElement | null = null
let playerCoordBox: HTMLDivElement | null = null
let enemyCoordBox: HTMLDivElement | null = null
let coordRafId = 0

// === Combat logic ===
function addLog(msg: string): void {
  logEntries.unshift(msg)
  if (logEntries.length > 5) logEntries.pop()
  if (logEl) {
    logEl.innerHTML = logEntries.map((e) => `<div class="demo-log-line">${e}</div>`).join('')
  }
}

function updateTurnIndicator(): void {
  if (!turnIndicator) return
  if (battleEnded) return
  turnIndicator.textContent = currentTurn === 'player' ? 'Lượt của bạn' : 'Lượt kẻ địch...'
  turnIndicator.className = `demo-turn-indicator ${currentTurn === 'player' ? 'is-player' : 'is-enemy'}`
}

function setSkillsEnabled(enabled: boolean): void {
  if (!skillBar) return
  skillBar.querySelectorAll<HTMLButtonElement>('.demo-skill-btn').forEach((btn) => {
    btn.disabled = !enabled
  })
}

function checkBattleEnd(): boolean {
  if (playerController?.isDead()) {
    battleEnded = true
    showResult(false)
    return true
  }
  if (enemyController?.isDead()) {
    battleEnded = true
    showResult(true)
    return true
  }
  return false
}

function showResult(victory: boolean): void {
  if (!resultEl) return
  resultEl.classList.add('is-visible')
  resultEl.innerHTML = `
    <h2 class="demo-result-title ${victory ? 'is-win' : 'is-lose'}">
      ${victory ? 'Chiến thắng!' : 'Đã bại trận!'}
    </h2>
    <button class="demo-result-btn" id="demo-replay">Đánh lại</button>
  `
  setSkillsEnabled(false)
  if (turnIndicator) turnIndicator.textContent = ''
  resultEl.querySelector<HTMLButtonElement>('#demo-replay')?.addEventListener('click', () => {
    resetBattle()
  })
}

function resetBattle(): void {
  playerController?.resetStats()
  enemyController?.resetStats()
  battleEnded = false
  currentTurn = 'player'
  logEntries = []
  if (resultEl) {
    resultEl.classList.remove('is-visible')
    resultEl.innerHTML = ''
  }
  if (logEl) logEl.innerHTML = ''
  addLog('Trận đấu bắt đầu!')
  updateTurnIndicator()
  setSkillsEnabled(true)
}

// === Skills ===
function getSkills(): GameplaySkill[] {
  return [
    {
      name: 'Tấn công',
      mpCost: 0,
      damage: 15 + Math.floor(Math.random() * 10),
      play: (targetPos) => playerController?.playAttack(targetPos),
    },
    {
      name: 'Tấn công 2',
      mpCost: 10,
      damage: 25 + Math.floor(Math.random() * 15),
      play: (targetPos) => playerController?.playAttack2(targetPos),
    },
    {
      name: 'Kỹ năng đặc biệt',
      mpCost: 30,
      damage: 50 + Math.floor(Math.random() * 20),
      play: (targetPos) => playerController?.playSpecSkill(targetPos),
    },
  ]
}

function playerAction(skill: GameplaySkill): void {
  if (currentTurn !== 'player' || battleEnded) return
  if (!playerController) return

  // Bắt buộc chọn mục tiêu trước khi tấn công
  if (!playerController.hasTarget()) {
    addLog('Hãy chọn mục tiêu trước khi tấn công!')
    return
  }

  if (!playerController.useMp(skill.mpCost)) {
    addLog(`Không đủ MP cho ${skill.name}!`)
    return
  }

  setSkillsEnabled(false)

  // Thực thi skill — GameplayController tự play animation + hit flash target
  playerController.executeSkill(skill)

  const dmg = skill.damage
  enemyController?.takeDamage(dmg)
  addLog(`Bạn dùng ${skill.name} → ${dmg} sát thương`)

  // Clear target sau khi tấn công xong
  playerController.clearTarget()

  if (checkBattleEnd()) return

  // Chuyển lượt enemy sau 1.5s
  setTimeout(() => {
    currentTurn = 'enemy'
    updateTurnIndicator()
    enemyTurn()
  }, 1500)
}

function enemyTurn(): void {
  if (battleEnded) return
  setTimeout(() => {
    if (!enemyController || !playerController) return

    // Enemy tự chọn player làm mục tiêu
    enemyController.selectTarget(playerController)

    // Enemy tấn công
    enemyController.playEnemyAttack()
    const dmg = 10 + Math.floor(Math.random() * 15)
    playerController.takeDamage(dmg)
    addLog(`Kẻ địch tấn công → ${dmg} sát thương`)

    // Clear target enemy
    enemyController.clearTarget()

    if (checkBattleEnd()) return

    // Hồi 5 MP mỗi lượt
    playerController.regenMp(5)

    // Chuyển lượt player
    setTimeout(() => {
      currentTurn = 'player'
      updateTurnIndicator()
      setSkillsEnabled(true)
    }, 1200)
  }, 800)
}

// === Scene lifecycle ===
export function mountDemoScene(app: HTMLElement, character: DemoCharacter, onBack?: () => void): void {
  unmountDemoScene()
  appEl = app
  onBackCallback = onBack ?? null

  // Stats được quản lý bởi controller — không cần hardcode ở scene
  currentTurn = 'player'
  battleEnded = false
  logEntries = []

  app.innerHTML = `
  <div id="demo-scene">
    <!-- Đội hình chiến đấu: mỗi bên 2 trước + 3 sau -->
    <div class="demo-formation demo-formation-enemy" aria-label="Vị trí đội hình kẻ địch">
      <div class="formation-slot slot-front-1"></div>
      <div class="formation-slot slot-front-2"></div>
      <div class="formation-slot slot-back-1"></div>
      <div class="formation-slot slot-back-2"></div>
      <div class="formation-slot slot-back-3"></div>
    </div>
    <div class="demo-formation demo-formation-player" aria-label="Vị trí đội hình phe ta">
      <div class="formation-slot slot-front-1"></div>
      <div class="formation-slot slot-front-2"></div>
      <div class="formation-slot slot-back-1"></div>
      <div class="formation-slot slot-back-2"></div>
      <div class="formation-slot slot-back-3"></div>
    </div>

    <!-- Bên trái: kẻ địch (cube) — EnemyController tự tạo canvas -->
    <div id="demo-enemy-panel">
      <div id="demo-enemy-label">Kẻ địch</div>
    </div>

    <!-- Bên phải: nhân vật — PlayerController tự tạo sprite -->
    <div id="demo-char-panel">
      <div id="demo-char-container"></div>
    </div>

    <!-- Turn indicator -->
    <div class="demo-turn-indicator is-player">Lượt của bạn</div>

    <!-- Tọa độ 2 phe — hiện trên đầu (debug) -->
    <div class="demo-coord demo-coord-enemy" id="demo-enemy-coord-box">
      <span class="demo-coord-label">Enemy</span>
      <span class="demo-coord-value" id="demo-enemy-coord">--, --</span>
    </div>
    <div class="demo-coord demo-coord-player" id="demo-player-coord-box">
      <span class="demo-coord-label">Player</span>
      <span class="demo-coord-value" id="demo-player-coord">--, --</span>
    </div>

    <!-- Log chiến đấu -->
    <div class="demo-log"></div>

    <!-- Thanh skill -->
    <div class="demo-skill-bar">
      <button class="demo-skill-btn" data-skill="0">Tấn công <span class="demo-mp-cost">Free</span></button>
      <button class="demo-skill-btn" data-skill="1">Tấn công 2 <span class="demo-mp-cost">10 MP</span></button>
      <button class="demo-skill-btn demo-skill-spec" data-skill="2">Kỹ năng đặc biệt <span class="demo-mp-cost">30 MP</span></button>
    </div>

    <!-- Kết quả -->
    <div class="demo-result"></div>

    <!-- Nút quay lại -->
    <button id="demo-back-btn">&lsaquo; Thoát</button>
  </div>
  `

  // Lưu DOM refs
  turnIndicator = app.querySelector('.demo-turn-indicator')
  logEl = app.querySelector('.demo-log')
  skillBar = app.querySelector('.demo-skill-bar')
  resultEl = app.querySelector('.demo-result')
  playerCoordEl = app.querySelector('#demo-player-coord')
  enemyCoordEl = app.querySelector('#demo-enemy-coord')
  playerCoordBox = app.querySelector('#demo-player-coord-box')
  enemyCoordBox = app.querySelector('#demo-enemy-coord-box')

  const sceneEl = app.querySelector<HTMLDivElement>('#demo-scene')!

  // === Tạo Player Controller ===
  const charContainer = app.querySelector<HTMLDivElement>('#demo-char-container')!
  if (character === 'Ara') {
    playerController = new AraController()
  } else {
    playerController = new RoverController()
  }
  playerController.mount(charContainer, { mode: 'sprite', name: character })
  playerController.createCollider(sceneEl)
  playerController.createStatusBar(sceneEl)
  playerController.setSelectable(false) // Player không click chọn làm target

  // === Tạo Enemy Controller ===
  const enemyPanel = app.querySelector<HTMLDivElement>('#demo-enemy-panel')!
  enemyController = new EnemyController()
  enemyController.mount(enemyPanel, { name: 'Cube' })
  enemyController.createCollider(sceneEl)
  enemyController.createStatusBar(sceneEl)
  enemyController.setSelectable(true)

  // Click vào enemy collider → chọn làm mục tiêu
  enemyController.bindColliderClick(() => {
    if (currentTurn !== 'player' || battleEnded) return
    if (!playerController || !enemyController) return
    playerController.selectTarget(enemyController)
    addLog(`Đã chọn mục tiêu: ${enemyController.getName()}`)
  })

  // Callback khi player chọn/hủy mục tiêu
  playerController.onNoTarget = () => {
    addLog('Hãy chọn mục tiêu trước khi tấn công!')
  }

  // === Wire nút skill ===
  const skills = getSkills()
  app.querySelectorAll<HTMLButtonElement>('.demo-skill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.skill)
      const skill = skills[idx]
      if (skill) playerAction(skill)
    })
  })

  // === Nút thoát ===
  app.querySelector<HTMLButtonElement>('#demo-back-btn')!.addEventListener('click', () => {
    if (onBackCallback) onBackCallback()
  })

  addLog('Trận đấu bắt đầu!')
  playerController?.refreshStatus()
  enemyController?.refreshStatus()
  updateTurnIndicator()

  // === Update tọa độ + vị trí real-time ===
  startCoordUpdate()
}

function startCoordUpdate(): void {
  function updateCoords(): void {
    // Lấy DOM slot #1 của Player và Enemy làm mốc chân trận (center-bottom)
    const playerSlot = appEl?.querySelector<HTMLDivElement>('.demo-formation-player .slot-front-1')
    const enemySlot = appEl?.querySelector<HTMLDivElement>('.demo-formation-enemy .slot-front-1')

    if (!playerSlot || !enemySlot || !playerController || !enemyController) {
      coordRafId = requestAnimationFrame(updateCoords)
      return
    }

    const pRect = playerSlot.getBoundingClientRect()
    const pX = Math.round(pRect.left + pRect.width / 2)
    const pY = Math.round(pRect.top + pRect.height / 2)

    const eRect = enemySlot.getBoundingClientRect()
    const eX = Math.round(eRect.left + eRect.width / 2)
    const eY = Math.round(eRect.top + eRect.height / 2)

    // Cập nhật text tọa độ
    if (playerCoordEl) playerCoordEl.textContent = `${pX}, ${pY}`
    if (enemyCoordEl) enemyCoordEl.textContent = `${eX}, ${eY}`

    // Controller tự định vị collider + status + sprite
    playerController.placeAt(pX, pY, playerCoordBox)
    enemyController.placeAt(eX, eY, enemyCoordBox)

    coordRafId = requestAnimationFrame(updateCoords)
  }
  coordRafId = requestAnimationFrame(updateCoords)
}

export function unmountDemoScene(): void {
  if (coordRafId) cancelAnimationFrame(coordRafId)
  coordRafId = 0
  if (playerController) {
    playerController.unmount()
    playerController = null
  }
  if (enemyController) {
    enemyController.unmount()
    enemyController = null
  }
  if (appEl) appEl.innerHTML = ''
  appEl = null
  onBackCallback = null
  turnIndicator = null
  logEl = null
  skillBar = null
  resultEl = null
  playerCoordEl = null
  enemyCoordEl = null
  playerCoordBox = null
  enemyCoordBox = null
}
