"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline_1 = __importDefault(require("readline"));
const world_1 = require("./world");
const renderer_1 = require("./renderer");
const game_1 = require("./game");
// Print both Z-levels for quick verification
for (let z = 0; z < world_1.depth; z++) {
    console.log(`Z-level ${z}`);
    for (let y = 0; y < world_1.height; y++) {
        let row = '';
        for (let x = 0; x < world_1.width; x++) {
            row += world_1.grid.getCell(x, y, z).char;
        }
        console.log(row);
    }
    console.log('');
}
let currentZLevel = 0;
let ticksPerStep = 1;
const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
// Ensure raw mode is set correctly
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
}
function handleKeypress(chunk) {
    const key = chunk.toString();
    if (key === '\u0003') { // Ctrl+C
        process.exit();
    }
    else if (key === '+' || key === '=') {
        ticksPerStep = Math.min(100, ticksPerStep + 1);
        (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, `Ticks per step: ${ticksPerStep}`);
    }
    else if (key === '-') {
        ticksPerStep = Math.max(1, ticksPerStep - 1);
        (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, `Ticks per step: ${ticksPerStep}`);
    }
    else if (key === '<' || key === ',') {
        if (currentZLevel > 0) {
            currentZLevel--;
            (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, `Z-level: ${currentZLevel}`);
        }
        else {
            (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, 'Already at lowest Z-level.');
        }
    }
    else if (key === '>' || key === '.') {
        if (currentZLevel < world_1.depth - 1) {
            currentZLevel++;
            (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, `Z-level: ${currentZLevel}`);
        }
        else {
            (0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel, 'Already at highest Z-level.');
        }
    }
    else if (key === '\r' || key === '\n') {
        (0, game_1.tickGame)(ticksPerStep, currentZLevel);
    }
    else if (key === 'å') {
        const direction = { x: 0, y: 0, z: 1 }; // Climb up
        if (world_1.player)
            (0, game_1.startPlayerMovement)(world_1.player, direction, world_1.grid);
    }
    else if (key === 'ä') {
        const direction = { x: 0, y: 0, z: -1 }; // Climb down
        if (world_1.player)
            (0, game_1.startPlayerMovement)(world_1.player, direction, world_1.grid);
    }
    else if ('1' <= key && key <= '9') {
        const direction = (0, game_1.parseDirection)(key);
        if (world_1.player) {
            (0, game_1.startPlayerMovement)(world_1.player, direction, world_1.grid);
        }
    }
}
// Handle raw keypresses
process.stdin.on('data', handleKeypress);
// Initial render
(0, renderer_1.renderState)(world_1.zombies, world_1.player, currentZLevel);
