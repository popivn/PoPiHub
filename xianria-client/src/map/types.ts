export interface MeowaTileData {
  tilesetId: string
  atlasX: number
  atlasY: number
  mode: string
}

export interface MeowaTileset {
  id: string
  name: string
  type: string
  url: string
  mimeType: string
  width?: number
  height?: number
}

export interface MeowaLayer {
  id: string
  kind: string
  name: string
  isLocked: boolean
  backgroundColor?: string
  grid: (MeowaTileData | null)[]
  objectPlacements?: unknown[]
  objectGrid?: (unknown | null)[]
}

export interface MeowaMap {
  version: number
  mapType: string
  widthTiles: number
  heightTiles: number
  tileSize: number
  tilesets: MeowaTileset[]
  layers: MeowaLayer[]
  grid: (MeowaTileData | null)[]
  objects: unknown[]
  walls: unknown[]
}

export interface MeowaMapData {
  format: string
  version: number
  exportedAt: string
  canvasElement: {
    id: string
    name: string
    width: number
    height: number
    naturalWidth: number
    naturalHeight: number
    sourceKind: string
  }
  map: MeowaMap
}

export interface MapConfig {
  container: HTMLElement
  mapJsonPath: string
  tilesetBasePath: string
  characterSpritePath?: string
}
