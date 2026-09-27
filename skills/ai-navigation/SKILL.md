---
name: ai-navigation
description: Use when implementing AI movement — NavigationAgent2D/3D, steering behaviors, behavior trees, and patrol patterns
---

# AI Navigation in Godot 4.3+ (Common)

Cover NavigationAgent2D/3D, steering behaviors, behavior trees, and patrol patterns. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **state-machine** for AI state management, **component-system** for modular AI behaviors, **player-controller** for movement physics patterns, **math-essentials** for pathfinding vectors and steering math, **limboai** for BT + HSM with a visual editor, **beehave** for lightweight GDScript behavior trees. For a structured behavior tree (rather than steering/navigation), see the comparison tables in **limboai** and **beehave**.

> **Dimension routing:** Use [2D navigation](references/2d-navigation-agent.md) or [3D ground navigation](references/3d-navigation-agent.md), then the matching steering, patrol and chase references. Behavior-tree structure and layer bitmasks are common.

---

## 1. Navigation Setup

### Scene Structure

```
World (Node2D or Node3D)
└── NavigationRegion2D (or NavigationRegion3D)
    ├── TileMapLayer / StaticBody2D (2D) or MeshInstance3D / StaticBody3D (3D)
    └── Enemy (matching CharacterBody2D/3D with NavigationAgent2D/3D child)
```

### NavigationRegion2D / NavigationRegion3D

1. Add a **NavigationRegion2D** (or **NavigationRegion3D**) node to your scene.
2. Assign a **NavigationPolygon** (2D) or **NavigationMesh** (3D) resource to it.
3. Draw the walkable area in the NavigationPolygon editor, or configure the NavigationMesh bounds in 3D.
4. **Bake the mesh at edit time:** select the NavigationRegion node → click **Bake NavigationPolygon** (2D) or **Bake NavigationMesh** (3D) in the toolbar.
5. **Bake at runtime** when the world changes dynamically:

```gdscript
# 2D
$NavigationRegion2D.bake_navigation_polygon()

# 3D
$NavigationRegion3D.bake_navigation_mesh()
```

```csharp
// 2D
GetNode<NavigationRegion2D>("NavigationRegion2D").BakeNavigationPolygon();

// 3D
GetNode<NavigationRegion3D>("NavigationRegion3D").BakeNavigationMesh();
```

### Async Navigation Baking (Godot 4.4+)

Navigation baking can cause frame drops on large maps. Godot 4.4 supports baking on a background thread: pass `true` to `bake_navigation_polygon(true)` (2D) or `bake_navigation_mesh(true)` (3D) and connect the region's `bake_finished` signal (use `CONNECT_ONE_SHOT`) to know when the mesh is ready.

> See [references/common-async-baking.md](references/common-async-baking.md) for the full GDScript and C# background-thread bake examples (2D and 3D).

> **When to use async baking:** Procedurally generated levels, destructible terrain, or any scene where the navigation mesh must be rebuilt at runtime. The game continues running while the mesh bakes.

### Navigation Layers

Navigation layers let you separate walkable areas for different agent types (ground troops, flying units, large enemies).

```gdscript
# Assign layer bits on the NavigationRegion (Inspector or code)
# Layer 1 = ground, Layer 2 = air, Layer 3 = large

# On the NavigationAgent, set matching layers:
$NavigationAgent2D.navigation_layers = 1   # ground only
$NavigationAgent2D.navigation_layers = 2   # air only
$NavigationAgent2D.navigation_layers = 1 | 2  # both (bitwise OR)
```

```csharp
// Assign layer bits on the NavigationRegion (Inspector or code)
// Layer 1 = ground, Layer 2 = air, Layer 3 = large

var navAgent = GetNode<NavigationAgent2D>("NavigationAgent2D");
navAgent.NavigationLayers = 1;       // ground only
navAgent.NavigationLayers = 2;       // air only
navAgent.NavigationLayers = 1 | 2;   // both (bitwise OR)
```

> Set `navigation_layers` on both the **NavigationRegion** and the **NavigationAgent** so they match. Mismatched layers are one of the most common reasons an agent finds no path.

---

## 2. NavigationAgent2D

Use the [2D navigation mover](references/2d-navigation-agent.md) for XY ground movement. It waits for map synchronization and handles both direct and avoidance movement.

## 3. NavigationAgent3D

Use the [3D navigation mover](references/3d-navigation-agent.md) for XZ ground steering with independent Y gravity. It does not zero vertical velocity when a path finishes.

## 4. Steering Behaviors

Lightweight per-frame calculations (seek, flee, arrive, wander) that produce natural-looking movement without a navigation mesh. Combine them by summing the returned vectors, or pick one and assign it to `velocity` each `_physics_process` tick.

> See [references/2d-steering-behaviors.md](references/2d-steering-behaviors.md) and [3D equivalent](references/3d-steering-behaviors.md) for the full GDScript and C# implementations of seek, flee, arrive (with deceleration ramp), and wander (with circle-projection jitter).

---

## 5. Patrol Patterns

A NavigationAgent2D/3D plus matching Marker2D/3D waypoints produces a patrol loop. Accumulate a short wait after each completed path, cycle the waypoint index, and set the next target. The shared movement base owns avoidance and gravity.

> See [references/2d-patrol-patterns.md](references/2d-patrol-patterns.md) and [3D equivalent](references/3d-patrol-patterns.md) for the full GDScript and C# waypoint-chain patrol with timed pauses.

---

## 6. Behavior Tree Concept

A behavior tree (BT) is a tree of nodes evaluated every tick. Three core node types:

| Type | Succeeds when | Fails when |
|---|---|---|
| **Sequence** | all children succeed (AND) | any child fails |
| **Selector** | any child succeeds (OR) | all children fail |
| **Action** | the leaf action completes | the leaf reports failure |

