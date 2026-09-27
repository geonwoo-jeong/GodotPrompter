# Synchronized Player State (2D)

> [Common synchronization concepts](../SKILL.md) · [3D counterpart](3d-synced-player.md)

Attach this state publisher to a `CharacterBody2D` moved by your own controller. Add a child `MultiplayerSynchronizer` with `root_path = ".."`, and configure `synced_position` and `synced_velocity` as ALWAYS plus health/animation as ON_CHANGE. In C#, select the corresponding PascalCase property names in the Inspector. The separate remote display in [2D interpolation](2d-interpolation.md) consumes position snapshots. These scripts publish state; they do not implement movement.

### Synced Player (GDScript)

```gdscript
# synced_player.gd
extends CharacterBody2D

## Sync interval in seconds — exposed so designers can tune per object type.
@export var sync_interval: float = 0.05  # 20 Hz

# These properties are listed in the MultiplayerSynchronizer replication config.
var synced_position: Vector2 = Vector2.ZERO
var synced_velocity: Vector2 = Vector2.ZERO
var synced_health: int = 100
var synced_anim: int = 0  # 0 = idle, 1 = run, 2 = jump

func _ready() -> void:
    var sync: MultiplayerSynchronizer = $MultiplayerSynchronizer
    sync.replication_interval = sync_interval
    # Only the authority (owner) drives movement.
    set_physics_process(is_multiplayer_authority())


func _physics_process(_delta: float) -> void:
    # Authority: write canonical state so MultiplayerSynchronizer can replicate it.
    synced_position = global_position
    synced_velocity = velocity
    synced_anim     = _compute_anim_state()


func _compute_anim_state() -> int:
    if not is_on_floor():
        return 2
    return 1 if velocity.length() > 1.0 else 0
```

### Synced Player (C#)

```csharp
// SyncedPlayer.cs
using Godot;

public partial class SyncedPlayer : CharacterBody2D
{
    /// <summary>Sync interval in seconds. Exposed so designers can tune per object type.</summary>
    [Export] public float SyncInterval { get; set; } = 0.05f; // 20 Hz

    // These properties are listed in the MultiplayerSynchronizer replication config.
    public Vector2 SyncedPosition { get; set; } = Vector2.Zero;
    public Vector2 SyncedVelocity { get; set; } = Vector2.Zero;
    public int SyncedHealth { get; set; } = 100;
    public int SyncedAnim   { get; set; } = 0; // 0=idle, 1=run, 2=jump

    public override void _Ready()
    {
        var sync = GetNode<MultiplayerSynchronizer>("MultiplayerSynchronizer");
        sync.ReplicationInterval = SyncInterval;
        SetPhysicsProcess(IsMultiplayerAuthority());
    }

    public override void _PhysicsProcess(double delta)
    {
        // Authority: write canonical state for replication.
        SyncedPosition = GlobalPosition;
        SyncedVelocity = Velocity;
        SyncedAnim     = ComputeAnimState();
    }

    private int ComputeAnimState()
    {
        if (!IsOnFloor()) return 2;
        return Velocity.Length() > 1f ? 1 : 0;
    }
}
```
