import { zombies, player, grid, width, height, depth } from './world';
import { astar, getMoveCost, isWalkableFloor, isWalkableWall } from './pathfinding';
import { FloorType, WallType } from './core/grid';
import { getVisibleObjects, getHeardObjects } from './core/awareness';
import { renderState } from './renderer';

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

export function startPlayerMovement(playerObj: typeof player, direction: {x: number, y: number, z: number} | null, gridObj: typeof grid) {
  if (!playerObj) return;
  if (direction) {
    const dx = playerObj.x + direction.x;
    const dy = playerObj.y + direction.y;
    const dz = playerObj.z + direction.z;

    if (gridObj.isValidMove(dx, dy, dz)) {
      // Calculate the move cost using the same algorithm as zombies
      let moveCost = getMoveCost(playerObj as any, { x: dx, y: dy, z: dz });

      if (playerObj.moveProgress < moveCost) {
        playerObj.moveProgress += moveCost;
      } else {
        playerObj.x = dx; playerObj.y = dy; playerObj.z = dz;
        playerObj.moveProgress -= moveCost;
        renderState(zombies, playerObj, playerObj.z, `Moved to (${dx},${dy},${dz})`);
      }
    } else {
      renderState(zombies, playerObj, playerObj.z, "Invalid move.");
    }
  }
}

export function tickGame(ticksPerStep: number, currentZLevel: number) {
  for (let t = 0; t < ticksPerStep; t++) {
    for (const zombie of zombies) {
      zombie.recalculated = false;
      zombie.soundLevel = 0;
      // Decay player-hearing memory
      if (zombie.playerHeardAt) {
        zombie.playerHeardAt.ticks--;
        if (zombie.playerHeardAt.ticks <= 0) zombie.playerHeardAt = null;
      }
    }
    // Awareness and intent selection
    for (const zombie of zombies) {
      const seen = getVisibleObjects(zombie, grid, zombies, player);
      const heard = getHeardObjects(zombie, grid, zombies, player);
      let newIntent: typeof zombie.intent = 'roaming';
      let newTarget: {x: number, y: number, z: number} | null = null;
      // 1. Sees player
      if (seen.has('player') && player) {
        newIntent = 'enraged';
        newTarget = { ...player };
      } else if (heard.has('player') && player) {
        // 2. Hears player: remember location
        zombie.playerHeardAt = { x: player.x, y: player.y, z: player.z, ticks: 5 };
      }
      // 3. Sees enraged zombie
      if (!newTarget) {
        const enragedZombies = zombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && seen.has('zombie'));
        if (enragedZombies.length > 0) {
          const targetZ = enragedZombies[0];
          newIntent = 'aware';
          newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
        } else {
          // 4. Hears enraged zombie
          const heardEnraged = zombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && heard.has('zombie'));
          if (heardEnraged.length > 0) {
            const targetZ = heardEnraged[0];
            newIntent = 'aware';
            newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
          } else {
            // 5. Sees and hears an aware zombie (virtual awareness)
            const awareZombies = zombies.filter(zb => zb !== zombie && zb.intent === 'aware' && seen.has('zombie') && heard.has('zombie') && zb.virtualTarget);
            if (awareZombies.length > 0) {
              newIntent = 'aware';
              newTarget = awareZombies[0].virtualTarget!;
            } else if (zombie.playerHeardAt) {
              // 6. Roam toward last heard player
              newIntent = 'roaming';
              newTarget = { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z };
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
    for (const zombie of zombies) {
      // Accumulate movement points ONCE per tick
      let speed = zombie.baseSpeed * zombie.health;
      if (zombie.state === 'roaming') speed /= 2;
      zombie.moveProgress += speed;
      // Only pathfind if intent is 'enraged' (sees or virtually knows player)
      if (zombie.intent === 'enraged' && player) {
        if (zombie.state !== 'enraged') {
          zombie.state = 'enraged';
        }
        zombie.soundLevel = 2; // Running sound
        if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
          const path = astar(zombie, player);
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
        // Prefer to roam toward last heard player if memory exists
        if (zombie.playerHeardAt && (!zombie.path || zombie.pathIndex >= zombie.path.length)) {
          const path = astar(zombie, {x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z});
          if (path && path.length > 1) {
            zombie.path = path.slice(1);
            zombie.pathIndex = 0;
            zombie.roamTarget = {x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z};
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
        if (zombie.state === 'moving' && player) target = player;
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
                const npcCount = zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
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
                const npcCount = zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
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
              // Switch to roaming after reaching the player
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
  renderState(zombies, player, currentZLevel, `Ticked ${ticksPerStep} time(s)`);
}
