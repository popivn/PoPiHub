import { TILE_WIDTH, TILE_HEIGHT, DEPTH_SCALE } from './constants';
import type { ScreenPosition, WorldPosition, Vec2, Direction } from './types';

// Isometric projection: classic 2:1 diamond.
// worldX grows toward screen bottom-right, worldY toward bottom-left,
// worldZ (height) lifts the object up on screen.
export function worldToScreen(p: WorldPosition, camera: Vec2): ScreenPosition {
  const isoX = (p.x - p.y) * (TILE_WIDTH / 2);
  const isoY = (p.x + p.y) * (TILE_HEIGHT / 2) - p.z * TILE_HEIGHT;
  return {
    x: isoX - camera.x,
    y: isoY - camera.y,
  };
}

// Depth used for z-index sorting. Larger depth = drawn in front.
export function depthOf(x: number, y: number, z: number): number {
  return Math.round((x + y + z) * DEPTH_SCALE);
}

// Convert a 2D input vector (x: right, y: down on screen-ish) into
// a world-space direction. We treat input.x as +east and input.y as +south
// in world terms, then map to the 8-way Direction enum.
export function vecToDirection(v: Vec2): Direction | null {
  if (v.x === 0 && v.y === 0) return null;
  const angle = Math.atan2(v.y, v.x); // -PI..PI, 0 = +x (east)
  const deg = (angle * 180) / Math.PI;
  // 8 sectors of 45deg.
  if (deg >= -22.5 && deg < 22.5) return 'east';
  if (deg >= 22.5 && deg < 67.5) return 'south-east';
  if (deg >= 67.5 && deg < 112.5) return 'south';
  if (deg >= 112.5 && deg < 157.5) return 'south-west';
  if (deg >= -67.5 && deg < -22.5) return 'north-east';
  if (deg >= -112.5 && deg < -67.5) return 'north';
  if (deg >= -157.5 && deg < -112.5) return 'north-west';
  return 'west';
}

// World-space unit direction vector for a Direction (for lean/lookahead).
export function directionVec(d: Direction): Vec2 {
  switch (d) {
    case 'east': return { x: 1, y: 0 };
    case 'west': return { x: -1, y: 0 };
    case 'north': return { x: 0, y: -1 };
    case 'south': return { x: 0, y: 1 };
    case 'north-east': return { x: 0.7071, y: -0.7071 };
    case 'north-west': return { x: -0.7071, y: -0.7071 };
    case 'south-east': return { x: 0.7071, y: 0.7071 };
    case 'south-west': return { x: -0.7071, y: 0.7071 };
  }
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Frame-rate independent smoothing factor: approaches target at rate per second.
export function damp(rate: number, dt: number): number {
  return 1 - Math.exp(-rate * dt);
}
