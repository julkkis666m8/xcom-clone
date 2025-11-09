"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unit = void 0;
class Unit {
    constructor(name, health, position) {
        this.name = name;
        this.health = health;
        this.position = position;
    }
    move(newPosition) {
        this.position = newPosition;
    }
    attack(target) {
        // Implement attack logic here
    }
}
exports.Unit = Unit;
