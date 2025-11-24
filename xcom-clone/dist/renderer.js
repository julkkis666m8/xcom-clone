"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderState = exports.printPrompt = exports.drawMap = void 0;
const world_1 = require("./world");
const awareness_1 = require("./core/awareness");
function drawMap(zombiesArg, playerArg, zLevel) {
    console.log(`Z-level ${zLevel}`);
    for (let y = 0; y < world_1.height; y++) {
        let row = '';
        for (let x = 0; x < world_1.width; x++) {
            // Only draw a zombie or player if they are currently at this position
            const zombieHere = zombiesArg.find(zz => zz.x === x && zz.y === y && zz.z === zLevel);
            if (zombieHere) {
                row += 'Z';
            }
            else if (playerArg && playerArg.x === x && playerArg.y === y && playerArg.z === zLevel) {
                row += 'P';
            }
            else {
                row += world_1.grid.getCell(x, y, zLevel).char;
            }
        }
        console.log(row);
    }
    console.log('');
}
exports.drawMap = drawMap;
function printPrompt() {
    console.log("Press Enter for next tick, + to increase, - to decrease ticks per step, < or , to go down a Z-level, > or . to go up a Z-level. Ctrl+C to exit.");
}
exports.printPrompt = printPrompt;
function renderState(zombiesArg, playerArg, zLevel, tickMsg) {
    console.clear();
    if (tickMsg) {
        console.log(tickMsg);
    }
    drawMap(zombiesArg, playerArg, zLevel);
    zombiesArg.forEach((z, i) => {
        var _a;
        let intentStr = z.intent;
        if (z.virtualTarget) {
            intentStr += `@(${z.virtualTarget.x},${z.virtualTarget.y},${z.virtualTarget.z})`;
        }
        else if (z.intent === 'enraged' && playerArg) {
            intentStr += `@(${playerArg.x},${playerArg.y},${playerArg.z})`;
        }
        else if (z.intent === 'roaming' && z.playerHeardAt) {
            intentStr += `@(${z.playerHeardAt.x},${z.playerHeardAt.y},${z.playerHeardAt.z})`;
        }
        let info = `Zombie ${i + 1}: (${z.x},${z.y},${z.z}) state=${z.state} intent=${intentStr} moveProgress=${z.moveProgress.toFixed(2)}`;
        if (z.recalculated)
            info += ' [recalculated path]';
        if (z.soundLevel === 2)
            info += ' [emitting: running]';
        else if (z.soundLevel === 1)
            info += ' [emitting: groaning]';
        // Awareness
        const seen = (0, awareness_1.getVisibleObjects)(z, world_1.grid, zombiesArg, playerArg);
        const heard = (0, awareness_1.getHeardObjects)(z, world_1.grid, zombiesArg, playerArg);
        if (seen.size > 0)
            info += ` [sees: ${Array.from(seen).join(', ')}]`;
        if (heard.size > 0)
            info += ` [hears: ${Array.from(heard).join(', ')}]`;
        // Print path for debugging
        if (z.path && z.path.length > 0) {
            if (z.pathIndex < z.path.length) {
                const nextStep = z.path[z.pathIndex];
                info += `\n  Next move cost: ${(_a = nextStep.cost) === null || _a === void 0 ? void 0 : _a.toFixed(2)}`;
            }
        }
        console.log(info);
    });
    printPrompt();
}
exports.renderState = renderState;
