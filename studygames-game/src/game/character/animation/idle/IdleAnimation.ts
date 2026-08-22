// Idle state: subtle breathing + gentle vertical bob. Blends in residual
// motion stretch as speed decays so the handoff from walk -> idle stays smooth.
// Root is projected at pos.z by the renderer, so bounce only handles the
// procedural hop — the shadow drops to ground level separately.
import type { SlimeAnimation } from '../AnimationBase';
import { toScreenDir, clamp, lerp } from '../AnimationBase';
import {
  SQUASH_IDLE,
  SQUASH_MOVING_BASE,
  SQUASH_SPEED_FACTOR,
  SQUASH_MAX,
  LANDING_SQUASH,
  LEAN_MAX_DEG,
  LEAN_SPEED_REF,
  EYE_TRACK_MAX,
  SHADOW_BASE_SCALE,
  SHADOW_OPACITY_BASE,
  SLIME_BOUNCE_AMPLITUDE,
  SLIME_BOUNCE_FREQUENCY,
  TILE_HEIGHT,
} from '../../../constants';

export class IdleAnimation implements SlimeAnimation {
  update(slime: any, view: any, _dt: number) {
    const speed = slime.smoothSpeed;
    const speedT = clamp(speed / LEAN_SPEED_REF, 0, 1);
    const screenDir = toScreenDir(slime.facingVec);
    const moveAngle = Math.atan2(screenDir.y, screenDir.x);

    // Procedural idle bob only (z lift is in the projection).
    const bouncePx =
      -Math.abs(Math.sin(slime.phase * Math.PI * 2 * SLIME_BOUNCE_FREQUENCY)) *
      SLIME_BOUNCE_AMPLITUDE *
      TILE_HEIGHT;

    // Breathing squash, blended with residual motion stretch.
    const breathe =
      Math.sin(slime.phase * Math.PI * 2 * SLIME_BOUNCE_FREQUENCY) * SQUASH_IDLE;
    const motionStretch = clamp(
      SQUASH_MOVING_BASE + speed * SQUASH_SPEED_FACTOR,
      0,
      SQUASH_MAX,
    ) * speedT;
    const land = slime.landingImpulse * LANDING_SQUASH;

    const blend = clamp(speed / 1.5, 0, 1);
    const scaleX = lerp(1 + breathe, 1 + motionStretch - land, blend);
    const scaleY = lerp(1 - breathe, 1 - motionStretch * 0.7 + land, blend);
    const squashAngleDeg = (moveAngle * 180) / Math.PI * blend;

    const leanAngle = Math.sin(moveAngle) * LEAN_MAX_DEG * speedT * 0.4;

    view.bounce.style.transform = `translateY(${bouncePx}px)`;
    view.squash.style.transform = `rotate(${squashAngleDeg}deg) scale(${scaleX}, ${scaleY}) rotate(${-squashAngleDeg}deg)`;
    view.lean.style.transform = `rotate(${leanAngle}deg)`;

    // Eyes drift gently toward facing.
    view.leftEyelid.style.opacity = '0';
    view.rightEyelid.style.opacity = '0';
    const eyeOffsetX = screenDir.x * EYE_TRACK_MAX * (0.4 + 0.6 * speedT);
    const eyeOffsetY = screenDir.y * EYE_TRACK_MAX * (0.4 + 0.6 * speedT);
    const eyeDip = (1 - scaleY) * 2;
    view.leftPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY + eyeDip}px)`;
    view.rightPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY + eyeDip}px)`;

    // Shadow: on the ground (drop from body by height above ground).
    const heightAbove = slime.pos.z - slime.groundZ;
    const shadowDropPx = heightAbove * TILE_HEIGHT;
    const shadowStretch = 1 + motionStretch * 0.3;
    const shadowSquash = 1 - motionStretch * 0.15;
    const liftT = clamp(heightAbove / 2, 0, 1);
    const shadowScale = lerp(SHADOW_BASE_SCALE, 0.5, liftT);
    view.shadow.style.transform = `translateY(${shadowDropPx}px) rotate(${squashAngleDeg}deg) scale(${shadowScale * shadowStretch}, ${shadowScale * shadowSquash}) rotate(${-squashAngleDeg}deg)`;
    view.shadow.style.opacity = lerp(SHADOW_OPACITY_BASE, 0.12, liftT).toFixed(3);

    // Far ambient shadow: larger, softer, reacts less to motion lift.
    view.shadowFar.style.transform = `translateY(${shadowDropPx * 0.9}px)`;
    view.shadowFar.style.opacity = lerp(0.45, 0.15, liftT).toFixed(3);
  }
}
