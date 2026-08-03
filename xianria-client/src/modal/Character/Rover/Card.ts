import './Card.css'

export interface RoverCardConfig {
  container: HTMLElement
  name?: string
  realm?: string
  level?: number
  combatPower?: string
  realmName?: string
  onAttack?: () => void
  onAttack2?: () => void
  onSpecSkill?: () => void
}

export function createRoverCard(config: RoverCardConfig): {
  el: HTMLDivElement
  displayEl: HTMLDivElement
} {
  const el = document.createElement('div')
  el.className = 'ara-card rover-card'

  // Border
  const border = document.createElement('div')
  border.className = 'ara-card-border'

  // Corners
  const corners = ['tl', 'tr', 'bl', 'br']
  for (const c of corners) {
    const corner = document.createElement('div')
    corner.className = `ara-card-corner ${c}`
    el.appendChild(corner)
  }

  // Header
  const header = document.createElement('div')
  header.className = 'ara-card-header'
  const name = document.createElement('span')
  name.className = 'ara-card-name'
  name.textContent = config.name ?? 'Rover'
  const realm = document.createElement('span')
  realm.className = 'ara-card-realm'
  realm.textContent = config.realm ?? 'Luyen Khi Ky'
  header.appendChild(name)
  header.appendChild(realm)

  // Display area (where sprite view mounts)
  const displayEl = document.createElement('div')
  displayEl.className = 'ara-card-display'

  // Footer
  const footer = document.createElement('div')
  footer.className = 'ara-card-footer'

  const stats = [
    { label: 'Cap', value: String(config.level ?? 45) },
    { label: 'Chien Luc', value: config.combatPower ?? '128,560' },
    { label: 'Canh Gioi', value: config.realmName ?? 'Luyen Khi' },
  ]

  stats.forEach((stat, i) => {
    if (i > 0) {
      const divider = document.createElement('div')
      divider.className = 'ara-card-divider'
      footer.appendChild(divider)
    }
    const statEl = document.createElement('div')
    statEl.className = 'ara-card-stat'
    const labelEl = document.createElement('span')
    labelEl.className = 'label'
    labelEl.textContent = stat.label
    const valueEl = document.createElement('span')
    valueEl.className = 'value'
    valueEl.textContent = stat.value
    statEl.appendChild(labelEl)
    statEl.appendChild(valueEl)
    footer.appendChild(statEl)
  })

  // Attack buttons
  const attackBtn = document.createElement('button')
  attackBtn.className = 'ara-card-attack-btn'
  attackBtn.textContent = 'Xem Thân Thú'
  console.info('[Rover Card] attackBtn created, onAttack=', typeof config.onAttack)
  attackBtn.addEventListener('click', () => {
    console.info('[Rover Card] attackBtn clicked')
    config.onAttack?.()
  })

  const attackBtn2 = document.createElement('button')
  attackBtn2.className = 'ara-card-attack-btn ara-card-attack-btn-2'
  attackBtn2.textContent = 'Xem Thân Thú 2'
  attackBtn2.addEventListener('click', () => {
    console.info('[Rover Card] attackBtn2 clicked')
    config.onAttack2?.()
  })

  const specSkillBtn = document.createElement('button')
  specSkillBtn.className = 'ara-card-attack-btn ara-card-spec-btn'
  specSkillBtn.textContent = 'Kỹ Năng Đặc Biệt'
  specSkillBtn.addEventListener('click', () => {
    console.info('[Rover Card] specSkillBtn clicked')
    config.onSpecSkill?.()
  })

  // Button rows
  const btnRow = document.createElement('div')
  btnRow.className = 'ara-card-btn-row'
  btnRow.appendChild(attackBtn)
  btnRow.appendChild(attackBtn2)

  const btnRow2 = document.createElement('div')
  btnRow2.className = 'ara-card-btn-row'
  btnRow2.appendChild(specSkillBtn)

  el.appendChild(border)
  el.appendChild(header)
  el.appendChild(displayEl)
  el.appendChild(footer)
  el.appendChild(btnRow)
  el.appendChild(btnRow2)
  config.container.appendChild(el)

  return { el, displayEl }
}
