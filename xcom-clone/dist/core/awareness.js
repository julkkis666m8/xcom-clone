"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHeardObjects = exports.getVisibleObjects = exports.bresenhamLine = exports.getTileHearing = exports.getTileTransparency = exports.HEARING_THRESHOLD = exports.VISION_THRESHOLD = exports.HEARING_RADIUS = exports.VISION_RADIUS = void 0;
const grid_1 = require("./grid");
exports.VISION_RADIUS = 8;
exports.HEARING_RADIUS = 10;
exports.VISION_THRESHOLD = 0.2;
exports.HEARING_THRESHOLD = 0.1;
function getTileTransparency(cell, hasNpc) {
    let t = 1.0;
    if (cell.wall === grid_1.WallType.Wall)
        t *= 0.0;
    else if (cell.floor === grid_1.FloorType.Air)
        t *= 0.9;
    else
        t *= 1.0;
    if (hasNpc)
        t *= 0.8;
    return t;
}
exports.getTileTransparency = getTileTransparency;
function getTileHearing(cell, hasNpc) {
    let t = 1.0;
    if (cell.wall === grid_1.WallType.Wall)
        t *= 0.2;
    else if (cell.floor === grid_1.FloorType.Air)
        t *= 0.98;
    else
        t *= 1.0;
    if (hasNpc)
        t *= 0.9;
    return t;
}
exports.getTileHearing = getTileHearing;
function bresenhamLine(x0, y0, x1, y1) {
    const points = [];
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;
    while (true) {
        points.push([x, y]);
        if (x === x1 && y === y1)
            break;
        let e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x += sx;
        }
        if (e2 < dx) {
            err += dx;
            y += sy;
        }
    }
    return points;
}
exports.bresenhamLine = bresenhamLine;
// These functions require grid, zombies, player to be passed in
function getVisibleObjects(zombie, grid, zombies, player) {
    const visible = new Set();
    const x = zombie.x;
    const y = zombie.y;
    const z = zombie.z;
    if (player) {
        const lineToPlayer = bresenhamLine(x, y, player.x, player.y);
        let canSeePlayer = true;
        for (const [lx, ly] of lineToPlayer) {
            if (!grid.isValidMove(lx, ly, z)) {
                canSeePlayer = false;
                break;
            }
            const cell = grid.getCell(lx, ly, z);
            const hasNpc = zombies.some(zb => zb.x === lx && zb.y === ly && zb.z === z);
            if (getTileTransparency(cell, hasNpc) < exports.VISION_THRESHOLD) {
                canSeePlayer = false;
                break;
            }
        }
        if (canSeePlayer)
            visible.add('player');
    }
    for (let dx = -exports.VISION_RADIUS; dx <= exports.VISION_RADIUS; dx++) {
        for (let dy = -exports.VISION_RADIUS; dy <= exports.VISION_RADIUS; dy++) {
            if (dx === 0 && dy === 0)
                continue;
            const nx = x + dx;
            const ny = y + dy;
            if (!grid.isValidMove(nx, ny, z))
                continue;
            const cell = grid.getCell(nx, ny, z);
            const hasNpc = zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z);
            if (getTileTransparency(cell, hasNpc) >= exports.VISION_THRESHOLD) {
                if (zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z && (zb.x !== x || zb.y !== y)))
                    visible.add('zombie');
                if (cell.wall === grid_1.WallType.StairsUp)
                    visible.add('stairs up');
                if (cell.floor === grid_1.FloorType.StairsDown)
                    visible.add('stairs down');
            }
        }
    }
    return visible;
}
exports.getVisibleObjects = getVisibleObjects;
function getHeardObjects(zombie, grid, zombies, player) {
    const heard = new Set();
    const x = zombie.x;
    const y = zombie.y;
    const z = zombie.z;
    for (let dx = -exports.HEARING_RADIUS; dx <= exports.HEARING_RADIUS; dx++) {
        for (let dy = -exports.HEARING_RADIUS; dy <= exports.HEARING_RADIUS; dy++) {
            if (dx === 0 && dy === 0)
                continue;
            const nx = x + dx;
            const ny = y + dy;
            if (!grid.isValidMove(nx, ny, z))
                continue;
            const cell = grid.getCell(nx, ny, z);
            const hasNpc = zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z);
            if (getTileHearing(cell, hasNpc) >= exports.HEARING_THRESHOLD) {
                if (player && player.x === nx && player.y === ny && player.z === z)
                    heard.add('player');
                if (zombies.some(zb => zb.x === nx && zb.y === ny && zb.z === z && (zb.x !== x || zb.y !== y)))
                    heard.add('zombie');
                if (cell.wall === grid_1.WallType.StairsUp)
                    heard.add('stairs up');
                if (cell.floor === grid_1.FloorType.StairsDown)
                    heard.add('stairs down');
            }
        }
    }
    return heard;
}
exports.getHeardObjects = getHeardObjects;
