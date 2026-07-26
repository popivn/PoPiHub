import { Application, Container } from 'pixi.js';
import { CharacterBase } from './components/CharacterBase.js';
import { AutoNpcBot } from './components/AutoNpcBot.js';
import { AutoNpcPresets } from './enums/AutoNpcEnum.js';
import { IsoMapManager } from './iso/IsoMapManager.js';
import { toIso, fromIso } from './iso/IsoUtils.js';
import { NetworkClient } from './network/NetworkClient.js';
import { ChatFeature } from './features/ChatFeature.js';
import { ChroniclesFeature } from './features/ChroniclesFeature.js';

// DOM Elements - Main HUD
const fpsEl = document.getElementById('fps-counter');
const rendererTypeEl = document.getElementById('renderer-type');
const scannedUnitsEl = document.getElementById('scanned-units');
const culledUnitsEl = document.getElementById('culled-units');
const totalDiscoveredEl = document.getElementById('total-discovered');

// DOM Elements - Character Creator Modal
const btnOpenCreator = document.getElementById('btn-open-creator');
const btnCloseCreator = document.getElementById('btn-close-creator');
const creatorModal = document.getElementById('creator-modal');
const inputCharName = document.getElementById('input-char-name');
const selectCharRole = document.getElementById('select-char-role');
const selectHelmet = document.getElementById('select-helmet');
const selectShield = document.getElementById('select-shield');
const selectWeapon = document.getElementById('select-weapon');
const selectThemeColor = document.getElementById('select-theme-color');
const btnSaveJson = document.getElementById('btn-save-json');
const btnSpawnArena = document.getElementById('btn-spawn-arena');

// DOM Elements - Rigging Modal
const btnOpenRig = document.getElementById('btn-open-rig');
const btnCloseRig = document.getElementById('btn-close-rig');
const rigModal = document.getElementById('rig-modal');
const toggleWireframe = document.getElementById('toggle-wireframe');
const btnExportPose = document.getElementById('btn-export-pose');

// DOM Elements - Login Modal & Auth
const btnOpenLogin = document.getElementById('btn-open-login');
const loginModal = document.getElementById('login-modal');
const formLogin = document.getElementById('form-login');
const loginFormView = document.getElementById('login-form-view');
const userProfileView = document.getElementById('user-profile-view');
const loginUsernameInput = document.getElementById('login-username');
const loginPasswordInput = document.getElementById('login-password');
const loginErrorMsg = document.getElementById('login-error-msg');
const loginBtnText = document.getElementById('login-btn-text');
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profileCacheTag = document.getElementById('profile-cache-tag');
const btnLogout = document.getElementById('btn-logout');

let mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let mainApp, creatorApp, rigApp;
let mainRiggedHero = null;
let creatorCharInstance = null;
let modalRiggedHero = null;
let isoMapManager = null;
let isAuthenticated = false;
let networkClient = null;
let chatFeature = null;
let guideNpcRef = null;

const arenaCharacters = [];