Sequences model "do A then B then C". Selectors model "try A, else try B, else try C".

> See [references/common-behavior-trees.md](references/common-behavior-trees.md) for the full lightweight BT implementation (BTNode base + Sequence / Selector / Action) and a worked enemy that uses "chase OR patrol", in both GDScript and C#.

---

## 7. Chase + Attack Pattern

Combines NavigationAgent2D/3D with a state machine. See the **state-machine** skill for the full FSM infrastructure.

### States

| State | Entry condition | Exit condition |
|---|---|---|
| PATROL | default / player escaped | player enters detect_range |
| CHASE | player in detect_range | player in attack_range OR player escaped |
| ATTACK | player in attack_range | player left attack_range |

> See [references/2d-chase-attack.md](references/2d-chase-attack.md) and [3D equivalent](references/3d-chase-attack.md) for the full GDScript and C# implementation (PATROL → CHASE → ATTACK transitions, attack cooldown timer, patrol-waypoint advancement, escape-range hand-off back to patrol).

> For larger projects, extract each state into its own node class using the **state-machine** skill and inject the matching NavigationAgent2D/3D reference from the parent.

---

## 8. Dedicated 2D Navigation Server (Godot 4.5+)

Prior to Godot 4.5, `NavigationServer2D` was a thin frontend that delegated all work to the 3D navigation server internally. Godot 4.5 splits them into fully independent servers. The change is **transparent** — no API changes and no code migration is required — but it brings two practical benefits:

- **Performance:** 2D pathfinding no longer competes with 3D navigation for server resources. Large 2D scenes with many agents see lower CPU overhead.
- **Smaller exports for 2D-only games:** The 3D navigation server can be stripped from 2D-only export templates, reducing binary size.

```gdscript
# No code change needed — NavigationServer2D calls work identically.
# The split is internal; you continue using NavigationServer2D as before.

# Example: query a path directly via the server (unchanged API).
func get_path_to(target: Vector2) -> PackedVector2Array:
    var map: RID = get_world_2d().get_navigation_map()
    return NavigationServer2D.map_get_path(
        map,
        global_position,
        target,
        true  # optimize path
    )
```

```csharp
// No code change needed — NavigationServer2D calls work identically.
public Vector2[] GetPathTo(Vector2 target)
{
    var map = GetWorld2D().NavigationMap;
    return NavigationServer2D.MapGetPath(map, GlobalPosition, target, true);
}
```

> Removing an engine module requires export templates built without that module; project settings do not remove compiled code from an existing export template. Keep 3D navigation available whenever the project uses 3D navigation nodes.

---

## 9. Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| **Navigation mesh not baked** | Agent stands still; no path found | Bake the NavigationPolygon/NavigationMesh before running, or call `bake_navigation_polygon()` at runtime after scene loads |
| **`agent_radius` too large** | Agent can't fit through doorways or narrow corridors | Bake with suitable agent clearance; NavigationAgent `radius` only controls avoidance |
| **Avoidance jitter** | Agent stutters or oscillates when near other agents | Increase `time_horizon_agents` (try 2–4 s) or slightly lower `max_speed` on the agent |
| **Path recalculation too frequent** | CPU spike each frame; agents lag | Add a `Timer` (0.2–0.5 s) and only set `target_position` when the timer fires, not every physics frame |
| **Wrong navigation layer** | Agent ignores some regions or finds no path | Confirm `navigation_layers` bitmask matches between the NavigationRegion and the NavigationAgent |
| **Target set before NavigationServer is ready** | Path is empty on the first frame | Wait for a synchronized map before querying paths; see the map-iteration check in both mover recipes |
| **Gravity ignored in 3D** | Agent floats or sinks into the floor | Always accumulate `velocity.y` from gravity separately; only zero out X/Z from the nav direction |
| **Baking causes frame drop** | Synchronous bake on large maps blocks the main thread | Use async baking: `bake_navigation_mesh(true)` (Godot 4.4+); connect `bake_finished` signal |

> ⚠️ **Changed in Godot 4.7:** `NavigationServer3D.map_get_closest_point_normal(map, to_point)` now returns a normalized vector ([GH-119022](https://github.com/godotengine/godot/pull/119022)) — previously the returned surface normal could be unnormalized. Code that compensated by calling `normalized()` on the result keeps working; code that relied on the unnormalized magnitude breaks.

---

## 10. Checklist

- [ ] NavigationRegion2D/3D added to the scene with a NavigationPolygon/NavigationMesh resource
- [ ] Navigation mesh baked (edit-time or at runtime before the agent needs a path)
- [ ] `navigation_layers` bitmask matches between NavigationRegion and NavigationAgent
- [ ] `NavigationAgent2D`/`NavigationAgent3D` is a **child** of the enemy node
- [ ] `get_next_path_position()` called each physics frame, not `get_target_position()`
- [ ] `velocity_computed` signal connected when `avoidance_enabled` is `true`
- [ ] `is_navigation_finished()` checked before moving to avoid jitter at the destination
- [ ] Path target updated via a throttle timer rather than every frame when following a moving player
- [ ] `agent_radius` small enough to fit through the narrowest passage in the level
- [ ] Gravity applied independently of horizontal nav velocity (3D only)
- [ ] Large or dynamic maps use async baking (`bake_navigation_mesh(true)`) to avoid frame drops (Godot 4.4+)
- [ ] Custom export templates retain the navigation modules used by the project

Spatial references: [2d-behavior-tree-actor](references/2d-behavior-tree-actor.md) · [3d-behavior-tree-actor](references/3d-behavior-tree-actor.md).
