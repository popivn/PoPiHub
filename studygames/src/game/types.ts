// Core type definitions for the isometric slime game.

export type Direction =
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'north-east'
  | 'north-west'
  | 'south-east'
  | 'south-west';

export type SlimeState =
  | 'idle'
  | 'accelerating'
  | 'moving'
  | 'decelerating'
  | 'jumping'
  | 'falling'
  | 'landing'
  | 'sleeping';

export interface WorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// A renderable placed in the isometric world.
export interface WorldObject {
  id: string;
  // Grid-aligned base coordinates (can be fractional for the slime).
  x: number;
  y: number;
  z: number;
  // Visual height in pixels (used for depth sorting of tall objects).
  height: number;
  kind: 'tile' | 'tree' | 'rock' | 'flower' | 'bush' | 'slime' | 'fancy-tree';
  // Element rendered for this object.
  el: HTMLElement;
}
