# Input Buffering (Common)

> ← Back to [SKILL.md](../SKILL.md)

Buffer the action separately from the body that consumes it. This Node works for either dimension: it stores a short-lived press, and the controller consumes it only when its own condition permits a jump, dash or attack. Set `action` in the Inspector. The controller should apply its own positive/negative jump velocity; the buffer does not know a coordinate system.

```gdscript
class_name ActionBuffer
extends Node

@export var action: StringName = &"jump"
@export var duration: float = 0.1
var _remaining: float = 0.0

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed(action):
        _remaining = duration

func _physics_process(delta: float) -> void:
    _remaining = maxf(0.0, _remaining - delta)

func consume_if(allowed: bool) -> bool:
    if not allowed or _remaining <= 0.0:
        return false
    _remaining = 0.0
    return true
```

```csharp
using Godot;

public partial class ActionBuffer : Node
{
    [Export] public StringName Action { get; set; } = "jump";
    [Export] public float Duration { get; set; } = 0.1f;
    private float _remaining;

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event.IsActionPressed(Action)) _remaining = Duration;
    }

    public override void _PhysicsProcess(double delta)
        => _remaining = Mathf.Max(0f, _remaining - (float)delta);

    public bool ConsumeIf(bool allowed)
    {
        if (!allowed || _remaining <= 0f) return false;
        _remaining = 0f;
        return true;
    }
}
```

For example, a character calls `buffer.consume_if(is_on_floor())` / `buffer.ConsumeIf(IsOnFloor())` in its physics loop and sets vertical velocity when true. If the buffer receives physics updates before the character, consumption sees that tick's elapsed time; choose processing order consistently if exact boundary timing matters. Complete inline buffered controllers are available in [2D](../../player-controller/references/2d-controllers.md) and [3D](../../player-controller/references/3d-controllers.md).
