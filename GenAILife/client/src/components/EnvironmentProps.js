import { Container, Graphics, Sprite } from 'pixi.js';

export class EnvironmentProps {
  static textureCache = {};

  // Pre-generate GPU Tree Textures ONCE at app startup
  static initTextures(app) {
    if (this.textureCache.treeCyan) return;

    const buildTreeGraphics = (themeColor) => {
      const treeContainer = new Container();

      // 1. Ground Shadow
      const shadowG = new Graphics();
      shadowG.ellipse(0, 0, 22, 9).fill({ color: 0x000000, alpha: 0.45 });
      shadowG.y = 82;
      treeContainer.addChild(shadowG);

      // 2. 3D Trunk
      const trunkG = new Graphics();
      trunkG.poly([-6, 82, 6, 82, 4, 44, -4, 44]).fill({ color: 0x0f172a }).stroke({ width: 2, color: 0x334155 });
      trunkG.poly([-2, 77, 2, 67, -1, 52]).stroke({ width: 2, color: themeColor, alpha: 0.9 });
      treeContainer.addChild(trunkG);

      // 3. Layered 2.5D Sci-Fi Canopy
      const canopyG = new Graphics();
      canopyG.poly([-26, 48, 0, 26, 26, 48, 0, 62]).fill({ color: 0x0284c7, alpha: 0.9 }).stroke({ width: 2, color: themeColor });
      canopyG.poly([-20, 34, 0, 14, 20, 34, 0, 46]).fill({ color: 0x0369a1, alpha: 0.95 }).stroke({ width: 2, color: 0x38bdf8 });
      canopyG.poly([-14, 20, 0, 0, 14, 20, 0, 30]).fill({ color: themeColor }).stroke({ width: 2, color: 0xffffff });

      canopyG.circle(0, 30, 4).fill({ color: 0xffffff });
      canopyG.circle(-8, 42, 2.5).fill({ color: 0xffffff });
      canopyG.circle(8, 42, 2.5).fill({ color: 0xffffff });
      treeContainer.addChild(canopyG);

      return app.renderer.generateTexture(treeContainer);
    };

    this.textureCache.treeCyan = buildTreeGraphics(0x00f2fe);
    this.textureCache.treePink = buildTreeGraphics(0xff007f);
  }

  // Returns a lightweight GPU Batched Tree Sprite
  static createTree(app, themeColor = 0x00f2fe) {
    this.initTextures(app);
    const tex = themeColor === 0xff007f ? this.textureCache.treePink : this.textureCache.treeCyan;
    const treeSprite = new Sprite(tex);
    treeSprite.anchor.set(0.5, 0.9); // Anchor at base of tree trunk
    return treeSprite;
  }
}
