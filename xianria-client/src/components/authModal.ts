import './authModal.css'
import { authApi } from '../server/authApi'

const API_BASE = 'http://localhost:3000'

type AuthMode = 'login' | 'register' | 'guest'

export function mountAuthModal(
  app: HTMLElement,
  onSuccess: (launchUrl: string) => void,
): { unmount: () => void } {
  let currentMode: AuthMode = 'login'
  let bannerUrl: string | null = null

  async function loadBanner(): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/api/banners/latest`)
      const data = await res.json()
      if (data.url) {
        bannerUrl = `${API_BASE}${data.url}`
        const bannerEl = document.querySelector<HTMLDivElement>('.auth-banner')
        if (bannerEl) {
          bannerEl.innerHTML = `<img src="${bannerUrl}" alt="Game Banner" />`
          bannerEl.style.display = 'block'
        }
      }
    } catch {
      // Banner optional — ignore errors
    }
  }

  function render() {
    app.innerHTML = `
      <div class="auth-overlay">
        <div class="auth-modal">
          <div class="auth-banner"></div>
          <div class="auth-content">
            <div class="auth-tabs">
              <button class="auth-tab ${currentMode === 'login' ? 'active' : ''}" data-mode="login">Đăng nhập</button>
              <button class="auth-tab ${currentMode === 'register' ? 'active' : ''}" data-mode="register">Đăng ký</button>
              <button class="auth-tab ${currentMode === 'guest' ? 'active' : ''}" data-mode="guest">Khách</button>
            </div>

            <div class="auth-form" id="auth-form">
              ${renderForm()}
            </div>

            <div class="auth-error" id="auth-error"></div>
          </div>
          <div class="auth-footer">
            <span class="auth-footer-text">Bằng việc tiếp tục, bạn đồng ý với điều khoản của Xianria</span>
          </div>
        </div>
      </div>
    `
    wireEvents()
    if (bannerUrl) {
      const bannerEl = document.querySelector<HTMLDivElement>('.auth-banner')
      if (bannerEl) {
        bannerEl.innerHTML = `<img src="${bannerUrl}" alt="Game Banner" />`
        bannerEl.style.display = 'block'
      }
    }
  }

  function renderForm(): string {
    if (currentMode === 'guest') {
      return `
        <p class="auth-hint">Chơi ngay không cần tài khoản</p>
        <input type="text" id="auth-nickname" class="auth-input" placeholder="Nickname (tùy chọn)" maxlength="20" />
        <button class="auth-submit" id="auth-submit">Vào game</button>
      `
    }
    const isRegister = currentMode === 'register'
    return `
      <input type="text" id="auth-username" class="auth-input" placeholder="Username" autocomplete="username" />
      <input type="password" id="auth-password" class="auth-input" placeholder="Password" autocomplete="${isRegister ? 'new-password' : 'current-password'}" />
      <button class="auth-submit" id="auth-submit">${isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
    `
  }

  function wireEvents() {
    const tabs = app.querySelectorAll<HTMLButtonElement>('.auth-tab')
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        currentMode = tab.dataset.mode as AuthMode
        render()
      })
    })

    const submitBtn = app.querySelector<HTMLButtonElement>('#auth-submit')
    const errorEl = app.querySelector<HTMLDivElement>('#auth-error')
    submitBtn?.addEventListener('click', async () => {
      if (errorEl) errorEl.textContent = ''
      submitBtn.disabled = true
      submitBtn.textContent = '...'

      try {
        let result
        if (currentMode === 'guest') {
          const nickname = (app.querySelector<HTMLInputElement>('#auth-nickname')?.value || '').trim()
          result = await authApi.guest(nickname || undefined)
        } else {
          const username = (app.querySelector<HTMLInputElement>('#auth-username')?.value || '').trim()
          const password = app.querySelector<HTMLInputElement>('#auth-password')?.value || ''
          if (!username || !password) throw new Error('Vui lòng nhập đầy đủ')
          if (currentMode === 'register') {
            result = await authApi.register(username, password)
          } else {
            result = await authApi.login(username, password)
          }
        }
        authApi.setStoredUser(result.user)
        onSuccess(result.launchUrl)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra'
        if (errorEl) errorEl.textContent = msg
        submitBtn.disabled = false
        submitBtn.textContent = currentMode === 'guest' ? 'Vào game' : (currentMode === 'register' ? 'Tạo tài khoản' : 'Đăng nhập')
      }
    })

    const passwordInput = app.querySelector<HTMLInputElement>('#auth-password')
    passwordInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBtn?.click()
    })
    const usernameInput = app.querySelector<HTMLInputElement>('#auth-username')
    usernameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') passwordInput?.focus()
    })
  }

  render()
  loadBanner()

  return {
    unmount() {
      app.innerHTML = ''
    },
  }
}
