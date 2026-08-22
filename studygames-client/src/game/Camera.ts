import type { Vec2 } from './types';
import { damp, lerp } from './iso';
import { CAMERA_SMOOTHING, CAMERA_LOOKAHEAD } from './constants';

// Smooth isometric camera that follows a target with lookahead.
export class Camera {
  pos: Vec2 = { x: 0, y: 0 };
  private target: Vec2 = { x: 0, y: 0 };
  private viewport: Vec2 = { x: 0, y: 0 };

  setViewport(w: number, h: number) {
    this.viewport = { x: w, y: h };
  }

  // targetWorld: world position to follow, lookaheadDir: movement direction (unit).
  update(dt: number, targetWorld: Vec2, lookaheadDir: Vec2) {
    // Convert world target to screen-space center offset.
    // We want the slime (+lookahead) centered, so camera = slimeScreen - viewport/2.
    const laX = lookaheadDir.x * CAMERA_LOOKAHEAD;
    const laY = lookaheadDir.y * CAMERA_LOOKAHEAD;
    // Project (worldX, worldY, 0) to iso screen coords.
    const TW = 64, TH = 32;
    const screenX = (targetWorld.x + laX - (targetWorld.y + laY)) * (TW / 2);
    const screenY = (targetWorld.x + laX + (targetWorld.y + laY)) * (TH / 2);
    this.target = {
      x: screenX - this.viewport.x / 2,
      y: screenY - this.viewport.y / 2,
    };
    const t = damp(CAMERA_SMOOTHING, dt);
    this.pos.x = lerp(this.pos.x, this.target.x, t);
    this.pos.y = lerp(this.pos.y, this.target.y, t);
  }

  snapTo(targetWorld: Vec2) {
    const TW = 64, TH = 32;
    const screenX = (targetWorld.x - targetWorld.y) * (TW / 2);
    const screenY = (targetWorld.x + targetWorld.y) * (TH / 2);
    this.pos = {
      x: screenX - this.viewport.x / 2,
      y: screenY - this.viewport.y / 2,
    };
    this.target = { ...this.pos };
  }
}
