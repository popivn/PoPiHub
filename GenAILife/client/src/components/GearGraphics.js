import { Graphics } from 'pixi.js';

export class GearGraphics {
  // 🪖 1. HELMET GRAPHICS
  static createHelmet(type = 'tech_visor', themeColor = 0x00f2fe) {
    const g = new Graphics();

    if (type === 'tech_visor') {
      // Tech Visor Helmet
      g.roundRect(0, -18, 34, 36, 14).fill({ color: 0x0f172a }).stroke({ width: 3, color: themeColor });
      g.roundRect(8, -13, 16, 26, 6).fill({ color: themeColor, alpha: 0.95 });
      g.circle(16, -5, 2.5).fill({ color: 0xffffff });
      g.circle(16, 5, 2.5).fill({ color: 0xffffff });
    } else if (type === 'knight_helm') {
      // Knight Iron Helmet
      g.roundRect(0, -18, 36, 36, 12).fill({ color: 0x334155 }).stroke({ width: 3, color: 0x94a3b8 });
      g.rect(12, -14, 18, 5).fill({ color: themeColor }); // Horizontal Eye Slot
      g.poly([0, -18, 14, -28, 28, -18]).fill({ color: 0x475569 }); // Crest
    } else if (type === 'cyber_crown') {
      // Cyber Energy Crown
      g.circle(16, 0, 15).fill({ color: 0x0f172a }).stroke({ width: 2.5, color: themeColor });
      g.poly([8, -20, 16, -30, 24, -20, 16, -16]).fill({ color: themeColor });
      g.circle(16, 0, 4).fill({ color: 0xffffff });
    } else if (type === 'tactical_goggles') {
      // Tactical Goggles
      g.roundRect(0, -16, 32, 32, 16).fill({ color: 0x1e293b }).stroke({ width: 2, color: 0x64748b });
      g.roundRect(8, -10, 14, 20, 5).fill({ color: 0xff007f }); // Dual Goggles Lens
      g.circle(15, -4, 2).fill({ color: 0xffffff });
    }
    // If 'none', returns empty Graphics

    return g;
  }

  // 🛡️ 2. SHIELD GRAPHICS
  static createShield(type = 'star_shield', themeColor = 0x0284c7) {
    const g = new Graphics();

    if (type === 'star_shield') {
      // Star Crest Shield
      g.poly([-16, -16, 16, -16, 12, 12, 0, 20, -12, 12]).fill({ color: themeColor }).stroke({ width: 3, color: 0xffffff });
      g.star(0, 0, 5, 8, 4).fill({ color: 0xffffff });
    } else if (type === 'energy_aegis') {
      // Energy Aegis Diamond Shield
      g.poly([0, -22, 18, 0, 0, 22, -18, 0]).fill({ color: 0x00f2fe, alpha: 0.85 }).stroke({ width: 3, color: 0xffffff });
      g.poly([0, -12, 10, 0, 0, 12, -10, 0]).fill({ color: 0xffffff, alpha: 0.9 });
    } else if (type === 'heavy_bulwark') {
      // Heavy Rectangular Bulwark Shield
      g.roundRect(-16, -22, 32, 44, 6).fill({ color: 0x1e293b }).stroke({ width: 3.5, color: 0xe2e8f0 });
      g.rect(-12, -4, 24, 8).fill({ color: themeColor });
    } else if (type === 'neon_ring') {
      // Circular Neon Force Barrier
      g.circle(0, 0, 20).fill({ color: themeColor, alpha: 0.4 }).stroke({ width: 3, color: 0xffffff });
      g.circle(0, 0, 12).stroke({ width: 2, color: themeColor });
    }

    return g;
  }

  // ⚔️ 3. WEAPON GRAPHICS
  static createWeapon(type = 'laser_blade', themeColor = 0x00f2fe) {
    const g = new Graphics();

    if (type === 'laser_blade') {
      // Standard Laser Blade
      g.rect(-4, -4, 12, 8).fill({ color: 0x64748b });
      g.rect(8, -9, 4, 18).fill({ color: themeColor });
      g.poly([12, -3, 12, 3, 50, 2, 58, 0, 50, -2]).fill({ color: themeColor }).stroke({ width: 2, color: 0xffffff });
      g.poly([13, -1.5, 13, 1.5, 55, 0]).fill({ color: 0xffffff });
    } else if (type === 'flame_greatsword') {
      // Flame Greatsword (Red/Orange Blade)
      g.rect(-6, -5, 14, 10).fill({ color: 0x334155 });
      g.rect(8, -12, 5, 24).fill({ color: 0xff007f });
      g.poly([13, -6, 13, 6, 62, 4, 72, 0, 62, -4]).fill({ color: 0xff0844 }).stroke({ width: 3, color: 0xffbb00 });
    } else if (type === 'plasma_katana') {
      // Plasma Curved Katana
      g.rect(-4, -3, 12, 6).fill({ color: 0x0f172a });
      g.circle(8, 0, 6).fill({ color: 0xffbb00 });
      g.poly([8, -2, 14, -2, 48, -10, 60, -14, 46, -6, 8, 2]).fill({ color: 0x00ff88 }).stroke({ width: 2, color: 0xffffff });
    } else if (type === 'double_saber') {
      // Double Ended Dual Saber
      g.rect(-10, -4, 20, 8).fill({ color: 0x475569 });
      g.poly([10, -2, 10, 2, 45, 0]).fill({ color: themeColor }).stroke({ width: 2, color: 0xffffff });
      g.poly([-10, -2, -10, 2, -45, 0]).fill({ color: themeColor }).stroke({ width: 2, color: 0xffffff });
    }

    return g;
  }
}
