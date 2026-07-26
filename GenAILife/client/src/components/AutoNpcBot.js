import { CharacterBase } from '../components/CharacterBase.js';
import { AutoNpcPresets } from '../enums/AutoNpcEnum.js';

export class AutoNpcBot {
  constructor(app, config = AutoNpcPresets.CYBER_GUARDIAN) {
    this.app = app;
    this.config = config;

    // Create Character Instance
    this.character = new CharacterBase(app, config);
    this.character.container.scale.set(0.85);

    // Initial World Position
    this.worldPos = {
      wx: config.spawnWorldPos.wx,
      wy: config.spawnWorldPos.wy
    };

    // Autonomous Wandering AI State
    // Autonomous Navigation Target State (Driven by Server LLM)
    this.targetWorldPos = null;
    this.targetPoiName = null;
    this.intentGoal = null;
    this.hasArrived = true;
    this.moveTimer = 0;
    this.targetDir = { x: 0, y: 0 };
    this.actionCooldown = 0;
    this.lastState = 'idle';
  }

  /**
   * Set new navigation target received from Server LLM Spatial Brain
   */
  setTargetDestination(targetPos, poiName, goal) {
    if (!targetPos) return;
    this.targetWorldPos = { wx: targetPos.wx, wy: targetPos.wy };
    this.targetPoiName = poiName || 'Địa điểm mới';
    this.intentGoal = goal || `Di chuyển tới ${this.targetPoiName}`;
    this.hasArrived = false;
    this.broadcastAction('MOVE', `🚶 Đang đi tới: ${this.targetPoiName} (${this.intentGoal})`);
  }

  update(delta, playerWx, playerWy) {
    this.actionCooldown -= delta;

    if (this.config.isStationary) {
      this.targetDir.x = 0;
      this.targetDir.y = 0;
      this.character.riggedChar.currentAnim = 'idle';
      this.character.update(0, 0, delta);
      return;
    }

    // 🧠 Navigation toward Server LLM Target Destination
    if (this.targetWorldPos && !this.hasArrived) {
      const dx = this.targetWorldPos.wx - this.worldPos.wx;
      const dy = this.targetWorldPos.wy - this.worldPos.wy;
      const dist = Math.hypot(dx, dy);

      if (dist < 15) {
        // Arrived at destination
        this.hasArrived = true;
        this.targetDir.x = 0;
        this.targetDir.y = 0;
        this.broadcastAction('ARRIVED', `📍 Đã đến: ${this.targetPoiName}`);

        // Dispatch Custom Event to notify WebSocket network module
        window.dispatchEvent(new CustomEvent('agent_arrived', {
          detail: {
            agentId: this.config.id,
            poiName: this.targetPoiName,
            wx: this.worldPos.wx,
            wy: this.worldPos.wy
          }
        }));
      } else {
        // Steer directly toward targetWorldPos
        const angle = Math.atan2(dy, dx);
        this.targetDir.x = Math.cos(angle);
        this.targetDir.y = Math.sin(angle);
      }
    } else {
      // Idle at arrived destination
      this.targetDir.x = 0;
      this.targetDir.y = 0;
    }

    // Random auto slash attack animation
    if (this.actionCooldown <= 0 && Math.random() < 0.005) {
      this.character.riggedChar.currentAnim = 'slash';
      this.actionCooldown = 120;
      this.broadcastAction('ATTACK', 'Vung kiếm chém Laser!');
    }

    // Move in World coordinates
    if (this.targetDir.x !== 0 || this.targetDir.y !== 0) {
      this.worldPos.wx += this.targetDir.x * this.config.speed * delta;
      this.worldPos.wy += this.targetDir.y * this.config.speed * delta;

      // Flip Facing direction based on horizontal movement
      if (this.targetDir.x < 0) {
        this.character.container.scale.x = -0.85;
      } else if (this.targetDir.x > 0) {
        this.character.container.scale.x = 0.85;
      }

      if (this.actionCooldown <= 90) {
        this.character.riggedChar.currentAnim = 'run';
      }
    } else {
      if (this.actionCooldown <= 90) {
        this.character.riggedChar.currentAnim = 'idle';
      }
    }

    // Update internal character skeletal animation
    this.character.update(0, 0, delta);
  }

  // 📢 Broadcast NPC action out to On-Screen UI / Window Event
  broadcastAction(actionType, details) {
    if (this.lastState === actionType && actionType !== 'ATTACK') return;
    this.lastState = actionType;

    // Dispatch global custom event so any UI component can listen to NPC broadcasts
    window.dispatchEvent(new CustomEvent('npc_broadcast', {
      detail: {
        npcId: this.config.id,
        npcName: this.config.name,
        action: actionType,
        details: details,
        worldPos: { ...this.worldPos }
      }
    }));
  }
}