async function init() {
  // 1. Initialize Main Pixi Application
  mainApp = new Application();
  await mainApp.init({
    resizeTo: window,
    backgroundColor: 0x03060d,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    preference: 'webgl',
  });
  document.getElementById('pixi-container').appendChild(mainApp.canvas);
  rendererTypeEl.textContent = mainApp.renderer.name.includes('WebGPU') ? 'WebGPU' : 'WebGL2';

  // Dynamic Isometric Map Manager with Circular Sight Range
  isoMapManager = new IsoMapManager(mainApp);
  mainApp.stage.addChild(isoMapManager.container);

  // Main Player Character
  mainRiggedHero = new CharacterBase(mainApp, {
    name: 'Cyber Knight',
    type: 'hero',
    helmet: 'tech_visor',
    shield: 'star_shield',
    weapon: 'laser_blade',
    themeColor: 0x00f2fe
  });
  mainRiggedHero.riggedChar.skeleton.showWireframe = false;
  mainRiggedHero.container.scale.set(0.9);

  // World coordinates
  const heroWorldState = {
    wx: 0,
    wy: 0,
    vx: 0,
    vy: 0,
    speed: 4.5,
    slashCooldown: 0
  };

  const screenCenterX = mainApp.screen.width / 2;
  const screenCenterY = mainApp.screen.height / 2;

  mainRiggedHero.container.x = screenCenterX;
  mainRiggedHero.container.y = screenCenterY;
  mainRiggedHero.worldPos = { wx: 0, wy: 0 };

  mainApp.stage.addChild(mainRiggedHero.container);
  arenaCharacters.push(mainRiggedHero);

  // Keyboard Movement State
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (!isAuthenticated) return;

    // 🛑 Ignore WASD movement when typing inside input/textarea fields (e.g. Chat Modal)
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
      return;
    }

    keys[e.code] = true;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!isAuthenticated) return;

    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement.isContentEditable) {
      keys[e.code] = false;
      return;
    }

    keys[e.code] = false;
  });

  // Track Mouse Pointer for Aiming
  window.addEventListener('pointermove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  });

  // Mouse Click Attack
  window.addEventListener('pointerdown', (e) => {
    if (!isAuthenticated) return;
    if (creatorModal.classList.contains('hidden') && rigModal.classList.contains('hidden') && mainRiggedHero) {
      mainRiggedHero.riggedChar.currentAnim = 'slash';
      heroWorldState.slashCooldown = 22;
    }
  });

  // 💬 Initialize Click-to-Chat & Bảng Kiến Văn Feature for Characters
  chatFeature = new ChatFeature(mainApp);
  const chroniclesFeature = new ChroniclesFeature(mainApp, chatFeature);

  chatFeature.onAiAgentClick = (character) => {
    chroniclesFeature.openChroniclesModal(character);
  };

  chatFeature.attachCharacterClick(mainRiggedHero);

  // Spawn Permanent Stationary Guide NPC at Spawn (0, 60)
  const guideNpc = new AutoNpcBot(mainApp, AutoNpcPresets.SPAWN_GUIDE_NPC);
  guideNpcRef = guideNpc;
  chatFeature.attachCharacterClick(guideNpc.character);
  mainApp.stage.addChild(guideNpc.character.container);

  const autoBots = [guideNpc];

  // Main Camera & Exploration Ticker Loop
  mainApp.ticker.add((ticker) => {
    const delta = ticker.deltaTime;

    // 🤖 Update Permanent Autonomous NPCs (Runs always, even without login)
    for (const bot of autoBots) {
      bot.update(delta, heroWorldState.wx, heroWorldState.wy);

      // Render positioning in Isometric space
      const centerX = mainApp.screen.width / 2;
      const centerY = mainApp.screen.height / 2;
      const dx = bot.worldPos.wx - heroWorldState.wx;
      const dy = bot.worldPos.wy - heroWorldState.wy;
      const iso = toIso(dx, dy);

      bot.character.container.x = centerX + iso.x;
      bot.character.container.y = centerY + iso.y;
    }

    if (!isAuthenticated) {
      // Pause player controls & stats when not logged in, but auto bots keep playing!
      return;
    }

    fpsEl.textContent = Math.round(mainApp.ticker.FPS);
    if (isoMapManager && isoMapManager.metrics) {
      scannedUnitsEl.textContent = `${isoMapManager.metrics.visibleCount} In Sight`;
      culledUnitsEl.textContent = `${isoMapManager.metrics.culledCount} Culled`;
      if (totalDiscoveredEl) {
        totalDiscoveredEl.textContent = `${isoMapManager.metrics.totalDiscovered} Total`;
      }
    }

    const centerX = mainApp.screen.width / 2;
    const centerY = mainApp.screen.height / 2;

    if (mainRiggedHero) {
      let screenMoveX = 0;
      let screenMoveY = 0;

      // WASD Visual Direction Mapping
      if (keys['KeyW'] || keys['ArrowUp']) screenMoveY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) screenMoveY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) screenMoveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) screenMoveX += 1;

      if (screenMoveX !== 0 && screenMoveY !== 0) {
        screenMoveX *= 0.7071;
        screenMoveY *= 0.7071;
      }

      // Convert visual screen movement to World velocity
      const worldMove = fromIso(screenMoveX, screenMoveY);
      heroWorldState.vx = worldMove.x * heroWorldState.speed;
      heroWorldState.vy = worldMove.y * heroWorldState.speed;

      // Update World position of player
      heroWorldState.wx += heroWorldState.vx * delta;
      heroWorldState.wy += heroWorldState.vy * delta;
      mainRiggedHero.worldPos.wx = heroWorldState.wx;
      mainRiggedHero.worldPos.wy = heroWorldState.wy;

      // Camera Follow: Player Hero stays centered on screen
      mainRiggedHero.container.x = centerX;
      mainRiggedHero.container.y = centerY;

      // Update Isometric Map Grid with Circular Sight Culling
      isoMapManager.update(heroWorldState.wx, heroWorldState.wy, centerX, centerY);

      // Facing Direction Flip based on Movement Direction only
      if (screenMoveX < 0) {
        mainRiggedHero.container.scale.x = -0.9;
      } else if (screenMoveX > 0) {
        mainRiggedHero.container.scale.x = 0.9;
      }

      if (heroWorldState.slashCooldown > 0) {
        const isMoving = screenMoveX !== 0 || screenMoveY !== 0;
        if (isMoving) {
          mainRiggedHero.riggedChar.currentAnim = 'run';
        } else {
          mainRiggedHero.riggedChar.currentAnim = 'idle';
        }
      }

      // Broadcast player position & animation to Online Server over WebSocket
      if (networkClient && networkClient.isReady) {
        networkClient.sendPosition(
          heroWorldState.wx,
          heroWorldState.wy,
          mainRiggedHero.riggedChar.currentAnim,
          mainRiggedHero.container.scale.x
        );
      }
    }

    // Position & Radial Culling for secondary spawned characters & Online Remote Players
    const maxSightDist = isoMapManager.sightRadius * 40;
    for (const char of arenaCharacters) {
      if (char !== mainRiggedHero && char.worldPos) {
        const dx = char.worldPos.wx - heroWorldState.wx;
        const dy = char.worldPos.wy - heroWorldState.wy;
        const distWorld = Math.hypot(dx, dy);

        if (distWorld > maxSightDist) {
          // Cull objects outside sight range (0 GPU cost!)
          char.container.visible = false;
        } else {
          char.container.visible = true;
          const iso = toIso(dx, dy);
          char.container.x = centerX + iso.x;
          char.container.y = centerY + iso.y;
        }
      }
      char.update(0, 0, delta);
    }
  });

  // Initialize Creator Studio, Rigging Studio & Auth Modal
  initCreatorModal();
  initRiggingModal();
  initAuthModal();
}

