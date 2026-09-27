# Historical Hit Validation (2D)

> [Common synchronization concepts](../SKILL.md) · [3D counterpart](3d-lag-compensation.md)

This server-side history tests a finite ray against historical circle hit regions in 2D. It never moves live physics bodies. `record_snapshot` receives your authoritative server tick and registered target positions; `hits_target` receives a tick already translated to that server clock. The bounded history stores copied dictionaries so later position updates cannot mutate old snapshots.

## History and geometric query

```gdscript
# lag_history_2d.gd
extends RefCounted

var max_snapshots: int = 32
var hit_radius: float = 32.0
var _history: Dictionary = {}
var _latest_tick := -1

func record_snapshot(server_tick: int, positions: Dictionary) -> void:
    if server_tick <= _latest_tick:
        return
    _latest_tick = server_tick
    _history[server_tick] = positions.duplicate()
    while _history.size() > max_snapshots:
        _history.erase(_history.keys()[0])

func hits_target(target_id: int, origin: Vector2, direction: Vector2,
        max_distance: float, server_tick: int) -> bool:
    if max_distance <= 0.0 or direction.is_zero_approx() or not _history.has(server_tick):
        return false
    var snapshot: Dictionary = _history[server_tick]
    if not snapshot.has(target_id):
        return false
    var center: Vector2 = snapshot[target_id]
    var unit_direction := direction.normalized()
    var distance_along_ray := clampf((center - origin).dot(unit_direction), 0.0, max_distance)
    var closest := origin + unit_direction * distance_along_ray
    return closest.distance_squared_to(center) <= hit_radius * hit_radius
```

```csharp
// LagHistory2D.cs
using Godot;
using System.Collections.Generic;

public partial class LagHistory2D : RefCounted
{
    public int MaxSnapshots { get; set; } = 32;
    public float HitRadius { get; set; } = 32.0f;
    private readonly Dictionary<int, Dictionary<int, Vector2>> _history = new();
    private readonly Queue<int> _ticks = new();
    private int _latestTick = -1;

    public void RecordSnapshot(int serverTick, Dictionary<int, Vector2> positions)
    {
        if (serverTick <= _latestTick) return;
        _latestTick = serverTick;
        _history[serverTick] = new Dictionary<int, Vector2>(positions);
        _ticks.Enqueue(serverTick);
        while (_ticks.Count > MaxSnapshots)
            _history.Remove(_ticks.Dequeue());
    }

    public bool HitsTarget(int targetId, Vector2 origin, Vector2 direction,
        float maxDistance, int serverTick)
    {
        if (maxDistance <= 0f || direction.IsZeroApprox() ||
            !_history.TryGetValue(serverTick, out var snapshot) ||
            !snapshot.TryGetValue(targetId, out var center)) return false;
        var unitDirection = direction.Normalized();
        float distanceAlongRay = Mathf.Clamp((center - origin).Dot(unitDirection), 0f, maxDistance);
        var closest = origin + unitDirection * distanceAlongRay;
        return closest.DistanceSquaredTo(center) <= HitRadius * HitRadius;
    }
}
```

## Integrating with an authoritative game

- Set `max_snapshots` / `MaxSnapshots` to a positive count derived from the maximum rewind duration and server tick rate; set `hit_radius` / `HitRadius` to the target size in pixels.
- Record every shootable target, including a listen-server player, from your server's player registry. `get_peers()` alone excludes the server's own peer ID.
- Estimate view time from measured latency and interpolation delay on the server clock. Clamp the rewind window; do not interpret an arbitrary client-local tick as a server tick. This discrete example rejects missing ticks; interpolate adjacent records if sub-tick accuracy is needed.
- Validate the sender, shot frequency, weapon range, and finite aim data before this helper. Derive shot origin from authoritative shooter state. A geometric hit here is a candidate, not permission to trust a client-reported kill.
- Check world occlusion and choose the nearest intersected target before applying damage. For rotating or articulated hitboxes, store historical Transform2D/shape data; a position and radius cannot represent their orientation. This helper deliberately tests only a circle.
