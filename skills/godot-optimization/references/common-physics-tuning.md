# Physics Tuning (Common)

> ← Back to [SKILL.md](../SKILL.md)

Filter collision layers/masks to the interactions that matter. Use simple primitives for moving bodies and let stationary rigid bodies sleep. Shape complexity and active body count usually matter more than the language used to control them.

| 2D | 3D | Use |
|---|---|---|
| CircleShape2D | SphereShape3D | Simple rounded object |
| CapsuleShape2D | CapsuleShape3D | Character |
| RectangleShape2D | BoxShape3D | Crate or wall |
| ConvexPolygonShape2D | ConvexPolygonShape3D | Irregular convex object |
| ConcavePolygonShape2D | ConcavePolygonShape3D | Static level geometry |

Use Area overlap signals for region membership and raycasts for direction/line of sight. Neither is universally cheaper: measure object count, shapes, query frequency, and masks. Concrete paired examples live in physics-system:

- [2D areas](../../physics-system/references/2d-area-recipes.md) / [3D areas](../../physics-system/references/3d-area-recipes.md)
- [2D rays](../../physics-system/references/2d-raycasting-recipes.md) / [3D rays](../../physics-system/references/3d-raycasting-recipes.md)
- [Common layer and mask setup](../../physics-system/references/common-collision-layers.md)

## Tick Rate

Changing the tick rate changes simulation fidelity, collision behavior, and input latency. Test it against movement speed and collision size before shipping; interpolation only smooths rendering and does not restore missed collisions. Set project defaults under Physics → Common.

```gdscript
func configure_physics_budget() -> void:
    Engine.physics_ticks_per_second = 60
    Engine.max_physics_steps_per_frame = 8
```

```csharp
public void ConfigurePhysicsBudget()
{
    Engine.PhysicsTicksPerSecond = 60;
    Engine.MaxPhysicsStepsPerFrame = 8;
}
```
