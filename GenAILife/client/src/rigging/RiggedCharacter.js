import { Container, Graphics } from 'pixi.js';
import { Bone, Skeleton } from './Skeleton.js';

export class RiggedCharacter {
  constructor(app) {
    this.app = app;
    this.container = new Container();
    this.container.sortableChildren = true;

    this.skeleton = new Skeleton();
    this.parts = {};

    // Animation State
    this.currentAnim = 'idle';
    this.animTime = 0;

    this.buildShadow();
    this.buildSkeleton();
    this.buildBodyParts();
    
    // Add skeleton wireframe gizmo container at top Z layer
    this.skeleton.gizmoGraphics.zIndex = 100;
    this.container.addChild(this.skeleton.gizmoGraphics);
  }

  buildShadow() {
    const shadowG = new Graphics();
    shadowG.ellipse(0, 0, 24, 10).fill({ color: 0x000000, alpha: 0.45 });
    shadowG.zIndex = 0;
    this.container.addChild(shadowG);
  }

  buildSkeleton() {
    // 1. Root Hip Bone
    const hip = new Bone('hip', 10, 0);

    // 2. Torso (pointing straight UP, length 44)
    const torso = hip.addChild(new Bone('torso', 44, -90));

    // 3. Head (pointing straight UP, length 32)
    const head = torso.addChild(new Bone('head', 32, 0));

    // 4. Back Arm (ArmR - Right Shoulder -> Bắp tay -> Khuỷu tay -> Cánh tay -> Cổ tay)
    const upperArmR = torso.addChild(new Bone('upperArmR', 20, 180), -6, 18);
    const forearmR = upperArmR.addChild(new Bone('forearmR', 18, 0));
    const handR = forearmR.addChild(new Bone('handR', 40, -90));

    // 5. Front Arm (ArmL - Left Shoulder -> Bắp tay -> Khuỷu tay -> Cánh tay -> Khiên)
    const upperArmL = torso.addChild(new Bone('upperArmL', 20, 180), -6, -18);
    const forearmL = upperArmL.addChild(new Bone('forearmL', 18, 0));
    const handL = forearmL.addChild(new Bone('handL', 15, 0));

    // 6. Back Leg (LegR - Right Hip -> Đùi -> Đầu gối -> Cẳng chân -> Cổ chân)
    const thighR = hip.addChild(new Bone('thighR', 22, 90), 12, 0);
    const shinR = thighR.addChild(new Bone('shinR', 22, 0));
    const footR = shinR.addChild(new Bone('footR', 12, 0));

    // 7. Front Leg (LegL - Left Hip -> Đùi -> Đầu gối -> Cẳng chân -> Cổ chân)
    const thighL = hip.addChild(new Bone('thighL', 22, 90), -12, 0);
    const shinL = thighL.addChild(new Bone('shinL', 22, 0));
    const footL = shinL.addChild(new Bone('footL', 12, 0));

    this.skeleton.addRoot(hip);
  }

