# XCOM Clone

This project is a 3D grid-based tactical game inspired by the XCOM series. Players control units on a grid, engaging in strategic combat against enemy forces.

## Table of Contents

- [Installation](#installation)
- [Gameplay Mechanics](#gameplay-mechanics)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Installation

To get started with the project, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd xcom-clone
npm install
```

## Gameplay Mechanics

- **Grid System**: The game features a 3D grid where units can move and interact. Players must navigate the grid strategically to outmaneuver opponents.
- **Unit Management**: Players control various units, each with unique stats and abilities. Units can move, attack, and perform special actions.
- **Combat System**: Engage in tactical combat with enemy units. Players must consider positioning and unit abilities to succeed.

## Project Structure

- `src/app.ts`: Entry point of the application.
- `src/core/game.ts`: Manages the overall game state.
- `src/core/grid.ts`: Represents the 3D grid for the game.
- `src/core/unit.ts`: Represents characters in the game.
- `src/systems/movement.ts`: Functions related to unit movement.
- `src/systems/combat.ts`: Functions for combat mechanics.
- `src/systems/ai.ts`: Functions for AI behavior.
- `src/rendering/renderer.ts`: Handles rendering of the game.
- `src/types/index.ts`: Contains interfaces and types used throughout the project.

## Testing

This project includes comprehensive unit tests for all core functionality. The tests are written using Jest and cover:

- Grid system operations
- Unit movement and positioning  
- Pathfinding algorithms
- Awareness systems (visibility/hearing)
- Game state management

### Running Tests

To run the tests locally, you'll need to install the development dependencies:

```bash
npm install --save-dev jest @types/jest ts-jest
```

Then run:
```bash
npm test
```

Or directly with Jest:
```bash
npx jest --config jest.config.json
```

### Test Structure

Tests are organized in the `tests/` directory by module:

- `grid.test.ts` - Grid initialization and cell access
- `unit.test.ts` - Unit movement and positioning  
- `game.test.ts` - Game state management
- `awareness.test.ts` - Visibility and hearing calculations
- `pathfinding.test.ts` - A* pathfinding algorithms

### CI/CD

The project includes a GitHub Actions workflow that automatically runs tests on every push to the main branch. The workflow is defined in `.github/workflows/test.yml`.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.