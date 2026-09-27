# Spatial Tasks (3D)

[Back to skill](../SKILL.md). Requires the LimboAI version/build described there; C# requires the module build. Agent must be CharacterBody3D. This is direct flying movement in XYZ, without gravity or navigation around obstacles; use ai-navigation for grounded motion.

### GDScript

```gdscript
@tool
extends BTAction
## Moves the agent toward a blackboard position each tick.

@export var target_pos_var: StringName = &"target_pos"
@export var speed: float = 5.0

func _generate_name() -> String:
    return "MoveToward %s" % LimboUtility.decorate_var(target_pos_var)

func _setup() -> void:
    pass  # one-time init; agent and blackboard are available here

func _enter() -> void:
    pass  # called when task transitions from non-RUNNING → RUNNING

func _tick(delta: float) -> Status:
    var target: Vector3 = blackboard.get_var(target_pos_var, Vector3.ZERO)
    if agent.global_position.distance_to(target) < 0.2:
        return SUCCESS
    agent.velocity = agent.global_position.direction_to(target) * speed
    agent.move_and_slide()
    return RUNNING

func _exit() -> void:
    pass  # cleanup after SUCCESS or FAILURE
```

```gdscript
@tool
extends BTCondition
## Returns SUCCESS if the agent is within range of a target node.

@export var target_var: StringName = &"target"
@export var distance_max: float = 4.0

var _max_sq: float

func _setup() -> void:
    _max_sq = distance_max * distance_max

func _tick(_delta: float) -> Status:
    var target: Node3D = blackboard.get_var(target_var, null)
    if not is_instance_valid(target):
        return FAILURE
    var in_range := agent.global_position.distance_squared_to(
        target.global_position) <= _max_sq
    return SUCCESS if in_range else FAILURE
```

### C#

```csharp
// MoveTowardTask.cs — place in res://ai/tasks/
using Godot;

[Tool]
public partial class MoveTowardTask : BTAction
{
    [Export] public StringName TargetPosVar { get; set; } = "target_pos";
    [Export] public float Speed { get; set; } = 5f;

    public override string _GenerateName() =>
        $"MoveToward {LimboUtility.DecorateVar(TargetPosVar)}";

    public override void _Setup() { }

    public override void _Enter() { }

    public override Status _Tick(double delta)
    {
        var target = (Vector3)Blackboard.GetVar(TargetPosVar, Vector3.Zero);
        var body = (CharacterBody3D)Agent;
        if (body.GlobalPosition.DistanceTo(target) < 0.2f)
            return Status.Success;
        body.Velocity = body.GlobalPosition.DirectionTo(target) * Speed;
        body.MoveAndSlide();
        return Status.Running;
    }

    public override void _Exit() { }
}
```

```csharp
// InRangeCondition.cs
using Godot;

[Tool]
public partial class InRangeCondition : BTCondition
{
    [Export] public StringName TargetVar { get; set; } = "target";
    [Export] public float DistanceMax { get; set; } = 4f;

    private float _maxSq;

    public override void _Setup() => _maxSq = DistanceMax * DistanceMax;

    public override Status _Tick(double delta)
    {
        var target = Blackboard.GetVar(TargetVar, default(Variant)).As<Node3D>();
        if (!GodotObject.IsInstanceValid(target))
            return Status.Failure;
        var agent3D = (Node3D)Agent;
        bool inRange = agent3D.GlobalPosition.DistanceSquaredTo(
            target.GlobalPosition) <= _maxSq;
        return inRange ? Status.Success : Status.Failure;
    }
}
```

