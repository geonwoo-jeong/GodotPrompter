---
name: phantom-camera
description: Use when using the Phantom Camera addon — PhantomCamera2D/3D with priority-based switching, follow and look-at modes, and tween transitions
---

# Phantom Camera (Common)

> **Dimension:** Common framework. [2D recipes](references/2d-camera-recipes.md) · [3D recipes](references/3d-camera-recipes.md).


> **Related skills:** **camera-system** for hand-rolled camera patterns, **tween-animation** for the easing concepts the transitions build on.

> **Addon:** Phantom Camera · version `v0.11.0.2` · Godot 4.4+ · MIT · source: https://github.com/ramokz/phantom-camera · nodes are GDScript, plus an official C# wrapper API (`namespace PhantomCamera`) shipped as source `.cs` files in the addon. **Pre-1.0:** minor versions may break API.

---

## 1. When to use Phantom Camera vs. `camera-system`

| Approach | Best for |
|---|---|
| Hand-rolled (`camera-system` skill) | One camera, simple follow/shake, no addon dependency |
| **Phantom Camera** | Multiple camera "shots" that need priority-based switching, dead-zone/group/path/third-person follow logic, and smooth resource-driven tweens between them — Cinemachine-style workflow |

Reach for Phantom Camera when a scene needs several distinct camera behaviors (gameplay follow, a
cutscene framing, a boss-fight group shot) that swap automatically based on priority, rather than one
script juggling every case. It replaces the `Camera2D`/`Camera3D` positioning logic itself — you still
keep exactly one real `Camera2D`/`Camera3D` per viewport; Phantom Camera nodes never render anything on
their own.

---

## 2. Install & setup

**Asset Library (recommended):** Godot AssetLib → search "Phantom Camera" → Download (select only the
`phantom_camera` directory) → **Project → Project Settings → Plugins** → enable it.

**GitHub zip:** extract `addons/phantom_camera/` into the project root, then enable the plugin the same
way.

Enabling the plugin auto-registers a `PhantomCameraManager` autoload singleton and **restarts the
editor every time `_enable_plugin()` runs** (not just the first time) — expected behavior, not a bug.
No manual autoload setup is needed. Six custom node types become available in the "Create New Node"
dialog: `PhantomCamera2D`, `PhantomCamera3D`, `PhantomCameraHost`, `PhantomCameraNoiseEmitter2D`,
`PhantomCameraNoiseEmitter3D`, and `PhantomCameraTweenDirector`.

**C# projects:** the addon ships its official wrapper as plain `.cs` source files under
`addons/phantom_camera/scripts/**` (`namespace PhantomCamera`) — no NuGet package to add. A
C#-enabled Godot project (one with its own generated `.csproj`, `Godot.NET.Sdk`) picks these up
automatically once the addon folder is present; `using PhantomCamera;` is then enough (§3–§7).

---

## 3. Host + camera model

Two node kinds work together:

- **`PhantomCameraHost`** — add it **as a child of your real `Camera2D`/`Camera3D`** (not the other way
  around). It reads the highest-priority `PhantomCamera2D`/`3D` in the scene and drives the real
  camera's transform every frame. Only the first `PhantomCameraHost` child of a given camera is used.
- **`PhantomCamera2D`** / **`PhantomCamera3D`** — placed anywhere else in the scene tree (siblings of
  the player, inside trigger areas, cutscene rigs). Any number can exist; each one describes a candidate
  "shot" via `priority`, a follow mode, and (3D only) a look-at mode. They render nothing themselves.

```text
Scene tree:
Camera2D (or Camera3D)
  └─ PhantomCameraHost
Player (CharacterBody2D)
  └─ PhantomCamera2D   (priority 0, follow_mode = SIMPLE, follow_target = Player)
BossArena
  └─ PhantomCamera2D   (priority 10, follow_mode = GROUP, follow_targets = [Player, Boss])
```

