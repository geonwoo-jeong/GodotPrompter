# Spatial Leaves (3D)

This version is a flying agent: it moves in XYZ without gravity. Use ai-navigation for grounded path following. Distances are world units.

[Back to skill](../SKILL.md).

Requires Beehave v2.9.2. These leaves require a matching Node3D/CharacterBody3D actor. Configure the tree to tick in physics mode.

```gdscript
# IsInRangeCondition.gd
class_name IsInRangeCondition
extends ConditionLeaf

@export var detection_range: float = 5.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to your concrete type for 3D members.
    var body := actor as Node3D
    var target: Node3D = blackboard.get_value("target")
    if body == null or not is_instance_valid(target):
        return FAILURE
    var in_range := body.global_position.distance_to(target.global_position) <= detection_range
    return SUCCESS if in_range else FAILURE
```

```gdscript
# MoveToTargetAction.gd
class_name MoveToTargetAction
extends ActionLeaf

const ARRIVE_DIST := 0.2

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to CharacterBody3D for the movement API.
    var body := actor as CharacterBody3D
    if body == null:
        return FAILURE
    var target_pos: Vector3 = blackboard.get_value("target_pos", Vector3.ZERO)
    if body.global_position.distance_to(target_pos) <= ARRIVE_DIST:
        _clear(blackboard)
        return SUCCESS

    var dir := body.global_position.direction_to(target_pos)
    body.velocity = dir * blackboard.get_value("move_speed", 5.0)
    body.move_and_slide()
    blackboard.set_value("is_moving", true)
    return RUNNING

func interrupt(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)
    var body := actor as CharacterBody3D
    if body != null:
        body.velocity = Vector3.ZERO

func after_run(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)

func _clear(blackboard: Blackboard) -> void:
    blackboard.erase_value("is_moving")
```
