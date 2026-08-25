import { 
  getTileTransparency, 
  getTileHearing, 
  bresenhamLine,
  getVisibleObjects,
  getHeardObjects 
} from '../src/core/awareness';
import { Grid, Cell, WallType, FloorType } from '../src/core/grid';

describe('Awareness System', () => {
  describe('Utility Functions', () => {
    it('should calculate tile transparency correctly', () => {
      // Test air floor with no NPC
      const cell1: Cell = { wall: WallType.Air, floor: FloorType.Air };
      expect(getTileTransparency(cell1, false)).toBe(1.0);
      
      // Test wall with no NPC
      const cell2: Cell = { wall: WallType.Wall, floor: FloorType.Floor };
      expect(getTileTransparency(cell2, false)).toBe(0.0);
      
      // Test floor with NPC
      const cell3: Cell = { wall: WallType.Air, floor: FloorType.Floor };
      expect(getTileTransparency(cell3, true)).toBe(0.8);
    });

    it('should calculate tile hearing correctly', () => {
      // Test air floor with no NPC
      const cell1: Cell = { wall: WallType.Air, floor: FloorType.Air };
      expect(getTileHearing(cell1, false)).toBe(1.0);
      
      // Test wall with no NPC
      const cell2: Cell = { wall: WallType.Wall, floor: FloorType.Floor };
      expect(getTileHearing(cell2, false)).toBe(0.2);
      
      // Test floor with NPC
      const cell3: Cell = { wall: WallType.Air, floor: FloorType.Floor };
      expect(getTileHearing(cell3, true)).toBe(0.9);
    });

    it('should generate Bresenham line correctly', () => {
      const points = bresenhamLine(0, 0, 2, 2);
      expect(points).toBeDefined();
      expect(points.length).toBeGreaterThan(0);
      
      // Should include start and end points
      expect(points[0]).toEqual([0, 0]);
      expect(points[points.length - 1]).toEqual([2, 2]);
    });
  });

  describe('Visibility Functions', () => {
    it('should handle empty grid with no player', () => {
      const zombie = { x: 5, y: 5, z: 0 };
      const grid = new Grid(10, 10, 3);
      const zombies = [];
      const player = null;
      
      const visible = getVisibleObjects(zombie, grid, zombies, player);
      expect(visible).toBeDefined();
    });
    
    it('should handle visibility with player present', () => {
      const zombie = { x: 5, y: 5, z: 0 };
      const grid = new Grid(10, 10, 3);
      const zombies = [];
      const player = { x: 8, y: 8, z: 0 };
      
      const visible = getVisibleObjects(zombie, grid, zombies, player);
      expect(visible).toBeDefined();
    });
  });

  describe('Hearing Functions', () => {
    it('should handle empty grid with no player', () => {
      const zombie = { x: 5, y: 5, z: 0 };
      const grid = new Grid(10, 10, 3);
      const zombies = [];
      const player = null;
      
      const heard = getHeardObjects(zombie, grid, zombies, player);
      expect(heard).toBeDefined();
    });
    
    it('should handle hearing with player present', () => {
      const zombie = { x: 5, y: 5, z: 0 };
      const grid = new Grid(10, 10, 3);
      const zombies = [];
      const player = { x: 8, y: 8, z: 0 };
      
      const heard = getHeardObjects(zombie, grid, zombies, player);
      expect(heard).toBeDefined();
    });
  });
});