See [2D camera recipes](references/2d-camera-recipes.md) and [3D camera recipes](references/3d-camera-recipes.md).

`PhantomCameraHost.interpolation_mode` (C#: `InterpolationMode`, enum `Auto`/`Idle`/`Physics`/`Manual`)
controls when the Host updates the real camera:
`AUTO` (default — picks physics or idle based on the active PCam's target), `IDLE`, `PHYSICS`, or
`MANUAL` (call `host.process(delta)` yourself each tick).

`host_layers` (`@export_flags_2d_render` / `_3d_render`) on both the Host and each PCam gate which PCams
a given Host will consider — a PCam is only eligible if its `host_layers` bitmask overlaps the Host's.

---

## 4. Priority-based switching

Every `PhantomCamera2D`/`3D` has `priority: int = 0`. The `PhantomCameraHost` attached to the scene's
real camera always follows the highest-priority PCam that shares a `host_layers` bit with it. Change
`priority` at runtime with `set_priority(value)` / read with `get_priority()` — values are clamped to
`>= 0`.

See [2D camera recipes](references/2d-camera-recipes.md) and [3D camera recipes](references/3d-camera-recipes.md).

Useful events on each PCam wrapper: `BecameActive`, `BecameInactive`, `TweenStarted`, `IsTweening`
(every frame while transitioning), `TweenInterrupted` (a higher-priority PCam preempted this tween —
argument is the interrupting node), `TweenCompleted` — subscribe with `+=`, same names as the GDScript
signals in PascalCase.

`priority_override: bool` is an editor-only "force preview" toggle for quickly previewing a shot without
touching `priority`; it's disabled automatically in exported builds — don't use it for gameplay logic.

---

## 5. Follow modes

`FollowMode` enum (2D and 3D share the first six; 3D adds `THIRD_PERSON`):



| Mode | Behavior | Key properties |
|---|---|---|
| `GLUED` | Sticks exactly to `follow_target`. | `follow_target` |
| `SIMPLE` | Follows `follow_target` with an offset and optional damping. | `follow_offset`, `follow_damping`, `follow_damping_value` |
| `GROUP` | Follows the centroid of `follow_targets`, can auto-reframe. | `follow_targets: Array[Node2D/3D]` |
| `PATH` | Follows `follow_target` while confined to the closest point on `follow_path`. | `follow_path` (`Path2D`/`Path3D`) |
| `FRAMED` | Dead-zone follow — only moves once the target nears the frame edge. | `dead_zone_width`, `dead_zone_height`; emits `dead_zone_reached(side)` |
| `THIRD_PERSON` (3D) | Drives a `SpringArm3D` at the target, allowing orbit. | `follow_distance`, `collision_mask`, `shape`, `vertical_rotation_offset`, `horizontal_rotation_offset` |

See [2D camera recipes](references/2d-camera-recipes.md) and [3D camera recipes](references/3d-camera-recipes.md).

`GROUP` follows the same pattern: `_pCamNode.Set("follow_mode", (int)FollowMode2D.Group)`, then
`pCam.FollowTargets`, `pCam.AutoZoom`, `pCam.AutoZoomMin`/`AutoZoomMax` — identical PascalCase names.

`GROUP` auto-reframe uses `auto_zoom`/`auto_zoom_min`/`auto_zoom_max`/`auto_zoom_margin` in 2D (adjusts
`Camera2D.zoom`), and `auto_follow_distance`/`auto_follow_distance_min`/`auto_follow_distance_max` in 3D
(adjusts distance along local `-z`).

Shared follow options: `follow_axis_lock` (`FollowLockAxis` — 2D: `NONE, X, Y, XY`; 3D adds `Z, XZ, YZ,
XYZ`), `rotate_with_target: bool` (2D-only; requires `Camera2D.ignore_rotation = false`), `lookahead:
bool` + `lookahead_time`/`lookahead_acceleration`/`lookahead_deceleration` (velocity-based look-ahead;
2D also exposes a `lookahead_max`/`lookahead_max_value` velocity clamp that 3D does not).

Query state with `is_following() -> bool`; snap instantly (bypassing damping) with
`teleport_position()`.

---

## 6. Look-at modes (3D only)

`PhantomCamera2D` has no look-at system — only `rotate_with_target` (§5). `PhantomCamera3D` adds:



| Mode | Behavior |
|---|---|
| `MIMIC` | Copies the target's rotation directly. |
| `SIMPLE` | Looks straight at `look_at_target` (single `Node3D`). |
| `GROUP` | Looks at the centroid of `look_at_targets: Array[Node3D]`. |

See [3D camera recipes](references/3d-camera-recipes.md).

**Gotcha (from the addon's own runtime warning):** combining a non-`NONE` `follow_mode` with a
non-`NONE` `look_at_mode` on the same `PhantomCamera3D` prints "Using both Look At and Follow Mode on
the same PCam3D has not been fully tested yet, proceed with caution!" — treat that combination as
experimental and verify it manually before shipping.

---

## 7. Tweening between cameras

Each PCam owns a `tween_resource: PhantomCameraTween` (a `Resource` — share one `.tres` across several
PCams to reuse timing, or leave each with its own default instance):

`PhantomCameraTween` stores duration (default 1 second), transition (default LINEAR / C# Linear), and easing (default EASE_IN_OUT / C# EaseInOut). Configure those through the tween properties in the paired recipes.

These map 1:1 to Godot's built-in `Tween.TransitionType` / `Tween.EaseType` names (minus the
`TRANS_`/`EASE_` prefixes) — see `tween-animation` for what each curve looks like.

See [3D camera recipes](references/3d-camera-recipes.md).

`tween_on_load: bool = true` — if this PCam is already the highest-priority one when it's instantiated
at runtime, it tweens the camera into place on load; set `false` to cut instantly instead. If
`tween_resource` is `null`, `get_tween_duration()` returns `0.0` (instant cut).

---

## Implementation checklist

- [ ] Exactly one `PhantomCameraHost` per real `Camera2D`/`Camera3D`, added **as its child**
- [ ] Every `PhantomCamera2D`/`3D` shares a `host_layers` bit with the Host that should track it
- [ ] Priority changes use `set_priority()` or the `priority` property (both route through the setter, which notifies the Host)
- [ ] `follow_target` / `follow_targets` assigned before relying on `is_following()`
- [ ] `GROUP` follow mode uses `follow_targets` (array), not `follow_target` (single node)
- [ ] 3D `THIRD_PERSON` rotation setters (`set_third_person_rotation`/`_degrees`/`_quaternion`) guard on `follow_mode == THIRD_PERSON` and no-op with a printed error otherwise — `set_follow_distance`/`set_spring_length`/`set_collision_mask(_value)`/`set_shape` have **no** such guard and print nothing
- [ ] Combined `follow_mode` + `look_at_mode` on one `PhantomCamera3D` tested manually (addon marks this untested)
- [ ] `tween_resource` shared deliberately (same `.tres`) when multiple PCams should transition identically
- [ ] C# obtains wrappers via `AsPhantomCamera2D()`/`AsPhantomCamera3D()`/`AsPhantomCameraHost()`/`AsPhantomCameraTween()` — they are plain classes wrapping the node, **not** `Node` subclasses, so never `class MyCam : PhantomCamera2D`
- [ ] C# enum names: only `FollowMode`/`FollowLockAxis` are dimension-suffixed (`FollowMode2D`, `FollowLockAxis3D`); `LookAtMode`, `TransitionType`, `EaseType`, `InterpolationMode` are not
- [ ] `FollowMode`/`LookAtMode` are getter-only on the wrapper — set them via `.Set("follow_mode", (int)FollowMode2D.Simple)` on the underlying node
- [ ] Pin the addon version in `plugin.cfg`/version control — pre-1.0, minor bumps can break API
