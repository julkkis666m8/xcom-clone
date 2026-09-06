import { zombies: typeof zombies, player: {x: number, y: number, z: number} | null, grid, width, height, depth } from './world';
import { astar, getMoveCost, isWalkableFloor, isWalkableWall } from './pathfinding';
import { FloorType, WallType } from './core/grid';
import { renderState } from './renderer';
import { getVisibleObjects, getHeardObjects } from './core/awareness';
import type { Zombie } from './world';

export function parseDirection(numKey: string): {x: number, y: number, z: number} | null {
  switch (numKey) {
    case '1': return { x: -1, y: 1, z: 0 };
    case '2': return { x: 0, y: 1, z: 0 };
    case '3': return { x: 1, y: 1, z: 0 };
    case '4': return { x: -1, y: 0, z: 0 };
    case '5': return null; // No movement
    case '6': return { x: 1, y: 0, z: 0 };
    case '7': return { x: -1, y: -1, z: 0 };
    case '8': return { x: 0, y: -1, z: 0 };
    case '9': return { x: 1, y: -1, z: 0 };
    case 'å': return { x: 0, y: 0, z: 1 };
    case 'ä': return { x: 0, y: 0, z: -1 };
    default: return null;
  }
}

export function moveEntity(entity: typeof player: {x: number, y: number, z: number} | null | Zombie, direction: {x: number, y: number, z: number}, gridObj: typeof grid): boolean {
  if (!entity) {
    throw new Error("Entity cannot be null");
  }

  const dx = entity.x + direction.x;
  const dy = entity.y + direction.y;
  const dz = entity.z + direction.z;

  if (!gridObj.isValidMove(dx, dy, dz)) {
    return false;
  }

  const destCell = gridObj.getCell(dx, dy, dz);
  if (!isWalkableFloor(destCell.floor) || !isWalkableWall(destCell.wall)) {
    return false;
  }

  const moveCost = getMoveCost(entity, { x: dx, y: dy, z: dz });
  if (entity.moveProgress >= moveCost) {
    entity.x = dx;
    entity.y = dy;
    entity.z = dz;
    entity.moveProgress -= moveCost;
    return true;
  } else {
    entity.moveProgress = Math.min(entity.moveProgress + entity.baseSpeed, entity.baseSpeed); // Cap movement progress
    return false;
  }
}

export function startPlayerMovement(player: {x: number, y: number, z: number} | nullObj: typeof player: {x: number, y: number, z: number} | null, direction: {x: number, y: number, z: number} | null, gridObj: typeof grid) {
  if (!player: {x: number, y: number, z: number} | nullObj || !direction) return;

  const moved = moveEntity(player: {x: number, y: number, z: number} | nullObj, direction, gridObj);
  if (moved) {
    renderState(zombies: typeof zombies, player: {x: number, y: number, z: number} | nullObj, player: {x: number, y: number, z: number} | nullObj.z, `Moved to (${player: {x: number, y: number, z: number} | nullObj.x},${player: {x: number, y: number, z: number} | nullObj.y},${player: {x: number, y: number, z: number} | nullObj.z}) | Move Progress: ${player: {x: number, y: number, z: number} | nullObj.moveProgress.toFixed(2)}`);
    tickGame(1, player: {x: number, y: number, z: number} | nullObj.z); // Trigger a tick after movement
  } else {
    renderState(zombies: typeof zombies, player: {x: number, y: number, z: number} | nullObj, player: {x: number, y: number, z: number} | nullObj.z, `Invalid move or not enough movement points. Move Progress: ${player: {x: number, y: number, z: number} | nullObj.moveProgress.toFixed(2)}`);
  }
}

function isWeaponInRange(attacker: Zombie, target: {x: number, y: number, z: number}): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const dz = target.z - attacker.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return distance <= attacker.weapon.range;
}

