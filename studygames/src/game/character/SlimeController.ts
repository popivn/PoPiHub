// SlimeController — owns the slime entity (world position, physics, facing,
// animation state machine) AND drives the active animation each frame.
// Sits at character/ root, same level as control/ and animation/.
//
// Pipeline per frame:
//   input intent + jump -> physics (horizontal + vertical) -> position
//   -> state machine -> pick animation -> animation.update() applies
//   coordinated visual transforms to the view.

import type { Direction, SlimeState, Vec2, WorldPosition } from '../types';
import { vecToDirection, directionVec } from '../iso';
import {
  WORLD_SIZE,
  SLIME_STOP_THRESHOLD,
  ACCEL_TO_MOVING_SPEED,
  MOVING_TO_DECEL_SPEED,
  GRAVITY,
  JUMP_VELOCITY,
  AIR_CONTROL,
  GROUND_SNAP_EPSILON,
  SLEEP_DELAY,
} from '../constants';
import { Physics, clampToWorld } from './control/Physics';
import { SlimeView } from './animation/SlimeView';
import type { SlimeAnimation } from './animation/AnimationBase';
import { IdleAnimation } from './animation/idle/IdleAnimation';
import { WalkAnimation } from './animation/walk/WalkAnimation';
import { JumpAnimation } from './animation/jump/JumpAnimation';
import { SleepAnimation } from './animation/sleep/SleepAnimation';
import { HatManager } from './hats/HatManager';

export class SlimeController {
  // ---- Entity state ----
  pos: WorldPosition = { x: 4, y: 4, z: 0 };
  readonly physics = new Physics();
  state: SlimeState = 'idle';
  facing: Direction = 'south';

  // Vertical physics.
  vz = 0;
  grounded = true;
  groundZ = 0; // height of ground beneath slime (set by Game each frame)

  // Smoothed values used by animations (continuous -> no snaps on state change).
  facingVec: Vec2 = { x: 0, y: 1 };
  smoothSpeed = 0;

  // Landing squash impulse (decays over time). 0..1.
  landingImpulse = 0;

  // Procedural phase accumulator (shared by idle/walk bounce).
  phase = 0;

  // Time spent idle (no input). After 3s, go to sleep.
  idleTime = 0;

  // ---- View + animations ----
  readonly view: SlimeView;
  readonly hats: HatManager;

  constructor(type = 'nature') {
    this.view = new SlimeView(type);
    this.hats = new HatManager(this.view.hatContainer);
  }
  private readonly idleAnim: SlimeAnimation = new IdleAnimation();
  private readonly walkAnim: SlimeAnimation = new WalkAnimation();
  private readonly jumpAnim: SlimeAnimation = new JumpAnimation();
  private readonly sleepAnim: SlimeAnimation = new SleepAnimation();

  private stateTime = 0;

  get root(): HTMLElement {
    return this.view.root;
  }

  get velocity(): Vec2 {
    return this.physics.velocity;
  }

  get speed(): number {
    return this.physics.speed;
  }

