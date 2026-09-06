import { Grid, FloorType, WallType } from './core/grid';
import { renderState } from './renderer';
import { grid, zombies as worldZombies, player as worldPlayer, width, height, depth } from './world';
import { getMoveCost, isWalkableFloor, isWalkableWall, astar } from './pathfinding';
import { getVisibleObjects, getHeardObjects } from './core/awareness';
import type { Zombie, Player } from './world';

export type Position = { x: number; y: number; z: number };

export function parseDirection(numKey: string): Position | null {
  switch (numKey) {
    case '1': return { x: -1, y: 1, z: 0 };
    case '2': return { x: 0, y: 1, z: 0 };
    case '3': return { x: 1, y: 1, z: 0 };
    case '4': return { x: -1, y: 0, z: 0 };
    case '5': return null;
    case '6': return { x: 1, y: 0, z: 0 };
    case '7': return { x: -1, y: -1, z: 0 };
    case '8': return { x: 0, y: -1, z: 0 };
    case '9': return { x: 1, y: -1, z: 0 };
    case 'å': return { x: 0, y: 0, z: 1 };
    case 'ä': return { x: 0, y: 0, z: -1 };
    default: return null;
  }
}

export function moveEntity(entity: Position & { moveProgress: number; baseSpeed?: number }, direction: Position, gridObj: Grid): boolean {
  const dx = entity.x + direction.x;
  const dy = entity.y + direction.y;
  const dz = entity.z + direction.z;

  if (!gridObj.isValidMove(dx, dy, dz)) return false;

  const destCell = gridObj.getCell(dx, dy, dz);
  if (!destCell || !isWalkableFloor(destCell.floor) || !isWalkableWall(destCell.wall)) return false;

  const moveCost = getMoveCost(entity, { x: dx, y: dy, z: dz });
  if (entity.moveProgress >= moveCost) {
    entity.x = dx;
    entity.y = dy;
    entity.z = dz;
    entity.moveProgress -= moveCost;
    return true;
  }

  if (typeof entity.baseSpeed === 'number') {
    entity.moveProgress = Math.min(entity.moveProgress + entity.baseSpeed, entity.baseSpeed);
  }
  return false;
}

export function startPlayerMovement(player: Player | null, direction: Position | null, gridObj: Grid) {
  if (!player || !direction) return;

  const moved = moveEntity(player, direction, gridObj);
  if (moved) {
    renderState(worldZombies, player, player.z, `Moved to (${player.x},${player.y},${player.z}) | Move Progress: ${player.moveProgress.toFixed(2)}`);
    tickGame(1, player.z);
  } else {
    renderState(worldZombies, player, player.z, `Invalid move or not enough movement points. Move Progress: ${player.moveProgress.toFixed(2)}`);
  }
}

function isWeaponInRange(attacker: Zombie, target: Position): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const dz = target.z - attacker.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance <= attacker.weapon.range;
}

