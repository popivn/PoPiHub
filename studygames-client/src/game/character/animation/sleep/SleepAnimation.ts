// Sleeping state: deep slow breathing, body slumps slightly, eyes close
// ( pupils hide ), and 'Zzz' bubbles float up in a cycle.
import type { SlimeAnimation } from '../AnimationBase';
import {
  SQUASH_IDLE,
  LANDING_SQUASH,
  SLIME_BOUNCE_FREQUENCY,
  SLIME_BOUNCE_AMPLITUDE,
  TILE_HEIGHT,
} from '../../../constants';

export class SleepAnimation implements SlimeAnimation {
  private startTime = -1;

  update(slime: any, view: any, _dt: number) {
    const now = performance.now();
    if (this.startTime < 0) this.startTime = now;
    const elapsed = (now - this.startTime) / 1000;

    // Deeper, slower breath at ~1.2 Hz.
    const breathe =
      Math.sin(slime.phase * Math.PI * 2 * SLIME_BOUNCE_FREQUENCY * 0.5) *
      (SQUASH_IDLE * 1.4);
    const land = slime.landingImpulse * LANDING_SQUASH;
    const scaleX = 1 + breathe;
    const scaleY = 1 - breathe * 0.8 + land;

    // Slump the body a bit wider/shorter as it falls asleep.
    const sleepBlend = Math.min(1, elapsed / 0.6);
    const slumpX = 1 + sleepBlend * 0.08;
    const slumpY = 1 - sleepBlend * 0.06;

    const finalScaleX = scaleX * slumpX;
    const finalScaleY = scaleY * slumpY;

    // Very slow bob (almost no movement).
    const bouncePx =
      -Math.abs(Math.sin(slime.phase * Math.PI * 2 * 0.8)) *
      SLIME_BOUNCE_AMPLITUDE *
      0.5 *
      TILE_HEIGHT;

    view.bounce.style.transform = `translateY(${bouncePx}px)`;
    view.squash.style.transform = `scale(${finalScaleX}, ${finalScaleY})`;
    view.lean.style.transform = `rotate(0deg)`;

    // Eyes closed: show the eyelids.
    view.leftEyelid.style.opacity = '1';
    view.rightEyelid.style.opacity = '1';
    view.leftPupil.style.transform = `translate(0, 0)`;
    view.rightPupil.style.transform = `translate(0, 0)`;

    // Shadow on ground, normal scale.
    const shadowDropPx = slime.pos.z * TILE_HEIGHT;
    view.shadow.style.transform = `translateY(${shadowDropPx}px) scale(1, 1)`;
    view.shadow.style.opacity = '0.32';
    view.shadowFar.style.transform = `translateY(${shadowDropPx * 0.9}px)`;
    view.shadowFar.style.opacity = '0.45';

    // Zzz bubbles cycle: each one appears, floats up, fades out.
    for (let i = 0; i < view.sleepBubbles.length; i++) {
      const zzz = view.sleepBubbles[i];
      // Stagger the bubbles by 1.2s each.
      const t = (elapsed + i * 1.2) % 3.6;
      const progress = t / 1.8; // each bubble takes 1.8s to rise
      if (progress > 1) {
        zzz.style.opacity = '0';
      } else {
        const y = -progress * 42; // float up 42px
        const x = Math.sin(progress * Math.PI * 2 + i) * 6; // gentle wobble
        const opacity = Math.sin(progress * Math.PI); // fade in/out
        const scale = 0.6 + progress * 0.5;
        zzz.style.opacity = String(Math.max(0, opacity));
        zzz.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
      }
    }
  }

  reset() {
    this.startTime = -1;
  }

  // Called when leaving sleep to immediately hide all Zzz bubbles.
  clear(view: any) {
    for (const zzz of view.sleepBubbles) {
      zzz.style.opacity = '0';
      zzz.style.transform = 'translate(0, 0) scale(0.6)';
    }
  }
}
