---
name: physics-system
description: Use when working with physics bodies, collision shapes, raycasting, areas, rigid bodies, ragdolls, soft bodies, Jolt physics, and physics interpolation in Godot 4.3+
---

# Physics System in Godot 4.3+ (Common)

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for CharacterBody2D/3D movement patterns, **component-system** for hitbox/hurtbox composition, **godot-optimization** for physics performance tuning, **camera-system** for camera follow and interpolation, **multiplayer-sync** for networked physics, **2d-essentials** for tile collision setup and 2D canvas layers.

---

## Dimension Routing

| Topic | 2D | 3D |
|---|---|---|
| Area overlaps and gravity | [Area2D](references/2d-area-recipes.md) | [Area3D](references/3d-area-recipes.md) |
| Rigid bodies and steering | [RigidBody2D](references/2d-rigidbody-recipes.md) | [RigidBody3D](references/3d-rigidbody-recipes.md) |
| Conveyors and moving platforms | [2D](references/2d-staticbody-recipes.md) | [3D](references/3d-staticbody-recipes.md) |
| Rays and mouse selection | [2D](references/2d-raycasting-recipes.md) | [3D](references/3d-raycasting-recipes.md) |
| Shape sizing and teleports | [2D](references/2d-collision-shapes.md) | [3D](references/3d-collision-shapes.md) |
| Interpolated camera follow | [2D samples](references/2d-interpolation-camera.md) | [3D transform getter](references/3d-interpolation-camera.md) |
| Ragdolls | [2D jointed bodies](references/2d-ragdoll-recipes.md) | [3D physical skeleton](references/3d-ragdoll-recipes.md) |

Layer/mask conventions, shape selection, timing, and troubleshooting are common references. Jolt and SoftBody3D are 3D-specific; one-way shape collision is 2D-specific. Use the matching column rather than mechanically replacing a type suffix.

## 1. Physics Body Types

Four collision-object types (the last three extend `PhysicsBody2D`/`3D`):

| Type | Moved by | Use for |
|------|----------|---------|
| `Area2D/3D` | Code | Overlap detection, gravity zones, audio zones |
| `StaticBody2D/3D` | Not moved (or `constant_linear_velocity`) | Walls, floors, conveyor belts |
| `RigidBody2D/3D` | Physics engine | Crates, projectiles, debris, ragdolls |
| `CharacterBody2D/3D` | Code | Players, enemies, NPCs (see **player-controller**) |

Every collision object needs at least one `CollisionShape2D`/`3D` (or `CollisionPolygon2D`/`3D`) child. **Jolt Physics is available as a built-in 3D engine from 4.4** (non-experimental from 4.6) — see Section 8. 2D always uses GodotPhysics.

> **Critical rule:** NEVER scale collision shapes or physics bodies via `scale`. Use the shape's own size parameters (radius, extents, height) — scaling breaks collision accuracy.

---

## 2. RigidBody2D/3D

### Forces vs Impulses

| Method | Effect | When to use |
|---|---|---|
| `apply_force(force, position)` | Continuous accel at point | Thrusters, wind, magnets |
| `apply_central_force(force)` | Continuous accel at center | Gravity, constant push |
| `apply_impulse(impulse, position)` | Instant velocity change at point | Bullet hit, explosion |
| `apply_central_impulse(impulse)` | Instant velocity change at center | Jump, knockback |
| `apply_torque(torque)` | Continuous angular accel | Steering, spinning |
| `apply_torque_impulse(impulse)` | Instant angular velocity change | Impact spin |

> See [references/2d-rigidbody-recipes.md](references/2d-rigidbody-recipes.md) for the 2D thrust, impulse, contact, and steering examples; the dimension table links the complete 3D equivalents.

### _integrate_forces() — Safe Physics Modification

Use `_integrate_forces(state)` instead of `_physics_process()` to read/modify a RigidBody's transform, velocity, or angular velocity. Setting `position` or `linear_velocity` directly in `_physics_process()` fights the physics engine.

