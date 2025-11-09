"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Grid = exports.WallType = exports.FloorType = void 0;
var FloorType;
(function (FloorType) {
    FloorType["Floor"] = "Floor";
    FloorType["StairsDown"] = "StairsDown";
    FloorType["Air"] = "Air";
})(FloorType = exports.FloorType || (exports.FloorType = {}));
var WallType;
(function (WallType) {
    WallType["Air"] = "Air";
    WallType["Wall"] = "Wall";
    WallType["StairsUp"] = "StairsUp";
})(WallType = exports.WallType || (exports.WallType = {}));
class Grid {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.grid = this.initializeGrid();
    }
    initializeGrid() {
        return Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => Array(this.depth).fill({
            floor: FloorType.Floor,
            wall: WallType.Air,
            char: ',',
        })));
    }
    getCell(x, y, z) {
        return this.grid[x][y][z];
    }
    setCell(x, y, z, value) {
        this.grid[x][y][z] = value;
    }
    isValidMove(x, y, z) {
        return (x >= 0 && x < this.width &&
            y >= 0 && y < this.height &&
            z >= 0 && z < this.depth);
    }
    /**
     * Create a Grid from an ASCII map.
     * @param asciiRows Array of strings, each representing a row.
     * @param charMap Object mapping characters to Cell definitions.
     * @param depth The depth of the grid (z-axis). Defaults to 1.
     */
    static fromAsciiMap(asciiRows, charMap, depth = 1) {
        var _a, _b, _c, _d;
        const height = asciiRows.length;
        const width = ((_a = asciiRows[0]) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const grid = new Grid(width, height, depth);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = asciiRows[y][x];
                const def = (_b = charMap[char]) !== null && _b !== void 0 ? _b : {};
                // Default: floor is Floor, wall is Air, char is the map char
                const cell = {
                    floor: (_c = def.floor) !== null && _c !== void 0 ? _c : FloorType.Floor,
                    wall: (_d = def.wall) !== null && _d !== void 0 ? _d : WallType.Air,
                    char: char,
                };
                grid.setCell(x, y, 0, cell);
            }
        }
        return grid;
    }
    /**
     * Vision blocking logic:
     * - Blocked by floor if floor is StairsDown or StairsUp
     * - Blocked by wall if wall is Wall or StairsUp
     */
    isVisionBlocked(x, y, z, direction) {
        const cell = this.getCell(x, y, z);
        if (direction === 'floor') {
            return cell.floor === FloorType.StairsDown;
        }
        else {
            return cell.wall === WallType.Wall || cell.wall === WallType.StairsUp;
        }
    }
}
exports.Grid = Grid;
