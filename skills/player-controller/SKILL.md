---
name: player-controller
description: Use when implementing player movement — CharacterBody2D/3D patterns, input handling, physics, common movement recipes
---

# Player Controllers in Godot 4.3+ (Common)

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **physics-system** for RigidBody, Area, raycasting, and collision shapes, **2d-essentials** for TileMaps, parallax, and 2D lighting, **3d-essentials** for CharacterBody3D and 3D movement setup, **state-machine** for movement state management, **camera-system** for camera follow and shake, **component-system** for hitbox/hurtbox integration, **animation-system** for animation driven by movement state, **input-handling** for InputMap actions and controller support, **ai-navigation** for enemy movement and pathfinding.

---

## 1. Core Concepts

### CharacterBody vs RigidBody

| Body Type         | Use For                        | Physics Control | Notes                                                   |
|-------------------|--------------------------------|-----------------|----------------------------------------------------------|
| `CharacterBody2D/3D` | Player, enemies, NPCs       | Manual (full)   | You control velocity; `move_and_slide()` handles collisions |
| `RigidBody2D/3D`  | Projectiles, props, debris     | Engine-driven   | Physics engine applies forces; harder to control precisely  |
| `RigidBody2D/3D`  | Projectiles with bouncing      | Engine-driven   | Set `linear_velocity` once; let physics resolve bounces  |
| `CharacterBody2D/3D` | Platformers, top-down, first-person (3D)    | Manual (full)   | Reliable and predictable; best for responsive game feel  |

**Rule of thumb:** Use `CharacterBody` when you need tight, responsive control. Use `RigidBody` when you want realistic physics simulation.

### The Movement Loop

Every physics frame follows this order:

```
1. Read input          → get axis/action values
2. Apply forces        → gravity, friction, acceleration
3. Modify velocity     → move_toward, lerp, clamp
4. move_and_slide()    → engine resolves collisions, updates position
5. Post-movement state → check is_on_floor(), is_on_wall(), landing events
```

Always put this loop in `_physics_process(delta)`, never `_process(delta)`.

---

## 2. Dimension-specific Controllers

| Need | 2D | 3D |
|---|---|---|
| Basic movement | [Top-down and platformer](references/2d-controllers.md) | [Ground movement and first-person](references/3d-controllers.md) |
| Dash and wall jump | [Pixel-space recipes](references/2d-movement-recipes.md) | [Ground-plane recipes](references/3d-movement-recipes.md) |

The input vector has two axes in both dimensions. Map it to XY for 2D or XZ for grounded 3D; preserve the separate vertical velocity in 3D. Tune speeds in pixels/second or world units/second respectively. A first-person perspective is a 3D camera concept; use the 2D top-down controller for planar aiming.

## 3. Movement Recipes

Beyond the basic locomotion patterns above, two recipes come up so often that they deserve their own block: **Dash** (timer-based velocity override for a short burst, with a cooldown and one dash per airtime) and **Wall Jump** (vertical wall slide + bounce off `GetWallNormal()` when jump is pressed). Choose the 2D or 3D version above; each fits the physics loop and documents its gravity direction.

See the [2D recipes](references/2d-movement-recipes.md) and [3D recipes](references/3d-movement-recipes.md) for full GDScript and C# implementations.

---

## 4. Common Pitfalls

| Symptom                        | Cause                                        | Fix                                                              |
|-------------------------------|----------------------------------------------|------------------------------------------------------------------|
| Player sticks to walls        | Default wall blocking behavior               | Set `floor_block_on_wall = false` on the CharacterBody           |
| Jittery or frame-rate-dependent movement | Movement in `_process`              | Move all physics/velocity code to `_physics_process(delta)`      |
| Inconsistent jump height      | Fixed velocity ignores frame timing          | Use variable jump (cut `velocity.y` on button release)           |
| Player slides down slopes     | No snap or angle limits                      | Set `floor_snap_length` > 0 and tune `floor_max_angle`           |
| Mouse look inverted           | Wrong sign on rotation delta                 | Negate `event.relative.x` for yaw and/or `event.relative.y` for pitch |

---

## 5. Implementation Checklist

- [ ] All movement logic is inside `_physics_process(delta)`, not `_process`
- [ ] Input action names match exactly what is defined in **Project > Project Settings > Input Map**
- [ ] Gravity value is read from `ProjectSettings` (`physics/2d/default_gravity` or `physics/3d/default_gravity`), not hard-coded
- [ ] `move_and_slide()` is called after all velocity modifications each frame
- [ ] Platformers implement coyote time and jump buffering for responsive feel
- [ ] FPS controllers capture mouse in `_ready()` and release on escape
- [ ] Variable jump height is handled via early-release velocity reduction
