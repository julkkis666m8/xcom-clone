import { grid, zombies, depth } from './world';
import { FloorType, WallType } from './core/grid';

export function astar(start: { x: number; y: number; z: number }, goal: { x: number; y: number; z: number }): { x: number; y: number; z: number; cost: number }[] | null {
  if (!grid.isValidMove(start.x, start.y, start.z) || !grid.isValidMove(goal.x, goal.y, goal.z)) {
    return null;
  }

  type Node = {
    x: number;
    y: number;
    z: number;
    path: { x: number; y: number; z: number; cost: number }[];
    cost: number;
    est: number;
  };

  const open: Node[] = [{
    x: start.x,
    y: start.y,
    z: start.z,
    path: [{ x: start.x, y: start.y, z: start.z, cost: 0 }],
    cost: 0,
    est: 0,
  }];

  const visited = new Set<string>();
  const key = (x: number, y: number, z: number) => `${x},${y},${z}`;
  const directions = [
    [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0],
    [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
  ];

  const heuristic = (x: number, y: number, z: number) => Math.sqrt((x - goal.x) ** 2 + (y - goal.y) ** 2 + (z - goal.z) ** 2);

  while (open.length > 0) {
    open.sort((a, b) => (a.cost + a.est) - (b.cost + b.est));
    const current = open.shift()!;
    const { x, y, z, path, cost } = current;

    if (x === goal.x && y === goal.y && z === goal.z) {
      return path;
    }

    const nodeKey = key(x, y, z);
    if (visited.has(nodeKey)) continue;
    visited.add(nodeKey);

    for (const [dx, dy, dz] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (nz !== z) continue;
      if (!grid.isValidMove(nx, ny, nz)) continue;

      const cell = grid.getCell(nx, ny, nz);
      if (!cell) continue;
      if (!isWalkableFloor(cell.floor) || !isWalkableWall(cell.wall)) continue;

      const moveCost = getMoveCost({ x, y, z }, { x: nx, y: ny, z: nz });
      open.push({
        x: nx,
        y: ny,
        z: nz,
        path: [...path, { x: nx, y: ny, z: nz, cost: moveCost }],
        cost: cost + moveCost,
        est: heuristic(nx, ny, nz),
      });
    }

    const here = grid.getCell(x, y, z);
    if (!here) continue;

    if (here.wall === WallType.StairsUp && z + 1 < depth) {
      const upCell = grid.getCell(x, y, z + 1);
      if (upCell && isWalkableFloor(upCell.floor) && isWalkableWall(upCell.wall)) {
        const stairCost = 2;
        open.push({
          x,
          y,
          z: z + 1,
          path: [...path, { x, y, z: z + 1, cost: stairCost }],
          cost: cost + stairCost,
          est: heuristic(x, y, z + 1),
        });
      }
    }

    if (here.floor === FloorType.StairsDown && z - 1 >= 0) {
      const downCell = grid.getCell(x, y, z - 1);
      if (downCell && isWalkableFloor(downCell.floor) && isWalkableWall(downCell.wall)) {
        const stairCost = 2;
        open.push({
          x,
          y,
          z: z - 1,
          path: [...path, { x, y, z: z - 1, cost: stairCost }],
          cost: cost + stairCost,
          est: heuristic(x, y, z - 1),
        });
      }
    }
  }

  return null;
}

export function isWalkableFloor(floor: FloorType | number): boolean {
  if (typeof floor === 'number') {
    return floor === 0 || floor === 2;
  }
  return floor === FloorType.Floor || floor === FloorType.StairsDown;
}

export function isWalkableWall(wall: WallType | number): boolean {
  if (typeof wall === 'number') {
    return wall === 0 || wall === 2;
  }
  return wall === WallType.Air || wall === WallType.StairsUp;
}

export function getMoveCost(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const cell = grid.getCell(to.x, to.y, to.z);
  if (!cell) return Number.POSITIVE_INFINITY;

  let baseMoveCost = dx !== 0 && dy !== 0 ? Math.SQRT2 : 1;
  if (cell.wall === WallType.StairsUp || cell.floor === FloorType.StairsDown) {
    baseMoveCost = dx !== 0 && dy !== 0 ? 1.5 * Math.SQRT2 : 1.5;
  }

  const npcCount = zombies.filter(zb => zb.x === to.x && zb.y === to.y && zb.z === to.z).length;
  return baseMoveCost * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
}
