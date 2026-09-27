# Interpolation (2D)

Reference for `skills/multiplayer-sync/SKILL.md` — visual interpolation between timestamped network snapshots in `_process`. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md) · [3D counterpart](3d-interpolation.md)

Use the [2D synchronized player](2d-synced-player.md) alongside this display.

---
## 3. Interpolation

Network snapshots arrive at their own rate (for example 20 Hz), independently of the 60 Hz physics clock. Render slightly behind the received stream, retaining snapshots on each side of that render time. The bounded buffer below timestamps arrivals with the local monotonic clock; it is a simple starting point, not a clock-synchronized server-time protocol.

### Why `_process`, Not `_physics_process`

- Visual interpolation belongs in `_process`; it does not change the authoritative physics body.
- Do not use `Engine.get_physics_interpolation_fraction()` between network snapshots: it resets each physics tick even when no new network snapshot has arrived.
- `synchronized` belongs to the child `MultiplayerSynchronizer`, not the parent `SyncedPlayer`. The parent holds the received properties.
- Configure `synced_position` as `REPLICATION_MODE_ALWAYS`. If your snapshots instead use ON_CHANGE, connect `delta_synchronized` as appropriate.

### Interpolation (GDScript)

```gdscript
# remote_player_display.gd — separate visual sibling of SyncedPlayer; remote peers only
extends Node2D

@export_range(0.0, 0.5, 0.01) var interpolation_delay: float = 0.1
const MAX_SNAPSHOTS := 32
var _snapshots: Array[Dictionary] = []

@onready var _sync_source: Node = $"../SyncedPlayer"


func _ready() -> void:
    set_physics_process(false)
    global_position = _sync_source.synced_position
    _record_snapshot(_now_seconds(), global_position)
    var sync: MultiplayerSynchronizer = _sync_source.get_node("MultiplayerSynchronizer")
    sync.synchronized.connect(_on_synchronized)


func _now_seconds() -> float:
    return Time.get_ticks_usec() / 1_000_000.0


func _on_synchronized() -> void:
    _record_snapshot(_now_seconds(), _sync_source.synced_position)
    # Discrete values such as health should update directly, not be interpolated.


func _record_snapshot(time: float, pos: Vector2) -> void:
    if not _snapshots.is_empty() and time <= _snapshots[-1]["time"]:
        # Multiple notifications in the same clock instant replace the latest value.
        _snapshots[-1]["position"] = pos
        return
    _snapshots.append({"time": time, "position": pos})
    if _snapshots.size() > MAX_SNAPSHOTS:
        _snapshots.pop_front()


func _sample_position(render_time: float) -> Vector2:
    if _snapshots.is_empty():
        return global_position
    while _snapshots.size() > 2 and _snapshots[1]["time"] <= render_time:
        _snapshots.pop_front()
    if _snapshots.size() == 1 or render_time <= _snapshots[0]["time"]:
        return _snapshots[0]["position"]
    var a: Dictionary = _snapshots[0]
    var b: Dictionary = _snapshots[1]
    var span: float = b["time"] - a["time"]
    var weight: float = clampf((render_time - a["time"]) / span, 0.0, 1.0)
    var start: Vector2 = a["position"]
    return start.lerp(b["position"], weight)


func _process(_delta: float) -> void:
    global_position = _sample_position(_now_seconds() - interpolation_delay)
```

### Interpolation (C#)

```csharp
// RemotePlayerDisplay.cs — separate visual sibling of SyncedPlayer; remote peers only
using Godot;
using System;
using System.Collections.Generic;

public partial class RemotePlayerDisplay : Node2D
{
    [Export(PropertyHint.Range, "0,0.5,0.01")]
    public double InterpolationDelay { get; set; } = 0.1;
    private const int MaxSnapshots = 32;
    private readonly List<(double Time, Vector2 Position)> _snapshots = new();
    private SyncedPlayer _syncSource = null!;

    public override void _Ready()
    {
        SetPhysicsProcess(false);
        _syncSource = GetNode<SyncedPlayer>("../SyncedPlayer");
        var sync = _syncSource.GetNode<MultiplayerSynchronizer>("MultiplayerSynchronizer");
        GlobalPosition = _syncSource.SyncedPosition;
        RecordSnapshot(NowSeconds(), GlobalPosition);
        sync.Synchronized += OnSynchronized;
    }

    private static double NowSeconds() => Time.GetTicksUsec() / 1_000_000.0;

    private void OnSynchronized()
    {
        RecordSnapshot(NowSeconds(), _syncSource.SyncedPosition);
        // Discrete values such as health update directly.
    }

    private void RecordSnapshot(double time, Vector2 position)
    {
        if (_snapshots.Count > 0 && time <= _snapshots[^1].Time)
        {
            _snapshots[^1] = (_snapshots[^1].Time, position);
            return;
        }
        _snapshots.Add((time, position));
        if (_snapshots.Count > MaxSnapshots)
            _snapshots.RemoveAt(0);
    }

    private Vector2 SamplePosition(double renderTime)
    {
        if (_snapshots.Count == 0) return GlobalPosition;
        while (_snapshots.Count > 2 && _snapshots[1].Time <= renderTime)
            _snapshots.RemoveAt(0);
        if (_snapshots.Count == 1 || renderTime <= _snapshots[0].Time)
            return _snapshots[0].Position;
        var a = _snapshots[0];
        var b = _snapshots[1];
        float weight = (float)Math.Clamp((renderTime - a.Time) / (b.Time - a.Time), 0.0, 1.0);
        return a.Position.Lerp(b.Position, weight);
    }

    public override void _Process(double delta)
        => GlobalPosition = SamplePosition(NowSeconds() - InterpolationDelay);
}
```

If the buffer underruns, this example holds the newest position rather than extrapolating. Tune the delay to the update interval and observed jitter. For competitive games, add server tick/sequence numbers, clock synchronization, and stale-packet rejection; local arrival timestamps alone cannot remove network jitter. Test the display with a network update rate different from the physics rate, bursts, and packet gaps.

Godot API: [MultiplayerSynchronizer signals](https://docs.godotengine.org/en/4.7/classes/class_multiplayersynchronizer.html#signals), [physics interpolation fraction](https://docs.godotengine.org/en/4.7/classes/class_engine.html#class-engine-method-get-physics-interpolation-fraction).
