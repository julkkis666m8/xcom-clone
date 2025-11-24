import { Grid, FloorType, WallType, Cell } from "./core/grid";

// Base Z=0 map
export const baseMap = [
  ",,,,,,,,,,,,,,,,,ZZZ",
  ",,,,,,,,#,,,,,,,,,,,",
  ",,,,,,,,#>,,,,,,,,,,",
  ",,###########,,,,,,,",
  ",>#>,#,,,,,,,,,,,,,,",
  ",>#,,,,######,,,,,,,",
  ",>#,,###,,,P######,#",
  "Z>####>,,,,,,,,,,,,,"
];

// Z=1: roof and upper floors
export const roofMap = baseMap.map((row, y) =>
  row.split('').map((char, x) => {
    // If there is a wall at (x, y, 0), make (x, y, 1) a walkable floor
    if (baseMap[y][x] === '#') return ',';
    if (char === '>') return '<'; // down-stair above up-stair
    return ' '; // air elsewhere
  }).join('')
);

export const asciiMaps = [baseMap, roofMap];

// Character to Cell mapping
export const charMap: Record<string, Partial<Cell>> = {
  ',': { floor: FloorType.Floor, wall: WallType.Air },
  '#': { floor: FloorType.Floor, wall: WallType.Wall },
  '>': { floor: FloorType.Floor, wall: WallType.StairsUp },
  '<': { floor: FloorType.StairsDown, wall: WallType.Air },
  ' ': { floor: FloorType.Air, wall: WallType.Air },
  'Z': { floor: FloorType.Floor, wall: WallType.Air }, // Z is a zombie entity on a floor
  'P': { floor: FloorType.Floor, wall: WallType.Air }, // P is a player entity on a floor
};

export const height = asciiMaps[0].length;
export const width = asciiMaps[0][0].length;
export const depth = asciiMaps.length;
export const grid = new Grid(width, height, depth);

export interface Zombie {
  x: number;
  y: number;
  z: number;
  baseSpeed: number; // tiles per tick at 100% health
  health: number; // 0..1
  moveProgress: number; // accumulated movement points
  path: {x: number, y: number, z: number, cost: number}[] | null;
  pathIndex: number; // index in path
  state: 'idle' | 'moving' | 'roaming' | 'enraged';
  roamTarget?: {x: number, y: number, z: number};
  recalculated?: boolean;
  intent?: 'idle' | 'roaming' | 'enraged' | 'aware';
  virtualTarget?: {x: number, y: number, z: number} | null;
  soundLevel?: number; // 0 = silent, 1 = groaning, 2 = running
  playerHeardAt?: {x: number, y: number, z: number, ticks: number} | null;
}

export interface Player {
  x: number;
  y: number;
  z: number;
  baseSpeed: number;
  health: number;
  moveProgress: number;
  path: {x: number, y: number, z: number, cost: number}[] | null;
  pathIndex: number;
  state: 'idle' | 'moving' | 'roaming' | 'enraged';
}

export const zombies: Zombie[] = [];
export let player: Player | null = null;

// Populate grid and entities
for (let z = 0; z < depth; z++) {
  const asciiMap = asciiMaps[z];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const char = asciiMap[y][x];
      const def = charMap[char] ?? {};
      const cell: Cell = {
        floor: def.floor ?? FloorType.Floor,
        wall: def.wall ?? WallType.Air,
        char: (char === 'Z' || char === 'P') ? ',' : char,
      };
      grid.setCell(x, y, z, cell);
      if (z === 0) {
        if (char === 'Z') zombies.push({
          x, y, z,
          baseSpeed: 1,
          health: 1,
          moveProgress: 0,
          path: null,
          pathIndex: 0,
          state: 'idle',
        } as Zombie);
        if (char === 'P') player = {
          x, y, z,
          baseSpeed: 1,
          health: 1,
          moveProgress: 0,
          path: null,
          pathIndex: 0,
          state: 'idle',
        } as Player;
      }
    }
  }
}
