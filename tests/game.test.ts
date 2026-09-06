import { describe, it, expect, jest } from '@jest/globals';
import Game, { startPlayerMovement, tickGame } from '../src/game';
import { Grid, FloorType, WallType } from '../src/core/grid';
import * as renderer from '../src/renderer';
import { player as worldPlayer, zombies as worldZombies } from '../src/world';

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

      expect(game.grid).toBeInstanceOf(Grid);
      expect(game.grid.width).toBeGreaterThan(0);
      expect(game.grid.height).toBeGreaterThan(0);
      expect(game.grid.depth).toBeGreaterThan(0);
    });

    it('should not render a failed diagonal move until the player can afford it', () => {
      const spy = jest.spyOn(renderer, 'renderState');
      const grid = new Grid(10, 10, 1);
      const player = {
        x: 5,
        y: 5,
        z: 0,
        baseSpeed: 2,
        health: 1,
        moveProgress: 0,
        path: null,
        pathIndex: 0,
        state: 'idle' as const,
      };

      const destination = { x: 1, y: 1, z: 0 };
      const validMove = grid.isValidMove(player.x + destination.x, player.y + destination.y, player.z + destination.z);
      expect(validMove).toBe(true);

      startPlayerMovement(player, destination, grid);

      expect(spy).not.toHaveBeenCalled();
      expect(player.x).toBe(5);
      expect(player.y).toBe(5);
      expect(player.moveProgress).toBe(0);
    });

    it('should start with enough movement points to move immediately', () => {
      if (!worldPlayer) throw new Error('World player should exist');

      expect(worldPlayer.moveProgress).toBe(worldPlayer.baseSpeed);
    });

    it('should remember the warning for the same move and allow it once the player confirms the move', () => {
      const spy = jest.spyOn(renderer, 'renderState');
      const grid = new Grid(5, 5, 2);
      const player = {
        x: 1,
        y: 1,
        z: 0,
        baseSpeed: 2,
        health: 1,
        moveProgress: 3,
        path: null,
        pathIndex: 0,
        state: 'idle' as const,
      };

      grid.setCell(2, 2, 1, { floor: FloorType.Floor, wall: WallType.StairsUp, char: '>' });
      const zombie = {
        x: 2,
        y: 2,
        z: 1,
        baseSpeed: 1,
        health: 1,
        moveProgress: 0,
        path: null,
        pathIndex: 0,
        state: 'idle' as const,
        weapon: { range: 1 },
      };

      worldZombies.length = 0;
      worldZombies.push(zombie as any);

      startPlayerMovement(player, { x: 1, y: 1, z: 1 }, grid);
      expect(spy).toHaveBeenCalledWith(worldZombies, player, 0, expect.stringContaining('zombie'));

      startPlayerMovement(player, { x: 1, y: 1, z: 1 }, grid);
      expect(player.x).toBe(2);
      expect(player.y).toBe(2);
      expect(player.z).toBe(1);
    });
  });
});