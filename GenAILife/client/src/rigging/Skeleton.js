import { Container, Graphics } from 'pixi.js';

export class Bone {
  constructor(name, length = 40, angle = 0) {
    this.name = name;
    this.length = length;
    this.localRotation = angle; // Angle in degrees
    this.parent = null;
    this.children = [];

    // Local offset relative to parent bone tip
    this.offsetX = 0;
    this.offsetY = 0;

    // Computed World properties
    this.worldX = 0;
    this.worldY = 0;
    this.worldRotation = 0; // In radians

    // Attached Pixi Container/Sprite
    this.displayObject = null;
  }

  addChild(childBone, offsetX = 0, offsetY = 0) {
    childBone.parent = this;
    childBone.offsetX = offsetX;
    childBone.offsetY = offsetY;
    this.children.push(childBone);
    return childBone;
  }

  // Update Forward Kinematics (FK) world transforms
  updateTransform(parentWorldX = 0, parentWorldY = 0, parentWorldRot = 0) {
    // Total rotation angle in radians
    const localRotRad = (this.localRotation * Math.PI) / 180;
    this.worldRotation = parentWorldRot + localRotRad;

    // Start position of this bone
    if (this.parent) {
      // Offset from parent's base or tip
      const cosP = Math.cos(parentWorldRot);
      const sinP = Math.sin(parentWorldRot);
      this.worldX = parentWorldX + (this.offsetX * cosP - this.offsetY * sinP);
      this.worldY = parentWorldY + (this.offsetX * sinP + this.offsetY * cosP);
    } else {
      this.worldX = parentWorldX;
      this.worldY = parentWorldY;
    }

    // Synchronize attached display object position & rotation
    if (this.displayObject) {
      this.displayObject.x = this.worldX;
      this.displayObject.y = this.worldY;
      this.displayObject.rotation = this.worldRotation;
    }

    // Tip position of this bone
    const tipX = this.worldX + Math.cos(this.worldRotation) * this.length;
    const tipY = this.worldY + Math.sin(this.worldRotation) * this.length;

    // Update children recursively
    for (const child of this.children) {
      child.updateTransform(tipX, tipY, this.worldRotation);
    }
  }
}

export class Skeleton {
  constructor() {
    this.rootBone = null;
    this.bonesMap = new Map();
    this.gizmoGraphics = new Graphics();
    this.showWireframe = true;
  }

  addRoot(bone) {
    this.rootBone = bone;
    this.registerBone(bone);
    return bone;
  }

  registerBone(bone) {
    this.bonesMap.set(bone.name, bone);
    for (const child of bone.children) {
      this.registerBone(child);
    }
  }

  getBone(name) {
    return this.bonesMap.get(name);
  }

  setRotation(boneName, angleDegrees) {
    const bone = this.getBone(boneName);
    if (bone) {
      bone.localRotation = angleDegrees;
    }
  }

  update(rootX = 0, rootY = 0, rootRotDegrees = 0) {
    if (this.rootBone) {
      const rootRotRad = (rootRotDegrees * Math.PI) / 180;
      this.rootBone.updateTransform(rootX, rootY, rootRotRad);
    }
    if (this.showWireframe) {
      this.drawWireframe();
    } else {
      this.gizmoGraphics.clear();
    }
  }

  drawWireframe() {
    this.gizmoGraphics.clear();
    if (!this.rootBone) return;

    const drawBoneGizmo = (bone) => {
      const tipX = bone.worldX + Math.cos(bone.worldRotation) * bone.length;
      const tipY = bone.worldY + Math.sin(bone.worldRotation) * bone.length;

      // Draw bone line
      this.gizmoGraphics
        .poly([bone.worldX, bone.worldY, tipX, tipY])
        .stroke({ width: 3, color: 0x00f2fe, alpha: 0.8 });

      // Draw joint node circle
      this.gizmoGraphics
        .circle(bone.worldX, bone.worldY, 5)
        .fill({ color: 0xff007f, alpha: 0.9 })
        .stroke({ width: 1.5, color: 0xffffff });

      // Draw tip circle
      this.gizmoGraphics
        .circle(tipX, tipY, 3)
        .fill({ color: 0x00ff88, alpha: 0.9 });

      for (const child of bone.children) {
        drawBoneGizmo(child);
      }
    };

    drawBoneGizmo(this.rootBone);
  }
}
