import { Cell, WallType, FloorType } from "./grid";
import type { Zombie } from "../world";

export const VISION_RADIUS = 8;
export const HEARING_RADIUS = 10;
export const VISION_THRESHOLD = 0.2;
export const HEARING_THRESHOLD = 0.1;

export function getTileTransparency(cell: Cell, hasNpc: boolean): number {
  let t = 1.0;
  if (cell.wall === WallType.Wall) t *= 0.0;
  else if (cell.floor === FloorType.Air) t *= 0.9;
  else t *= 1.0;
  if (hasNpc) t *= 0.8;
  return t;
}

export function getTileHearing(cell: Cell, hasNpc: boolean): number {
  let t = 1.0;
  if (cell.wall === WallType.Wall) t *= 0.2;
  else if (cell.floor === FloorType.Air) t *= 0.98;
  else t *= 1.0;
  if (hasNpc) t *= 0.9;
  return t;
}

export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0, y = y0;
  while (true) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return points;
}

// These functions require grid, zombies, player to be passed in
export function getVisibleObjects(zombie: Zombie, grid: any, zombies: Zombie[], player: {x: number, y: number, z: number} | null): Set<string> {
  const visible = new Set<string>();
  const x = zombie.x;
  const y = zombie.y;
  const z = zombie.z;
  if (player) {
    const lineToPlayer = bresenhamLine(x, y, player.x, player.y);
    let canSeePlayer = true;
    for (const [lx, ly] of lineToPlayer) {
      if (!grid.isValidMove(lx, ly, z)) {
        canSeePlayer = false;
        break;
      }
      const cell = grid.getCell(lx, ly, z);
      const hasNpc = zombies.some(zb => zb.x === lx && zb.y === ly && zb.z === z);
      if (getTileTransparency(cell, hasNpc) < VISION_THRESHOLD) {
        canSeePlayer = false;
        break;
      }
    }
    if (canSeePlayer) visible.add('player');
  }
  for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (!grid.isValidMove(nx, ny, z)) continue;
      const cell = grid.getCell(nx, ny, z);
      const hasNpc = zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z);
      if (getTileTransparency(cell, hasNpc) >= VISION_THRESHOLD) {
        if (zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z && (zb.x !== x || zb.y !== y))) visible.add('zombie');
        if (cell.wall === WallType.StairsUp) visible.add('stairs up');
        if (cell.floor === FloorType.StairsDown) visible.add('stairs down');
      }
    }
  }
  return visible;
}

export function getHeardObjects(zombie: Zombie, grid: any, zombies: Zombie[], player: {x: number, y: number, z: number} | null): Set<string> {
  const heard = new Set<string>();
  const x = zombie.x;
  const y = zombie.y;
  const z = zombie.z;
  for (let dx = -HEARING_RADIUS; dx <= HEARING_RADIUS; dx++) {
    for (let dy = -HEARING_RADIUS; dy <= HEARING_RADIUS; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (!grid.isValidMove(nx, ny, z)) continue;
      const cell = grid.getCell(nx, ny, z);
      const hasNpc = zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z);
      if (getTileHearing(cell, hasNpc) >= HEARING_THRESHOLD) {
        if (player && player.x === nx && player.y === ny && player.z === z) heard.add('player');
        if (zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z && (zb.x !== x || zb.y !== y))) heard.add('zombie');
        if (cell.wall === WallType.StairsUp) heard.add('stairs up');
        if (cell.floor === FloorType.StairsDown) heard.add('stairs down');
      }
    }
  }
  return heard;
}
