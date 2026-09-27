# Path Following (2D)

> ← Back to [SKILL.md](../SKILL.md)

Create `Path2D` with a `Curve2D`, a `PathFollow2D` child carrying this script, and a visual child. `progress` is distance along the curve in pixels; `progress_ratio` maps 0–1 over its baked length. `loop` wraps and `cubic_interp` smooths sampled positions. Use `rotates` to follow the tangent.

This directly positions a visual object. For a colliding CharacterBody, sample a path target and move the body with `move_and_slide()` rather than parenting it under a moving PathFollow. For a moving platform, apply the sampled transform through an `AnimatableBody2D` controller.

```gdscript
extends PathFollow2D

@export var speed: float = 100.0

func _physics_process(delta: float) -> void:
    progress += speed * delta
```

```csharp
using Godot;

public partial class PathFollower2D : PathFollow2D
{
    [Export] public float Speed { get; set; } = 100f;

    public override void _PhysicsProcess(double delta)
    {
        Progress += Speed * (float)delta;
    }
}
```
