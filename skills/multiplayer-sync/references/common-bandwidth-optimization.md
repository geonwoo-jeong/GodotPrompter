# Bandwidth Optimization (Common)

Reference for `skills/multiplayer-sync/SKILL.md` — sync only changed properties, quantize floats, distance-based sync rate, reliable vs unreliable channel selection.

> ← Back to [SKILL.md](../SKILL.md)

---

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

`replication_interval` is a single value for a synchronizer, not a per-recipient rate. Run rate selection on its authority and consider every relevant viewer. The nearest viewer recipe is in [2D interest management](2d-interest-management.md) and [3D interest management](3d-interest-management.md); visibility filters control which individual peers receive state.

### Reliable vs Unreliable Channels

| Data Type | Channel | Why |
|---|---|---|
| Position, velocity | `unreliable` | Timeliness matters; a dropped packet will be superseded by the next one |
| Health, score, kills | `reliable` | Must arrive and in order; gaps cause incorrect state |
| Spawn / despawn events | `reliable` | One-time events that must not be missed |
| Chat messages | `reliable` | Ordering and delivery matter to the user |

Select the transfer mode in `@rpc` / `[Rpc]`; `transfer_channel` is the independent stream number. The dimension-specific authority examples in **multiplayer-basics** show position RPCs. Common score replication can use:

```gdscript
@rpc("authority", "call_remote", "reliable")
func update_score(value: int) -> void:
    score = value
```

```csharp
[Rpc(MultiplayerApi.RpcMode.Authority, CallLocal = false,
     TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
private void UpdateScore(int value)
{
    Score = value;
}
```

Here `score` / `Score` is your existing integer state field. Keep authority on the server for server-owned game state.
