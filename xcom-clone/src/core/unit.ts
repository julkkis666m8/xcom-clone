export class Unit {
    health: number;
    position: { x: number; y: number; z: number };
    name: string;

    constructor(name: string, health: number, position: { x: number; y: number; z: number }) {
        this.name = name;
        this.health = health;
        this.position = position;
    }

    move(newPosition: { x: number; y: number; z: number }) {
        this.position = newPosition;
    }

    attack(target: Unit) {
        // Implement attack logic here
    }
}