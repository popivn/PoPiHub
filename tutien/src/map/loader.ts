import type { MeowaMapData, MeowaTileData } from './types'

export async function loadMapData(path: string): Promise<MeowaMapData> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to load map: ${path} (${res.status})`)
  return res.json()
}

export function getTileAt(mapData: MeowaMapData, tileX: number, tileY: number): MeowaTileData | null {
  const { widthTiles, grid } = mapData.map
  if (tileX < 0 || tileX >= widthTiles || tileY < 0) return null
  const index = tileY * widthTiles + tileX
  return grid[index] ?? null
}

export function pixelToTile(
  px: number,
  py: number,
  tileSize: number,
): { tx: number; ty: number } {
  return {
    tx: Math.floor(px / tileSize),
    ty: Math.floor(py / tileSize),
  }
}

export function tileToCenterPixel(
  tx: number,
  ty: number,
  tileSize: number,
): { x: number; y: number } {
  return {
    x: tx * tileSize + tileSize / 2,
    y: ty * tileSize + tileSize / 2,
  }
}
