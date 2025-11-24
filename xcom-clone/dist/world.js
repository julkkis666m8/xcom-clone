"use strict";
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.player = exports.zombies = exports.grid = exports.depth = exports.width = exports.height = exports.charMap = exports.asciiMaps = exports.roofMap = exports.baseMap = void 0;
const grid_1 = require("./core/grid");
// Base Z=0 map
exports.baseMap = [
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
exports.roofMap = exports.baseMap.map((row, y) => row.split('').map((char, x) => {
    // If there is a wall at (x, y, 0), make (x, y, 1) a walkable floor
    if (exports.baseMap[y][x] === '#')
        return ',';
    if (char === '>')
        return '<'; // down-stair above up-stair
    return ' '; // air elsewhere
}).join(''));
exports.asciiMaps = [exports.baseMap, exports.roofMap];
// Character to Cell mapping
exports.charMap = {
    ',': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air },
    '#': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Wall },
    '>': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.StairsUp },
    '<': { floor: grid_1.FloorType.StairsDown, wall: grid_1.WallType.Air },
    ' ': { floor: grid_1.FloorType.Air, wall: grid_1.WallType.Air },
    'Z': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air },
    'P': { floor: grid_1.FloorType.Floor, wall: grid_1.WallType.Air }, // P is a player entity on a floor
};
exports.height = exports.asciiMaps[0].length;
exports.width = exports.asciiMaps[0][0].length;
exports.depth = exports.asciiMaps.length;
exports.grid = new grid_1.Grid(exports.width, exports.height, exports.depth);
exports.zombies = [];
exports.player = null;
// Populate grid and entities
for (let z = 0; z < exports.depth; z++) {
    const asciiMap = exports.asciiMaps[z];
    for (let y = 0; y < exports.height; y++) {
        for (let x = 0; x < exports.width; x++) {
            const char = asciiMap[y][x];
            const def = (_a = exports.charMap[char]) !== null && _a !== void 0 ? _a : {};
            const cell = {
                floor: (_b = def.floor) !== null && _b !== void 0 ? _b : grid_1.FloorType.Floor,
                wall: (_c = def.wall) !== null && _c !== void 0 ? _c : grid_1.WallType.Air,
                char: (char === 'Z' || char === 'P') ? ',' : char,
            };
            exports.grid.setCell(x, y, z, cell);
            if (z === 0) {
                if (char === 'Z')
                    exports.zombies.push({
                        x, y, z,
                        baseSpeed: 1,
                        health: 1,
                        moveProgress: 0,
                        path: null,
                        pathIndex: 0,
                        state: 'idle',
                    });
                if (char === 'P')
                    exports.player = {
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
