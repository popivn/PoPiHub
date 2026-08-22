import type { WorldObject } from './types';
import { depthOf } from './iso';
import { WORLD_SIZE } from './constants';
import { createFancyTreeEl } from './assets/FancyTree';

// Builds the isometric environment: flat ground tiles + decorations
// (trees, rocks, flowers, bushes). Owns the layer container and re-sorts
// z-index each frame based on depth.
//
// Ground tiles are kept on a separate sub-layer with a fixed low z-index
// so they never participate in depth sorting — they always sit beneath
// every object and the slime.
export class IsometricWorld {
  readonly layer: HTMLElement;
  readonly groundLayer: HTMLElement;
  readonly objects: WorldObject[] = [];
  readonly blocked = new Set<string>();

  constructor() {
    this.layer = document.createElement('div');
    this.layer.className = 'iso-layer';

    // Ground tiles live on their own sub-layer, pinned to z-index 0.
    this.groundLayer = document.createElement('div');
    this.groundLayer.className = 'iso-ground-layer';
    this.layer.appendChild(this.groundLayer);

    this.build();
  }

  private key(x: number, y: number) {
    return `${Math.round(x)},${Math.round(y)}`;
  }

  isBlocked(x: number, y: number): boolean {
    return this.blocked.has(this.key(x, y));
  }

  // Flat world — ground is always z=0.
  heightAt(_x: number, _y: number): number {
    return 0;
  }

  private addTile(x: number, y: number) {
    const el = document.createElement('div');
    el.className = 'iso-tile';
    if ((x + y) % 2 === 0) el.classList.add('iso-tile-alt');
    const obj: WorldObject = {
      id: `tile-${x}-${y}`,
      x,
      y,
      z: 0,
      height: 0,
      kind: 'tile',
      el,
    };
    this.objects.push(obj);
    // Ground tiles go to the dedicated ground layer (no depth sorting).
    this.groundLayer.appendChild(el);
  }

  private addTree(x: number, y: number) {
    const el = document.createElement('div');
    el.className = 'iso-object iso-tree';
    const trunk = document.createElement('div');
    trunk.className = 'tree-trunk';
    const foliage = document.createElement('div');
    foliage.className = 'tree-foliage';
    el.appendChild(trunk);
    el.appendChild(foliage);
    this.addObject(x, y, 0, 96, 'tree', el);
    this.blocked.add(this.key(x, y));
  }

  private addFancyTree(x: number, y: number) {
    const el = createFancyTreeEl();
    el.classList.add('iso-object', 'iso-fancy-tree');
    // Height = 132px (visual height of the fancy tree SVG) for depth sorting.
    this.addObject(x, y, 0, 132, 'fancy-tree', el);
    // Box collider: block the tile the trunk sits on.
    this.blocked.add(this.key(x, y));
  }

  private addRock(x: number, y: number) {
    const el = document.createElement('div');
    el.className = 'iso-object iso-rock';
    this.addObject(x, y, 0, 22, 'rock', el);
    this.blocked.add(this.key(x, y));
  }

  private addFlower(x: number, y: number) {
    const el = document.createElement('div');
    el.className = 'iso-object iso-flower';
    const stem = document.createElement('div');
    stem.className = 'flower-stem';
    const bloom = document.createElement('div');
    bloom.className = 'flower-bloom';
    el.appendChild(stem);
    el.appendChild(bloom);
    this.addObject(x, y, 0, 18, 'flower', el);
  }

  private addBush(x: number, y: number) {
    const el = document.createElement('div');
    el.className = 'iso-object iso-bush';
    this.addObject(x, y, 0, 26, 'bush', el);
  }

  private addObject(
    x: number,
    y: number,
    z: number,
    height: number,
    kind: WorldObject['kind'],
    el: HTMLElement,
  ) {
    const obj: WorldObject = {
      id: `${kind}-${x}-${y}`,
      x,
      y,
      z,
      height,
      kind,
      el,
    };
    this.objects.push(obj);
    this.layer.appendChild(el);
  }

  private build() {
    for (let y = 0; y < WORLD_SIZE; y++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        this.addTile(x, y);
      }
    }

    this.addTree(1, 1);
    this.addTree(7, 1);
    this.addTree(1, 7);
    this.addTree(7, 6);
    this.addTree(3, 0);
    this.addTree(0, 4);

    // Fancy animated trees (with collider + depth-sorted height).
    // Avoid top row (y=0) so the tall crown is not clipped by viewport.
    this.addFancyTree(5, 1);
    this.addFancyTree(0, 6);
    this.addFancyTree(8, 3);
    this.addFancyTree(4, 7);

    this.addRock(5, 2);
    this.addRock(2, 6);
    this.addRock(6, 7);

    this.addFlower(3, 3);
    this.addFlower(5, 5);
    this.addFlower(6, 3);
    this.addFlower(2, 5);
    this.addFlower(4, 7);
    this.addFlower(7, 4);

    this.addBush(3, 6);
    this.addBush(6, 5);
    this.addBush(2, 2);
  }

  // Depth sort only non-tile objects. Ground tiles are on a separate
  // sub-layer with a fixed z-index and never need sorting.
  applyDepth() {
    for (const obj of this.objects) {
      if (obj.kind === 'tile') continue;
      obj.el.style.zIndex = String(depthOf(obj.x, obj.y, obj.z));
    }
  }
}
