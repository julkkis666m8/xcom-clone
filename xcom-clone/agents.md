# XCOM Clone - Agent Systems Analysis

This document analyzes the various AI and agent systems implemented in the XCOM clone game.

## Overview

The XCOM clone implements a 3D grid-based tactical game with multiple agent types that exhibit intelligent behavior. The core agents are:
- Player character (controlled by user)
- Zombie enemies with complex AI behaviors

## Agent Types

### 1. Player Agent
- **Role**: Human-controlled character in the game
- **Characteristics**:
  - Higher movement speed than zombies (baseSpeed: 2 vs 1)
  - Positioned at the start of the game
  - Controlled through keyboard input
  - Can move on all three axes (X, Y, Z) including stairs
  - Movement points accumulate over time for strategic movement

### 2. Zombie Agents
- **Role**: Enemy AI that pursues and attacks the player
- **Characteristics**:
  - Each zombie has individual properties like health, speed, and movement progress
  - Implemented with state-based behavior system (idle, moving, roaming, enraged)
  - Movement is pathfinding-based using A* algorithm
  - Complex decision-making based on vision and hearing systems

## AI Behavior Systems

### 1. Awareness System
The zombies use both visual and auditory perception to determine their actions:

#### Vision System (`getVisibleObjects`)
- **Radius**: 8 tiles
- **Threshold**: 0.2 transparency
- **Detection**: 
  - Direct line of sight to player
  - Detection of other zombies (even through walls)
  - Detection of stairs (up/down)

#### Hearing System (`getHeardObjects`)  
- **Radius**: 10 tiles
- **Threshold**: 0.1 hearing ability
- **Detection**:
  - Sounds from player movement
  - Sounds from other zombies
  - Sound propagation through walls and floors

### 2. Intent Selection System
Zombies use a multi-layered decision-making process:

1. **Sees Player**: Immediately becomes enraged, targets player directly
2. **Hears Player**: Remembers last heard position for later pursuit  
3. **Sees Enraged Zombie**: Becomes aware and follows the enraged zombie
4. **Hears Enraged Zombie**: Becomes aware and follows the sound source
5. **Sees Aware Zombie**: Inherits target from other aware zombies (virtual awareness)
6. **Hears Aware Zombie**: Inherits target from heard aware zombies  
7. **Default Roaming**: Random wandering when no threats detected

### 3. State Management
Each zombie maintains different states that affect behavior:

- **Idle**: Initial state, waiting for action
- **Moving**: Currently following a path to a target
- **Roaming**: Wandering around the map
- **Enraged**: Actively pursuing player with highest priority

### 4. Movement and Pathfinding
The zombies use a sophisticated movement system:

#### A* Pathfinding (`astar`)
- **2D movement**: Normal grid-based movement with diagonal support
- **3D movement**: Stair climbing with cost calculation
- **Crowding penalty**: Movement cost increases with number of NPCs on tile
- **Dynamic recalculation**: Path recalculated when costs change

#### Movement Cost Calculation (`getMoveCost`)
- **Base movement**: 1.0 for orthogonal, √2 for diagonal
- **Stairs**: Increased cost (1.5x) for stairs 
- **Crowding**: Exponential cost increase with number of NPCs on tile
- **Diagonal stairs**: Higher cost than regular stairs

## Core Agent Behaviors

### 1. Decision Making Loop
Each game tick, zombies:
1. Check if they can attack the player (within weapon range)
2. Recalculate awareness based on vision/hearing
3. Select intent and target based on awareness
4. Update pathfinding based on intent
5. Execute movement based on accumulated movement points

### 2. Combat System
- **Range-based**: Zombies attack when within weapon range of player
- **Movement points**: Attack consumes movement points (-5)
- **No automatic combat**: Zombies must move into range to attack

### 3. Sound Emission
Zombies emit sounds that other zombies can hear:
- **Silent**: No sound (0)  
- **Groaning**: Roaming sound (1)
- **Running**: Pursuing sound (2)

## Game Mechanics Integration

### 1. Movement Coordination
- Movement points accumulate over time
- Zombies can move multiple steps per tick
- Pathfinding is updated when targets change
- Movement costs dynamically adjust based on crowding and terrain

### 2. Z-Level Navigation  
- 3D grid with two levels (base map and roof map)
- Stairs allow movement between levels:
  - `>` stairs: up from floor to ceiling
  - `<` stairs: down from ceiling to floor
- Movement between levels has special cost calculations

### 3. Visual Feedback
The game provides rich visual feedback about agent states:
- Current position and movement progress
- Intent and target information
- Pathfinding visualization
- Sound emission status
- Awareness indicators (what the zombie sees/hears)

## Architecture Design

### 1. Modular Structure
- **Core systems**: Grid, pathfinding, awareness
- **Agent systems**: Movement, combat, AI decision making  
- **Rendering system**: Display game state to console
- **Game loop**: Tick-based execution of all systems

### 2. Data Flow
1. Input handling (keyboard controls)
2. Game tick processing (all agents)
3. State updates (movement, pathfinding, intent)
4. Rendering (display current state)

### 3. Scalability Considerations
- State-based architecture allows for easy addition of new agent types
- Modular design enables swapping out individual components
- Pathfinding and awareness systems designed to scale with map complexity

## Future Enhancements

1. **More Agent Types**: Additional enemy types with unique behaviors
2. **Improved AI**: More sophisticated decision making and tactical positioning  
3. **Combat Mechanics**: Weapon variety, damage calculation, health systems
4. **Environment Interactions**: Breaking objects, traps, destructible terrain
5. **Multiplayer Support**: Cooperative or competitive player modes

This implementation demonstrates a solid foundation for a tactical 3D grid-based game with sophisticated AI behavior.