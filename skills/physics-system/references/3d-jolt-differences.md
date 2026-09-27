# Jolt Physics — Differences from GodotPhysics (3D)

Reference for `skills/physics-system/SKILL.md` — behavioral differences to expect when switching the 3D engine to Jolt.

> ← Back to [SKILL.md](../SKILL.md)

---

- Position-only Baumgarte stabilization.
- Convex-radius collision margins.
- Single-body joints treat the unassigned slot as `node_a` (world — opposite of GodotPhysics).
- `face_index` returns `-1` unless **Enable Ray Cast Face Index** is on.
- Some joint properties (`bias`, `softness`, `relaxation`, `damping`) are unsupported on PinJoint / HingeJoint / SliderJoint / ConeTwistJoint.

> ⚠️ **Changed in Godot 4.7:** With Jolt Physics, `WorldBoundaryShape3D.plane.d` now follows the same sign convention as Godot Physics — the plane distance is interpreted with the opposite sign compared to Godot 4.6. Flip the sign yourself to keep the 4.6 behavior. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).
