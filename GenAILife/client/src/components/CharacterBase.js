import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { RiggedCharacter } from '../rigging/RiggedCharacter.js';
import { GearGraphics } from './GearGraphics.js';

export class CharacterBase {
  constructor(app, config = {}) {
    this.app = app;
    this.config = {
      id: config.id || `char_${Date.now()}`,
      name: config.name || 'Hero Warrior',
      type: config.type || 'hero', // 'hero' | 'enemy' | 'npc'
      helmet: config.helmet || 'tech_visor',
      shield: config.shield || 'star_shield',
      weapon: config.weapon || 'laser_blade',
      themeColor: config.themeColor || 0x00f2fe,
      hp: config.hp || 100,
      maxHp: config.maxHp || 100,
      attack: config.attack || 25,
      speed: config.speed || 5.5,
      showUI: config.showUI !== undefined ? config.showUI : true
    };

    this.container = new Container();
    this.container.sortableChildren = true;

    // Inner Rigged Skeleton Character
    this.riggedChar = new RiggedCharacter(app);
    this.riggedChar.skeleton.showWireframe = false;
    this.container.addChild(this.riggedChar.container);

    // UI Elements above head
    this.uiContainer = new Container();
    this.uiContainer.zIndex = 500;
    this.container.addChild(this.uiContainer);

    this.buildOverheadUI();
    this.applyGearConfig();
  }

  buildOverheadUI() {
    this.uiContainer.removeChildren();

    // Disable overhead UI completely if showUI is false or name is empty
    if (!this.config.showUI || !this.config.name) return;

    // 1. Nameplate Text
    const isEnemy = this.config.type === 'enemy';
    const nameStyle = new TextStyle({
      fontFamily: 'Outfit, sans-serif',
      fontSize: 12,
      fontWeight: 'bold',
      fill: isEnemy ? '#ff4d6d' : '#00f2fe',
      stroke: { color: '#050811', width: 3 }
    });

    const nameText = new Text({ text: this.config.name, style: nameStyle });
    nameText.anchor.set(0.5);
    nameText.y = -95;
    this.uiContainer.addChild(nameText);

    // 2. Health Bar Graphics
    const hpBg = new Graphics();
    hpBg.roundRect(-25, -80, 50, 6, 3).fill({ color: 0x0f172a }).stroke({ width: 1.5, color: 0x334155 });
    this.uiContainer.addChild(hpBg);

    const hpRatio = Math.max(0, this.config.hp / this.config.maxHp);
    const hpBar = new Graphics();
    const barColor = isEnemy ? 0xff0844 : 0x00ff88;
    hpBar.roundRect(-24, -79, 48 * hpRatio, 4, 2).fill({ color: barColor });
    this.uiContainer.addChild(hpBar);
  }

  applyGearConfig() {
    // Replace Head / Helmet / Hair / Face Graphic safely via headBone.displayObject
    const headBone = this.riggedChar.skeleton.getBone('head');
    if (headBone && headBone.displayObject) {
      headBone.displayObject.removeChildren();
      const newHeadG = GearGraphics.createHelmet(this.config.helmet, this.config.themeColor, this.config.hair, this.config.face);
      headBone.displayObject.addChild(newHeadG);
      this.riggedChar.parts.head = newHeadG;
    }

    // Replace Shield Graphic safely via handLBone.displayObject
    const handLBone = this.riggedChar.skeleton.getBone('handL');
    if (handLBone && handLBone.displayObject) {
      handLBone.displayObject.removeChildren();
      const newShieldG = GearGraphics.createShield(this.config.shield, this.config.themeColor);
      handLBone.displayObject.addChild(newShieldG);
      this.riggedChar.parts.handL = newShieldG;
    }

    // Replace Weapon Graphic safely via handRBone.displayObject
    const handRBone = this.riggedChar.skeleton.getBone('handR');
    if (handRBone && handRBone.displayObject) {
      handRBone.displayObject.removeChildren();
      const newWeaponG = GearGraphics.createWeapon(this.config.weapon, this.config.themeColor);
      handRBone.displayObject.addChild(newWeaponG);
      this.riggedChar.parts.handR = newWeaponG;
    }

    this.buildOverheadUI();
  }

  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
    this.applyGearConfig();
  }

  takeDamage(amount) {
    this.config.hp = Math.max(0, this.config.hp - amount);
    this.buildOverheadUI();
  }

  exportConfigJSON() {
    return JSON.stringify(this.config, null, 2);
  }

  update(x, y, delta) {
    this.riggedChar.update(x, y, delta);
  }
}