  // dt: delta time, intent: horizontal movement, jump: jump pressed this frame,
  // groundZ: height of the ground tile beneath the slime.
  update(dt: number, intent: Vec2, jump: boolean, groundZ: number) {
    this.groundZ = groundZ;

    // Wake from sleep on any input.
    const hasInput = intent.x !== 0 || intent.y !== 0 || jump;
    if (this.state === 'sleeping' && hasInput) {
      this.state = 'idle';
      this.stateTime = 0;
      this.idleTime = 0;
      (this.sleepAnim as SleepAnimation).reset();
      (this.sleepAnim as SleepAnimation).clear(this.view);
      this.resetEyes();
    }

    // 1. Jump impulse (only when grounded, or wakes from sleep).
    if (jump && this.grounded) {
      this.vz = JUMP_VELOCITY;
      this.grounded = false;
      this.state = 'jumping';
      this.stateTime = 0;
    }

    // 2. Horizontal physics (reduced acceleration in air).
    const airMul = this.grounded ? 1 : AIR_CONTROL;
    const scaledIntent: Vec2 = { x: intent.x * airMul, y: intent.y * airMul };
    this.physics.update(dt, scaledIntent);
    const speed = this.physics.speed;

    // 3. Vertical physics: gravity + integration.
    if (!this.grounded) {
      this.vz -= GRAVITY * dt;
    }
    this.pos.z += this.vz * dt;

    // Ground collision: if at or below ground level, snap and land.
    if (this.pos.z <= groundZ + GROUND_SNAP_EPSILON) {
      if (!this.grounded) {
        // Just landed — trigger squash impulse.
        this.landingImpulse = 1;
      }
      this.pos.z = groundZ;
      this.vz = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // 4. Position integration (clamped to world bounds).
    this.pos.x = clampToWorld(this.pos.x + this.physics.velocity.x * dt, WORLD_SIZE);
    this.pos.y = clampToWorld(this.pos.y + this.physics.velocity.y * dt, WORLD_SIZE);

    // 5. Facing from intent (keep last when no intent).
    const dir = vecToDirection(intent);
    if (dir) this.facing = dir;

    // Smooth facing vector + speed for gradual lean/eye/animation weighting.
    const targetVec = directionVec(this.facing);
    const k = 1 - Math.exp(-10 * dt);
    this.facingVec.x += (targetVec.x - this.facingVec.x) * k;
    this.facingVec.y += (targetVec.y - this.facingVec.y) * k;
    this.smoothSpeed += (speed - this.smoothSpeed) * (1 - Math.exp(-12 * dt));

    // Track idle time (no horizontal intent while grounded).
    const hasIntent = intent.x !== 0 || intent.y !== 0;
    if (this.grounded && !hasIntent) {
      this.idleTime += dt;
    } else {
      this.idleTime = 0;
    }

    // 6. Animation state machine.
    this.stateTime += dt;
    let next = this.state;

    if (!this.grounded) {
      // Airborne: jumping (ascending) or falling (descending / walked off edge).
      if (this.state !== 'jumping' && this.state !== 'falling') {
        next = 'falling'; // walked off an edge
      } else if (this.state === 'jumping' && this.vz <= 0) {
        next = 'falling'; // passed the peak
      }
    } else {
      // Grounded state machine.
      switch (this.state) {
        case 'idle':
          if (this.idleTime >= SLEEP_DELAY && this.stateTime >= SLEEP_DELAY) next = 'sleeping';
          else if (hasIntent && speed > 0.001) next = 'accelerating';
          break;
        case 'accelerating':
          if (speed >= ACCEL_TO_MOVING_SPEED) next = 'moving';
          else if (!hasIntent && speed < MOVING_TO_DECEL_SPEED) next = 'decelerating';
          break;
        case 'moving':
          if (!hasIntent) next = 'decelerating';
          else if (speed < MOVING_TO_DECEL_SPEED) next = 'accelerating';
          break;
        case 'decelerating':
          if (hasIntent && speed > 0.001) next = 'accelerating';
          else if (speed <= SLIME_STOP_THRESHOLD) next = 'idle';
          break;
        case 'jumping':
        case 'falling':
          // Just landed.
          next = 'landing';
          break;
        case 'landing':
          if (this.landingImpulse <= 0.05) next = hasIntent ? 'accelerating' : 'idle';
          break;
        case 'sleeping':
          if (hasInput) next = 'idle';
          break;
      }
    }

    if (next !== this.state) {
      this.state = next;
      this.stateTime = 0;
    }

    // Decay landing impulse.
    if (this.landingImpulse > 0) {
      this.landingImpulse = Math.max(0, this.landingImpulse - dt * 6);
    }

    // 7. Advance procedural phase.
    this.phase += dt;

    // 8. Dispatch to the active animation.
    let anim: SlimeAnimation;
    if (this.state === 'jumping' || this.state === 'falling') {
      anim = this.jumpAnim;
    } else if (this.state === 'accelerating' || this.state === 'moving') {
      anim = this.walkAnim;
    } else if (this.state === 'sleeping') {
      anim = this.sleepAnim;
    } else {
      anim = this.idleAnim;
    }
    anim.update(this, this.view, dt);
  }

  private resetEyes() {
    this.view.leftPupil.style.transform = 'translate(0, 0)';
    this.view.rightPupil.style.transform = 'translate(0, 0)';
    this.view.leftEyelid.style.opacity = '0';
    this.view.rightEyelid.style.opacity = '0';
  }

  setSlimeType(type: string) {
    this.view.setSlimeType(type);
  }
}
