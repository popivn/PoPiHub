import './mainGameUI.css'

export interface MainGameUI {
  toggle: HTMLButtonElement
}

let instance: MainGameUI | null = null

export function mountMainGameUI(onToggle?: (btn: HTMLButtonElement) => void): MainGameUI {
  if (instance) return instance

  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'kh-ctrl-toggle'
  toggle.setAttribute('aria-label', 'Mở thanh công cụ')
  toggle.setAttribute('aria-expanded', 'false')
  toggle.textContent = '▼'
  toggle.addEventListener('click', () => onToggle?.(toggle))

  document.body.appendChild(toggle)

  instance = { toggle }
  return instance
}

export function getMainGameUI(): MainGameUI | null {
  return instance
}
