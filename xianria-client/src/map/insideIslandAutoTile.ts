/**
 * Dual-grid-15 auto-tiling algorithm for inside island with triple layers (water, grass, and dark grass).
 */

/** Mask bit flags — bit0=BR, bit1=BL, bit2=TR, bit3=TL */
export const BR = 1
export const BL = 2
export const TR = 4
export const TL = 8

/** Lookup table: mask → [atlasX, atlasY] — derived from tile file names X-Y-mask-N.png */
export const MASK_TO_ATLAS: Record<number, [number, number]> = {
  0:  [0, 3], // Empty
  1:  [3, 3], // BR          — file: 3-3-mask-1
  2:  [0, 0], // BL          — file: 0-0-mask-2
  3:  [3, 2], // BL + BR     — file: 3-2-mask-3
  4:  [0, 2], // TR          — file: 0-2-mask-4
  5:  [1, 2], // TR + BR     — file: 1-2-mask-5
  6:  [2, 3], // BL + TR     — (diagonal, inferred)
  7:  [3, 1], // BL + BR + TR — file: 3-1-mask-7
  8:  [1, 3], // TL          — file: 1-3-mask-8
  9:  [0, 1], // TL + BR     — file: 0-1-mask-9
  10: [3, 0], // TL + BL     — file: 3-0-mask-10
  11: [2, 0], // TL + BL + BR — file: 2-0-mask-11
  12: [1, 0], // TL + TR     — file: 1-0-mask-12
  13: [2, 2], // TL + TR + BR — file: 2-2-mask-13
  14: [1, 1], // TL + TR + BL — file: 1-1-mask-14
  15: [2, 1], // Full — (inferred, center of atlas)
}

export interface RegularGrid {
  width: number
  height: number
  cells: (string | null)[]   // tilesetId or null, length = width * height
}

export interface DualGridCell {
  waterAtlasX: number
  waterAtlasY: number
  waterFilled: boolean

  grassAtlasX: number
  grassAtlasY: number
  grassFilled: boolean

  darkGrassAtlasX: number
  darkGrassAtlasY: number
  darkGrassFilled: boolean
}

/**
 * Calculate water mask for a dual-grid cell at (dx, dy).
 * Checks the 4 surrounding regular grid cells. Any cell inside grid is filled with water.
 */
export function calcWaterMask(
  grid: RegularGrid,
  dx: number,
  dy: number,
): number {
  const { width, height, cells } = grid
  let mask = 0

  const isWater = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    return cells[y * width + x] === 'water'
  }
  if (isWater(dx - 1, dy - 1)) mask |= BR
  if (isWater(dx,     dy - 1)) mask |= TR
  if (isWater(dx - 1, dy    )) mask |= BL
  if (isWater(dx,     dy    )) mask |= TL

  return mask
}

/**
 * Calculate grass mask for a dual-grid cell at (dx, dy).
 * Both 'grass' and '060440_dual_grid_template_dual_grid_template-tileset' are treated as grass.
 */
export function calcGrassMask(
  grid: RegularGrid,
  dx: number,
  dy: number,
): number {
  const { width, height, cells } = grid
  let mask = 0

  const isGrass = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    const val = cells[y * width + x]
    return val === 'grass' || val === 'water'
  }

  if (isGrass(dx - 1, dy - 1)) mask |= BR
  if (isGrass(dx,     dy - 1)) mask |= TR
  if (isGrass(dx - 1, dy    )) mask |= BL
  if (isGrass(dx,     dy    )) mask |= TL

  return mask
}

/**
 * Calculate dark grass mask for a dual-grid cell at (dx, dy).
 * Both dark grass, grass, and water are treated as dark grass base layer.
 */
export function calcDarkGrassMask(
  grid: RegularGrid,
  dx: number,
  dy: number,
): number {
  const { width, height, cells } = grid
  let mask = 0

  const isDarkGrass = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    return cells[y * width + x] === 'texture-job_e510e767f70e488b9a4ed95f6caaf33c'
  }

  if (isDarkGrass(dx - 1, dy - 1)) mask |= BR
  if (isDarkGrass(dx,     dy - 1)) mask |= TR
  if (isDarkGrass(dx - 1, dy    )) mask |= BL
  if (isDarkGrass(dx,     dy    )) mask |= TL

  return mask
}

