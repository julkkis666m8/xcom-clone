import { Grid } from './core/grid';

class Game {
  public grid: Grid;
  public zombies: unknown[];
  public player: { x: number; y: number; z: number } | null;
  private isRunning: boolean;

  constructor() {
    this.grid = new Grid(10, 10, 1);
    this.zombies = [];
    this.player = { x: 0, y: 0, z: 0 };
    this.isRunning = false;
  }

  start(): void {
    this.isRunning = true;
    console.log('Game started');
  }

  update(): void {
    if (!this.isRunning) return;
    console.log('Game updated');
  }

  end(): void {
    this.isRunning = false;
    console.log('Game ended');
  }
}

export default Game;
export { Game };
