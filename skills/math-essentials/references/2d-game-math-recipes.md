# Spatial Game Math (2D)

> ← Back to [SKILL.md](../SKILL.md)

These independent helpers assume nonnegative speed, deadzone and delta. Store the original bob position once; passing last frame's result would accumulate drift. `phase` is elapsed seconds multiplied by angular speed. Orbit and direction functions use XY pixel space, +X forward and +Y downward.

`approach_with_deadzone` stops at the boundary even on a long frame. `turn_toward` uses a frame-rate-independent exponential weight. The angle interpolation follows the shortest wrap-around route.

```gdscript
extends Node2D

func approach_with_deadzone(current: Vector2, target: Vector2, speed: float, deadzone: float, delta: float) -> Vector2:
    var distance := current.distance_to(target)
    return current.move_toward(target, minf(speed * delta, maxf(0.0, distance - deadzone)))

func orbit_position(center: Vector2, radius: float, angle: float) -> Vector2:
    return center + Vector2(cos(angle), sin(angle)) * radius

func bob_position(base: Vector2, amplitude: float, phase: float) -> Vector2:
    return base + Vector2.UP * sin(phase) * amplitude

func target_in_front(target: Vector2) -> bool:
    var forward := Vector2.RIGHT.rotated(global_rotation)
    return forward.dot(global_position.direction_to(target)) > 0.0

func turn_toward(target: Vector2, response: float, delta: float) -> void:
    if global_position == target:
        return
    var target_angle := global_position.angle_to_point(target)
    global_rotation = lerp_angle(global_rotation, target_angle, 1.0 - exp(-response * delta))
```

```csharp
using Godot;

public partial class SpatialMath2D : Node2D
{
    public Vector2 ApproachWithDeadzone(Vector2 current, Vector2 target, float speed, float deadzone, float delta)
    {
        float distance = current.DistanceTo(target);
        return current.MoveToward(target, Mathf.Min(speed * delta, Mathf.Max(0f, distance - deadzone)));
    }

    public Vector2 OrbitPosition(Vector2 center, float radius, float angle)
        => center + new Vector2(Mathf.Cos(angle), Mathf.Sin(angle)) * radius;

    public Vector2 BobPosition(Vector2 start, float amplitude, float phase)
        => start + Vector2.Up * Mathf.Sin(phase) * amplitude;

    public bool TargetInFront(Vector2 target)
    {
        Vector2 forward = Vector2.Right.Rotated(GlobalRotation);
        return forward.Dot(GlobalPosition.DirectionTo(target)) > 0f;
    }

    public void TurnToward(Vector2 target, float response, float delta)
    {
        if (GlobalPosition == target) return;
        float targetAngle = GlobalPosition.AngleToPoint(target);
        GlobalRotation = Mathf.LerpAngle(GlobalRotation, targetAngle, 1f - Mathf.Exp(-response * delta));
    }
}
```
