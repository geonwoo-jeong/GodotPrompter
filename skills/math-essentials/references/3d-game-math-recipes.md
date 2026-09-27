# Spatial Game Math (3D)

> ← Back to [SKILL.md](../SKILL.md)

These independent helpers assume nonnegative speed, deadzone and delta. Store the original bob position once; passing last frame's result would accumulate drift. `phase` is elapsed seconds multiplied by angular speed. Orbit and direction functions use world units, an XZ orbit, +Y upward and local -Z forward.

`approach_with_deadzone` stops at the boundary even on a long frame. `turn_toward` uses a frame-rate-independent exponential weight. The 3D turn helper rotates an unscaled visual Node3D around Y; keep mesh scale on a child, since an orthonormal basis contains rotation only.

```gdscript
extends Node3D

func approach_with_deadzone(current: Vector3, target: Vector3, speed: float, deadzone: float, delta: float) -> Vector3:
    var distance := current.distance_to(target)
    return current.move_toward(target, minf(speed * delta, maxf(0.0, distance - deadzone)))

func orbit_position(center: Vector3, radius: float, angle: float) -> Vector3:
    return center + Vector3(cos(angle), 0.0, sin(angle)) * radius

func bob_position(base: Vector3, amplitude: float, phase: float) -> Vector3:
    return base + Vector3.UP * sin(phase) * amplitude

func target_in_front(target: Vector3) -> bool:
    var forward := -global_basis.z.normalized()
    return forward.dot(global_position.direction_to(target)) > 0.0

func turn_toward(target: Vector3, response: float, delta: float) -> void:
    var offset := target - global_position
    offset.y = 0.0
    if offset.is_zero_approx():
        return
    var desired := Basis.looking_at(offset.normalized(), Vector3.UP)
    global_basis = global_basis.orthonormalized().slerp(desired, 1.0 - exp(-response * delta))
```

```csharp
using Godot;

public partial class SpatialMath3D : Node3D
{
    public Vector3 ApproachWithDeadzone(Vector3 current, Vector3 target, float speed, float deadzone, float delta)
    {
        float distance = current.DistanceTo(target);
        return current.MoveToward(target, Mathf.Min(speed * delta, Mathf.Max(0f, distance - deadzone)));
    }

    public Vector3 OrbitPosition(Vector3 center, float radius, float angle)
        => center + new Vector3(Mathf.Cos(angle), 0f, Mathf.Sin(angle)) * radius;

    public Vector3 BobPosition(Vector3 start, float amplitude, float phase)
        => start + Vector3.Up * Mathf.Sin(phase) * amplitude;

    public bool TargetInFront(Vector3 target)
    {
        Vector3 forward = -GlobalBasis.Z.Normalized();
        return forward.Dot(GlobalPosition.DirectionTo(target)) > 0f;
    }

    public void TurnToward(Vector3 target, float response, float delta)
    {
        Vector3 offset = target - GlobalPosition;
        offset.Y = 0f;
        if (offset.IsZeroApprox()) return;
        Basis desired = Basis.LookingAt(offset.Normalized(), Vector3.Up);
        GlobalBasis = GlobalBasis.Orthonormalized().Slerp(desired, 1f - Mathf.Exp(-response * delta));
    }
}
```
