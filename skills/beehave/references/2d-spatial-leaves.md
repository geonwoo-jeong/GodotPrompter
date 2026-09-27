# Spatial Leaves (2D)

[Back to skill](../SKILL.md).

Requires Beehave v2.9.2. These leaves require a matching Node2D/CharacterBody2D actor. Configure the tree to tick in physics mode.

```gdscript
# IsInRangeCondition.gd
class_name IsInRangeCondition
extends ConditionLeaf

@export var detection_range: float = 150.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to your concrete type for 2D members.
    var body := actor as Node2D
    var target: Node2D = blackboard.get_value("target")
    if body == null or not is_instance_valid(target):
        return FAILURE
    var in_range := body.global_position.distance_to(target.global_position) <= detection_range
    return SUCCESS if in_range else FAILURE
```

```gdscript
# MoveToTargetAction.gd
class_name MoveToTargetAction
extends ActionLeaf

const ARRIVE_DIST := 8.0

func tick(actor: Node, blackboard: Blackboard) -> int:
    # Beehave types `actor` as Node; cast to CharacterBody2D for the movement API.
    var body := actor as CharacterBody2D
    if body == null:
        return FAILURE
    var target_pos: Vector2 = blackboard.get_value("target_pos", Vector2.ZERO)
    if body.global_position.distance_to(target_pos) <= ARRIVE_DIST:
        _clear(blackboard)
        return SUCCESS

    var dir := body.global_position.direction_to(target_pos)
    body.velocity = dir * blackboard.get_value("move_speed", 150.0)
    body.move_and_slide()
    blackboard.set_value("is_moving", true)
    return RUNNING

func interrupt(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)
    var body := actor as CharacterBody2D
    if body != null:
        body.velocity = Vector2.ZERO

func after_run(actor: Node, blackboard: Blackboard) -> void:
    _clear(blackboard)

func _clear(blackboard: Blackboard) -> void:
    blackboard.erase_value("is_moving")
```
