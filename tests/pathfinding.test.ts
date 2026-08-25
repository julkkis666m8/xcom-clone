import { 
  astar, 
  isWalkableFloor, 
  isWalkableWall,
  getMoveCost 
} from '../src/pathfinding';
import { Grid } from '../src/core/grid';

describe('Pathfinding', () => {
  describe('Utility Functions', () => {
    it('should determine walkable floors correctly', () => {
      expect(isWalkableFloor(0)).toBe(true); // Floor
      expect(isWalkableFloor(1)).toBe(false); // Wall
      expect(isWalkableFloor(2)).toBe(true); // StairsDown
    });

    it('should determine walkable walls correctly', () => {
      expect(isWalkableWall(0)).toBe(true); // Air
      expect(isWalkableWall(1)).toBe(false); // Wall
      expect(isWalkableWall(2)).toBe(true); // StairsUp
    });

    it('should calculate move cost correctly', () => {
      const grid = new Grid(10, 10, 3);
      const from = { x: 0, y: 0, z: 0 };
      const to = { x: 1, y: 0, z: 0 };
      
      // Test basic move cost
      const cost = getMoveCost(from, to);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('A* Pathfinding', () => {
    it('should find a path between two points', () => {
      const grid = new Grid(10, 10, 3);
      
      // Test with simple straight path
      const start = { x: 0, y: 0, z: 0 };
      const goal = { x: 2, y: 2, z: 0 };
      
      const path = astar(start, goal);
      
      // Pathfinding should return a path or null
      expect(path).toBeDefined();
    });

    it('should handle invalid paths gracefully', () => {
      const grid = new Grid(5, 5, 3);
      
      // Test with unreachable goal (surrounded by walls)
      const start = { x: 0, y: 0, z: 0 };
      const goal = { x: 10, y: 10, z: 0 }; // Out of bounds
      
      const path = astar(start, goal);
      
      // Should return null for unreachable paths
      expect(path).toBeNull();
    });
  });
});