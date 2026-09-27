# Physics Interpolation Tuning (Common)

The project interpolation setting and reset rules apply to both dimensions.

> ← Back to [SKILL.md](../SKILL.md)

## Teleports

Set the new transform, then reset interpolation. The 2D and 3D APIs have the same name but different position types:

- [2D teleport and shape setup](2d-collision-shapes.md)
- [3D teleport and shape setup](3d-collision-shapes.md)

## Per-Node Control and Tick Rate

`physics_interpolation_mode` accepts `INHERIT`, `ON`, or `OFF`. Ordinary physics-driven objects inherit project interpolation; a manually interpolated camera turns it off. Run transform animation on physics ticks. Temporarily lowering Physics Ticks per Second to 10 is useful for spotting incorrect interpolation, but choose the shipping tick rate from collision/movement tests at the target speed.

For cameras, use [2D sampled follow](2d-interpolation-camera.md) or [3D interpolated transforms](3d-interpolation-camera.md).
