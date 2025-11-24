"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMoveCost = exports.isWalkableWall = exports.isWalkableFloor = exports.astar = void 0;
const world_1 = require("./world");
const grid_1 = require("./core/grid");
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
            if (!world_1.grid.isValidMove(nx, ny, nz))
                continue;
            const cell = world_1.grid.getCell(nx, ny, nz);
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
        const here = world_1.grid.getCell(x, y, z);
        // Up
        if (here.wall === grid_1.WallType.StairsUp && z + 1 < world_1.depth) {
            const upCell = world_1.grid.getCell(x, y, z + 1);
            if (isWalkableFloor(upCell.floor) && isWalkableWall(upCell.wall) && world_1.grid.isValidMove(x, y, z + 1)) {
                const npcCount = world_1.zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z + 1).length;
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
            const downCell = world_1.grid.getCell(x, y, z - 1);
            if (isWalkableFloor(downCell.floor) && isWalkableWall(downCell.wall) && world_1.grid.isValidMove(x, y, z - 1)) {
                const npcCount = world_1.zombies.filter(zb => zb.x === x && zb.y === y && zb.z === z - 1).length;
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
exports.astar = astar;
// Helpers for walkability
function isWalkableFloor(floor) {
    return floor === grid_1.FloorType.Floor || floor === grid_1.FloorType.StairsDown;
}
exports.isWalkableFloor = isWalkableFloor;
function isWalkableWall(wall) {
    return wall === grid_1.WallType.Air || wall === grid_1.WallType.StairsUp;
}
exports.isWalkableWall = isWalkableWall;
// Helper for movement cost (including stairs)
function getMoveCost(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const cell = world_1.grid.getCell(to.x, to.y, to.z);
    let baseMoveCost = (dx !== 0 && dy !== 0) ? Math.SQRT2 : 1;
    if (cell.wall === grid_1.WallType.StairsUp || cell.floor === grid_1.FloorType.StairsDown) {
        baseMoveCost = (dx !== 0 && dy !== 0) ? 1.5 * Math.SQRT2 : 1.5;
    }
    const npcCount = world_1.zombies.filter(zb => zb.x === to.x && zb.y === to.y && zb.z === to.z).length;
    return baseMoveCost * (npcCount > 0 ? Math.pow(2, npcCount) : 1);
}
exports.getMoveCost = getMoveCost;
