# Pooled Scene Placement (3D)

> ← Back to [SKILL.md](../SKILL.md)

Assign a [ReusableNodePool](common-memory-management.md) whose scene root is Node3D. The position argument is local to this spawner. Configure the detached instance before it enters the tree, then reset interpolation after insertion. Return the effect through `pool.release(effect)` when it finishes.

```gdscript
extends Node3D

@export var pool: ReusableNodePool

func spawn_effect(at_position: Vector3) -> Node3D:
    var effect: Node3D = pool.acquire()
    if effect == null:
        return null  # Fixed-capacity pool is exhausted.
    effect.position = at_position
    add_child(effect)
    effect.reset_physics_interpolation()
    return effect
```

```csharp
public partial class PooledEffectSpawner3D : Node3D
{
    [Export] public ReusableNodePool Pool { get; set; }
    public Node3D SpawnEffect(Vector3 atPosition)
    {
        Node3D effect = (Node3D)Pool.Acquire();
        if (effect == null) return null;
        effect.Position = atPosition;
        AddChild(effect);
        effect.ResetPhysicsInterpolation();
        return effect;
    }
}
```
