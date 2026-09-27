# Spatial Interest Management (2D)

> [Common synchronization concepts](../SKILL.md) · [3D counterpart](3d-interest-management.md) · [Common bandwidth formats](common-bandwidth-optimization.md)

Attach this script to the replicated Node2D with a child `MultiplayerSynchronizer`. Each player is registered in exactly one `player_<peer_id>` group. Distances use pixels. The synchronizer's authority evaluates visibility and selects one shared replication interval based on the nearest connected viewer. Changing that interval does **not** create a different rate for each recipient.

```gdscript
# interest_2d.gd
extends Node2D

@export var visibility_distance: float = 1000.0
@export var near_distance: float = 200.0
@export var medium_distance: float = 600.0
@onready var _sync: MultiplayerSynchronizer = $MultiplayerSynchronizer

func _ready() -> void:
    set_physics_process(is_multiplayer_authority())
    if is_multiplayer_authority():
        _sync.visibility_update_mode = MultiplayerSynchronizer.VISIBILITY_PROCESS_PHYSICS
        _sync.add_visibility_filter(_is_peer_in_range)

func _is_peer_in_range(peer_id: int) -> bool:
    var player: Node2D = get_tree().get_first_node_in_group("player_%d" % peer_id)
    return player != null and global_position.distance_to(player.global_position) <= visibility_distance

func _physics_process(_delta: float) -> void:
    var nearest := INF
    for peer_id in multiplayer.get_peers():
        var player: Node2D = get_tree().get_first_node_in_group("player_%d" % peer_id)
        if player != null:
            nearest = minf(nearest, global_position.distance_to(player.global_position))
    _sync.replication_interval = 0.05 if nearest < near_distance else (0.1 if nearest < medium_distance else 0.5)
```

```csharp
// Interest2D.cs
using Godot;

public partial class Interest2D : Node2D
{
    [Export] public float VisibilityDistance { get; set; } = 1000.0f;
    [Export] public float NearDistance { get; set; } = 200.0f;
    [Export] public float MediumDistance { get; set; } = 600.0f;
    private MultiplayerSynchronizer _sync = null!;

    public override void _Ready()
    {
        _sync = GetNode<MultiplayerSynchronizer>("MultiplayerSynchronizer");
        SetPhysicsProcess(IsMultiplayerAuthority());
        if (IsMultiplayerAuthority())
        {
            _sync.VisibilityUpdateMode = MultiplayerSynchronizer.VisibilityUpdateModeEnum.Physics;
            _sync.AddVisibilityFilter(Callable.From<int, bool>(IsPeerInRange));
        }
    }

    private bool IsPeerInRange(int peerId)
    {
        var player = (Node2D)GetTree().GetFirstNodeInGroup($"player_{peerId}");
        return player != null && GlobalPosition.DistanceTo(player.GlobalPosition) <= VisibilityDistance;
    }

    public override void _PhysicsProcess(double delta)
    {
        float nearest = float.PositiveInfinity;
        foreach (int peerId in Multiplayer.GetPeers())
        {
            var player = (Node2D)GetTree().GetFirstNodeInGroup($"player_{peerId}");
            if (player != null)
                nearest = Mathf.Min(nearest, GlobalPosition.DistanceTo(player.GlobalPosition));
        }
        _sync.ReplicationInterval = nearest < NearDistance ? 0.05 : nearest < MediumDistance ? 0.1 : 0.5;
    }
}
```

Keep authority stable after `_ready` or rerun the authority setup when transferring it. This example assumes the server owns the object. With spawner-managed objects, visibility may control spawn/despawn too; configure `root_path` and the spawn parent consistently before filtering. For many objects, update interest on a timer or spatial index instead of scanning every peer on every physics tick.
