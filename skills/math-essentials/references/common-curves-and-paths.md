# Scalar Curves and Spatial Path Routing (Common)

> ← Back to [SKILL.md](../SKILL.md)

A `Curve` maps a scalar input to a scalar output; its Vector2 control points are graph coordinates, not a 2D game-world restriction. Use this same resource for damage falloff or animation weights in either dimension.

## Scalar Curve

```gdscript
extends Node

func make_pulse_curve() -> Curve:
    var curve := Curve.new()
    curve.add_point(Vector2(0.0, 0.0))
    curve.add_point(Vector2(0.5, 1.0))
    curve.add_point(Vector2(1.0, 0.0))
    return curve
```

```csharp
using Godot;

public partial class PulseCurveFactory : Node
{
    public Curve MakePulseCurve()
    {
        var curve = new Curve();
        curve.AddPoint(new Vector2(0f, 0f));
        curve.AddPoint(new Vector2(0.5f, 1f));
        curve.AddPoint(new Vector2(1f, 0f));
        return curve;
    }
}
```

Sample with `curve.sample(0.25)` / `curve.Sample(0.25f)`. A `CurveTexture` wraps this data for shaders.

## Spatial Paths

Use [Path2D / PathFollow2D](2d-path-following.md) or [Path3D / PathFollow3D](3d-path-following.md). Their progress concepts are common, but their orientation controls differ. Scalar angle wrapping (`wrapf`, `angle_difference`, `lerp_angle`; C#: `Mathf.Wrap`, `AngleDifference`, `LerpAngle`) applies to a 2D rotation or a selected 3D yaw; do not interpolate an arbitrary 3D orientation by treating all Euler components as independent angles.
