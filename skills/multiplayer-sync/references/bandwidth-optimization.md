# Bandwidth Optimization

Reference for `skills/multiplayer-sync/SKILL.md` — sync only changed properties, quantize floats, distance-based sync rate, reliable vs unreliable channel selection.

> ← Back to [SKILL.md](../SKILL.md)

---

## 7. Bandwidth Optimization

## 7. Bandwidth Optimization

### Sync Only Changed Properties

Configure change-driven properties as `SceneReplicationConfig.REPLICATION_MODE_ON_CHANGE`; `delta_interval` controls how often changes are sent. `replication_interval` separately controls properties in `REPLICATION_MODE_ALWAYS`. Setting both intervals does not turn ON_CHANGE properties into periodic full-state heartbeats.

```gdscript
func _ready() -> void:
    var sync := $MultiplayerSynchronizer
    sync.replication_interval = 1.0   # ALWAYS properties every 1 s
    sync.delta_interval        = 0.05  # ON_CHANGE properties checked every 50 ms
```

```csharp
public override void _Ready()
{
    var sync = GetNode<MultiplayerSynchronizer>("MultiplayerSynchronizer");
    sync.ReplicationInterval = 1.0;  // ALWAYS properties every 1 s
    sync.DeltaInterval       = 0.05; // ON_CHANGE properties checked every 50 ms
}
```

### Quantize Floats

Reduce float precision before sending. A signed 16-bit integer at 1 cm precision covers approximately ±327 m; choose precision and range for your world. These helpers return an ordinary integer constrained to that range. An integer passed directly to an RPC is not automatically encoded in 16 bits: the bandwidth saving requires explicitly packing each quantized component into two bytes and unpacking it on receipt.

```gdscript
# Quantize to a signed 16-bit range (1 cm precision, approximately ±327 m).
func quantize(value: float) -> int:
    return clampi(int(value * 100.0), -32768, 32767)

func dequantize(value: int) -> float:
    return float(value) / 100.0
```

```csharp
// Quantize to a signed 16-bit range (1 cm precision, approximately +/-327 m).
public static int Quantize(float value)
{
    return Mathf.Clamp((int)(value * 100.0f), -32768, 32767);
}

public static float Dequantize(int value)
{
    return value / 100.0f;
}
```

### Distance-Based Sync Rate

Reduce the sync rate for objects far from the local player to save bandwidth.

```gdscript
# distance_sync_manager.gd — call from a timer or _physics_process
func update_sync_intervals(local_player: Node2D) -> void:
    for sync_node in get_tree().get_nodes_in_group("synced_objects"):
        var obj := sync_node.get_parent() as Node2D
        if obj == null:
            continue
        var dist: float = local_player.global_position.distance_to(obj.global_position)
        var multiplayer_sync := sync_node as MultiplayerSynchronizer
        if dist < 200.0:
            multiplayer_sync.replication_interval = 0.05   # 20 Hz — nearby
        elif dist < 600.0:
            multiplayer_sync.replication_interval = 0.1    # 10 Hz — medium
        else:
            multiplayer_sync.replication_interval = 0.5    # 2 Hz  — distant
```

```csharp
// DistanceSyncManager.cs — call from a timer or _PhysicsProcess
public void UpdateSyncIntervals(Node2D localPlayer)
{
    foreach (Node syncNode in GetTree().GetNodesInGroup("synced_objects"))
    {
        if (syncNode.GetParent() is not Node2D obj)
            continue;
        float dist = localPlayer.GlobalPosition.DistanceTo(obj.GlobalPosition);
        var multiplayerSync = (MultiplayerSynchronizer)syncNode;
        if (dist < 200.0f)
            multiplayerSync.ReplicationInterval = 0.05;  // 20 Hz — nearby
        else if (dist < 600.0f)
            multiplayerSync.ReplicationInterval = 0.1;   // 10 Hz — medium
        else
            multiplayerSync.ReplicationInterval = 0.5;   // 2 Hz  — distant
    }
}
```

### Reliable vs Unreliable Channels

| Data Type | Channel | Why |
|---|---|---|
| Position, velocity | `unreliable` | Timeliness matters; a dropped packet will be superseded by the next one |
| Health, score, kills | `reliable` | Must arrive and in order; gaps cause incorrect state |
| Spawn / despawn events | `reliable` | One-time events that must not be missed |
| Chat messages | `reliable` | Ordering and delivery matter to the user |

In Godot, set the channel per `@rpc` annotation:

```gdscript
@rpc("any_peer", "call_remote", "unreliable")
func update_position(pos: Vector2) -> void:
    synced_position = pos

@rpc("any_peer", "call_remote", "reliable")
func take_damage(amount: int) -> void:
    synced_health -= amount
```

```csharp
[Rpc(MultiplayerApi.RpcMode.AnyPeer, CallLocal = false, TransferMode = MultiplayerPeer.TransferModeEnum.Unreliable)]
private void UpdatePosition(Vector2 pos)
{
    SyncedPosition = pos;
}

[Rpc(MultiplayerApi.RpcMode.AnyPeer, CallLocal = false, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
private void TakeDamage(int amount)
{
    SyncedHealth -= amount;
}
```

---
