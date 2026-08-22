// Shared interface + helpers used by every slime animation state.
// Animations are self-contained: each takes the controller (read-only state)
// and the shared view, and applies coordinated transforms for one frame.

import type { SlimeController } from '../SlimeController';
import type { SlimeView } from './SlimeView';
import type { Vec2 } from '../../types';

export interface SlimeAnimation {
  update(slime: SlimeController, view: SlimeView, dt: number): void;
}

// Project a world-space direction (east+, south+) to a screen-space unit vector
// so stretch/lean/eyes align with the isometric perspective.
export function toScreenDir(v: Vec2): Vec2 {
  const sx = v.x - v.y;
  const sy = v.x + v.y;
  const len = Math.hypot(sx, sy) || 1;
  return { x: sx / len, y: sy / len };
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
