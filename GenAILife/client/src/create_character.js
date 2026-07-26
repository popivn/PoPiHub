import { Application } from 'pixi.js';
import { CharacterBase } from './components/CharacterBase.js';

// Verify token
const token = localStorage.getItem('jwt_token');
if (!token) {
  window.location.href = '/login';
}

let app;
let charInstance;

async function initPreview() {
  const container = document.getElementById('create-canvas-container');
  if (!container) return;

  app = new Application();
  await app.init({
    width: 400,
    height: 400,
    backgroundColor: 0x060a14,
    antialias: true,
    resolution: window.devicePixelRatio || 1
  });
  container.appendChild(app.canvas);

  charInstance = new CharacterBase(app, getFormConfig());
  charInstance.container.scale.set(1.4);
  charInstance.container.x = 200;
  charInstance.container.y = 260;
  app.stage.addChild(charInstance.container);

  app.ticker.add((t) => {
    if (charInstance) charInstance.update(0, 0, t.deltaTime);
  });

  setupEvents();
  fetchCurrentPlayers();
}

function getFormConfig() {
  return {
    name: document.getElementById('input-player-name')?.value.trim() || 'Custom Hero',
    type: 'hero',
    helmet: document.getElementById('select-player-helmet')?.value || 'tech_visor',
    shield: document.getElementById('select-player-shield')?.value || 'star_shield',
    weapon: document.getElementById('select-player-weapon')?.value || 'laser_blade',
    themeColor: parseInt(document.getElementById('select-player-theme')?.value || '0x00f2fe')
  };
}

function setupEvents() {
  const inputs = ['input-player-name', 'select-player-helmet', 'select-player-shield', 'select-player-weapon', 'select-player-theme'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      if (charInstance) charInstance.updateConfig(getFormConfig());
    });
    el.addEventListener('input', () => {
      if (charInstance) charInstance.updateConfig(getFormConfig());
    });
  });

  const form = document.getElementById('form-create-character');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errBox = document.getElementById('create-error-alert');
      if (errBox) errBox.classList.add('hidden');

      const config = getFormConfig();

      try {
        const res = await fetch('/api/players', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify(config)
        });

        const data = await res.json();
        if (!res.ok) {
          if (errBox) {
            errBox.textContent = data.error || 'Tạo nhân vật thất bại!';
            errBox.classList.remove('hidden');
          }
          return;
        }

        // Save selected player config to localStorage and enter game
        localStorage.setItem('selected_player', JSON.stringify(data.player));
        window.location.href = '/';

      } catch (err) {
        if (errBox) {
          errBox.textContent = 'Lỗi kết nối Server!';
          errBox.classList.remove('hidden');
        }
      }
    });
  }
}

async function fetchCurrentPlayers() {
  try {
    const res = await fetch('/api/players', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (res.ok) {
      const data = await res.json();
      const badge = document.getElementById('player-count-badge');
      if (badge) {
        badge.innerHTML = `<i class="fa-solid fa-users mr-1"></i>Số nhân vật: ${data.players.length} / 3`;
      }
    }
  } catch (e) {}
}

initPreview();
