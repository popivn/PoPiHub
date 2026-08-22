import type { Vec2 } from '../../types';
import { clamp } from '../../iso';
import {
  SLIME_MAX_SPEED,
  SLIME_ACCELERATION,
  SLIME_DECELERATION,
  SLIME_FRICTION,
} from '../../constants';

// Simple integrator with acceleration toward an intent, deceleration when
// no intent, and frame-rate-independent friction. All in tiles/second.
export class Physics {
  velocity: Vec2 = { x: 0, y: 0 };

  get speed(): number {
    return Math.hypot(this.velocity.x, this.velocity.y);
  }

  update(dt: number, intent: Vec2): Vec2 {
    const speed = this.speed;
    const hasIntent = intent.x !== 0 || intent.y !== 0;

    if (hasIntent) {
      const ax = intent.x * SLIME_ACCELERATION;
      const ay = intent.y * SLIME_ACCELERATION;
      this.velocity.x += ax * dt;
      this.velocity.y += ay * dt;
    } else if (speed > 0) {
      const decel = SLIME_DECELERATION * dt;
      const nx = this.velocity.x / speed;
      const ny = this.velocity.y / speed;
      const newSpeed = Math.max(0, speed - decel);
      this.velocity.x = nx * newSpeed;
      this.velocity.y = ny * newSpeed;
    }

    const frictionFrame = Math.pow(SLIME_FRICTION, dt * 60);
    this.velocity.x *= frictionFrame;
    this.velocity.y *= frictionFrame;

    const s = this.speed;
    if (s > SLIME_MAX_SPEED) {
      this.velocity.x = (this.velocity.x / s) * SLIME_MAX_SPEED;
      this.velocity.y = (this.velocity.y / s) * SLIME_MAX_SPEED;
    }

    return { x: this.velocity.x, y: this.velocity.y };
  }

  stop() {
    this.velocity = { x: 0, y: 0 };
  }
}

export function clampToWorld(v: number, max: number): number {
  return clamp(v, 0, max - 1);
}
