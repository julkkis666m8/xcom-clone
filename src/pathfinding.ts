import { grid, zombies, depth } from './world';
import { FloorType, WallType } from './core/grid';

// Simple A* pathfinding with diagonal support, cost, and NPC crowding penalty
export function astar(start: {x: number, y: number, z: number}, goal: {x: number, y: number, z: number}): {x: number, y: number, z: number, cost: number}[] | null {
  type Node = {
    x: number;
    y: number;
    z: number;
    path: {x: number, y: number, z: number, cost: number}[];
    cost: number;
    est: number;
  };
  const open: Node[] = [
    { ...start, path: [{...start, cost: 0}], cost: 0, est: 0 }
  ];
  const visited = new Set<string>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const directions = [
    [1,0,0],[-1,0,0],[0,1,0],[0,-1,0], // orthogonal
    [1,1,0],[1,-1,0],[-1,1,0],[-1,-1,0] // diagonal
  ];
  function heuristic(x: number, y: number, z: number) {
    return Math.sqrt((x - goal.x) ** 2 + (y - goal.y) ** 2 + (z - goal.z) ** 2);
  }
  while (open.length > 0) {
    // Get node with lowest cost + heuristic
    open.sort((a, b) => (a.cost + a.est) - (b.cost + b.est));
    const {x, y, z, path, cost} = open.shift()!;
    if (x === goal.x && y === goal.y && z === goal.z) return path;
    if (visited.has(key(x, y, z))) continue;
    visited.add(key(x, y, z));
    // 2D movement
    for (const [dx, dy, dz] of directions) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nz !== z) continue; // Only allow 2D movement here
      if (!grid.isValidMove(nx, ny, nz)) continue;
      const cell = grid.getCell(nx, ny, nz);
      // Use walkability helpers
      if (isWalkableFloor(cell.floor) && isWalkableWall(cell.wall)) {
        const crowdCost = getMoveCost({x, y, z}, {x: nx, y: ny, z: nz});
        open.push({
          x: nx, y: ny, z: nz,
          path: [...path, {x: nx, y: ny, z: nz, cost: crowdCost}],
          cost: cost + crowdCost,
          est: heuristic(nx, ny, nz)
        });
      }
    }
    // 3D movement: stairs only
    const here = grid.getCell(x, y, z);
    // Up
    if (here.wall === WallType.StairsUp && z + 1 < depth) {
      const upCell = grid.getCell(x, y, z + 1);
      if (isWalkableFloor(upCell.floor) && isWalkableWall(upCell.wall) && grid.isValidMove(x, y, z + 1)) {
        const npcCount = zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z + 1).length;
        const stairCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
        open.push({
          x: x, y: y, z: z + 1,
          path: [...path, {x: x, y: y, z: z + 1, cost: stairCost}],
          cost: cost + stairCost,
          est: heuristic(x, y, z + 1)
        });
      }
    }
    // Down
    if (here.floor === FloorType.StairsDown && z - 1 >= 0) {
      const downCell = grid.getCell(x, y, z - 1);
      if (isWalkableFloor(downCell.floor) && isWalkableWall(downCell.wall) && grid.isValidMove(x, y, z - 1)) {
        const npcCount = zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z - 1).length;
        const stairCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
        open.push({
          x: x, y: y, z: z - 1,
          path: [...path, {x: x, y: y, z: z - 1, cost: stairCost}],
          cost: cost + stairCost,
          est: heuristic(x, y, z - 1)
        });
      }
    }
  }
  return null;
}

// Helpers for walkability
export function isWalkableFloor(floor: FloorType): boolean {
  return floor === FloorType.Floor || floor === FloorType.StairsDown;
}
export function isWalkableWall(wall: WallType): boolean {
  return wall === WallType.Air || wall === WallType.StairsUp;
}

// Helper for movement cost (including stairs)
export function getMoveCost(from: {x: number, y: number, z: number}, to: {x: number, y: number, z: number}): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cell = grid.getCell(to.x, to.y, to.z);
  let baseMoveCost = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
  if (cell.wall === WallType.StairsUp || cell.floor === FloorType.StairsDown) {
    baseMoveCost = (dx !== 0 && dy !== 0) ? 1.5 * Math.SQRT2 : 1.5;
  }
  const npcCount = zombies.filter(zb => zb.x === to.x && zb.y === to.y && zb.z === to.z).length;
  return baseMoveCost * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
}
