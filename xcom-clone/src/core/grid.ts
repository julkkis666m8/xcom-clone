export enum FloorType {
    Floor = 'Floor',
    StairsDown = 'StairsDown',
    Air = 'Air',
}

export enum WallType {
    Air = 'Air',
    Wall = 'Wall',
    StairsUp = 'StairsUp',
}

export interface Cell {
    floor: FloorType;
    wall: WallType;
    char: string; // For display
}

export class Grid {
    private grid: Cell[][][];

    constructor(private width: number, private height: number, private depth: number) {
        this.grid = this.initializeGrid();
    }

    private initializeGrid(): Cell[][][] {
        return Array.from({ length: this.width }, () =>
            Array.from({ length: this.height }, () =>
                Array(this.depth).fill({
                    floor: FloorType.Floor,
                    wall: WallType.Air,
                    char: ',',
                })
            )
        );
    }

    public getCell(x: number, y: number, z: number): Cell {
        return this.grid[x][y][z];
    }

    public setCell(x: number, y: number, z: number, value: Cell): void {
        this.grid[x][y][z] = value;
    }

    public isValidMove(x: number, y: number, z: number): boolean {
        return (
            x >= 0 && x < this.width &&
            y >= 0 && y < this.height &&
            z >= 0 && z < this.depth
        );
    }

    /**
     * Create a Grid from an ASCII map.
     * @param asciiRows Array of strings, each representing a row.
     * @param charMap Object mapping characters to Cell definitions.
     * @param depth The depth of the grid (z-axis). Defaults to 1.
     */
    static fromAsciiMap(asciiRows: string[], charMap: Record<string, Partial<Cell>>, depth: number = 1): Grid {
        const height = asciiRows.length;
        const width = asciiRows[0]?.length || 0;
        const grid = new Grid(width, height, depth);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = asciiRows[y][x];
                const def = charMap[char] ?? {};
                // Default: floor is Floor, wall is Air, char is the map char
                const cell: Cell = {
                    floor: def.floor ?? FloorType.Floor,
                    wall: def.wall ?? WallType.Air,
                    char: char,
                };
                grid.setCell(x, y, 0, cell);
            }
        }
        return grid;
    }

    /**
     * Vision blocking logic:
     * - Blocked by floor if floor is StairsDown or StairsUp
     * - Blocked by wall if wall is Wall or StairsUp
     */
    public isVisionBlocked(x: number, y: number, z: number, direction: 'floor' | 'wall'): boolean {
        const cell = this.getCell(x, y, z);
        if (direction === 'floor') {
            return cell.floor === FloorType.StairsDown;
        } else {
            return cell.wall === WallType.Wall || cell.wall === WallType.StairsUp;
        }
    }
}