# Client Authority Movement (3D)

> [Common multiplayer concepts](../SKILL.md) · [2D counterpart](2d-authority-movement.md)

This client-authoritative example is suitable for trusted/cooperative movement. Assign authority in the custom spawn callback on every peer. A competitive server must validate client input/state instead. Configure matching player node paths on all peers.

This 3D variant moves along the XZ plane at 5 m/s. It intentionally has no gravity; add a grounded controller from **player-controller** when the game needs one.

### GDScript

```gdscript
# player.gd
extends CharacterBody3D

func _physics_process(_delta: float) -> void:
	# Guard: authority-only input and movement.
	if not is_multiplayer_authority():
		return

	var direction := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
	velocity = Vector3(direction.x, 0.0, direction.y) * 5.0
	move_and_slide()

	sync_position.rpc(global_position)


@rpc("authority", "unreliable_ordered", "call_local", 1)
func sync_position(pos: Vector3) -> void:
	if not is_multiplayer_authority():
		global_position = pos


func print_authority_info() -> void:
	print("My peer ID : %d" % multiplayer.get_unique_id())
	print("Authority  : %d" % get_multiplayer_authority())
	print("Am I auth? : %s" % str(is_multiplayer_authority()))
```

### C#

```csharp
// NetworkPlayer3D.cs
using Godot;

public partial class NetworkPlayer3D : CharacterBody3D
{
    public override void _PhysicsProcess(double delta)
    {
        // Guard: authority-only input.
        if (!IsMultiplayerAuthority()) return;

        var direction = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Velocity = new Vector3(direction.X, 0f, direction.Y) * 5f;
        MoveAndSlide();

        Rpc(MethodName.SyncPosition, GlobalPosition);
    }

    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.UnreliableOrdered,
         TransferChannel = 1)]
    private void SyncPosition(Vector3 pos)
    {
        if (!IsMultiplayerAuthority())
            GlobalPosition = pos;
    }
}
```
