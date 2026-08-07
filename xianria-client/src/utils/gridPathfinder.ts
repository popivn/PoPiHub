export interface GridPoint {
  x: number
  y: number
}

export function isPassableTile(
  cells: (string | null)[],
  width: number,
  height: number,
  x: number,
  y: number
): boolean {
  if (x < 0 || x >= width || y < 0 || y >= height) return false
  const cell = cells[y * width + x]
  // Passable if terrain is grass or dark grass (dirt). Water and empty (null) are impassable.
  return cell === 'grass' || cell === 'texture-job_e510e767f70e488b9a4ed95f6caaf33c'
}

/**
 * A* Pathfinding algorithm to find the shortest grid path from start to target.
 */
export function findShortestPath(
  cells: (string | null)[],
  width: number,
  height: number,
  start: GridPoint,
  target: GridPoint
): GridPoint[] {
  // If target is out of bounds or not passable, return empty path
  if (!isPassableTile(cells, width, height, target.x, target.y)) {
    return []
  }

  // If start is same as target, return single point
  if (start.x === target.x && start.y === target.y) {
    return [start]
  }

  const key = (p: GridPoint) => `${p.x},${p.y}`
  const heuristic = (p1: GridPoint, p2: GridPoint) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y)

  const openSet: GridPoint[] = [start]
  const cameFrom = new Map<string, GridPoint>()

  const gScore = new Map<string, number>()
  gScore.set(key(start), 0)

  const fScore = new Map<string, number>()
  fScore.set(key(start), heuristic(start, target))

  const directions: GridPoint[] = [
    { x: 0, y: -1 }, // Up
    { x: 1, y: 0 },  // Right
    { x: 0, y: 1 },  // Down
    { x: -1, y: 0 }, // Left
  ]

  while (openSet.length > 0) {
    // Find node in openSet with lowest fScore
    let currentIdx = 0
    let currentF = fScore.get(key(openSet[0])) ?? Infinity
    for (let i = 1; i < openSet.length; i++) {
      const f = fScore.get(key(openSet[i])) ?? Infinity
      if (f < currentF) {
        currentF = f
        currentIdx = i
      }
    }

    const current = openSet.splice(currentIdx, 1)[0]
    const currentKey = key(current)

    // Reached target!
    if (current.x === target.x && current.y === target.y) {
      const path: GridPoint[] = [current]
      let curr = current
      while (cameFrom.has(key(curr))) {
        curr = cameFrom.get(key(curr))!
        path.unshift(curr)
      }
      return path
    }

    const currentG = gScore.get(currentKey) ?? Infinity

    for (const dir of directions) {
      const neighbor: GridPoint = { x: current.x + dir.x, y: current.y + dir.y }

      if (!isPassableTile(cells, width, height, neighbor.x, neighbor.y)) {
        continue
      }

      const neighborKey = key(neighbor)
      const tentativeG = currentG + 1

      if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
        cameFrom.set(neighborKey, current)
        gScore.set(neighborKey, tentativeG)
        fScore.set(neighborKey, tentativeG + heuristic(neighbor, target))

        if (!openSet.some(p => p.x === neighbor.x && p.y === neighbor.y)) {
          openSet.push(neighbor)
        }
      }
    }
  }

  // No path found
  return []
}
