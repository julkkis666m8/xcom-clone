import { Grid, Cell, WallType, FloorType } from '../src/core/grid';

describe('Grid', () => {
  describe('Initialization', () => {
    it('should create a grid with specified dimensions', () => {
      const width = 10;
      const height = 10;
      const depth = 5;
      
      const grid = new Grid(width, height, depth);
      
      expect(grid.width).toBe(width);
      expect(grid.height).toBe(height);
      expect(grid.depth).toBe(depth);
    });

    it('should initialize cells with default values', () => {
      const grid = new Grid(5, 5, 3);
      
      const cell = grid.getCell(0, 0, 0);
      expect(cell.wall).toBe(WallType.Air);
      expect(cell.floor).toBe(FloorType.Floor);
    });
  });

  describe('Cell Access', () => {
    it('should return valid cells for valid coordinates', () => {
      const grid = new Grid(5, 5, 3);
      
      const cell = grid.getCell(2, 2, 1);
      expect(cell).toBeDefined();
      expect(cell.wall).toBe(WallType.Air);
      expect(cell.floor).toBe(FloorType.Floor);
    });

    it('should return undefined for invalid coordinates', () => {
      const grid = new Grid(5, 5, 3);
      
      const cell = grid.getCell(-1, 2, 1);
      expect(cell).toBeUndefined();
      
      const cell2 = grid.getCell(10, 2, 1);
      expect(cell2).toBeUndefined();
    });
  });

  describe('Movement Validation', () => {
    it('should validate movement for valid cells', () => {
      const grid = new Grid(5, 5, 3);
      
      // Should be able to move to a default floor cell
      expect(grid.isValidMove(2, 2, 0)).toBe(true);
      
      // Should not be able to move outside bounds
      expect(grid.isValidMove(-1, 2, 0)).toBe(false);
      expect(grid.isValidMove(10, 2, 0)).toBe(false);
    });
  });
});