/**
 * Get atlas position for a mask.
 */
export function maskToAtlas(mask: number): [number, number] {
  return MASK_TO_ATLAS[mask] ?? [0, 3]
}

/**
 * Compute the full dual grid from a regular grid.
 * Dual grid dimensions: (width+1) x (height+1)
 */
export function computeDualGrid(grid: RegularGrid): DualGridCell[] {
  const dualWidth = grid.width + 1
  const dualHeight = grid.height + 1
  const result: DualGridCell[] = []

  for (let dy = 0; dy < dualHeight; dy++) {
    for (let dx = 0; dx < dualWidth; dx++) {
      const waterMask = calcWaterMask(grid, dx, dy)
      const [waterAtlasX, waterAtlasY] = maskToAtlas(waterMask)

      const grassMask = calcGrassMask(grid, dx, dy)
      const [grassAtlasX, grassAtlasY] = maskToAtlas(grassMask)

      const darkGrassMask = calcDarkGrassMask(grid, dx, dy)
      const [darkGrassAtlasX, darkGrassAtlasY] = maskToAtlas(darkGrassMask)

      result.push({
        waterAtlasX,
        waterAtlasY,
        waterFilled: waterMask > 0,

        grassAtlasX,
        grassAtlasY,
        grassFilled: grassMask > 0,

        darkGrassAtlasX,
        darkGrassAtlasY,
        darkGrassFilled: darkGrassMask > 0,
      })
    }
  }

  return result
}

/**
 * Recompute only the dual-grid cells affected by painting at (tx, ty).
 * Returns array of { dx, dy, cell } that need updating.
 */
export function recomputeAround(
  grid: RegularGrid,
  tx: number,
  ty: number,
): Array<{ dx: number; dy: number; cell: DualGridCell }> {
  const updates: Array<{ dx: number; dy: number; cell: DualGridCell }> = []

  const corners = [
    { dx: tx, dy: ty },
    { dx: tx + 1, dy: ty },
    { dx: tx, dy: ty + 1 },
    { dx: tx + 1, dy: ty + 1 },
  ]

  for (const { dx, dy } of corners) {
    const waterMask = calcWaterMask(grid, dx, dy)
    const [waterAtlasX, waterAtlasY] = maskToAtlas(waterMask)

    const grassMask = calcGrassMask(grid, dx, dy)
    const [grassAtlasX, grassAtlasY] = maskToAtlas(grassMask)

    const darkGrassMask = calcDarkGrassMask(grid, dx, dy)
    const [darkGrassAtlasX, darkGrassAtlasY] = maskToAtlas(darkGrassMask)

    updates.push({
      dx,
      dy,
      cell: {
        waterAtlasX,
        waterAtlasY,
        waterFilled: waterMask > 0,

        grassAtlasX,
        grassAtlasY,
        grassFilled: grassMask > 0,

        darkGrassAtlasX,
        darkGrassAtlasY,
        darkGrassFilled: darkGrassMask > 0,
      },
    })
  }

  return updates
}

/**
 * Create an empty regular grid.
 */
export function createGrid(width: number, height: number): RegularGrid {
  return {
    width,
    height,
    cells: new Array(width * height).fill(null),
  }
}

/**
 * Paint a cell in the regular grid and return affected dual-grid updates.
 */
export function paintCell(
  grid: RegularGrid,
  tx: number,
  ty: number,
  tilesetId: string | null,
): Array<{ dx: number; dy: number; cell: DualGridCell }> {
  const idx = ty * grid.width + tx
  if (idx < 0 || idx >= grid.cells.length) return []
  grid.cells[idx] = tilesetId
  return recomputeAround(grid, tx, ty)
}

/**
 * Export regular grid to meowa-map.json format.
 */
export function exportGrid(
  grid: RegularGrid,
  tilesetId: string,
): { grid: Array<{ tilesetId: string; atlasX: number; atlasY: number; mode: string } | null> } {
  const dual = computeDualGrid(grid)

  const exportedGrid = dual.map((cell) => {
    if (!cell.grassFilled) return null
    return {
      tilesetId,
      atlasX: cell.grassAtlasX,
      atlasY: cell.grassAtlasY,
      mode: 'auto',
    }
  })

  return { grid: exportedGrid }
}
