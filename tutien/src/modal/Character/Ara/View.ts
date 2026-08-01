import './Ara.css'
import idle1 from './Assets/indle/1.webp'
import atkBasic1 from './Assets/Atk_basic/1.webp'
import atkBasic2 from './Assets/Atk_basic_2/1.webp'
import specSkill1 from './Assets/Spec_Skill/1.webp'

export interface AraViewConfig {
  container: HTMLElement
  width?: number
  height?: number
}

export function createAraView(config: AraViewConfig): {
  el: HTMLDivElement
  setImage: (src: string) => void
  playAttack: () => void
  playAttack2: () => void
  playSpecSkill: () => void
  playIdle: () => void
} {
  const el = document.createElement('div')
  el.className = 'ara-view'

  const frame = document.createElement('div')
  frame.className = 'ara-view-frame'

  const img = document.createElement('img')
  img.className = 'ara-view-sprite'
  img.src = idle1
  img.alt = 'Ara'
  img.draggable = false

  const shadow = document.createElement('div')
  shadow.className = 'ara-view-shadow'

  frame.appendChild(img)
  el.appendChild(shadow)
  el.appendChild(frame)
  config.container.appendChild(el)

  let attackTimer: ReturnType<typeof setTimeout> | null = null

  function playAttack(): void {
    if (attackTimer) clearTimeout(attackTimer)
    img.src = atkBasic1
    img.classList.add('ara-attacking')
    shadow.classList.add('ara-shadow-attacking')

    // Return to idle after 1.5s
    attackTimer = setTimeout(() => {
      playIdle()
    }, 1500)
  }

  function playAttack2(): void {
    if (attackTimer) clearTimeout(attackTimer)
    img.src = atkBasic2
    img.classList.add('ara-attacking')
    img.classList.add('ara-attacking-2')
    shadow.classList.add('ara-shadow-attacking')

    // Return to idle after 1.5s
    attackTimer = setTimeout(() => {
      playIdle()
    }, 1500)
  }

  function playSpecSkill(): void {
    if (attackTimer) clearTimeout(attackTimer)
    img.src = specSkill1
    img.classList.add('ara-attacking')
    img.classList.add('ara-spec-skill')
    shadow.classList.add('ara-shadow-attacking')
    shadow.classList.add('ara-shadow-spec')

    // Return to idle after 2s (longer for ultimate)
    attackTimer = setTimeout(() => {
      playIdle()
    }, 2000)
  }

  function playIdle(): void {
    img.src = idle1
    img.classList.remove('ara-attacking')
    img.classList.remove('ara-attacking-2')
    img.classList.remove('ara-spec-skill')
    shadow.classList.remove('ara-shadow-attacking')
    shadow.classList.remove('ara-shadow-spec')
  }

  return {
    el,
    setImage: (src: string) => { img.src = src },
    playAttack,
    playAttack2,
    playSpecSkill,
    playIdle,
  }
}
