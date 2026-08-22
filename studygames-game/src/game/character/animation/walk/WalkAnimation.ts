// Walk state: step-bounce + motion-aligned squash/stretch + lean + eye
// tracking + stretched shadow. Root is projected at pos.z by the renderer,
// so bounce only handles the procedural step hop.
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
  SLIME_STEP_BOUNCE_AMPLITUDE,
  SLIME_STEP_BOUNCE_FREQUENCY,
  SLIME_BOUNCE_FREQUENCY,
  TILE_HEIGHT,
} from '../../../constants';

export class WalkAnimation implements SlimeAnimation {
  update(slime: any, view: any, _dt: number) {
    const speed = slime.smoothSpeed;
    const speedT = clamp(speed / LEAN_SPEED_REF, 0, 1);
    const screenDir = toScreenDir(slime.facingVec);
    const moveAngle = Math.atan2(screenDir.y, screenDir.x);

    // Step bounce (procedural only; z lift is in the projection).
    const f = SLIME_STEP_BOUNCE_FREQUENCY;
    const amp = SLIME_STEP_BOUNCE_AMPLITUDE * (0.5 + 0.5 * speedT);
    const bouncePx =
      -Math.abs(Math.sin(slime.phase * Math.PI * 2 * f)) * amp * TILE_HEIGHT;

    // Motion stretch along movement axis; breathing blended at low speed.
    const breathe =
      Math.sin(slime.phase * Math.PI * 2 * SLIME_BOUNCE_FREQUENCY) * SQUASH_IDLE;
    const motionStretch = clamp(
      SQUASH_MOVING_BASE + speed * SQUASH_SPEED_FACTOR,
      0,
      SQUASH_MAX,
    ) * speedT;
    const land = slime.landingImpulse * LANDING_SQUASH;

    const breathBlend = clamp(1 - speed / 1.5, 0, 1);
    const stretchAxis = lerp(1 + motionStretch - land, 1 + breathe, breathBlend);
    const squashAxis = lerp(1 - motionStretch * 0.7 + land, 1 - breathe, breathBlend);
    const squashAngleDeg = (moveAngle * 180) / Math.PI;

    const leanAngle = Math.sin(moveAngle) * LEAN_MAX_DEG * speedT * 0.4;

    view.bounce.style.transform = `translateY(${bouncePx}px)`;
    view.squash.style.transform = `rotate(${squashAngleDeg}deg) scale(${stretchAxis}, ${squashAxis}) rotate(${-squashAngleDeg}deg)`;
    view.lean.style.transform = `rotate(${leanAngle}deg)`;

    // Eyes track movement direction.
    view.leftEyelid.style.opacity = '0';
    view.rightEyelid.style.opacity = '0';
    const eyeOffsetX = screenDir.x * EYE_TRACK_MAX * (0.4 + 0.6 * speedT);
    const eyeOffsetY = screenDir.y * EYE_TRACK_MAX * (0.4 + 0.6 * speedT);
    const eyeDip = (1 - squashAxis) * 2;
    view.leftPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY + eyeDip}px)`;
    view.rightPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY + eyeDip}px)`;

    // Shadow on ground, stretched along motion.
    const heightAbove = slime.pos.z - slime.groundZ;
    const shadowDropPx = heightAbove * TILE_HEIGHT;
    const liftT = clamp(heightAbove / 2, 0, 1);
    const shadowScale = lerp(SHADOW_BASE_SCALE, 0.5, liftT);
    const shadowStretch = 1 + motionStretch * 0.3;
    const shadowSquash = 1 - motionStretch * 0.15;
    view.shadow.style.transform = `translateY(${shadowDropPx}px) rotate(${squashAngleDeg}deg) scale(${shadowScale * shadowStretch}, ${shadowScale * shadowSquash}) rotate(${-squashAngleDeg}deg)`;
    view.shadow.style.opacity = lerp(0.32, 0.12, liftT).toFixed(3);

    // Far ambient shadow.
    view.shadowFar.style.transform = `translateY(${shadowDropPx * 0.9}px) rotate(${squashAngleDeg}deg) scale(${shadowStretch}, 1)`;
    view.shadowFar.style.opacity = lerp(0.45, 0.15, liftT).toFixed(3);
  }
}
