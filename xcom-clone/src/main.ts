import readline from 'readline';
import { grid, zombies, player, width, height, depth } from './world';
import { renderState, drawMap } from './renderer';
import { parseDirection, startPlayerMovement, tickGame } from './game';

// Print both Z-levels for quick verification
for (let z = 0; z < depth; z++) {
  console.log(`Z-level ${z}`);
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      row += grid.getCell(x, y, z).char;
    }
    console.log(row);
  }
  console.log('');
}

let currentZLevel = 0;
let ticksPerStep = 1;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Ensure raw mode is set correctly
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
}

function handleKeypress(chunk: Buffer) {
  const key = chunk.toString();
  if (key === '\u0003') { // Ctrl+C
    process.exit();
  } else if (key === '+' || key === '=') {
    ticksPerStep = Math.min(100, ticksPerStep + 1);
    renderState(zombies, player, currentZLevel, `Ticks per step: ${ticksPerStep}`);
  } else if (key === '-') {
    ticksPerStep = Math.max(1, ticksPerStep - 1);
    renderState(zombies, player, currentZLevel, `Ticks per step: ${ticksPerStep}`);
  } else if (key === '<' || key === ',') {
    if (currentZLevel > 0) {
      currentZLevel--;
      renderState(zombies, player, currentZLevel, `Z-level: ${currentZLevel}`);
    } else {
      renderState(zombies, player, currentZLevel, 'Already at lowest Z-level.');
    }
  } else if (key === '>' || key === '.') {
    if (currentZLevel < depth - 1) {
      currentZLevel++;
      renderState(zombies, player, currentZLevel, `Z-level: ${currentZLevel}`);
    } else {
      renderState(zombies, player, currentZLevel, 'Already at highest Z-level.');
    }
  } else if (key === '\r' || key === '\n') {
    tickGame(ticksPerStep, currentZLevel);
  } else if (key === 'å') {
    const direction = { x: 0, y: 0, z: 1 }; // Climb up
    if (player) startPlayerMovement(player, direction, grid);
  } else if (key === 'ä') {
    const direction = { x: 0, y: 0, z: -1 }; // Climb down
    if (player) startPlayerMovement(player, direction, grid);
  } else if ('1' <= key && key <= '9') {
    const direction = parseDirection(key);
    if (player) {
      startPlayerMovement(player, direction, grid);
    }
  }
}

// Handle raw keypresses
process.stdin.on('data', handleKeypress);

// Initial render
renderState(zombies, player, currentZLevel);
