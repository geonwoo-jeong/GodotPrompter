---
name: camera-system
description: Use when implementing cameras — smooth follow, screen shake, camera zones, and transitions for 2D and 3D
---

# Camera Systems in Godot 4.3+ (Common)

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for first-person camera setup, **state-machine** for camera state transitions, **godot-optimization** for camera culling and performance, **physics-system** for physics interpolation and camera smoothing, **2d-essentials** for canvas layers, parallax scrolling, and coordinate conversion, **math-essentials** for smoothstep and lerp-based interpolation, **tween-animation** for camera shake and cinematic transitions, **phantom-camera** for a Cinemachine-style camera addon.

---

## 1. Dimension-specific Camera Patterns

| Feature | 2D | 3D |
|---|---|---|
| Follow / orbit | [Follow and look-ahead](references/2d-camera-patterns.md) | [SpringArm follow and orbit](references/3d-camera-patterns.md) |
| Shake | [Pixel offset and roll](references/2d-camera-patterns.md#3-screen-shake) | [Local camera offset and roll](references/3d-screen-shake.md) |
| Room zones | [Area2D camera limits](references/2d-camera-zones.md) | [Area3D camera selection](references/3d-camera-zones.md) |
| Split screen | [Shared World2D](references/2d-split-screen.md) | [Shared World3D](references/3d-split-screen.md) |

Camera2D limits/zoom operate in canvas space. Camera3D uses perspective/orthographic projection and has no Camera2D room-limit API. First-person look and SpringArm collision are 3D-specific; 2D follow and room limits fulfill the corresponding framing role.

## 2. Camera Zones / Rooms

For room-based games (metroidvanias, top-down dungeons): an `Area2D` per room with a script that, on `body_entered`, tweens the active `Camera2D`'s `limit_left` / `limit_right` / `limit_top` / `limit_bottom` to the room's bounds. Smooth transitions when the player crosses room boundaries.

> See [references/2d-camera-zones.md](references/2d-camera-zones.md) for the full GDScript + C# CameraZone implementation.

---

## 3. Camera3D Patterns

Three canonical 3D camera setups: **third-person follow** with `SpringArm3D` (handles wall collision), **orbit camera** with mouse-drag rotation, **first-person** with mouse-look-from-camera.

> See [references/3d-camera-patterns.md](references/3d-camera-patterns.md) for full GDScript and C# implementations of each pattern.

---

## 4. Camera Transitions

Async camera transitions via `Tween` + `await ToSignal`. The pattern: tween the active camera toward the destination, then call `make_current()` on the destination. Works for both 2D and 3D.

> See [references/common-transitions.md](references/common-transitions.md) for the full `CameraTransitionManager` implementation (2D and 3D).

---

## 5. Split Screen (Local Multiplayer)

Render multiple cameras to separate `SubViewport`s, then arrange `SubViewportContainer`s in a layout (`HBoxContainer`, `VBoxContainer`, or `GridContainer`). Each player's camera is set as `current` for its viewport.

> See [references/common-split-screen.md](references/common-split-screen.md) for the SubViewport scene-tree setup and a 2-player split-screen example.

---

## 6. Implementation Checklist

- [ ] `Camera2D` limits match level/tilemap bounds so no out-of-world edges are visible
- [ ] Smooth follow uses `_process` (visual interpolation), not `_physics_process`
- [ ] Screen shake returns to the rest pose: zero 2D offset/roll, or the saved 3D local transform
- [ ] `add_trauma()` clamps to `1.0`; it does not exceed maximum shake
- [ ] Camera zone Area2D/Area3D collision masks detect the player layer
- [ ] `SpringArm3D` collision mask includes all environment layers for wall avoidance
- [ ] Camera transition awaits tween completion before calling `make_current()`
- [ ] Split screen containers expand with the layout and use `stretch` to resize their SubViewports
- [ ] Only one `SubViewport` has `audio_listener_enable_2d` or `audio_listener_enable_3d` set to `true`