// 🔐 AUTH & JWT LOGIN MODAL LOGIC
function initAuthModal() {
  if (btnOpenLogin) {
    btnOpenLogin.addEventListener('click', () => {
      if (loginModal) loginModal.classList.remove('hidden');
    });
  }

  // Mandatory Login check on load
  checkSession();

  formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.classList.add('hidden');

    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        loginErrorMsg.textContent = data.error || 'Đăng nhập thất bại!';
        loginErrorMsg.classList.remove('hidden');
        return;
      }

      // Save JWT Token to localStorage
      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
      }

      // Login success
      setLoggedInState(data.user, false);
      loginModal.classList.add('hidden');
    } catch (err) {
      loginErrorMsg.textContent = 'Lỗi kết nối Server!';
      loginErrorMsg.classList.remove('hidden');
    }
  });

  const btnHudLogout = document.getElementById('btn-hud-logout');
  if (btnHudLogout) {
    btnHudLogout.addEventListener('click', async () => {
      const token = localStorage.getItem('jwt_token');
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {}
      localStorage.removeItem('jwt_token');
      setLoggedOutState();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      const token = localStorage.getItem('jwt_token');
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {}
      localStorage.removeItem('jwt_token');
      setLoggedOutState();
    });
  }
}

async function checkSession() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    setLoggedOutState();
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        // If user has NO players in DB -> Redirect to character creation page
        if (!data.hasPlayers && window.location.pathname !== '/create-character') {
          window.location.href = '/create-character';
          return;
        }

        setLoggedInState(data.user, data.cached);
        return;
      }
    }
    // Token invalid or expired
    localStorage.removeItem('jwt_token');
    setLoggedOutState();
  } catch (err) {
    setLoggedOutState();
  }
}