> **Warning:** `_integrate_forces()` is NOT called while the body is sleeping. Set `can_sleep = false` if you need continuous callbacks; otherwise let bodies sleep for performance.

> See [references/2d-rigidbody-recipes.md](references/2d-rigidbody-recipes.md) for physics-state thrust and torque examples (GDScript + C#).

### Contact Monitoring, PhysicsMaterial, Freeze, look_at

- **Contact signals** require `contact_monitor = true` + `max_contacts_reported > 0`. Then `body_entered`/`body_exited` fire.
- **`PhysicsMaterial`** resource controls `friction` (0 ice → 1 rubber) and `bounce` (0 → 1).
- **Freeze modes:** `FREEZE_MODE_STATIC` (acts like a StaticBody) or `FREEZE_MODE_KINEMATIC` (code-moved, pushes others).
- **RigidBody3D orientation:** never `look_at()` a RigidBody — use `_integrate_forces` and set `state.angular_velocity` from a cross-product steering term.

> See [references/2d-rigidbody-recipes.md](references/2d-rigidbody-recipes.md) for 2D contact, impulse, freeze, and orientation recipes. Use the 3D counterpart for vector angular velocity.

---

## 3. StaticBody2D/3D

`StaticBody` is not moved by the physics engine but can push other bodies via `constant_linear_velocity` (e.g. conveyor belts). For platforms that move via code AND push CharacterBodies, use **`AnimatableBody2D`/`3D`** — a code-moved `StaticBody` won't push CharacterBodies reliably.

> See [references/2d-staticbody-recipes.md](references/2d-staticbody-recipes.md) for the conveyor belt and moving-platform recipes (GDScript + C#, with Tween-driven AnimatableBody2D loop).

---

## 4. Area2D/3D

Areas detect overlaps and override physics properties within their bounds. They do NOT produce collision responses — bodies pass through them. Connect `body_entered` / `body_exited` for body overlaps; use `area_entered` / `area_exited` for Area-to-Area (hitbox vs hurtbox — see **component-system**). Areas can also override gravity (zero-G zones, point gravity / black holes), `linear_damp` / `angular_damp` (water, slow-mo), and redirect audio to a specific `AudioBus`. When multiple areas overlap, `priority` decides order; pick a `space_override` mode (`COMBINE`, `REPLACE`, `COMBINE_REPLACE`, `REPLACE_COMBINE`).

> See [references/2d-area-recipes.md](references/2d-area-recipes.md) for GDScript + C# overlap, zero-G, and point-gravity recipes; the 3D counterpart covers the same operations.

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `Area3D` now reports overlaps with `SoftBody3D` from its signals and methods. Configure collision layers/masks so any unwanted `Area3D` ↔ `SoftBody3D` interactions are ignored. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 5. Collision Shapes

| Shape (2D / 3D) | Use case |
|---|---|
| `Rectangle` / `Box` | Crates, platforms, rooms |
| `Circle` / `Sphere` | Balls, projectiles, simple characters, trigger zones |
| `Capsule` (2D & 3D) | Characters — rounded, slides over edges |
| `Segment2D` / — | Thin walls, laser beams |
| `SeparationRay2D` / `SeparationRay3D` | Character ground snapping |
| `WorldBoundary2D` / `WorldBoundary3D` | Infinite floor/wall/ceiling |
| — / `Cylinder3D` | Pillars, barrels (Jolt only — unstable on GodotPhysics) |

Prefer primitives for dynamic bodies. `ConvexPolygonShape` is fast but cannot express holes or inward curves; `ConcavePolygonShape` is accurate for level geometry but is **StaticBody-only** and the slowest. Local offsets and rotation are supported. Avoid nonuniform scaling; edit the shape resource dimensions instead. Godot 4.7+ adds `one_way_collision_direction` for sideways 2D one-way platforms.

Convex/concave cost table, shape-generation menus, the full performance rules, and the 4.7+ one-way direction API (GDScript + C#): [references/common-collision-shapes.md](references/common-collision-shapes.md)

---

## 6. Collision Layers and Masks

Godot provides 32 physics layers per dimension (2D and 3D separately).

- **collision_layer** — which layers this object **exists on** (others scan for it here)
- **collision_mask** — which layers this object **scans** (what it detects)

> **Mental model:** Layer = "I am", Mask = "I scan for". A collision happens when object A's mask includes object B's layer, OR vice versa.

Name layers in **Project Settings → Layer Names → 2D Physics** (or 3D Physics); set them in code with `set_collision_layer_value(N, true)` / `set_collision_mask_value(N, true)` (1-indexed).

> See [references/common-collision-layers.md](references/common-collision-layers.md) for layer naming conventions, bitmask shorthand, Inspector export flags, and the GDScript + C# examples.

---

## 7. Raycasting and Physics Queries

### RayCast2D/3D Nodes (Simple Per-Frame Rays)

Add a `RayCast2D` / `RayCast3D` as a child node — it casts every physics frame automatically. Read with `is_colliding()` and `get_collider()` / `get_collision_point()` / `get_collision_normal()`.

> See [references/2d-raycasting-recipes.md](references/2d-raycasting-recipes.md) for the GDScript + C# RayCast node example.

### Code-Based Raycasting (PhysicsDirectSpaceState)

For on-demand queries, access the space state via `get_world_2d().direct_space_state` (or `get_world_3d()`) and call `intersect_ray(query)` with `PhysicsRayQueryParameters2D/3D.create(from, to)`. Set `query.exclude = [get_rid()]` to skip self, `query.collision_mask` to filter layers. **Only safe inside `_physics_process()`** — the physics space is locked during rendering.

> See [references/2d-raycasting-recipes.md](references/2d-raycasting-recipes.md) for the full GDScript + C# code-based raycast example with self-exclusion and mask filtering, plus 2D point picking; the 3D counterpart projects a ray from Camera3D.

### Ray Result, Other Queries, 3D Mouse Picking

The `intersect_ray` result dictionary contains `position`, `normal`, `collider`, `collider_id`, `rid`, `shape`. `PhysicsDirectSpaceState` also supports `intersect_point` (overlapping shapes at a point), `intersect_shape` (area query), `cast_motion` (shape sweep), `collide_shape` (contact points), `get_rest_info` (resting collision info). For 3D mouse picking, `Camera3D.project_ray_origin(screen_pos)` + `project_ray_normal(screen_pos)` builds the ray.

> See [references/2d-raycasting-recipes.md](references/2d-raycasting-recipes.md) for the 2D picking recipe; use [3D ray picking](references/3d-raycasting-recipes.md) with Camera3D.

---

## 8. Jolt Physics

Jolt is a built-in alternative physics engine since Godot 4.4. **(Godot 4.6+)** Jolt is no longer marked experimental and is the confirmed stable default for all new 3D projects.

### Enabling Jolt

**Project Settings → Physics → 3D → Physics Engine** → `Jolt Physics` → Save → Restart editor. (3D only; 2D always uses GodotPhysics.)

### Why & Differences

**Wins:** better stacking stability, reliable `CylinderShape3D`, better `SoftBody3D`, optional thread-safe mode, active-edge detection (fixes ghost collisions).

> See [references/3d-jolt-differences.md](references/3d-jolt-differences.md) for the behavioral differences from GodotPhysics (stabilization, collision margins, single-body joints, `face_index`, unsupported joint properties).

---

## 9. Physics Interpolation

Smooths visual motion between physics ticks, eliminating "staircase" jitter when tick rate ≠ frame rate. Enable in **Project Settings → Physics → Common → Physics Interpolation**. **Godot 4.5+** restructured the 3D interpolation pipeline (`RenderingServer` → `SceneTree`) for more accurate results in nested transforms — no API change, automatic improvement on upgrade.

### Core Rules

1. **Move all game logic to `_physics_process()`** — transforms set outside physics ticks cause jitter
2. **Tweens and AnimationPlayer** that move physics objects must use physics tick timing
3. **Call `reset_physics_interpolation()`** after teleporting or initial placement to prevent "streaking"

> See [references/common-interpolation-tuning.md](references/common-interpolation-tuning.md) for the teleport-reset example (GDScript + C#), per-node `physics_interpolation_mode` control, and tick-rate guidance.

### Camera Interpolation

Cameras need dimension-specific handling. In 3D, an independent camera can read `Node3D.get_global_transform_interpolated()` during `_process()`. In 2D, that getter is unavailable: the paired recipe samples physics positions and interpolates the camera explicitly.

> See [references/3d-interpolation-camera.md](references/3d-interpolation-camera.md) for the full smooth-follow Camera3D recipe (GDScript + C#).

---

## 10. Ragdoll System

Ragdolls replace animation with physics for procedural death, explosions, or limp characters. Generate via `Skeleton3D` → **Skeleton** menu → **Create Physical Skeleton**. Use `ConeJoint` for shoulders/hips/neck, `HingeJoint` for elbows/knees — `PinJoint` (default) tends to crumple. Drive via `physical_bones_start_simulation()`, blend with `Influence`.

> See [references/3d-ragdoll-recipes.md](references/3d-ragdoll-recipes.md) for setup, joint guidance, full GDScript + C# control, animation blending, and collision exceptions.

---

## 11. SoftBody3D

`SoftBody3D` simulates deformable objects (cloth, capes, jelly). Mesh subdivision drives the simulation; no `CollisionShape` child needed. **Jolt Physics recommended.** Set `Simulation Precision ≥ 5` to prevent collapse. `Pressure > 0.0` only on closed meshes.

Godot 4.5+ adds `apply_central_impulse()` / `apply_central_force()` for `RigidBody3D`-style force application — distributes across all simulation points.

> See [references/3d-softbody-recipes.md](references/3d-softbody-recipes.md) for the cloth/cape walk-through (PlaneMesh, BoneAttachment3D pinning, Parent Collision Ignore) and the 4.5+ force/impulse API with GDScript and C# (explosion knockback, continuous wind).

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `SoftBody3D` mass no longer defaults to `0` (which auto-calculated 1 kg *per point*, giving a very high total mass) — it now defaults to 1 kg for the entire body, matching Godot Physics. `linear_stiffness` is also applied differently, so re-tweak `linear_stiffness` and `damping_coefficient` after upgrading. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 13. Troubleshooting Physics Issues

Symptom → causes & fixes quick table covering tunneling, wobbly stacks, scaled shapes, tile collision bumps, unstable cylinders, the physics spiral of death, and float-precision issues far from origin.

> See [references/common-troubleshooting.md](references/common-troubleshooting.md) for the full table.

---

## 14. Implementation Checklist

- [ ] Dynamic bodies use primitive collision shapes; concave shapes only on StaticBodies
- [ ] Collision layers named in Project Settings; layer/mask set correctly per body
- [ ] No `scale` on collision shapes or bodies — use shape size parameters directly
- [ ] RigidBodies modify state via `_integrate_forces()`, not `_physics_process()`
- [ ] RigidBodies needing contact signals set `contact_monitor = true` + `max_contacts_reported > 0`
- [ ] Moving platforms use `AnimatableBody2D/3D` (not manually moved StaticBody)
- [ ] Code raycasts use `PhysicsDirectSpaceState` inside `_physics_process()` only
- [ ] Physics interpolation enabled; `reset_physics_interpolation()` called after teleport / initial placement
- [ ] Ragdoll bones on a separate collision layer from the character capsule
- [ ] 3D projects use Jolt (non-experimental default in Godot 4.6+)
