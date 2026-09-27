---
name: multiplayer-sync
description: Use when synchronizing multiplayer state — MultiplayerSynchronizer, interpolation, prediction, and lag compensation
---

# Multiplayer Synchronization in Godot 4.3+ (Common)

**Dimension routing:** Replication configuration and bandwidth formats are common. The paired references below separate movement, interpolation, prediction, visibility, and lag compensation into 2D and 3D.

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **multiplayer-basics** for ENet setup, RPCs, and authority model, **dedicated-server** for headless export and deployment, **physics-system** for physics interpolation and RigidBody synchronization.

---

## 1. MultiplayerSynchronizer

`MultiplayerSynchronizer` is Godot's built-in node for replicating properties across the network. Add it as a child of the node whose state you want to share.

### What It Does

- Sends property values from the **authority** peer to all others at a configured interval
- Supports both **delta sync** (changed ON_CHANGE properties) and **full sync** (ALWAYS properties at the configured interval)
- Allows **visibility filters** to control which peers receive updates

### Replication Config in the Editor

1. Select the `MultiplayerSynchronizer` node in the scene tree.
2. In the Inspector, open **Replication** and click **Add Property**.
3. Pick the parent node path and property name (e.g. `position`, `velocity`).
4. Choose **Always**, **On Change**, or **Never** for each property's replication mode. The separate **Spawn** checkbox controls whether its initial value is included when spawning; it can be enabled alongside ongoing synchronization.
5. Set the **Replication Interval** (seconds). `0` means every network process frame.

### Key Properties

| Property | Description |
|---|---|
| `replication_interval` | Seconds between full sync updates. `0` = every network process frame |
| `delta_interval` | Seconds between delta sync updates. `0` = every network process frame for ON_CHANGE properties |
| `public_visibility` | When `true`, updates go to all peers (default) |
| `visibility_update_mode` | When registered visibility filters are reevaluated (idle, physics, or manual) |

Register/remove filter Callables with `add_visibility_filter()` / `remove_visibility_filter()`. Use `update_visibility()` when updates are manual; there is no public `visibility_filters` array property.

### Delta vs Full Sync

| Mode | How It Works | Best For |
|---|---|---|
| **Full sync** | Sends properties configured as `REPLICATION_MODE_ALWAYS` every `replication_interval` | Simple objects, low property count |
| **Delta sync** | Sends changed properties configured as `REPLICATION_MODE_ON_CHANGE`, every `delta_interval` | Objects with many properties that change infrequently |

Choose a replication mode per property in `SceneReplicationConfig`. The two intervals govern different property sets; setting both does not send an ON_CHANGE property again as a periodic full-state heartbeat. A zero interval does not disable ongoing replication; use `REPLICATION_MODE_NEVER` for that property. Its separate spawn flag still controls transmission during spawning.

### Visibility and Spatial Interest

Use [2D interest management](references/2d-interest-management.md) or [3D interest management](references/3d-interest-management.md). Registering a filter is common, but player types, positions, and distance thresholds depend on world dimension.

---

## 2. Property Synchronization

### What to Sync

Sync the minimal state needed to reconstruct the visual on remote peers. Typical properties:

| Property | Type | Notes |
|---|---|---|
| `position` | `Vector2` / `Vector3` | Core transform — sync every frame or use interpolation |
| `velocity` | `Vector2` / `Vector3` | Helps remote prediction stay ahead of position snaps |
| `health` | `int` / `float` | Sync reliably on change; delta sync is ideal |
| `animation_state` | `String` / `int` | Sync on change; use an enum int to save bandwidth |
| `is_crouching` | `bool` | Low-change boolean; delta sync or RPC on change |

Choose the complete [2D synchronized player](references/2d-synced-player.md) or [3D synchronized player](references/3d-synced-player.md) publisher, then pair it with the matching interpolation display.

---

## 3. Interpolation

`MultiplayerSynchronizer` updates target properties at sync intervals (e.g., 30 Hz), but rendering runs at frame rate (60+ Hz). Without interpolation, remote players appear to teleport between snapshots. The fix: store position snapshots with timestamps and lerp in `_process` toward the latest snapshot using a small offset (interpolation buffer ~100 ms).