  buildBodyParts() {
    // 1. Back Arm (Right Arm)
    const upperArmRG = new Graphics();
    upperArmRG.roundRect(0, -5, 22, 10, 5).fill({ color: 0x1e293b }).stroke({ width: 2, color: 0x0284c7 });
    this.attachGraphicToBone('upperArmR', upperArmRG, 1);

    const forearmRG = new Graphics();
    forearmRG.roundRect(0, -4, 20, 8, 4).fill({ color: 0x334155 }).stroke({ width: 2, color: 0x0284c7 });
    forearmRG.circle(0, 0, 4).fill({ color: 0x00f2fe });
    this.attachGraphicToBone('forearmR', forearmRG, 2);

    // Laser Sword (Attached to Right Hand - Point 3)
    const swordG = new Graphics();
    swordG.rect(-4, -4, 12, 8).fill({ color: 0x64748b });
    swordG.rect(8, -9, 4, 18).fill({ color: 0x00f2fe });
    swordG.poly([12, -3, 12, 3, 50, 2, 58, 0, 50, -2]).fill({ color: 0x00f2fe }).stroke({ width: 2, color: 0xffffff });
    swordG.poly([13, -1.5, 13, 1.5, 55, 0]).fill({ color: 0xffffff });
    this.attachGraphicToBone('handR', swordG, 9);

    // 2. Back Leg (Right Leg)
    const thighRG = new Graphics();
    thighRG.roundRect(0, -6, 24, 12, 6).fill({ color: 0x1e293b }).stroke({ width: 2, color: 0x0284c7 });
    this.attachGraphicToBone('thighR', thighRG, 2);

    const shinRG = new Graphics();
    shinRG.roundRect(0, -5, 24, 10, 5).fill({ color: 0x0f172a }).stroke({ width: 2, color: 0x0284c7 });
    shinRG.circle(0, 0, 5).fill({ color: 0x38bdf8 });
    this.attachGraphicToBone('shinR', shinRG, 2);

    const footRG = new Graphics();
    footRG.roundRect(-2, -6, 14, 12, 4).fill({ color: 0x0284c7 });
    this.attachGraphicToBone('footR', footRG, 2);

    // 3. Torso Graphic
    const torsoG = new Graphics();
    torsoG.roundRect(0, -18, 44, 36, 10).fill({ color: 0x0f172a }).stroke({ width: 3, color: 0x00f2fe });
    torsoG.roundRect(6, -14, 32, 28, 6).fill({ color: 0x1e293b });
    torsoG.circle(22, 0, 9).fill({ color: 0x00f2fe }).stroke({ width: 2, color: 0xffffff });
    torsoG.roundRect(30, -24, 12, 10, 3).fill({ color: 0x3b82f6 });
    torsoG.roundRect(30, 14, 12, 10, 3).fill({ color: 0x3b82f6 });
    this.attachGraphicToBone('torso', torsoG, 3);

    // 4. Head Graphic
    const headG = new Graphics();
    headG.roundRect(0, -18, 34, 36, 14).fill({ color: 0x0f172a }).stroke({ width: 3, color: 0x38bdf8 });
    headG.roundRect(8, -13, 16, 26, 6).fill({ color: 0x00f2fe, alpha: 0.95 });
    headG.circle(16, -5, 2.5).fill({ color: 0xffffff });
    headG.circle(16, 5, 2.5).fill({ color: 0xffffff });
    this.attachGraphicToBone('head', headG, 4);

    // 5. Front Leg (Left Leg)
    const thighLG = new Graphics();
    thighLG.roundRect(0, -6, 24, 12, 6).fill({ color: 0x1e293b }).stroke({ width: 2.5, color: 0x00f2fe });
    this.attachGraphicToBone('thighL', thighLG, 5);

    const shinLG = new Graphics();
    shinLG.roundRect(0, -5, 24, 10, 5).fill({ color: 0x1e293b }).stroke({ width: 2.5, color: 0x00f2fe });
    shinLG.circle(0, 0, 5).fill({ color: 0x00f2fe });
    this.attachGraphicToBone('shinL', shinLG, 5);

    const footLG = new Graphics();
    footLG.roundRect(-2, -7, 16, 14, 4).fill({ color: 0x38bdf8 });
    this.attachGraphicToBone('footL', footLG, 5);

    // 6. Front Arm & Star Shield Graphic
    const upperArmLG = new Graphics();
    upperArmLG.roundRect(0, -6, 22, 12, 6).fill({ color: 0x334155 }).stroke({ width: 2, color: 0x00f2fe });
    this.attachGraphicToBone('upperArmL', upperArmLG, 6);

    const forearmLG = new Graphics();
    forearmLG.roundRect(0, -5, 20, 10, 5).fill({ color: 0x334155 }).stroke({ width: 2, color: 0x00f2fe });
    forearmLG.circle(0, 0, 4).fill({ color: 0x00f2fe });
    this.attachGraphicToBone('forearmL', forearmLG, 6);

    const shieldG = new Graphics();
    shieldG.poly([-16, -16, 16, -16, 12, 12, 0, 20, -12, 12]).fill({ color: 0x0284c7 }).stroke({ width: 3, color: 0x38bdf8 });
    shieldG.star(0, 0, 5, 8, 4).fill({ color: 0xffffff });
    this.attachGraphicToBone('handL', shieldG, 7);
  }

  attachGraphicToBone(boneName, graphic, zIndex = 1) {
    const bone = this.skeleton.getBone(boneName);
    if (!bone) return;

    const partContainer = new Container();
    partContainer.zIndex = zIndex;
    partContainer.addChild(graphic);
    this.container.addChild(partContainer);

    bone.displayObject = partContainer;
    this.parts[boneName] = graphic;
  }

  setPose(poseData) {
    for (const [boneName, angle] of Object.entries(poseData)) {
      this.skeleton.setRotation(boneName, angle);
    }
  }

  getPose() {
    const pose = {};
    for (const [name, bone] of this.skeleton.bonesMap.entries()) {
      pose[name] = bone.localRotation;
    }
    return pose;
  }

