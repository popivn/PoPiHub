// Airborne state: vertical stretch (jelly pulled upward), eyes look down
// anticipating landing, shadow shrinks/fades with height above ground.
// On landing the landingImpulse (handled by idle/walk) provides the squash.
import type { SlimeAnimation } from '../AnimationBase';
import { toScreenDir, clamp, lerp } from '../AnimationBase';
import {
  JUMP_VELOCITY,
  JUMP_STRETCH,
  LANDING_SQUASH,
  EYE_TRACK_MAX,
  SHADOW_BASE_SCALE,
  SHADOW_LIFT_SHRINK,
  SHADOW_OPACITY_BASE,
  SHADOW_OPACITY_LIFTED,
  TILE_HEIGHT,
} from '../../../constants';

export class JumpAnimation implements SlimeAnimation {
  update(slime: any, view: any, _dt: number) {
    const speed = slime.smoothSpeed;
    const screenDir = toScreenDir(slime.facingVec);
    const moveAngle = Math.atan2(screenDir.y, screenDir.x);

    // Vertical stretch based on vertical velocity (faster = more stretched).
    const vStretch = clamp(Math.abs(slime.vz) / JUMP_VELOCITY, 0, 1) * JUMP_STRETCH;
    // Stretch vertically, squash horizontally (volume-preserving-ish).
    let scaleX = 1 - vStretch * 0.6;
    let scaleY = 1 + vStretch;

    // Blend in landing squash if any (shouldn't happen mid-air, but safe).
    const land = slime.landingImpulse * LANDING_SQUASH;
    scaleX += land;
    scaleY -= land * 0.8;

    // No procedural bounce in the air — the z position handles lift.
    // Small residual wobble for organic feel.
    const wobble = Math.sin(slime.phase * 8) * 0.02;
    scaleX += wobble;
    scaleY -= wobble;

    // Squash aligned with movement direction (lean into the jump).
    const squashAngleDeg = (moveAngle * 180) / Math.PI * clamp(speed / 2, 0, 1);

    view.bounce.style.transform = `translateY(0px)`;
    view.squash.style.transform = `rotate(${squashAngleDeg}deg) scale(${scaleX}, ${scaleY}) rotate(${-squashAngleDeg}deg)`;
    view.lean.style.transform = `rotate(0deg)`;

    // Eyes look downward (anticipating landing) + drift in movement direction.
    view.leftEyelid.style.opacity = '0';
    view.rightEyelid.style.opacity = '0';
    const eyeOffsetX = screenDir.x * EYE_TRACK_MAX * 0.5;
    const eyeOffsetY = 2 + screenDir.y * EYE_TRACK_MAX * 0.5; // bias downward
    view.leftPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;
    view.rightPupil.style.transform = `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`;

    // Shadow: stays on ground (dropped from body by height above ground).
    const heightAbove = slime.pos.z - slime.groundZ;
    const liftT = clamp(heightAbove / 2, 0, 1);
    const shadowDropPx = heightAbove * TILE_HEIGHT;
    const shadowScale = lerp(SHADOW_BASE_SCALE, SHADOW_LIFT_SHRINK, liftT);
    view.shadow.style.transform = `translateY(${shadowDropPx}px) scale(${shadowScale}, ${shadowScale})`;
    view.shadow.style.opacity = lerp(SHADOW_OPACITY_BASE, SHADOW_OPACITY_LIFTED, liftT).toFixed(3);

    // Far ambient shadow: fades but stays wider as a soft ground halo.
    view.shadowFar.style.transform = `translateY(${shadowDropPx * 0.9}px) scale(${1 + liftT * 0.2}, 1)`;
    view.shadowFar.style.opacity = lerp(0.45, 0.08, liftT).toFixed(3);
  }
}
