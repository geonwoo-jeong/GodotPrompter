# World Input (2D)

> ← Back to [SKILL.md](../SKILL.md)

A stick's Vector2 maps directly to an XY velocity in pixels/second. Mouse positions arrive in viewport coordinates; `get_global_mouse_position()` applies the canvas transform, including Camera2D pan/zoom. This aiming helper assumes an unscaled Node2D whose artwork points right. GUI controls get the first opportunity to consume discrete clicks through `_unhandled_input`.

```gdscript
extends Node2D

func movement_direction(input_vector: Vector2) -> Vector2:
    return input_vector

func aim_at_mouse() -> void:
    var target := get_global_mouse_position()
    if target != global_position:
        global_rotation = global_position.angle_to_point(target)
```

```csharp
using Godot;

public partial class WorldInput2D : Node2D
{
    public Vector2 MovementDirection(Vector2 input) => input;

    public void AimAtMouse()
    {
        Vector2 target = GetGlobalMousePosition();
        if (target != GlobalPosition) GlobalRotation = GlobalPosition.AngleToPoint(target);
    }
}
```
