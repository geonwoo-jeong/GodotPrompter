# Path Following (3D)

> ← Back to [SKILL.md](../SKILL.md)

Create `Path3D` with a `Curve3D`, a `PathFollow3D` child carrying this script, and a visual child. `progress` is distance along the curve in world units; `progress_ratio` maps 0–1 over its baked length. `loop` wraps and `cubic_interp` smooths sampled positions. Use `rotation_mode` (None/Y/XY/XYZ/Oriented), not the 2D `rotates` property. `use_model_front` selects +Z model front instead of -Z.

This directly positions a visual object. For a colliding CharacterBody, sample a path target and move the body with `move_and_slide()` rather than parenting it under a moving PathFollow. For a moving platform, apply the sampled transform through an `AnimatableBody3D` controller.

```gdscript
extends PathFollow3D

@export var speed: float = 3.0

func _physics_process(delta: float) -> void:
    progress += speed * delta
```

```csharp
using Godot;

public partial class PathFollower3D : PathFollow3D
{
    [Export] public float Speed { get; set; } = 3f;

    public override void _PhysicsProcess(double delta)
    {
        Progress += Speed * (float)delta;
    }
}
```
