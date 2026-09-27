---
name: godot-optimization
description: Use when optimizing Godot games — profiler, draw calls, physics tuning, memory management, and common bottlenecks
---

# Godot Optimization (Common)

Profile representative gameplay before changing code. This skill targets Godot 4.3+ and separates common measurement/lifetime rules from dimension-specific rendering and placement.

> **Related skills:** **godot-debugging** for systematic profiling, **godot-code-review** for review, **physics-system** for collision recipes, **2d-essentials** and **3d-essentials** for rendering systems, **multithreading** for parallel work, **export-pipeline** for release builds, **mobile-development** for device budgets.

## 1. Measure the Bottleneck

At 60 FPS the frame budget is about 16.7 ms; at 120 FPS it is about 8.3 ms. Use Debugger → Profiler to inspect self time, total time, and call counts. Use Monitors for draw calls, memory, object count, and active physics bodies. Compare the same scenario before/after on target hardware; universal draw-call or object-count thresholds are not reliable.

```gdscript
func print_frame_metrics() -> void:
    print("FPS: ", Performance.get_monitor(Performance.TIME_FPS))
    print("Draw calls: ", Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME))
```

```csharp
public void PrintFrameMetrics()
{
    GD.Print("FPS: ", Performance.GetMonitor(Performance.Monitor.TimeFps));
    GD.Print("Draw calls: ", Performance.GetMonitor(Performance.Monitor.RenderTotalDrawCallsInFrame));
}
```

## 2. Choose the Rendering Path

| Topic | 2D | 3D |
|---|---|---|
| Rendering, culling, and MultiMesh | [2D recipes](references/2d-rendering.md) | [3D recipes](references/3d-rendering.md) |
| Pooled scene placement | [Node2D caller](references/2d-pool-placement.md) | [Node3D caller](references/3d-pool-placement.md) |

[Common rendering principles](references/common-draw-calls.md) cover measurement, sharing resources, and gameplay-aware culling. CanvasGroup compositing is a 2D feature; imported mesh LOD and visibility ranges are 3D features. Their costs and purposes differ.

## 3. Physics and CPU Work

[Common physics tuning](references/common-physics-tuning.md) covers masks, sleeping, shape complexity, and tick rate, with links to paired area/raycast examples. Lowering physics frequency also changes behavior; interpolation only improves rendered motion.

[Common CPU patterns](references/common-cpu-bottlenecks.md) cover cached lookups, StringName, typed collections, and resource loading. Cache only what can be kept correct as the scene changes. Vector2/Vector3 value construction does not justify introducing mutable global scratch state. Moving code from `_process` to `_physics_process` changes its timing and is not an automatic speedup.

## 4. Memory and Pooling

[Common memory management](references/common-memory-management.md) explains shared Resource lifetime and provides a dimension-independent detached-node pool. Its 2D and 3D callers configure spatial state before insertion. Reuse requires resetting velocities, timers, signals, and custom gameplay state; hiding a physics node does not remove its collider.

## 5. Implementation Checklist

- [ ] Profile the same representative scenario before and after changes.
- [ ] Confirm frame time and memory behavior on target hardware.
- [ ] Select rendering recipes for the project's dimension and renderer.
- [ ] Keep off-screen gameplay active when it affects the simulation.
- [ ] Test collision behavior after shape, mask, or tick-rate changes.
- [ ] Verify cached collections handle spawns, removals, and group membership changes.
- [ ] Pool only measured hot paths, and reset per-use state explicitly.
- [ ] Check memory/object counts across repeated scene transitions.
