import { Application } from 'pixi.js';
import { CharacterBase } from './components/CharacterBase.js';

let app;
let character;
let isWireframe = false;
let currentAnim = 'idle';

async function initSpriteViewer() {
  const container = document.getElementById('sprite-canvas-container');
  if (!container) return;

  app = new Application();
  await app.init({
    width: 650,
    height: 600,
    backgroundColor: 0x060a14,
    antialias: true,
    resolution: window.devicePixelRatio || 1
  });
  container.appendChild(app.canvas);

  character = new CharacterBase(app, getGearConfig());
  character.container.scale.set(1.8);
  character.container.x = 325;
  character.container.y = 380;
  app.stage.addChild(character.container);

  app.ticker.add((t) => {
    if (character) {
      character.update(0, 0, t.deltaTime);
    }
  });

  setupUI();
}

function getGearConfig() {
  return {
    name: 'Sample 3/4 Sprite',
    type: 'hero',
    helmet: document.getElementById('select-helmet')?.value || 'tech_visor',
    shield: document.getElementById('select-shield')?.value || 'star_shield',
    weapon: document.getElementById('select-weapon')?.value || 'laser_blade',
    themeColor: parseInt(document.getElementById('select-theme')?.value || '0x00f2fe')
  };
}

function setupUI() {
  // Gear changes
  ['select-helmet', 'select-shield', 'select-weapon', 'select-theme'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      if (character) character.updateConfig(getGearConfig());
    });
  });

  // Wireframe toggle
  const wireframeBtn = document.getElementById('btn-toggle-wireframe');
  if (wireframeBtn) {
    wireframeBtn.addEventListener('click', () => {
      isWireframe = !isWireframe;
      if (character && character.riggedChar) {
        character.riggedChar.skeleton.showWireframe = isWireframe;
      }
      wireframeBtn.innerHTML = isWireframe
        ? `<i class="fa-solid fa-bone text-emerald-400"></i> Wireframe ON`
        : `<i class="fa-solid fa-bone"></i> Wireframe OFF`;
      wireframeBtn.className = isWireframe
        ? `text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/40 transition flex items-center gap-1.5`
        : `text-xs px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-medium hover:bg-cyan-500/30 transition flex items-center gap-1.5`;
    });
  }

  // Reset Pose
  const resetBtn = document.getElementById('btn-reset-pose');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setAnim('idle');
    });
  }

  // Tabs
  const tabBtnGear = document.getElementById('tab-btn-gear');
  const tabBtnAnim = document.getElementById('tab-btn-anim');
  const tabBtnBones = document.getElementById('tab-btn-bones');

  const secGear = document.getElementById('section-gear');
  const secAnim = document.getElementById('section-anim');
  const secBones = document.getElementById('section-bones');

  function switchTab(activeBtn, activeSec) {
    [tabBtnGear, tabBtnAnim, tabBtnBones].forEach(btn => {
      btn.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-400 hover:text-white";
    });
    activeBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg transition-all text-slate-900 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-md";

    [secGear, secAnim, secBones].forEach(sec => {
      sec.classList.add('hidden');
      sec.classList.remove('flex');
    });
    activeSec.classList.remove('hidden');
    activeSec.classList.add('flex');
  }

  tabBtnGear?.addEventListener('click', () => switchTab(tabBtnGear, secGear));
  tabBtnAnim?.addEventListener('click', () => switchTab(tabBtnAnim, secAnim));
  tabBtnBones?.addEventListener('click', () => switchTab(tabBtnBones, secBones));

  // Animations
  document.querySelectorAll('.btn-anim').forEach(btn => {
    btn.addEventListener('click', () => {
      const anim = btn.getAttribute('data-anim');
      setAnim(anim);

      document.querySelectorAll('.btn-anim').forEach(b => {
        b.className = "btn-anim py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 transition";
      });
      btn.className = "btn-anim py-2 px-3 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition";
    });
  });

  // Bone rotation sliders
  const bones = ['head', 'torso', 'upperArmR', 'upperArmL'];
  bones.forEach(b => {
    const slider = document.getElementById(`slider-${b}`);
    const label = document.getElementById(`val-${b}`);
    if (slider && label) {
      slider.addEventListener('input', () => {
        const val = parseFloat(slider.value);
        label.textContent = `${val}°`;
        if (character && character.riggedChar) {
          character.riggedChar.skeleton.setRotation(b, val);
        }
      });
    }
  });

  // Export JSON
  const exportBtn = document.getElementById('btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = character.exportConfigJSON();
      navigator.clipboard.writeText(json);
      const origText = exportBtn.innerHTML;
      exportBtn.innerHTML = `<i class="fa-solid fa-check text-emerald-400"></i> ĐÃ SAO CHÉP VÀO CLIPBOARD!`;
      setTimeout(() => exportBtn.innerHTML = origText, 2000);
    });
  }
}

function setAnim(animName) {
  currentAnim = animName;
  if (character && character.riggedChar) {
    character.riggedChar.currentAnim = animName;
  }
}

initSpriteViewer();
