# Behavior Tree Actor (2D)

> ← Back to [SKILL.md](../SKILL.md)

Uses the types from [shared behavior trees](common-behavior-trees.md). Direct steering assumes an unobstructed XY plane.

### Wiring a BT in an Enemy

```gdscript
extends CharacterBody2D

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
	_bt_root.tick(self, delta)
	move_and_slide()


func _can_see_player(_actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	if not is_instance_valid(player):
		return BTNode.Status.FAILURE
	return BTNode.Status.SUCCESS if global_position.distance_to(player.global_position) < 300.0 \
		else BTNode.Status.FAILURE


func _chase_player(actor: Node, _delta: float) -> BTNode.Status:
	var player := get_tree().get_first_node_in_group("player")
	velocity = (player.global_position - global_position).normalized() * 120.0
	return BTNode.Status.RUNNING


func _patrol(_actor: Node, _delta: float) -> BTNode.Status:
	# minimal inline patrol; replace with full patrol logic
	velocity = Vector2.RIGHT * 60.0
	return BTNode.Status.RUNNING
```

### C#

```csharp
using Godot;

public partial class BTEnemy : CharacterBody2D
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
        _btRoot.Tick(this, (float)delta);
        MoveAndSlide();
    }

    private BTNode.Status CanSeePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        if (!IsInstanceValid(player)) return BTNode.Status.Failure;
        return GlobalPosition.DistanceTo(player.GlobalPosition) < 300f
            ? BTNode.Status.Success
            : BTNode.Status.Failure;
    }

    private BTNode.Status ChasePlayer(Node actor, float delta)
    {
        var player = GetTree().GetFirstNodeInGroup("player") as Node2D;
        Velocity = (player.GlobalPosition - GlobalPosition).Normalized() * 120f;
        return BTNode.Status.Running;
    }

    private BTNode.Status Patrol(Node actor, float delta)
    {
        // Minimal inline patrol; replace with full patrol logic
        Velocity = Vector2.Right * 60f;
        return BTNode.Status.Running;
    }
}
```
