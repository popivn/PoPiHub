import { Container, Graphics, Sprite } from 'pixi.js';
import { toIso } from './IsoUtils.js';
import { EnvironmentProps } from '../components/EnvironmentProps.js';

// Deterministic Pseudo-Random Hash for consistent random forest generation
function pseudoRandom(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

export class IsoMapManager {
  constructor(app) {
    this.app = app;
    this.container = new Container();

    this.tileSizeW = 80;
    this.tileSizeH = 40;

    // 🎯 CIRCULAR SIGHT RANGE (Phạm vi nhìn hình tròn xung quanh nhân vật)
    this.sightRadius = 7.5; // Radius of circular vision in tile units

    // Cache pre-rendered tile textures ONCE for ultra-fast GPU batch rendering
    this.textures = this.generateTileTextures();

    // Container for all tile sprites in World space with Z-Depth Sorting
    this.mapContainer = new Container();
    this.mapContainer.sortableChildren = true;
    this.container.addChild(this.mapContainer);

    // Map of discovered tile sprites: "tx,ty" -> { group, tx, ty }
    this.tileSprites = new Map();
  }

  generateTileTextures() {
    const halfW = this.tileSizeW / 2;
    const halfH = this.tileSizeH / 2;

    const createTexture = (fillColor, strokeColor) => {
      const g = new Graphics();
      g.poly([
        halfW, 0,
        this.tileSizeW, halfH,
        halfW, this.tileSizeH,
        0, halfH
      ]).fill({ color: fillColor }).stroke({ width: 1.5, color: strokeColor });
      return this.app.renderer.generateTexture(g);
    };

    // Pre-create 3D Slab Texture
    const slabG = new Graphics();
    slabG.poly([
      halfW, 0,
      this.tileSizeW, halfH,
      halfW, this.tileSizeH + 15,
      0, halfH + 15
    ]).fill({ color: 0x070c18 });
    const slabTex = this.app.renderer.generateTexture(slabG);

    return {
      tileA: createTexture(0x0c1427, 0x0284c7),
      tileB: createTexture(0x0e172e, 0x0284c7),
      centerTile: createTexture(0x172554, 0x00f2fe),
      slab: slabTex
    };
  }

  update(playerWorldX, playerWorldY, screenCenterX, screenCenterY) {
    const halfW = this.tileSizeW / 2;
    const currentTileX = Math.round(playerWorldX / halfW);
    const currentTileY = Math.round(playerWorldY / halfW);

    const intSightRadius = Math.ceil(this.sightRadius);

    // 1. Instantiates tiles within sight bounding box if not discovered yet
    for (let tx = currentTileX - intSightRadius; tx <= currentTileX + intSightRadius; tx++) {
      for (let ty = currentTileY - intSightRadius; ty <= currentTileY + intSightRadius; ty++) {
        const key = `${tx},${ty}`;

        if (!this.tileSprites.has(key)) {
          const iso = toIso(tx * halfW, ty * halfW);

          const tileGroup = new Container();
          tileGroup.x = iso.x;
          tileGroup.y = iso.y;
          tileGroup.zIndex = tx + ty; // Isometric Z-sorting

          // 3D Slab Sprite
          const slabSprite = new Sprite(this.textures.slab);
          slabSprite.anchor.set(0.5, 0);
          slabSprite.y = 5;
          slabSprite.alpha = 0.7;
          tileGroup.addChild(slabSprite);

          // Top Grid Tile Sprite
          const isCenter = Math.abs(tx) <= 1 && Math.abs(ty) <= 1;
          const isEvenTile = Math.abs(tx + ty) % 2 === 0;
          const tex = isCenter ? this.textures.centerTile : (isEvenTile ? this.textures.tileA : this.textures.tileB);
          const tileSprite = new Sprite(tex);
          tileSprite.anchor.set(0.5, 0);
          tileGroup.addChild(tileSprite);

          // 🌳 Organic Random Tree Spawning
          const distFromCenter = Math.hypot(tx, ty);
          const randVal = pseudoRandom(tx, ty);
          const isTreeTile = !isCenter && distFromCenter > 2.5 && randVal < 0.14;

          if (isTreeTile) {
            const colorRand = pseudoRandom(tx * 3, ty * 7);
            const themeColor = colorRand > 0.4 ? 0x00f2fe : 0xff007f;
            const treeSprite = EnvironmentProps.createTree(this.app, themeColor);
            
            treeSprite.x = (pseudoRandom(tx * 5, ty) - 0.5) * 16;
            treeSprite.y = (pseudoRandom(tx, ty * 5) - 0.5) * 8;

            tileGroup.addChild(treeSprite);
          }

          this.mapContainer.addChild(tileGroup);
          this.tileSprites.set(key, { group: tileGroup, tx, ty });
        }
      }
    }

    // 2. ⚡ RADIAL LINE OF SIGHT CULLING & CIRCULAR ALPHA FADING
    const fadeStart = this.sightRadius - 2.0;
    let visibleCount = 0;
    let culledCount = 0;

    for (const tileData of this.tileSprites.values()) {
      const dx = tileData.tx - currentTileX;
      const dy = tileData.ty - currentTileY;
      const dist = Math.hypot(dx, dy);

      if (dist > this.sightRadius) {
        // CULLING: Hide completely when outside circular vision range (0 GPU cost!)
        tileData.group.visible = false;
        culledCount++;
      } else {
        tileData.group.visible = true;
        visibleCount++;

        // Smooth Circular Radial Alpha Falloff near edge of vision circle
        if (dist > fadeStart) {
          const edgeAlpha = (this.sightRadius - dist) / (this.sightRadius - fadeStart);
          tileData.group.alpha = Math.max(0, Math.min(1, edgeAlpha));
        } else {
          tileData.group.alpha = 1.0;
        }
      }
    }

    this.metrics = {
      visibleCount,
      culledCount,
      totalDiscovered: this.tileSprites.size
    };

    // 3. Ultra-Fast Camera Tracking on GPU
    const playerIso = toIso(playerWorldX, playerWorldY);
    this.mapContainer.x = screenCenterX - playerIso.x;
    this.mapContainer.y = screenCenterY - playerIso.y;
  }
}
