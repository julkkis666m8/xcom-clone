# Shooting Mechanics

## Input & Actions
- **Trigger:** Player presses '0' followed by a direction key (1, 2, 3, 4, 6, 7, 8, 9).
- **Targeting:** Fire towards the nearest zombie.
- **Movement Logic:** If 'up' or 'down' is pressed and the player is not on an upstairs/downstairs tile, allow diagonal movement upward or downward (e.g., x-1, z+1).
- **Cost:** Shooting costs 1 Action Point (AP).

## Projectile (Bullet) Mechanics
- **Entity:** Create a `Bullet` entity.
- **Action Points:** Bullets have a total of 10 Action Points for movement.
- **Movement:** 
    - Same movement logic as the player/zombies (cardinal, corner, and up/down directions).
    - Euclidean diagonal costs apply (same as walking).
    - Constant motion in the direction of the target (non-homing).
- **Visuals:** 
    - Render each movement step (screen re-renders every step).
    - Display a direction-based icon:
        - West-East: "-"
        - North-West or South-West: "\\"
        - North or South: "|"
        - Only Up or Down: "+"
        - North-East or South-East: "/"
    - Timing: 0.1s sleep between steps (or proportional to AP cost).
- **Collision & Deletion:**
    - The bullet is deleted if it moves into a wall, a floor (non-walkable), or escapes the world boundaries.
- **Damage:** Each bullet deals 1 damage.
    - Only hits one enemy (randomly chosen if multiple on a tile).
    - TODO: Bullets should eventually be lodged in their last hit location (for now, they disappear).
- **Interaction:** 
    - TODO: Bullets hitting bullets (1% chance to explode both).

## Combat & Collision System
- **Hit Detection:** Use a shared method to check if a bullet occupies the same tile as any entity (including zombies) during movement or when an entity enters the same tile.
- **Damage Logic:**
    - When a hit is registered, the target entity takes damage.
    - Calculate blood amount = HP removed from the target.

## Blood & Visuals
- **Blood Spreading (Fluid Simulation):**
    - Simulated in a fluid step in the tick process.
    - All liquid tiles (Air, Floor, Stair) check once per fluid step.
    - One blood unit per fluid step per tile can move.
    - If blood is added to a tile with existing blood:
        - Check 8 surrounding tiles.
        - Identify tiles with the minimum amount of blood.
        - Shuffle the list of available "lowest" spots.
        - Move $n$ blood units (starting with 1) to the first available spots in the shuffled list.
- **Special Rules:**
    - Walls can have a maximum of one blood unit (static, not simulated).
- **Visuals:**
    - Tiles with blood are colored based on the tile's intended character/aspect.
    - Blood adds to the existing aspects of the tile.
