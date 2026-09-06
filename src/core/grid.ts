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
    char?: string;
}

export class Grid {
    public readonly width: number;
    public readonly height: number;
    public readonly depth: number;
    private grid: Cell[][][];

    constructor(width: number, height: number, depth: number) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.grid = this.initializeGrid();
    }

    private initializeGrid(): Cell[][][] {
        return Array.from({ length: this.width }, () =>
            Array.from({ length: this.height }, () =>
                Array.from({ length: this.depth }, () => ({
                    floor: FloorType.Floor,
                    wall: WallType.Air,
                    char: ',',
                }))
            )
        );
    }

    public getCell(x: number, y: number, z: number): Cell | undefined {
        if (!this.isValidMove(x, y, z)) return undefined;
        return this.grid[x][y][z];
    }

    public setCell(x: number, y: number, z: number, value: Cell): void {
        if (!this.isValidMove(x, y, z)) return;
        this.grid[x][y][z] = value;
    }

    public isValidMove(x: number, y: number, z: number): boolean {
        return (
            x >= 0 && x < this.width &&
            y >= 0 && y < this.height &&
            z >= 0 && z < this.depth
        );
    }

    static fromAsciiMap(asciiRows: string[], charMap: Record<string, Partial<Cell>>, depth: number = 1): Grid {
        const height = asciiRows.length;
        const width = asciiRows[0]?.length || 0;
        const grid = new Grid(width, height, depth);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const char = asciiRows[y][x];
                const def = charMap[char] ?? {};
                const cell: Cell = {
                    floor: def.floor ?? FloorType.Floor,
                    wall: def.wall ?? WallType.Air,
                    char,
                };
                grid.setCell(x, y, 0, cell);
            }
        }
        return grid;
    }

    public isVisionBlocked(x: number, y: number, z: number, direction: 'floor' | 'wall'): boolean {
        const cell = this.getCell(x, y, z);
        if (!cell) return true;
        if (direction === 'floor') {
            return cell.floor === FloorType.StairsDown;
        }
        return cell.wall === WallType.Wall || cell.wall === WallType.StairsUp;
    }
}