function setLoggedInState(user, isCached) {
  isAuthenticated = true;
  if (loginBtnText) loginBtnText.textContent = user.username;
  if (profileUsername) profileUsername.textContent = `${user.username} (${user.role})`;
  if (profileEmail) profileEmail.textContent = user.email;

  if (profileCacheTag) {
    profileCacheTag.innerHTML = isCached
      ? `<i class="fa-solid fa-bolt mr-1" style="color:#00ff88"></i>Session Cached via Redis`
      : `<i class="fa-solid fa-database mr-1" style="color:#00f2fe"></i>Loaded from PostgreSQL`;
  }

  // Populate Player Select Dropdown
  const selectPlayer = document.getElementById('select-active-player');
  const btnAddPlayer = document.getElementById('btn-add-new-player');

  if (selectPlayer && user.players && user.players.length > 0) {
    selectPlayer.innerHTML = user.players.map((p, idx) => 
      `<option value="${p.id}" class="bg-slate-900 text-white">${p.name} (${p.type})</option>`
    ).join('');

    // Apply selected player config to main hero
    const applySelectedPlayer = (playerId) => {
      const p = user.players.find(x => x.id === playerId) || user.players[0];
      if (p && mainRiggedHero) {
        const config = p.config_json || {};
        mainRiggedHero.updateConfig({
          name: p.name,
          type: p.type,
          helmet: config.helmet || 'tech_visor',
          shield: config.shield || 'star_shield',
          weapon: config.weapon || 'laser_blade',
          themeColor: typeof config.themeColor === 'number' ? config.themeColor : parseInt(config.themeColor || '0x00f2fe')
        });
      }
    };

    applySelectedPlayer(user.players[0].id);

    selectPlayer.onchange = (e) => {
      applySelectedPlayer(e.target.value);
    };
  }

  if (btnAddPlayer) {
    btnAddPlayer.onclick = () => {
      if (user.players && user.players.length >= 3) {
        alert('⚠️ Tài khoản của bạn đã đạt giới hạn tối đa 3 nhân vật!');
        return;
      }
      window.location.href = '/create-character';
    };
  }

  if (loginFormView) loginFormView.classList.add('hidden');
  if (userProfileView) {
    userProfileView.classList.remove('hidden');
    userProfileView.classList.add('flex');
  }

  // 🌐 CONNECT TO REALTIME MULTI-PLAYER WEBSOCKET SERVER
  if (!networkClient) {
    networkClient = new NetworkClient((msg) => {
      handleServerNetworkMessage(msg);
    });
    const activePlayer = (user.players && user.players.length > 0) ? user.players[0] : null;
    networkClient.connect(user, activePlayer);
  }
}

// 🌐 Handle Realtime WebSocket Messages from Server
const onlinePlayersMap = new Map(); // playerId -> CharacterBase instance

function handleServerNetworkMessage(msg) {
  switch (msg.type) {
    case 'CURRENT_PLAYERS': {
      msg.players.forEach(pData => spawnOrUpdateRemotePlayer(pData));
      break;
    }

    case 'PLAYER_JOINED': {
      spawnOrUpdateRemotePlayer(msg.player);
      break;
    }

    case 'PLAYER_MOVED': {
      const remoteChar = onlinePlayersMap.get(msg.playerId);
      if (remoteChar) {
        remoteChar.worldPos.wx = msg.wx;
        remoteChar.worldPos.wy = msg.wy;
        if (msg.anim) remoteChar.riggedChar.currentAnim = msg.anim;
        if (typeof msg.scaleX === 'number') remoteChar.container.scale.x = msg.scaleX;
      }
      break;
    }

    case 'PLAYER_ATTACKED': {
      const remoteChar = onlinePlayersMap.get(msg.playerId);
      if (remoteChar) {
        remoteChar.riggedChar.currentAnim = 'slash';
      }
      break;
    }

    case 'PLAYER_CHAT': {
      let senderChar = onlinePlayersMap.get(msg.senderId);
      if (!senderChar && mainRiggedHero && mainRiggedHero.config && mainRiggedHero.config.id === msg.senderId) {
        senderChar = mainRiggedHero;
      }
      if (!senderChar && guideNpcRef && (msg.senderId === '00000000-0000-0000-0000-0000000000b1' || msg.senderId === 'npc_genai1' || msg.senderName === 'GenAi1')) {
        senderChar = guideNpcRef.character;
      }

      if (senderChar && chatFeature) {
        chatFeature.showSpeechBubble(senderChar, msg.text);
      }
      break;
    }

    case 'AGENT_SET_TARGET': {
      if (guideNpcRef && (msg.agentId === '00000000-0000-0000-0000-0000000000b1' || msg.agentName === 'GenAi1')) {
        console.log(`🤖 [CLIENT RECEIVED AGENT TARGET] Destination: ${msg.targetPoi} (${msg.targetPos?.wx}, ${msg.targetPos?.wy}) | Goal: ${msg.goal}`);
        guideNpcRef.setTargetDestination(msg.targetPos, msg.targetPoi, msg.goal);
      }
      break;
    }

    case 'PLAYER_LEFT': {
      const remoteChar = onlinePlayersMap.get(msg.playerId);
      if (remoteChar) {
        mainApp.stage.removeChild(remoteChar.container);
        const index = arenaCharacters.indexOf(remoteChar);
        if (index > -1) arenaCharacters.splice(index, 1);
        onlinePlayersMap.delete(msg.playerId);
      }
      break;
    }
  }
}

