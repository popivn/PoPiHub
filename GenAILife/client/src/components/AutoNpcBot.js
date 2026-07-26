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
    this.moveTimer = 0;
    this.targetDir = { x: 0, y: 0 };
    this.actionCooldown = 0;
    this.lastState = 'idle';
  }

  update(delta, playerWx, playerWy) {
    this.moveTimer -= delta;
    this.actionCooldown -= delta;

    // 🧠 AI Autonomous Decision Making
    if (this.config.isStationary) {
      this.targetDir.x = 0;
      this.targetDir.y = 0;
      this.character.riggedChar.currentAnim = 'idle';
      this.character.update(0, 0, delta);
      return;
    }

    if (this.moveTimer <= 0) {
      // Soft tether to spawn: If too far (>400 units), steer back towards spawn
      const spawnWx = this.config.spawnWorldPos ? this.config.spawnWorldPos.wx : 0;
      const spawnWy = this.config.spawnWorldPos ? this.config.spawnWorldPos.wy : 0;
      const distFromSpawn = Math.hypot(this.worldPos.wx - spawnWx, this.worldPos.wy - spawnWy);

      if (distFromSpawn > 400) {
        // Steer back towards spawn
        const angle = Math.atan2(spawnWy - this.worldPos.wy, spawnWx - this.worldPos.wx);
        this.targetDir.x = Math.cos(angle);
        this.targetDir.y = Math.sin(angle);
        this.moveTimer = 80 + Math.random() * 80;
        this.broadcastAction('MOVE', `Quay trở lại khu vực trung tâm`);
      } else {
        const isMoving = Math.random() > 0.3;
        if (isMoving) {
          const angle = Math.random() * Math.PI * 2;
          this.targetDir.x = Math.cos(angle);
          this.targetDir.y = Math.sin(angle);
          this.moveTimer = 60 + Math.random() * 120;
          
          this.broadcastAction('MOVE', `Di chuyển hướng (${this.targetDir.x.toFixed(2)}, ${this.targetDir.y.toFixed(2)})`);
        } else {
          this.targetDir.x = 0;
          this.targetDir.y = 0;
          this.moveTimer = 40 + Math.random() * 60;

          this.broadcastAction('IDLE', 'Đứng yên quan sát xung quanh');
        }
      }
    }

    // Random auto slash attack animation
    if (this.actionCooldown <= 0 && Math.random() < 0.008) {
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
