import { IsometricWorld } from './IsometricWorld';
import { SlimeController } from './character/SlimeController';
import { Camera } from './Camera';
import { InputController } from './character/control/InputController';
import { worldToScreen, depthOf } from './iso';
import { TILE_WIDTH, TILE_HEIGHT, WORLD_SIZE } from './constants';
import type { Vec2 } from './types';

// Orchestrates the whole scene: input -> slime controller -> camera -> projection -> render.
export class Game {
  private viewport: HTMLElement;
  private world = new IsometricWorld();
  private slime = new SlimeController();
  private camera = new Camera();
  private input = new InputController();

  private rafId = 0;
  private lastTime = 0;
  private running = false;
  private prevPos: Vec2 = { x: 0, y: 0 };
  private externalJump = false;

  constructor(viewport: HTMLElement) {
    this.viewport = viewport;
    viewport.classList.add('iso-viewport');
    viewport.appendChild(this.world.layer);

    // Slime lives in the world layer so it depth-sorts with trees/objects.
    this.world.layer.appendChild(this.slime.root);
    this.slime.root.classList.add('slime-root');

    this.input.attach(viewport);
    this.camera.setViewport(viewport.clientWidth, viewport.clientHeight);
    // Snap slime to ground height at start.
    this.slime.pos.z = this.world.heightAt(this.slime.pos.x, this.slime.pos.y);
    this.slime.groundZ = this.slime.pos.z;
    this.camera.snapTo({ x: this.slime.pos.x, y: this.slime.pos.y });
    this.placeInitial();
  }

  private placeInitial() {
    for (const obj of this.world.objects) {
      this.positionObject(obj.el, obj.x, obj.y, obj.z, obj.kind === 'tile');
    }
  }

  private positionObject(
    el: HTMLElement,
    wx: number,
    wy: number,
    wz: number,
    isTile: boolean,
  ) {
    const screen = worldToScreen({ x: wx, y: wy, z: wz }, this.camera.pos);
    if (isTile) {
      el.style.transform = `translate(${screen.x - TILE_WIDTH / 2}px, ${screen.y}px)`;
    } else {
      el.style.transform = `translate(${screen.x}px, ${screen.y + TILE_HEIGHT / 2}px) translate(-50%, -100%)`;
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.input.detach();
    // Remove the world layer (includes slime) to prevent duplicates
    // when React StrictMode re-mounts the component.
    if (this.world.layer.parentElement === this.viewport) {
      this.viewport.removeChild(this.world.layer);
    }
    this.viewport.classList.remove('iso-viewport');
  }

  resize() {
    this.camera.setViewport(this.viewport.clientWidth, this.viewport.clientHeight);
  }

  equipHat(id: string): boolean {
    return this.slime.hats.equip(id);
  }

  setInputEnabled(enabled: boolean) {
    this.input.setEnabled(enabled);
  }

  setSlimeType(type: string) {
    this.slime.setSlimeType(type);
  }

  // External jump trigger (mobile button). Ignored when input disabled.
  requestJump() {
    if (!this.input?.isEnabled()) return;
    this.externalJump = true;
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const intent = this.input.getIntent();
    const jump = this.input.consumeJump() || this.externalJump;
    this.externalJump = false;

    this.prevPos = { x: this.slime.pos.x, y: this.slime.pos.y };

    // Ground height beneath the slime (before moving).
    const groundZ = this.world.heightAt(this.slime.pos.x, this.slime.pos.y);
    this.slime.update(dt, intent, jump, groundZ);
    this.resolveCollision(this.prevPos);

    // After collision resolution, re-check ground height at new position.
    // If the slime moved to a different-height tile while grounded, snap.
    const newGroundZ = this.world.heightAt(this.slime.pos.x, this.slime.pos.y);
    if (this.slime.grounded && newGroundZ !== this.slime.pos.z) {
      // Stepped onto a different-height tile (shouldn't happen due to collision,
      // but handle gracefully by snapping).
      this.slime.pos.z = newGroundZ;
      this.slime.groundZ = newGroundZ;
    }

    const lookahead: Vec2 = {
      x: this.slime.facingVec.x * this.slime.smoothSpeed * 0.15,
      y: this.slime.facingVec.y * this.slime.smoothSpeed * 0.15,
    };
    this.camera.update(
      dt,
      { x: this.slime.pos.x, y: this.slime.pos.y },
      lookahead,
    );

    this.render();
    this.rafId = requestAnimationFrame(this.tick);
  };

  // Simple obstacle collision: slide along blocked tiles.
  private resolveCollision(prev: Vec2) {
    const nx = this.slime.pos.x;
    const ny = this.slime.pos.y;

    if (!this.world.isBlocked(nx, ny)) return;

    if (!this.world.isBlocked(prev.x, ny)) {
      this.slime.pos.x = prev.x;
      this.slime.physics.velocity.x = 0;
      return;
    }
    if (!this.world.isBlocked(nx, prev.y)) {
      this.slime.pos.y = prev.y;
      this.slime.physics.velocity.y = 0;
      return;
    }
    this.slime.pos.x = prev.x;
    this.slime.pos.y = prev.y;
    this.slime.physics.stop();
  }

  private render() {
    for (const obj of this.world.objects) {
      this.positionObject(obj.el, obj.x, obj.y, obj.z, obj.kind === 'tile');
    }
    // Project slime root at its actual z (body at correct height).
    // Shadow drops to ground inside the animation.
    const screen = worldToScreen(
      { x: this.slime.pos.x, y: this.slime.pos.y, z: this.slime.pos.z },
      this.camera.pos,
    );
    this.slime.root.style.transform = `translate(${screen.x}px, ${screen.y + TILE_HEIGHT / 2}px) translate(-50%, -100%)`;

    // Depth-sort world objects.
    this.world.applyDepth();
    // Sort slime with world objects by depth so trees in front overlap it.
    this.slime.root.style.zIndex = String(
      depthOf(this.slime.pos.x, this.slime.pos.y, this.slime.pos.z),
    );
  }
}

export { WORLD_SIZE };