// Listen for agent arrival event from AutoNpcBot and notify Server WS
window.addEventListener('agent_arrived', (e) => {
  if (networkClient && networkClient.isReady) {
    networkClient.send({
      type: 'AGENT_ARRIVED',
      agentId: e.detail.agentId,
      poiName: e.detail.poiName,
      wx: e.detail.wx,
      wy: e.detail.wy
    });
  }
});

// 💬 Send Chat Message over WebSocket when user chats with a character
window.addEventListener('character_chat_sent', (e) => {
  const { text, targetId, targetName } = e.detail;
  if (networkClient && networkClient.isReady) {
    networkClient.send({
      type: 'CHAT_MESSAGE',
      text: text,
      targetId: targetId,
      targetName: targetName
    });
  }
});

function spawnOrUpdateRemotePlayer(pData) {
  if (onlinePlayersMap.has(pData.id)) return;

  const config = pData.config || {};
  const remoteHero = new CharacterBase(mainApp, {
    name: pData.name || pData.username,
    type: 'hero',
    helmet: config.helmet || 'tech_visor',
    shield: config.shield || 'star_shield',
    weapon: config.weapon || 'laser_blade',
    themeColor: typeof config.themeColor === 'number' ? config.themeColor : parseInt(config.themeColor || '0x00f2fe')
  });

  remoteHero.container.scale.set(0.9);
  remoteHero.worldPos = { wx: pData.wx || 0, wy: pData.wy || 0 };

  if (chatFeature) {
    chatFeature.attachCharacterClick(remoteHero);
  }

  mainApp.stage.addChild(remoteHero.container);
  arenaCharacters.push(remoteHero);
  onlinePlayersMap.set(pData.id, remoteHero);
}

