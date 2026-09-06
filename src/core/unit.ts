export class Unit {
    x: number;
    y: number;
    z: number;
    type: string;
    health: number;
    position: { x: number; y: number; z: number };

    constructor(x: number, y: number, z: number, type: string, health: number = 100) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type;
        this.health = health;
        this.position = { x, y, z };
    }

    move(x: number, y: number, z: number, grid?: { isValidMove: (x: number, y: number, z: number) => boolean }): boolean {
        if (grid && !grid.isValidMove(x, y, z)) {
            return false;
        }
        this.x = x;
        this.y = y;
        this.z = z;
        this.position = { x, y, z };
        return true;
    }

    attack(target: Unit) {
        // Implement attack logic here
        void target;
    }
}