export function tickGame(ticksPerStep: number, currentZLevel: number) {
  for (let t = 0; t < ticksPerStep; t++) {
    for (const zombie of worldZombies) {
      zombie.recalculated = false;
      zombie.soundLevel = 0;
      if (zombie.playerHeardAt) {
        zombie.playerHeardAt.ticks -= 1;
        if (zombie.playerHeardAt.ticks <= 0) zombie.playerHeardAt = null;
      }

      if (worldPlayer && isWeaponInRange(zombie, worldPlayer)) {
        zombie.moveProgress = -5;
        renderState(worldZombies, worldPlayer, currentZLevel, `Zombie at (${zombie.x},${zombie.y},${zombie.z}) attacks the player!`);
        continue;
      }
    }

    for (const zombie of worldZombies) {
      const seen = getVisibleObjects(zombie, grid, worldZombies, worldPlayer);
      const heard = getHeardObjects(zombie, grid, worldZombies, worldPlayer);
      let newIntent: Zombie['intent'] = 'roaming';
      let newTarget: Position | null = null;

      if (seen.has('player') && worldPlayer) {
        newIntent = 'enraged';
        newTarget = { ...worldPlayer };
      } else if (heard.has('player') && worldPlayer) {
        zombie.playerHeardAt = { x: worldPlayer.x, y: worldPlayer.y, z: worldPlayer.z, ticks: 5 };
      }

      if (!newTarget) {
        const enragedZombies = worldZombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && seen.has('zombie'));
        if (enragedZombies.length > 0) {
          const targetZ = enragedZombies[0];
          newIntent = 'aware';
          newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
        } else {
          const heardEnraged = worldZombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && heard.has('zombie'));
          if (heardEnraged.length > 0) {
            const targetZ = heardEnraged[0];
            newIntent = 'aware';
            newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
          } else {
            const awareZombies = worldZombies.filter(zb => zb !== zombie && zb.intent === 'aware' && seen.has('zombie') && heard.has('zombie') && zb.virtualTarget);
            if (awareZombies.length > 0) {
              newIntent = 'aware';
              newTarget = awareZombies[0].virtualTarget ?? null;
            } else if (zombie.playerHeardAt) {
              newIntent = 'roaming';
              newTarget = { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z };
            } else {
              newIntent = 'roaming';
              newTarget = null;
            }
          }
        }
      }

      zombie.intent = newIntent;
      zombie.virtualTarget = newTarget;
    }

    for (const zombie of worldZombies) {
      let speed = zombie.baseSpeed * zombie.health;
      if (zombie.state === 'roaming') speed /= 2;
      zombie.moveProgress += speed;

      if (zombie.intent === 'enraged' && worldPlayer) {
        zombie.state = 'enraged';
        zombie.soundLevel = 2;
        if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const path = astar(zombie, worldPlayer);
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
          }
        }
      } else if (zombie.intent === 'aware' && zombie.virtualTarget) {
        zombie.state = 'roaming';
        zombie.soundLevel = 1;
        if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const path = astar(zombie, zombie.virtualTarget);
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
            zombie.roamTarget = zombie.virtualTarget;
          }
        }
      } else if (zombie.intent === 'roaming') {
        zombie.state = 'roaming';
        zombie.soundLevel = 0;
        if (zombie.playerHeardAt && (!zombie.path || zombie.pathIndex >= zombie.path.length)) {
          const path = astar(zombie, { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z });
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
            zombie.roamTarget = { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z };
          }
        } else if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const minX = Math.max(0, zombie.x - 2);
          const maxX = Math.min(width - 1, zombie.x + 2);
          const minY = Math.max(0, zombie.y - 2);
          const maxY = Math.min(height - 1, zombie.y + 2);
          for (let tries = 0; tries < 10; tries++) {
            const tx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const ty = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            if (tx === zombie.x && ty === zombie.y) continue;
            const path = astar(zombie, { x: tx, y: ty, z: zombie.z });
            if (path && path.length > 1) {
              zombie.path = path.slice(1);
              zombie.pathIndex = 0;
              zombie.roamTarget = { x: tx, y: ty, z: zombie.z };
              break;
            }
          }
        }
      }

      if ((!zombie.path || zombie.pathIndex >= (zombie.path?.length ?? 0)) && zombie.state !== 'roaming') {
        zombie.state = 'roaming';
      }

      let moved = false;
      do {
        moved = false;
        let target: Position | undefined;
        if (zombie.state === 'moving' && worldPlayer) target = worldPlayer;
        if (zombie.state === 'roaming' && zombie.roamTarget) target = zombie.roamTarget;

        if ((zombie.state === 'moving' || zombie.state === 'roaming' || zombie.state === 'enraged') && zombie.path && zombie.pathIndex < zombie.path.length) {
          const next = zombie.path[zombie.pathIndex];
          let moveCost: number;
          if (zombie.x === next.x && zombie.y === next.y && zombie.z !== next.z) {
            if (next.z > zombie.z) {
              const here = grid.getCell(zombie.x, zombie.y, zombie.z);
              const dest = grid.getCell(next.x, next.y, next.z);
              if (here && dest && here.wall === WallType.StairsUp && isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) && grid.isValidMove(next.x, next.y, next.z)) {
                const npcCount = worldZombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
              } else {
                moveCost = Infinity;
              }
            } else if (next.z < zombie.z) {
              const here = grid.getCell(zombie.x, zombie.y, zombie.z);
              const dest = grid.getCell(next.x, next.y, next.z);
              if (here && dest && here.floor === FloorType.StairsDown && isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) && grid.isValidMove(next.x, next.y, next.z)) {
                const npcCount = worldZombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
              } else {
                moveCost = Infinity;
              }
            } else {
              moveCost = Infinity;
            }
          } else {
            moveCost = getMoveCost(zombie, next);
          }

          if (Math.abs((next.cost ?? 1) - moveCost) > 1e-6 && target) {
            const newPath = astar(zombie, target);
            if (newPath && newPath.length > 1) {
              zombie.path = newPath.slice(1);
              zombie.pathIndex = 0;
              zombie.recalculated = true;
              continue;
            }
            zombie.path = null;
            zombie.pathIndex = 0;
            break;
          }

          if (zombie.moveProgress >= moveCost) {
            zombie.moveProgress -= moveCost;
            zombie.x = next.x; zombie.y = next.y; zombie.z = next.z;
            zombie.pathIndex++;
            moved = true;
            if (zombie.pathIndex >= zombie.path.length) {
              if (zombie.state === 'moving') {
                zombie.state = 'roaming';
                zombie.path = null;
                zombie.pathIndex = 0;
              } else if (zombie.state === 'roaming') {
                zombie.path = null;
                zombie.pathIndex = 0;
                zombie.roamTarget = undefined;
              }
              break;
            }
          }
        }
      } while (moved && zombie.path && zombie.pathIndex < zombie.path.length && zombie.moveProgress >= (zombie.path[zombie.pathIndex]?.cost ?? 1));
    }
  }

  renderState(worldZombies, worldPlayer, currentZLevel, `Ticked ${ticksPerStep} time(s)`);
}

class Game {
  public grid: Grid;
  public zombies: Zombie[];
  public player: Player | null;
  private isRunning: boolean;

  constructor() {
    this.grid = new Grid(10, 10, 1);
    this.zombies = [];
    this.player = { x: 0, y: 0, z: 0, baseSpeed: 2, health: 1, moveProgress: 0, path: null, pathIndex: 0, state: 'idle' };
    this.isRunning = false;
  }

  start(): void {
    this.isRunning = true;
    console.log('Game started');
  }

  update(): void {
    if (!this.isRunning) return;
    console.log('Game updated');
  }

  end(): void {
    this.isRunning = false;
    console.log('Game ended');
  }
}

export default Game;
export { Game };
