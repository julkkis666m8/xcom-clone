import { Unit } from '../src/core/unit';
import { Grid } from '../src/core/grid';

describe('Unit', () => {
  describe('Initialization', () => {
    it('should create a unit with specified properties', () => {
      const unit = new Unit(10, 20, 0, 'zombie');
      
      expect(unit.x).toBe(10);
      expect(unit.y).toBe(20);
      expect(unit.z).toBe(0);
      expect(unit.type).toBe('zombie');
    });
  });

  describe('Movement', () => {
    it('should be able to move within grid bounds', () => {
      const grid = new Grid(10, 10, 3);
      const unit = new Unit(5, 5, 0, 'zombie');
      
      // Move one step in each direction
      expect(unit.move(6, 5, 0, grid)).toBe(true);
      expect(unit.x).toBe(6);
      expect(unit.y).toBe(5);
      
      expect(unit.move(5, 6, 0, grid)).toBe(true);
      expect(unit.x).toBe(5);
      expect(unit.y).toBe(6);
    });

    it('should not be able to move outside grid bounds', () => {
      const grid = new Grid(5, 5, 3);
      const unit = new Unit(0, 0, 0, 'zombie');
      
      // Try to move outside bounds
      expect(unit.move(-1, 0, 0, grid)).toBe(false);
      expect(unit.x).toBe(0); // Should not have moved
    });
  });
});