> See [2D interpolation](references/2d-interpolation.md) or [3D interpolation](references/3d-interpolation.md) for the full GDScript and C# interpolation buffer pattern (bounded timestamped snapshots, delayed render-time lerp).

---

## 4. Client-Side Prediction

For local-player responsiveness: predict movement immediately on client, send input to server, reconcile when server snapshot arrives. On each new authoritative acknowledgement, restore the acknowledged state and replay pending input; smooth a separate visual offset if needed.

> See [2D prediction](references/2d-client-prediction.md) or [3D prediction](references/3d-client-prediction.md) for the bounded predict-and-reconcile core (fixed-step movement, authoritative acknowledgement, replay) in GDScript + C#.

---

## 5. Lag Compensation

For hit-scan weapons in fast-paced games: when the server validates a hit, it rewinds the world state to the client's view-time (`now - client_rtt/2 - interp_delay`) and tests the hit against that historical state.

> See [2D lag compensation](references/2d-lag-compensation.md) or [3D lag compensation](references/3d-lag-compensation.md) for the snapshot-history pattern, view-time calculation, and a hit-scan validator in GDScript + C#.

---

## 6. State vs Input Synchronization

Choose the synchronization model that fits your game's needs:

| Factor | Sync State | Sync Inputs |
|---|---|---|
| **What is sent** | Current property values (position, health, etc.) | Player input actions each frame |
| **Who simulates** | Authority only; others receive results | All peers run the same simulation |
| **Determinism required** | No | Yes — every peer must produce identical output from the same inputs |
| **Bandwidth** | Higher — full state sent each interval | Lower — small input structs per frame |
| **Responsiveness** | Lower — non-authority peers wait for next sync tick | Higher — local prediction is trivial when deterministic |
| **Complexity** | Lower — no reconciliation loop | Higher — requires deterministic physics, fixed-point math, or lockstep |
| **Best for** | Action games, shooters, most real-time games | Fighting games, RTS, turn-based, simulation games |
| **Lag compensation needed** | Yes, for hit detection | Usually not — all peers are in sync |

**Hybrid approach** (most real-time games): sync inputs for the local player's character (enabling prediction), sync state for all other objects and game events.

---

## 7. Bandwidth Optimization

Four levers: **sync only changed properties** (replication-config mode per property), **quantize and pack floats** (use a bounded integer range and an explicit compact wire format), **distance-based sync rate** (far-away objects sync at 5 Hz, close at 30 Hz), and **channel selection** (reliable for state changes that must arrive, unreliable for position streams that get superseded).

> See [references/common-bandwidth-optimization.md](references/common-bandwidth-optimization.md) for common quantization/configuration recipes and the reliable-vs-unreliable decision table, with links to paired spatial interest recipes.

---

## 8. Implementation Checklist

- [ ] `MultiplayerSynchronizer` is a direct child of the node it replicates
- [ ] Only the **authority** peer writes to synced properties; others are read-only
- [ ] `set_multiplayer_authority()` is called consistently on every peer during custom spawn initialization
- [ ] `replication_interval` and `delta_interval` are tuned for the object's update rate
- [ ] Remote player visuals use interpolation in `_process`, not `_physics_process`
- [ ] Network interpolation stores timestamped snapshots and blends against a delayed network render time, independent of the physics-tick fraction
- [ ] Client-side prediction is applied only to the local player's own character
- [ ] Pending input buffer is bounded (max ~128 ticks) to prevent memory growth
- [ ] Reconciliation restores simulation state; visual correction smoothing is separate
- [ ] Position and velocity use `unreliable` RPC; state changes use `reliable`
- [ ] Float quantization is applied before sending position data over the network
- [ ] Lag compensation snapshot history is pruned each tick to a bounded window
- [ ] Server validates all hit detection; clients never self-report kills
- [ ] Distance-based sync rate reduces bandwidth for far-away objects
