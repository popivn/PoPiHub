/**
 * Dual-grid-15 auto-tiling algorithm.
 *
 * Regular grid: user paints cells as "filled" (tilesetId) or "empty" (null).
 * Dual grid: sits at corners of regular cells, determines which atlas tile to render.
 *
 * For each dual-grid cell at (dx, dy), check 4 surrounding regular cells:
 *   TL = (dx-1, dy-1), TR = (dx, dy-1), BL = (dx-1, dy), BR = (dx, dy)
 *
 * 4-bit mask: BR=1, BL=2, TR=4, TL=8
 * Lookup table maps mask → (atlasX, atlasY) in the 4x4 tileset atlas.
 */

/** Mask bit flags — bit0=BR, bit1=BL, bit2=TR, bit3=TL */
export const BR = 1
export const BL = 2
export const TR = 4
export const TL = 8

/** Lookup table: mask → [atlasX, atlasY] — derived from tile file names X-Y-mask-N.png */
const MASK_TO_ATLAS: Record<number, [number, number]> = {
  0:  [0, 3], // Empty (all water)
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
  15: [2, 1], // Full (all grass) — (inferred, center of atlas)
}

export interface RegularGrid {
  width: number
  height: number
  cells: (string | null)[]   // tilesetId or null, length = width * height
}

export interface DualGridCell {
  atlasX: number
  atlasY: number
  filled: boolean
}

/**
 * Calculate mask for a dual-grid cell at (dx, dy).
 * Checks the 4 surrounding regular grid cells.
 */
export function calcMask(
  grid: RegularGrid,
  dx: number,
  dy: number,
): number {
  const { width, height, cells } = grid
  let mask = 0

  const isFilled = (x: number, y: number): boolean => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false
    return !!cells[y * width + x]
  }

  if (isFilled(dx - 1, dy - 1)) mask |= BR // bit 1
  if (isFilled(dx,     dy - 1)) mask |= TR // bit 4
  if (isFilled(dx - 1, dy    )) mask |= BL // bit 2
  if (isFilled(dx,     dy    )) mask |= TL // bit 8

  return mask
}

/**
 * Get atlas position for a dual-grid cell.
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
      const mask = calcMask(grid, dx, dy)
      const [atlasX, atlasY] = maskToAtlas(mask)
      result.push({ atlasX, atlasY, filled: mask > 0 })
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

  // When (tx,ty) is painted, update the 4 dual-grid corners around it.
  // Each corner sees 1 filled cell → produces a quarter-tile:
  //   (tx, ty)     → BR=1 (grass in bottom-right quarter)
  //   (tx+1, ty)   → BL=2 (grass in bottom-left quarter)
  //   (tx, ty+1)   → TR=4 (grass in top-right quarter)
  //   (tx+1, ty+1) → TL=8 (grass in top-left quarter)
  // Together they form a complete 1x1 island with smooth borders.
  const corners = [
    { dx: tx, dy: ty },
    { dx: tx + 1, dy: ty },
    { dx: tx, dy: ty + 1 },
    { dx: tx + 1, dy: ty + 1 },
  ]

  for (const { dx, dy } of corners) {
    const mask = calcMask(grid, dx, dy)
    const [atlasX, atlasY] = maskToAtlas(mask)
    updates.push({ dx, dy, cell: { atlasX, atlasY, filled: mask > 0 } })
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
    if (!cell.filled) return null
    return {
      tilesetId,
      atlasX: cell.atlasX,
      atlasY: cell.atlasY,
      mode: 'auto',
    }
  })

  return { grid: exportedGrid }
}
