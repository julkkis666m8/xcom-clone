import { grid, height, width, bullets } from './world';
import { zombies, player as playerRef } from './world';
import { getVisibleObjects, getHeardObjects } from './core/awareness';
import type { Zombie } from './world';
 
export function drawMap(zombiesArg: Zombie[], playerArg: { x: number; y: number; z: number } | null, zLevel: number) {
  console.log(`Z-level ${zLevel}`);
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const zombieHere = zombiesArg.find(zz => zz.x === x && zz.y === y && zz.z === zLevel);
      if (zombieHere) {
        row += 'Z';
      } else if (playerArg && playerArg.x === x && playerArg.y === y && playerArg.z === zLevel) {
        row += 'P';
      } else {
        const cell = grid.getCell(x, y, zLevel);
        let char = cell?.char ?? ' ';
        
        // Render Blood Color
        if (cell && cell.blood > 0) {
          const intensity = Math.min(cell.blood, 1);
          if (intensity > 0.5) {
            row += `\u001b[31m${char}\u001b[0m`; // Red
          } else if (intensity > 0.2) {
            row += `\u001b[33m${char}\u001b[0m`; // Yellow
          } else {
            row += char;
          }
        } else {
          row += char;
        }
      }
    }
    console.log(row);
  }
  console.log('');
}

export function printPrompt() {
  console.log('Press Enter for next tick, + to increase, - to decrease ticks per step, < or , to go down a Z-level, > or . to go up a Z-level. Ctrl+C to exit.');
}
 
export function renderState(zombiesArg: Zombie[], playerArg: { x: number; y: number; z: number } | null, zLevel: number, tickMsg?: string) {
  console.clear();
  if (tickMsg) {
    console.log(tickMsg);
  }
  drawMap(zombiesArg, playerArg, zLevel);
  
  // Render Bullets
      for (const bullet of bullets) {
          if (bullet.active) {
            let finalIcon = ' ';
            const { x, y, z } = bullet;
            const { vx, vy, vz } = bullet;

            if (Math.abs(vx) > 0.1 && vy === 0 && vz === 0) finalIcon = '-';
            else if (vx < 0 && vy !== 0 && vz === 0) finalIcon = '\\';
            else if (vx === 0 && vy !== 0 && vz === 0) finalIcon = '|';
            else if (vx === 0 && vy === 0 && vz !== 0) finalIcon = '+';
            else if (vx > 0 && vy !== 0 && vz === 0) finalIcon = '/';

            console.log(`Bullet: ${finalIcon} at (${Math.round(x)},${Math.round(y)},${Math.round(z)})`);
          }

      }


  zombiesArg.forEach((z, i) => {
    let intentStr = z.intent ?? 'idle';
    if (z.virtualTarget) {
      intentStr += `@(${z.virtualTarget.x},${z.virtualTarget.y},${z.virtualTarget.z})`;
    } else if (z.intent === 'enraged' && playerArg) {
      intentStr += `@(${playerArg.x},${playerArg.y},${playerArg.z})`;
    } else if (z.intent === 'roaming' && z.playerHeardAt) {
      intentStr += `@(${z.playerHeardAt.x},${z.playerHeardAt.y},${z.playerHeardAt.z})`;
    }
 
    let info = `Zombie ${i + 1}: (${z.x},${z.y},${z.z}) state=${z.state} intent=${intentStr} moveProgress=${z.moveProgress.toFixed(2)}`;
    if (z.recalculated) info += ' [recalculated path]';
    if (z.soundLevel === 2) info += ' [emitting: running]';
    else if (z.soundLevel === 1) info += ' [emitting: groaning]';
 
    const seen = getVisibleObjects(z, grid, zombiesArg, playerArg);
    const heard = getHeardObjects(z, grid, zombiesArg, playerArg);
    if (seen.size > 0) info += ` [sees: ${Array.from(seen).join(', ')}]`;
    if (heard.size > 0) info += ` [hears: ${Array.from(heard).join(', ')}]`;
 
    if (z.path && z.path.length > 0 && z.pathIndex < z.path.length) {
      const nextStep = z.path[z.pathIndex];
      info += `\n  Next move cost: ${nextStep.cost?.toFixed(2)}`;
    }
    console.log(info);
  });
  printPrompt();
}
 
export { zombies, playerRef };

