import { Grid, FloorType, WallType } from "./grid";
import { getMoveCost, isWalkableFloor, isWalkableWall } from "../pathfinding";


export interface Bullet {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    ap: number;
    active: boolean;
    direction: { x: number; y: number; z: number };
    ownerId: string | null;
}

export class Bullet {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    ap: number;
    active: boolean;
    direction: { x: number; y: number; z: number };

    constructor(x: number, y: number, z: number, direction: { x: number; y: number; z: number }) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = direction.x;
        this.vy = direction.y;
        this.vz = direction.z;
        this.ap = 10;
        this.active = true;
        this.direction = direction;
    }

    public move(grid: Grid): boolean {
        const nextX = this.x + this.vx;
        const nextY = this.y + this.vy;
        const nextZ = this.z + this.vz;

        if (!grid.isValidMove(nextX, nextY, nextZ)) {
            this.active = false;
            return false;
        }

        const destCell = grid.getCell(nextX, nextY, nextZ);
        if (!destCell || !isWalkableFloor(destCell.floor) || !isWalkableWall(destCell.wall)) {
            this.active = false;
            return false;
        }

        const cost = getMoveCost({ x: this.x, y: this.y, z: this.z }, { x: nextX, y: nextY, z: nextZ });
        
        if (this.ap >= cost) {
            this.x = nextX;
            this.y = nextY;
            this.z = nextZ;
            this.ap -= cost;
            return true;
        } else {
            this.active = false;
            return false;
        }
    }
}