export function tickGame(ticksPerStep: number, currentZLevel: number) {
  for (let t = 0; t < ticksPerStep; t++) {
    for (const zombie of zombies: typeof zombies) {
      zombie.recalculated = false;
      zombie.soundLevel = 0;
      if (zombie.player: {x: number, y: number, z: number} | nullHeardAt) {
        zombie.player: {x: number, y: number, z: number} | nullHeardAt.ticks--;
        if (zombie.player: {x: number, y: number, z: number} | nullHeardAt.ticks <= 0) zombie.player: {x: number, y: number, z: number} | nullHeardAt = null;
      }

      // Check if zombie is in range to attack the player: {x: number, y: number, z: number} | null
      if (player: {x: number, y: number, z: number} | null && isWeaponInRange(zombie, player: {x: number, y: number, z: number} | null)) {
        zombie.moveProgress = -5; // Attack sets moveProgress to -5
        renderState(zombies: typeof zombies, player: {x: number, y: number, z: number} | null, currentZLevel, `Zombie at (${zombie.x},${zombie.y},${zombie.z}) attacks the player: {x: number, y: number, z: number} | null!`);
        continue; // Skip movement if attacking
      }

      // Cap zombie movement progress
      //zombie.moveProgress = Math.min(zombie.moveProgress, zombie.baseSpeed);
    }

    // Awareness and intent selection
    for (const zombie of zombies: typeof zombies) {
      const seen = getVisibleObjects(zombie, grid, zombies: typeof zombies, player: {x: number, y: number, z: number} | null);
      const heard = getHeardObjects(zombie, grid, zombies: typeof zombies, player: {x: number, y: number, z: number} | null);
      let newIntent: typeof zombie.intent = 'roaming';
      let newTarget: {x: number, y: number, z: number} | null = null;
      // 1. Sees player: {x: number, y: number, z: number} | null
      if (seen.has('player: {x: number, y: number, z: number} | null') && player: {x: number, y: number, z: number} | null) {
        newIntent = 'enraged';
        newTarget = { ...player: {x: number, y: number, z: number} | null };
      } else if (heard.has('player: {x: number, y: number, z: number} | null') && player: {x: number, y: number, z: number} | null) {
        // 2. Hears player: {x: number, y: number, z: number} | null: remember location
        zombie.player: {x: number, y: number, z: number} | nullHeardAt = { x: player: {x: number, y: number, z: number} | null.x, y: player: {x: number, y: number, z: number} | null.y, z: player: {x: number, y: number, z: number} | null.z, ticks: 5 };
      }
      // 3. Sees enraged zombie
      if (!newTarget) {
        const enragedZombies = zombies: typeof zombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && seen.has('zombie'));
        if (enragedZombies.length > 0) {
          const targetZ = enragedZombies[0];
          newIntent = 'aware';
          newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
        } else {
          // 4. Hears enraged zombie
          const heardEnraged = zombies: typeof zombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && heard.has('zombie'));
          if (heardEnraged.length > 0) {
            const targetZ = heardEnraged[0];
            newIntent = 'aware';
            newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
          } else {
            // 5. Sees and hears an aware zombie (virtual awareness)
            const awareZombies = zombies: typeof zombies.filter(zb => zb !== zombie && zb.intent === 'aware' && seen.has('zombie') && heard.has('zombie') && zb.virtualTarget);
            if (awareZombies.length > 0) {
              newIntent = 'aware';
              newTarget = awareZombies[0].virtualTarget!;
            } else if (zombie.player: {x: number, y: number, z: number} | nullHeardAt) {
              // 6. Roam toward last heard player: {x: number, y: number, z: number} | null
              newIntent = 'roaming';
              newTarget = { x: zombie.player: {x: number, y: number, z: number} | nullHeardAt.x, y: zombie.player: {x: number, y: number, z: number} | nullHeardAt.y, z: zombie.player: {x: number, y: number, z: number} | nullHeardAt.z };
            } else {
              // 7. Default: roam
              newIntent = 'roaming';
              newTarget = null;
            }
          }
        }
      }
      zombie.intent = newIntent;
      zombie.virtualTarget = newTarget;
    }
    // Simulate tick
    for (const zombie of zombies: typeof zombies) {
      // Accumulate movement points ONCE per tick
      let speed = zombie.baseSpeed * zombie.health;
      if (zombie.state === 'roaming') speed /= 2;
      zombie.moveProgress += speed;
      // Only pathfind if intent is 'enraged' (sees or virtually knows player: {x: number, y: number, z: number} | null)
      if (zombie.intent === 'enraged' && player: {x: number, y: number, z: number} | null) {
        if (zombie.state !== 'enraged') {
          zombie.state = 'enraged';
        }
        zombie.soundLevel = 2; // Running sound
        if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const path = astar(zombie, player: {x: number, y: number, z: number} | null);
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
          }
        }
      } else if (zombie.intent === 'aware' && zombie.virtualTarget) {
        if (zombie.state !== 'roaming') zombie.state = 'roaming';
        zombie.soundLevel = 1; // Groaning sound
        if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const roamTarget = zombie.virtualTarget;
          const path = astar(zombie, roamTarget);
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
            zombie.roamTarget = roamTarget;
          }
        }
      } else if (zombie.intent === 'roaming') {
        if (zombie.state !== 'roaming') zombie.state = 'roaming';
        zombie.soundLevel = 0;
        // Prefer to roam toward last heard player: {x: number, y: number, z: number} | null if memory exists
        if (zombie.player: {x: number, y: number, z: number} | nullHeardAt && (!zombie.path || zombie.pathIndex >= zombie.path.length)) {
          const path = astar(zombie, {x: zombie.player: {x: number, y: number, z: number} | nullHeardAt.x, y: zombie.player: {x: number, y: number, z: number} | nullHeardAt.y, z: zombie.player: {x: number, y: number, z: number} | nullHeardAt.z});
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
            zombie.roamTarget = {x: zombie.player: {x: number, y: number, z: number} | nullHeardAt.x, y: zombie.player: {x: number, y: number, z: number} | nullHeardAt.y, z: zombie.player: {x: number, y: number, z: number} | nullHeardAt.z};
          }
        } else if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          // Roam randomly
          const minX = Math.max(0, zombie.x - 2);
          const maxX = Math.min(width - 1, zombie.x + 2);
          const minY = Math.max(0, zombie.y - 2);
          const maxY = Math.min(height - 1, zombie.y + 2);
          let found = false;
          for (let tries = 0; tries < 10 && !found; tries++) {
            const tx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            const ty = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            if (tx === zombie.x && ty === zombie.y) continue;
            const path = astar(zombie, {x: tx, y: ty, z: zombie.z});
            if (path && path.length > 1) {
              zombie.path = path.slice(1);
              zombie.pathIndex = 0;
              zombie.roamTarget = {x: tx, y: ty, z: zombie.z};
              found = true;
            }
          }
        }
      }
      // If zombie has no path and is not moving, set to roaming
      if ((!zombie.path || zombie.pathIndex >= (zombie.path?.length ?? 0)) && zombie.state !== 'roaming') {
        zombie.state = 'roaming';
      }
      // Move as many steps as possible
      let moved = false;
      do {
        moved = false;
        // Determine target for path recalculation
        let target: {x: number, y: number, z: number} | undefined = undefined;
        if (zombie.state === 'moving' && player: {x: number, y: number, z: number} | null) target = player: {x: number, y: number, z: number} | null;
        if (zombie.state === 'roaming' && zombie.roamTarget) target = zombie.roamTarget;

        if ((zombie.state === 'moving' || zombie.state === 'roaming' || zombie.state === 'enraged') && zombie.path && zombie.pathIndex < zombie.path.length) {
          const next = zombie.path[zombie.pathIndex];
          // Calculate current crowding cost for the next tile
          let moveCost: number;
          // 3D stair movement
          if (zombie.x === next.x && zombie.y === next.y && zombie.z !== next.z) {
            // Moving up
            if (next.z > zombie.z) {
              const here = grid.getCell(zombie.x, zombie.y, zombie.z);
              const dest = grid.getCell(next.x, next.y, next.z);
              if (
                here.wall === WallType.StairsUp &&
                isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) &&
                grid.isValidMove(next.x, next.y, next.z)
              ) {
                const npcCount = zombies: typeof zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
              } else {
                moveCost = Infinity;
              }
            // Moving down
            } else if (next.z < zombie.z) {
              const here = grid.getCell(zombie.x, zombie.y, zombie.z);
              const dest = grid.getCell(next.x, next.y, next.z);
              if (
                here.floor === FloorType.StairsDown &&
                isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) &&
                grid.isValidMove(next.x, next.y, next.z)
              ) {
                const npcCount = zombies: typeof zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
              } else {
                moveCost = Infinity;
              }
            } else {
              moveCost = Infinity;
            }
          } else {
            // 2D movement (use getMoveCost)
            moveCost = getMoveCost(zombie, next);
          }
          // If the cost has changed, recalculate path
          if (Math.abs((next.cost ?? 1) - moveCost) > 1e-6 && target) {
            const newPath = astar(zombie, target);
            if (newPath && newPath.length > 1) {
              zombie.path = newPath.slice(1);
              zombie.pathIndex = 0;
              zombie.recalculated = true; // Mark that we recalculated
              // Update next after recalculation
              continue;
            } else {
              // No valid path, stop moving
              zombie.path = null;
              zombie.pathIndex = 0;
              break;
            }
          }
          if (zombie.moveProgress >= moveCost) {
            zombie.moveProgress -= moveCost;
            zombie.x = next.x; zombie.y = next.y; zombie.z = next.z;
            zombie.pathIndex++;
            moved = true;
            if (zombie.pathIndex >= zombie.path.length) {
              // Switch to roaming after reaching the player: {x: number, y: number, z: number} | null
              if (zombie.state === 'moving') {
                zombie.state = 'roaming';
                zombie.path = null;
                zombie.pathIndex = 0;
              } else if (zombie.state === 'roaming') {
                // Pick a new roam target next tick
                zombie.path = null;
                zombie.pathIndex = 0;
                zombie.roamTarget = undefined;
              }
              break;
            }
          }
        }
      } while (
        moved &&
        zombie.path &&
        zombie.pathIndex < zombie.path.length &&
        zombie.moveProgress >= (zombie.path[zombie.pathIndex]?.cost ?? 1)
      );
    }
  }
  renderState(zombies: typeof zombies, player: {x: number, y: number, z: number} | null, currentZLevel, `Ticked ${ticksPerStep} time(s)`);
}
