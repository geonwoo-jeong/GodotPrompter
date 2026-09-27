# Behavior Tree Actor (3D)

> ← Back to [SKILL.md](../SKILL.md)

Uses the types from [shared behavior trees](common-behavior-trees.md). Direct steering assumes an unobstructed XZ plane.

### Wiring a BT in an Enemy

```gdscript
extends CharacterBody3D

var _bt_root: BTNode


func _ready() -> void:
	# "Chase player OR patrol" selector
	var chase_seq := BTSequence.new()
	chase_seq.children = [
		BTAction.new(_can_see_player),
		BTAction.new(_chase_player),
	]

	var patrol_act := BTAction.new(_patrol)

	var root := BTSelector.new()
	root.children = [chase_seq, patrol_act]
	_bt_root = root


func _physics_process(delta: float) -> void:
	var vertical_speed: float = velocity.y
	if not is_on_floor():
		vertical_speed -= ProjectSettings.get_setting("physics/3d/default_gravity") * delta
	_bt_root.tick(self, delta)
	velocity.y = vertical_speed
	move_and_slide()


func _can_see_player(_actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	if not is_instance_valid(player):
		return BTNode.Status.FAILURE
	return BTNode.Status.SUCCESS if global_position.distance_to(player.global_position) < 10.0 \
		else BTNode.Status.FAILURE


func _chase_player(actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	var offset: Vector3 = player.global_position - global_position
	offset.y = 0.0
	velocity = offset.normalized() * 4.0
	return BTNode.Status.RUNNING


func _patrol(_actor: Node, _delta: float) -> BTNode.Status:
	# minimal inline patrol; replace with full patrol logic
	velocity = Vector3.RIGHT * 2.0
	return BTNode.Status.RUNNING
```

### C#

```csharp
using Godot;

public partial class BTEnemy3D : CharacterBody3D
{
    private BTNode _btRoot;

    public override void _Ready()
    {
        var chaseSeq = new BTSequence
        {
            Children = { new BTAction(CanSeePlayer), new BTAction(ChasePlayer) }
        };
        var patrolAct = new BTAction(Patrol);
        _btRoot = new BTSelector { Children = { chaseSeq, patrolAct } };
    }

    public override void _PhysicsProcess(double delta)
    {
        float verticalSpeed = Velocity.Y;
        if (!IsOnFloor()) verticalSpeed -= ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle() * (float)delta;
        _btRoot.Tick(this, (float)delta);
        Vector3 velocity = Velocity;
        velocity.Y = verticalSpeed;
        Velocity = velocity;
        MoveAndSlide();
    }

    private BTNode.Status CanSeePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node3D;
        if (!IsInstanceValid(player)) return BTNode.Status.Failure;
        return GlobalPosition.DistanceTo(player.GlobalPosition) < 10f
            ? BTNode.Status.Success
            : BTNode.Status.Failure;
    }

    private BTNode.Status ChasePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node3D;
        Vector3 offset = player.GlobalPosition - GlobalPosition;
        offset.Y = 0f;
        Velocity = offset.Normalized() * 4f;
        return BTNode.Status.Running;
    }

    private BTNode.Status Patrol(Node actor, float delta)
    {
        // Minimal inline patrol; replace with full patrol logic
        Velocity = Vector3.Right * 2f;
        return BTNode.Status.Running;
    }
}
```