function setLoggedOutState() {
  isAuthenticated = false;
  loginBtnText.textContent = 'Đăng Nhập';
  if (loginFormView) loginFormView.classList.remove('hidden');
  if (userProfileView) {
    userProfileView.classList.add('hidden');
    userProfileView.classList.remove('flex');
  }
  // Redirect to standalone login page only if not already on /login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

// 🎨 CHARACTER CREATOR MODAL LOGIC
async function initCreatorModal() {
  const container = document.getElementById('creator-canvas-container');

  creatorApp = new Application();
  await creatorApp.init({
    width: 480,
    height: 480,
    backgroundColor: 0x070a13,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(creatorApp.canvas);

  creatorCharInstance = new CharacterBase(creatorApp, getCreatorFormConfig());
  creatorCharInstance.container.scale.set(1.4);
  creatorCharInstance.container.x = 240;
  creatorCharInstance.container.y = 300;
  creatorApp.stage.addChild(creatorCharInstance.container);

  creatorApp.ticker.add((ticker) => {
    if (creatorCharInstance) {
      creatorCharInstance.update(0, 0, ticker.deltaTime);
    }
  });

  setupCreatorEvents();
}

function getCreatorFormConfig() {
  return {
    id: `char_custom_${Date.now()}`,
    name: inputCharName.value || 'Custom Hero',
    type: selectCharRole.value,
    helmet: selectHelmet.value,
    shield: selectShield.value,
    weapon: selectWeapon.value,
    themeColor: parseInt(selectThemeColor.value),
    hp: 100,
    maxHp: 100,
    attack: 30,
    speed: 5.5
  };
}

function setupCreatorEvents() {
  btnOpenCreator.addEventListener('click', () => {
    creatorModal.classList.remove('hidden');
  });

  btnCloseCreator.addEventListener('click', () => {
    creatorModal.classList.add('hidden');
  });

  const formElements = [inputCharName, selectCharRole, selectHelmet, selectShield, selectWeapon, selectThemeColor];
  formElements.forEach((el) => {
    el.addEventListener('change', () => {
      if (creatorCharInstance) {
        creatorCharInstance.updateConfig(getCreatorFormConfig());
      }
    });
    el.addEventListener('input', () => {
      if (creatorCharInstance) {
        creatorCharInstance.updateConfig(getCreatorFormConfig());
      }
    });
  });

  btnSaveJson.addEventListener('click', () => {
    if (creatorCharInstance) {
      const configJson = creatorCharInstance.exportConfigJSON();
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${creatorCharInstance.config.name.toLowerCase().replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert(`✅ Đã lưu cấu hình nhân vật mới vào file JSON!\n\n${configJson}`);
    }
  });

  btnSpawnArena.addEventListener('click', () => {
    const config = getCreatorFormConfig();
    const newChar = new CharacterBase(mainApp, config);
    newChar.container.scale.set(0.85);

    const playerWx = mainRiggedHero ? mainRiggedHero.worldPos.wx : 0;
    const playerWy = mainRiggedHero ? mainRiggedHero.worldPos.wy : 0;
    newChar.worldPos = {
      wx: playerWx + (Math.random() - 0.5) * 200,
      wy: playerWy + (Math.random() - 0.5) * 200
    };

    mainApp.stage.addChild(newChar.container);
    arenaCharacters.push(newChar);

    creatorModal.classList.add('hidden');
    alert(`⚔️ Đã thả nhân vật mới "${config.name}" vào Không gian Đấu Trường Isometric!`);
  });
}

// 🦴 RIGGING STUDIO MODAL LOGIC
async function initRiggingModal() {
  const container = document.getElementById('rig-canvas-container');

  rigApp = new Application();
  await rigApp.init({
    width: 480,
    height: 480,
    backgroundColor: 0x070a13,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  container.appendChild(rigApp.canvas);

  modalRiggedHero = new CharacterBase(rigApp, { name: 'Rigging Preview' });
  modalRiggedHero.riggedChar.skeleton.showWireframe = true;
  modalRiggedHero.container.scale.set(1.4);
  modalRiggedHero.container.x = 240;
  modalRiggedHero.container.y = 300;
  rigApp.stage.addChild(modalRiggedHero.container);

  rigApp.ticker.add((ticker) => {
    if (modalRiggedHero) {
      modalRiggedHero.update(0, 0, ticker.deltaTime);
      updateSliderValuesFromHero();
    }
  });

  setupRigModalEvents();
}

function setupRigModalEvents() {
  btnOpenRig.addEventListener('click', () => {
    rigModal.classList.remove('hidden');
  });

  btnCloseRig.addEventListener('click', () => {
    rigModal.classList.add('hidden');
  });

  toggleWireframe.addEventListener('change', (e) => {
    if (modalRiggedHero) {
      modalRiggedHero.riggedChar.skeleton.showWireframe = e.target.checked;
    }
  });

  document.querySelectorAll('.btn-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const anim = btn.dataset.anim;
      if (modalRiggedHero) {
        modalRiggedHero.riggedChar.currentAnim = anim;
      }
    });
  });

  document.querySelectorAll('.bone-slider').forEach((sliderInput) => {
    sliderInput.addEventListener('input', (e) => {
      const boneName = e.target.dataset.bone;
      const angle = parseFloat(e.target.value);

      if (modalRiggedHero) {
        modalRiggedHero.riggedChar.currentAnim = 'custom';
        modalRiggedHero.riggedChar.skeleton.setRotation(boneName, angle);
      }

      document.querySelectorAll('.btn-preset').forEach((b) => b.classList.remove('active'));
      const valDisplay = document.getElementById(`val-${boneName}`);
      if (valDisplay) valDisplay.textContent = `${angle}°`;
    });
  });

  btnExportPose.addEventListener('click', () => {
    if (modalRiggedHero) {
      const poseData = modalRiggedHero.riggedChar.getPose();
      const poseJson = JSON.stringify(poseData, null, 2);
      navigator.clipboard.writeText(poseJson);
      alert(`✅ Đã sao chép Pose Data (JSON) vào bộ nhớ tạm!\n\n${poseJson}`);
    }
  });
}

function updateSliderValuesFromHero() {
  if (!modalRiggedHero || modalRiggedHero.riggedChar.currentAnim === 'custom') return;

  const pose = modalRiggedHero.riggedChar.getPose();
  for (const [boneName, angle] of Object.entries(pose)) {
    const sliderInput = document.querySelector(`.bone-slider[data-bone="${boneName}"]`);
    const valDisplay = document.getElementById(`val-${boneName}`);
    if (sliderInput && valDisplay) {
      const roundedAngle = Math.round(angle);
      sliderInput.value = roundedAngle;
      valDisplay.textContent = `${roundedAngle}°`;
    }
  }
}

init();
