# Pooled Scene Placement (2D)

> ← Back to [SKILL.md](../SKILL.md)

Assign a [ReusableNodePool](common-memory-management.md) whose scene root is Node2D. The position argument is local to this spawner. Configure the detached instance before it enters the tree, then reset interpolation after insertion. Return the effect through `pool.release(effect)` when it finishes.

```gdscript
extends Node2D

@export var pool: ReusableNodePool

func spawn_effect(at_position: Vector2) -> Node2D:
    var effect: Node2D = pool.acquire()
    if effect == null:
        return null  # Fixed-capacity pool is exhausted.
    effect.position = at_position
    add_child(effect)
    effect.reset_physics_interpolation()
    return effect
```

```csharp
public partial class PooledEffectSpawner2D : Node2D
{
    [Export] public ReusableNodePool Pool { get; set; }
    public Node2D SpawnEffect(Vector2 atPosition)
    {
        Node2D effect = (Node2D)Pool.Acquire();
        if (effect == null) return null;
        effect.Position = atPosition;
        AddChild(effect);
        effect.ResetPhysicsInterpolation();
        return effect;
    }
}
```
