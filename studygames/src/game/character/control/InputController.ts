import { JOYSTICK_DEADZONE, JOYSTICK_MAX_RADIUS } from '../../constants';
import type { Vec2, Direction } from '../../types';
import { vecToDirection } from '../../iso';

// Unified input: keyboard on desktop, virtual joystick on touch.
// Both produce a normalized intent vector in world space
// (x: east+, y: south+) so movement logic stays single-source.
export class InputController {
  private enabled = false; // disabled until login
  private keys = new Set<string>();
  private joystickActive = false;
  private joystickOrigin: Vec2 = { x: 0, y: 0 };
  private joystickVec: Vec2 = { x: 0, y: 0 };
  private jumpQueued = false;

  private joystickBase: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    const k = this.normalizeKey(e.key);
    this.keys.add(k);
    if (k === ' ' || k === 'Space' || e.code === 'Space') {
      this.jumpQueued = true;
      e.preventDefault();
    }
    this.updateKeyboardIntent();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (!this.enabled) {
      this.keys.clear();
      this.keyboardIntent = { x: 0, y: 0 };
      return;
    }
    this.keys.delete(this.normalizeKey(e.key));
    this.updateKeyboardIntent();
  };

  private normalizeKey(k: string): string {
    return k.length === 1 ? k.toLowerCase() : k;
  }

  private updateKeyboardIntent() {
    let x = 0;
    let y = 0;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) y += 1;
    const len = Math.hypot(x, y);
    if (len > 0) {
      x /= len;
      y /= len;
    }
    this.keyboardIntent = { x, y };
  }

  private keyboardIntent: Vec2 = { x: 0, y: 0 };

  private target: HTMLElement | null = null;

  attach(target: HTMLElement) {
    this.target = target;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('touchstart', this.onTouchStart, { passive: false });
    target.addEventListener('touchmove', this.onTouchMove, { passive: false });
    target.addEventListener('touchend', this.onTouchEnd, { passive: false });
    target.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
  }

  detach() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    if (this.target) {
      this.target.removeEventListener('touchstart', this.onTouchStart);
      this.target.removeEventListener('touchmove', this.onTouchMove);
      this.target.removeEventListener('touchend', this.onTouchEnd);
      this.target.removeEventListener('touchcancel', this.onTouchEnd);
      this.target = null;
    }
    if (this.joystickBase && this.joystickBase.parentElement) {
      this.joystickBase.parentElement.removeChild(this.joystickBase);
    }
    this.joystickBase = null;
    this.joystickKnob = null;
    this.jumpQueued = false;
  }

  private ensureJoystickUI(container: HTMLElement) {
    if (this.joystickBase) return;
    const base = document.createElement('div');
    base.className = 'joystick-base';
    const knob = document.createElement('div');
    knob.className = 'joystick-knob';
    base.appendChild(knob);
    container.appendChild(base);
    this.joystickBase = base;
    this.joystickKnob = knob;
  }

  private onTouchStart = (e: TouchEvent) => {
    if (!this.enabled) return;
    e.preventDefault();
    const t = e.touches[0];
    const container = e.currentTarget as HTMLElement;
    this.ensureJoystickUI(container);
    this.joystickActive = true;
    this.joystickOrigin = { x: t.clientX, y: t.clientY };
    if (this.joystickBase) {
      this.joystickBase.style.left = `${t.clientX}px`;
      this.joystickBase.style.top = `${t.clientY}px`;
      this.joystickBase.style.opacity = '1';
    }
    this.updateJoystick(t.clientX, t.clientY);
  };

  private onTouchMove = (e: TouchEvent) => {
    if (!this.joystickActive) return;
    e.preventDefault();
    const t = e.touches[0];
    this.updateJoystick(t.clientX, t.clientY);
  };

  private onTouchEnd = () => {
    this.joystickActive = false;
    this.joystickVec = { x: 0, y: 0 };
    if (this.joystickBase) this.joystickBase.style.opacity = '0';
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    }
  };

  private updateJoystick(clientX: number, clientY: number) {
    let dx = clientX - this.joystickOrigin.x;
    let dy = clientY - this.joystickOrigin.y;
    const dist = Math.hypot(dx, dy);
    if (dist > JOYSTICK_MAX_RADIUS) {
      dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
      dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
    }
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
    let nx = dx / JOYSTICK_MAX_RADIUS;
    let ny = dy / JOYSTICK_MAX_RADIUS;
    const mag = Math.hypot(nx, ny);
    if (mag < JOYSTICK_DEADZONE) {
      nx = 0;
      ny = 0;
    } else {
      const scaled = Math.min(1, (mag - JOYSTICK_DEADZONE) / (1 - JOYSTICK_DEADZONE));
      nx = (nx / mag) * scaled;
      ny = (ny / mag) * scaled;
    }
    this.joystickVec = { x: nx, y: ny };
  }

  getIntent(): Vec2 {
    if (!this.enabled) return { x: 0, y: 0 };
    if (this.joystickActive) return this.joystickVec;
    return this.keyboardIntent;
  }

  getDirection(): Direction | null {
    return vecToDirection(this.getIntent());
  }

  // External jump trigger (mobile button). Queues a jump for the next tick.
  queueJump() {
    this.jumpQueued = true;
  }

  // Consume the queued jump. Returns true once per press.
  consumeJump(): boolean {
    if (!this.enabled) return false;
    if (this.jumpQueued) {
      this.jumpQueued = false;
      return true;
    }
    return false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(value: boolean) {
    this.enabled = value;
    if (!value) {
      this.keys.clear();
      this.keyboardIntent = { x: 0, y: 0 };
      this.joystickActive = false;
      if (this.joystickBase) this.joystickBase.style.opacity = '0';
    }
  }
}
