"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const grid_1 = require("./core/grid");
const readline_1 = __importDefault(require("readline"));
const awareness_1 = require("./core/awareness");
// Base Z=0 map
const baseMap = [
    ",,,,,,,,,,,,,,,,,ZZZ",
    ",,,,,,,,#,,,,,,,,,,,",
    ",,,,,,,,#>,,,,,,,,,,",
    ",,###########,,,,,,,",
    ",>#>,#,,,,,,,,,,,,,,",
    ",>#,,,,######,,,,,,,",
    ",>#,,###,,,P######,#",
    "Z>####>,,,,,,,,,,,,,"
];
// Z=1: roof and upper floors
const roofMap = baseMap.map((row, y) => row.split('').map((char, x) => {
    // If there is a wall at (x, y, 0), make (x, y, 1) a walkable floor
    if (baseMap[y][x] === '#')
        return ',';
    if (char === '>')
        return '<'; // down-stair above up-stair
    return ' '; // air elsewhere
}).join(''));
const asciiMaps = [baseMap, roofMap];
// Character to Cell mapping
const charMap = {
    ',': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air },
    '#': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Wall },
    '>': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.StairsUp },
    '<': { floor: grid_1.FloorType.StairsDown, wall: grid_1.WallType.Air },
    ' ': { floor: grid_1.FloorType.Air, wall: grid_1.WallType.Air },
    'Z': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air },
    'P': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air }, // P is a player entity on a floor
};
// Create the grid for both Z-levels
const height = asciiMaps[0].length;
const width = asciiMaps[0][0].length;
const depth = asciiMaps.length;
const grid = new grid_1.Grid(width, height, depth);
const zombies = [];
let player = null;
for (let z = 0; z < depth; z++) {
    const asciiMap = asciiMaps[z];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const char = asciiMap[y][x];
            const def = (_a = charMap[char]) !== null && _a !== void 0 ? _a : {};
            const cell = {
                floor: (_b = def.floor) !== null && _b !== void 0 ? _b : grid_1.FloorType.Floor,
                wall: (_c = def.wall) !== null && _c !== void 0 ? _c : grid_1.WallType.Air,
                char: (char === 'Z' || char === 'P') ? ',' : char,
            };
            grid.setCell(x, y, z, cell);
            if (z === 0) {
                if (char === 'Z')
                    zombies.push({
                        x, y, z,
                        baseSpeed: 1,
                        health: 1,
                        moveProgress: 0,
                        path: null,
                        pathIndex: 0,
                        state: 'idle',
                    });
                if (char === 'P')
                    player = {
                        x, y, z,
                        baseSpeed: 1,
                        health: 1,
                        moveProgress: 0,
                        path: null,
                        pathIndex: 0,
                        state: 'idle',
                    };
            }
        }
    }
}
// Simple A* pathfinding with diagonal support, cost, and NPC crowding penalty
function astar(start, goal) {
    const open = [
        Object.assign(Object.assign({}, start), { path: [Object.assign(Object.assign({}, start), { cost: 0 })], cost: 0, est: 0 })
    ];
    const visited = new Set();
    const key = (x, y, z) => `${x},${y},${z}`;
    const directions = [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0],
        [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0] // diagonal
    ];
    function heuristic(x, y, z) {
        return Math.sqrt(Math.pow((x - goal.x), 2) + Math.pow((y - goal.y), 2) + Math.pow((z - goal.z), 2));
    }
    while (open.length > 0) {
        // Get node with lowest cost + heuristic
        open.sort((a, b) => (a.cost + a.est) - (b.cost + b.est));
        const { x, y, z, path, cost } = open.shift();
        if (x === goal.x && y === goal.y && z === goal.z)
            return path;
        if (visited.has(key(x, y, z)))
            continue;
        visited.add(key(x, y, z));
        // 2D movement
        for (const [dx, dy, dz] of directions) {
            const nx = x + dx, ny = y + dy, nz = z + dz;
            if (nz !== z)
                continue; // Only allow 2D movement here
            if (!grid.isValidMove(nx, ny, nz))
                continue;
            const cell = grid.getCell(nx, ny, nz);
            // Use walkability helpers
            if (isWalkableFloor(cell.floor) && isWalkableWall(cell.wall)) {
                const crowdCost = getMoveCost({ x, y, z }, { x: nx, y: ny, z: nz });
                open.push({
                    x: nx, y: ny, z: nz,
                    path: [...path, { x: nx, y: ny, z: nz, cost: crowdCost }],
                    cost: cost + crowdCost,
                    est: heuristic(nx, ny, nz)
                });
            }
        }
        // 3D movement: stairs only
        const here = grid.getCell(x, y, z);
        // Up
        if (here.wall === grid_1.WallType.StairsUp && z + 1 < depth) {
            const upCell = grid.getCell(x, y, z + 1);
            if (isWalkableFloor(upCell.floor) && isWalkableWall(upCell.wall) && grid.isValidMove(x, y, z + 1)) {
                const npcCount = zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z + 1).length;
                const stairCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
                open.push({
                    x: x, y: y, z: z + 1,
                    path: [...path, { x: x, y: y, z: z + 1, cost: stairCost }],
                    cost: cost + stairCost,
                    est: heuristic(x, y, z + 1)
                });
            }
        }
        // Down
        if (here.floor === grid_1.FloorType.StairsDown && z - 1 >= 0) {
            const downCell = grid.getCell(x, y, z - 1);
            if (isWalkableFloor(downCell.floor) && isWalkableWall(downCell.wall) && grid.isValidMove(x, y, z - 1)) {
                const npcCount = zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z - 1).length;
                const stairCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
                open.push({
                    x: x, y: y, z: z - 1,
                    path: [...path, { x: x, y: y, z: z - 1, cost: stairCost }],
                    cost: cost + stairCost,
                    est: heuristic(x, y, z - 1)
                });
            }
        }
    }
    return null;
}
// Helpers for walkability
function isWalkableFloor(floor) {
    return floor === grid_1.FloorType.Floor || floor === grid_1.FloorType.StairsDown;
}
function isWalkableWall(wall) {
    return wall === grid_1.WallType.Air || wall === grid_1.WallType.StairsUp;
}
// Helper for movement cost (including stairs)
function getMoveCost(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cell = grid.getCell(to.x, to.y, to.z);
    let baseMoveCost = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
    if (cell.wall === grid_1.WallType.StairsUp || cell.floor === grid_1.FloorType.StairsDown) {
        baseMoveCost = (dx !== 0 && dy !== 0) ? 1.5 * Math.SQRT2 : 1.5;
    }
    const npcCount = zombies.filter(zb => zb.x === to.x && zb.y === to.y && zb.z === to.z).length;
    return baseMoveCost * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
}
function drawMap(zombies, player, zLevel) {
    console.log(`Z-level ${zLevel}`);
    for (let y = 0; y < height; y++) {
        let row = '';
        for (let x = 0; x < width; x++) {
            // Only draw a zombie or player if they are currently at this position
            const zombieHere = zombies.find(zz => zz.x === x && zz.y === y && zz.z === zLevel);
            if (zombieHere) {
                row += 'Z';
            }
            else if (player && player.x === x && player.y === y && player.z === zLevel) {
                row += 'P';
            }
            else {
                row += grid.getCell(x, y, zLevel).char;
            }
        }
        console.log(row);
    }
    console.log('');
}
// Print both Z-levels for verification
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
// Pathfind for each zombie to the player
if (player) {
    zombies.forEach((zombie, i) => {
        const path = astar(zombie, player);
        if (path) {
            console.log(`Zombie ${i + 1} path:`, path.map(p => `(${p.x},${p.y},${p.z})`).join(' -> '));
        }
        else {
            console.log(`Zombie ${i + 1} cannot reach the player.`);
        }
    });
}
else {
    console.log('No player found on the map.');
}
let currentZLevel = 0;
let ticksPerStep = 1;
const rl = readline_1.default.createInterface({ input: process.stdin, output: process.stdout });
// Set up raw mode for immediate keypress handling
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
}
process.stdin.resume();
function printPrompt() {
    console.log("Press Enter for next tick, + to increase, - to decrease ticks per step, < or , to go down a Z-level, > or . to go up a Z-level. Ctrl+C to exit.");
}
function renderState(tickMsg) {
    console.clear();
    if (tickMsg) {
        console.log(tickMsg);
    }
    drawMap(zombies, player, currentZLevel);
    zombies.forEach((z, i) => {
        var _a;
        let intentStr = z.intent;
        if (z.virtualTarget) {
            intentStr += `@(${z.virtualTarget.x},${z.virtualTarget.y},${z.virtualTarget.z})`;
        }
        else if (z.intent === 'enraged' && player) {
            intentStr += `@(${player.x},${player.y},${player.z})`;
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
        const seen = (0, awareness_1.getVisibleObjects)(z, grid, zombies, player);
        const heard = (0, awareness_1.getHeardObjects)(z, grid, zombies, player);
        if (seen.size > 0)
            info += ` [sees: ${Array.from(seen).join(', ')}]`;
        if (heard.size > 0)
            info += ` [hears: ${Array.from(heard).join(', ')}]`;
        // Print path for debugging
        if (z.path && z.path.length > 0) {
            //info += `\n  Path: ` + z.path.map(p => `(${p.x},${p.y},${p.z})`).join(' -> ');
            // Show cost for the next movement step
            if (z.pathIndex < z.path.length) {
                const nextStep = z.path[z.pathIndex];
                info += `\n  Next move cost: ${(_a = nextStep.cost) === null || _a === void 0 ? void 0 : _a.toFixed(2)}`;
            }
        }
        console.log(info);
    });
    printPrompt();
}
function handleKeypress(chunk) {
    const key = chunk.toString();
    if (key === '\u0003') { // Ctrl+C
        process.exit();
    }
    else if (key === '+' || key === '=') {
        ticksPerStep = Math.min(100, ticksPerStep + 1);
        renderState(`Ticks per step: ${ticksPerStep}`);
    }
    else if (key === '-') {
        ticksPerStep = Math.max(1, ticksPerStep - 1);
        renderState(`Ticks per step: ${ticksPerStep}`);
    }
    else if (key === '<' || key === ',') {
        if (currentZLevel > 0) {
            currentZLevel--;
            renderState(`Z-level: ${currentZLevel}`);
        }
        else {
            renderState('Already at lowest Z-level.');
        }
    }
    else if (key === '>' || key === '.') {
        if (currentZLevel < depth - 1) {
            currentZLevel++;
            renderState(`Z-level: ${currentZLevel}`);
        }
        else {
            renderState('Already at highest Z-level.');
        }
    }
    else if (key === '\r' || key === '\n') {
        tickGame();
    }
    else if ('1' <= key && key <= '9') {
        const direction = parseDirection(key);
        if (player) {
            startPlayerMovement(player, direction, grid);
        }
    }
}
function parseDirection(numKey) {
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
function startPlayerMovement(player, direction, grid) {
    if (direction) {
        const dx = player.x + direction.x;
        const dy = player.y + direction.y;
        const dz = player.z + direction.z;
        if (grid.isValidMove(dx, dy, dz)) {
            // Calculate the move cost using the same algorithm as zombies
            let moveCost = getMoveCost(player, { x: dx, y: dy, z: dz });
            if (player.moveProgress < moveCost) {
                player.moveProgress += moveCost;
            }
            else {
                player.x = dx;
                player.y = dy;
                player.z = dz;
                player.moveProgress -= moveCost;
                renderState(`Moved to (${dx},${dy},${dz})`);
            }
        }
        else {
            renderState("Invalid move.");
        }
    }
}
function tickGame() {
    var _a, _b, _c, _d, _e;
    for (let t = 0; t < ticksPerStep; t++) {
        for (const zombie of zombies) {
            zombie.recalculated = false;
            zombie.soundLevel = 0;
            // Decay player-hearing memory
            if (zombie.playerHeardAt) {
                zombie.playerHeardAt.ticks--;
                if (zombie.playerHeardAt.ticks <= 0)
                    zombie.playerHeardAt = null;
            }
        }
        // Awareness and intent selection
        for (const zombie of zombies) {
            const seen = (0, awareness_1.getVisibleObjects)(zombie, grid, zombies, player);
            const heard = (0, awareness_1.getHeardObjects)(zombie, grid, zombies, player);
            let newIntent = 'roaming';
            let newTarget = null;
            // 1. Sees player
            if (seen.has('player') && player) {
                newIntent = 'enraged';
                newTarget = Object.assign({}, player);
            }
            else if (heard.has('player') && player) {
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
                }
                else {
                    // 4. Hears enraged zombie
                    const heardEnraged = zombies.filter(zb => zb !== zombie && zb.intent === 'enraged' && heard.has('zombie'));
                    if (heardEnraged.length > 0) {
                        const targetZ = heardEnraged[0];
                        newIntent = 'aware';
                        newTarget = { x: targetZ.x, y: targetZ.y, z: targetZ.z };
                    }
                    else {
                        // 5. Sees and hears an aware zombie (virtual awareness)
                        const awareZombies = zombies.filter(zb => zb !== zombie && zb.intent === 'aware' && seen.has('zombie') && heard.has('zombie') && zb.virtualTarget);
                        if (awareZombies.length > 0) {
                            newIntent = 'aware';
                            newTarget = awareZombies[0].virtualTarget;
                        }
                        else if (zombie.playerHeardAt) {
                            // 6. Roam toward last heard player
                            newIntent = 'roaming';
                            newTarget = { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z };
                        }
                        else {
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
            if (zombie.state === 'roaming')
                speed /= 2;
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
            }
            else if (zombie.intent === 'aware' && zombie.virtualTarget) {
                if (zombie.state !== 'roaming')
                    zombie.state = 'roaming';
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
            }
            else if (zombie.intent === 'roaming') {
                if (zombie.state !== 'roaming')
                    zombie.state = 'roaming';
                zombie.soundLevel = 0;
                // Prefer to roam toward last heard player if memory exists
                if (zombie.playerHeardAt && (!zombie.path || zombie.pathIndex >= zombie.path.length)) {
                    const path = astar(zombie, { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z });
                    if (path && path.length > 1) {
                        zombie.path = path.slice(1);
                        zombie.pathIndex = 0;
                        zombie.roamTarget = { x: zombie.playerHeardAt.x, y: zombie.playerHeardAt.y, z: zombie.playerHeardAt.z };
                    }
                }
                else if (!zombie.path || zombie.pathIndex >= zombie.path.length) {
                    // Roam randomly
                    const minX = Math.max(0, zombie.x - 2);
                    const maxX = Math.min(width - 1, zombie.x + 2);
                    const minY = Math.max(0, zombie.y - 2);
                    const maxY = Math.min(height - 1, zombie.y + 2);
                    let found = false;
                    for (let tries = 0; tries < 10 && !found; tries++) {
                        const tx = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
                        const ty = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
                        if (tx === zombie.x && ty === zombie.y)
                            continue;
                        const path = astar(zombie, { x: tx, y: ty, z: zombie.z });
                        if (path && path.length > 1) {
                            zombie.path = path.slice(1);
                            zombie.pathIndex = 0;
                            zombie.roamTarget = { x: tx, y: ty, z: zombie.z };
                            found = true;
                        }
                    }
                }
            }
            // If zombie has no path and is not moving, set to roaming
            if ((!zombie.path || zombie.pathIndex >= ((_b = (_a = zombie.path) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0)) && zombie.state !== 'roaming') {
                zombie.state = 'roaming';
            }
            // Move as many steps as possible
            let moved = false;
            do {
                moved = false;
                // Determine target for path recalculation
                let target = undefined;
                if (zombie.state === 'moving' && player)
                    target = player;
                if (zombie.state === 'roaming' && zombie.roamTarget)
                    target = zombie.roamTarget;
                if ((zombie.state === 'moving' || zombie.state === 'roaming' || zombie.state === 'enraged') && zombie.path && zombie.pathIndex < zombie.path.length) {
                    const next = zombie.path[zombie.pathIndex];
                    // Calculate current crowding cost for the next tile
                    let moveCost;
                    // 3D stair movement
                    if (zombie.x === next.x && zombie.y === next.y && zombie.z !== next.z) {
                        // Moving up
                        if (next.z > zombie.z) {
                            const here = grid.getCell(zombie.x, zombie.y, zombie.z);
                            const dest = grid.getCell(next.x, next.y, next.z);
                            if (here.wall === grid_1.WallType.StairsUp &&
                                isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) &&
                                grid.isValidMove(next.x, next.y, next.z)) {
                                const npcCount = zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
                            }
                            else {
                                moveCost = Infinity;
                            }
                            // Moving down
                        }
                        else if (next.z < zombie.z) {
                            const here = grid.getCell(zombie.x, zombie.y, zombie.z);
                            const dest = grid.getCell(next.x, next.y, next.z);
                            if (here.floor === grid_1.FloorType.StairsDown &&
                                isWalkableFloor(dest.floor) && isWalkableWall(dest.wall) &&
                                grid.isValidMove(next.x, next.y, next.z)) {
                                const npcCount = zombies.filter(zb => zb.x === next.x && zb.y === next.y && zb.z === next.z).length;
                                moveCost = 2 * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
                            }
                            else {
                                moveCost = Infinity;
                            }
                        }
                        else {
                            moveCost = Infinity;
                        }
                    }
                    else {
                        // 2D movement (use getMoveCost)
                        moveCost = getMoveCost(zombie, next);
                    }
                    // If the cost has changed, recalculate path
                    if (Math.abs(((_c = next.cost) !== null && _c !== void 0 ? _c : 1) - moveCost) > 1e-6 && target) {
                        const newPath = astar(zombie, target);
                        if (newPath && newPath.length > 1) {
                            zombie.path = newPath.slice(1);
                            zombie.pathIndex = 0;
                            zombie.recalculated = true; // Mark that we recalculated
                            // Update next after recalculation
                            continue;
                        }
                        else {
                            // No valid path, stop moving
                            zombie.path = null;
                            zombie.pathIndex = 0;
                            break;
                        }
                    }
                    if (zombie.moveProgress >= moveCost) {
                        zombie.moveProgress -= moveCost;
                        zombie.x = next.x;
                        zombie.y = next.y;
                        zombie.z = next.z;
                        zombie.pathIndex++;
                        moved = true;
                        if (zombie.pathIndex >= zombie.path.length) {
                            // Switch to roaming after reaching the player
                            if (zombie.state === 'moving') {
                                zombie.state = 'roaming';
                                zombie.path = null;
                                zombie.pathIndex = 0;
                            }
                            else if (zombie.state === 'roaming') {
                                // Pick a new roam target next tick
                                zombie.path = null;
                                zombie.pathIndex = 0;
                                zombie.roamTarget = undefined;
                            }
                            break;
                        }
                    }
                }
            } while (moved &&
                zombie.path &&
                zombie.pathIndex < zombie.path.length &&
                zombie.moveProgress >= ((_e = (_d = zombie.path[zombie.pathIndex]) === null || _d === void 0 ? void 0 : _d.cost) !== null && _e !== void 0 ? _e : 1));
        }
    }
    renderState(`Ticked ${ticksPerStep} time(s)`);
}
rl.on('line', (line) => {
    // Handle line input (not used in this version)
});
// Handle raw keypresses
process.stdin.on('data', handleKeypress);
// Initial render
renderState();
