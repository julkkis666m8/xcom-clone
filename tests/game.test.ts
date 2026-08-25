import { Game } from '../src/core/game';
import { Grid } from '../src/core/grid';

describe('Game', () => {
  describe('Initialization', () => {
    it('should create a game with default properties', () => {
      const game = new Game();
      
      expect(game.grid).toBeDefined();
      expect(game.zombies).toBeDefined();
      expect(game.player).toBeDefined();
    });
  });

  describe('Game State Management', () => {
    it('should initialize with correct grid dimensions', () => {
      const game = new Game();
      
      // Check that grid is initialized
      expect(game.grid).toBeInstanceOf(Grid);
      expect(game.grid.width).toBeGreaterThan(0);
      expect(game.grid.height).toBeGreaterThan(0);
      expect(game.grid.depth).toBeGreaterThan(0);
    });
  });
});