  update(x = 0, y = 0, delta = 1) {
    this.animTime += delta * 0.05;

    // Animation Presets
    if (this.currentAnim === 'idle') {
      const breathe = Math.sin(this.animTime * 2) * 2;
      const sway = Math.sin(this.animTime * 1.5) * 3;
      
      this.skeleton.setRotation('torso', -90 + breathe * 0.5);
      this.skeleton.setRotation('head', sway * 0.5);
      
      this.skeleton.setRotation('upperArmL', 170 + sway);
      this.skeleton.setRotation('forearmL', 15 + breathe);
      this.skeleton.setRotation('upperArmR', 170 - sway);
      this.skeleton.setRotation('forearmR', 15 - breathe);
      this.skeleton.setRotation('handR', -90 + sway * 0.5);
      
      this.skeleton.setRotation('thighL', 85);
      this.skeleton.setRotation('shinL', 10);
      this.skeleton.setRotation('thighR', 85);
      this.skeleton.setRotation('shinR', 10);

    } else if (this.currentAnim === 'slash') {
      const slash = Math.sin(this.animTime * 6);
      this.skeleton.setRotation('torso', -90 + slash * 20);
      this.skeleton.setRotation('upperArmR', 100 + slash * 80);
      this.skeleton.setRotation('forearmR', 30 + slash * 40);
      this.skeleton.setRotation('handR', -60 + slash * 60);
      this.skeleton.setRotation('upperArmL', 170);
      this.skeleton.setRotation('forearmL', 20);
      this.skeleton.setRotation('thighL', 75);
      this.skeleton.setRotation('shinL', 15);
      this.skeleton.setRotation('thighR', 95);
      this.skeleton.setRotation('shinR', 10);

    } else if (this.currentAnim === 'run') {
      const step = Math.sin(this.animTime * 8);
      this.skeleton.setRotation('torso', -90 + step * 4);
      
      this.skeleton.setRotation('thighL', 90 + step * 35);
      this.skeleton.setRotation('shinL', Math.max(0, -step * 45));
      this.skeleton.setRotation('thighR', 90 - step * 35);
      this.skeleton.setRotation('shinR', Math.max(0, step * 45));

      this.skeleton.setRotation('upperArmL', 170 - step * 35);
      this.skeleton.setRotation('forearmL', 25 + Math.abs(step) * 20);
      this.skeleton.setRotation('upperArmR', 170 + step * 35);
      this.skeleton.setRotation('forearmR', 25 + Math.abs(step) * 20);

    } else if (this.currentAnim === 'guard') {
      this.skeleton.setRotation('torso', -90);
      this.skeleton.setRotation('upperArmL', 130);
      this.skeleton.setRotation('forearmL', 45);
      this.skeleton.setRotation('handL', 20);
      this.skeleton.setRotation('upperArmR', 140);
      this.skeleton.setRotation('forearmR', 30);
      this.skeleton.setRotation('handR', -60);
      this.skeleton.setRotation('thighL', 75);
      this.skeleton.setRotation('shinL', 20);
      this.skeleton.setRotation('thighR', 95);
      this.skeleton.setRotation('shinR', 10);

    } else if (this.currentAnim === 'wave') {
      const wave = Math.sin(this.animTime * 10) * 25;
      this.skeleton.setRotation('upperArmR', 30);
      this.skeleton.setRotation('forearmR', 40 + wave);
      this.skeleton.setRotation('handR', wave - 40);
      this.skeleton.setRotation('upperArmL', 170);
      this.skeleton.setRotation('forearmL', 15);
      this.skeleton.setRotation('thighL', 85);
      this.skeleton.setRotation('shinL', 10);
      this.skeleton.setRotation('thighR', 85);
      this.skeleton.setRotation('shinR', 10);

    } else if (this.currentAnim === 'eat') {
      const chew = Math.sin(this.animTime * 12) * 6;
      const handEat = Math.sin(this.animTime * 4) * 6;
      
      this.skeleton.setRotation('torso', -85 + chew * 0.3);
      this.skeleton.setRotation('head', 15 + chew);
      
      // Point 2 (Elbow) drops down-right, Point 3 (Wrist) folds UP-LEFT directly to face/visor!
      this.skeleton.setRotation('upperArmR', 115 + handEat * 0.5); // Elbow (Point 2) extends down-right
      this.skeleton.setRotation('forearmR', -145 + chew * 0.5);  // Wrist (Point 3) folds UP-LEFT directly to visor!
      this.skeleton.setRotation('handR', -30);                   // Tilts food to mouth
      
      this.skeleton.setRotation('upperArmL', 170);
      this.skeleton.setRotation('forearmL', 15);
      this.skeleton.setRotation('thighL', 85);
      this.skeleton.setRotation('shinL', 10);
      this.skeleton.setRotation('thighR', 85);
      this.skeleton.setRotation('shinR', 10);
    }

    this.skeleton.update(x, y, 0);
  }
}
