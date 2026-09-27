# Character State Adapters (3D)

> ← Back to [SKILL.md](../SKILL.md)

Use the shared `State` and `StateMachine` classes. The scene owner must be a `CharacterBody3D`; this is a required scene contract, not an optional runtime type. The base adapter exposes that body with a typed property. Movement code remains in the body controller, which owns the one `move_and_slide()` call per tick.

## Typed State Base

```gdscript
class_name CharacterState3D
extends State

var body: CharacterBody3D:
    get:
        return entity
```

```csharp
using Godot;

public partial class CharacterState3D : State
{
    public CharacterBody3D Body => (CharacterBody3D)Entity;
}
```

## Idle State

The `AnimationPlayer` child and `Jump`, `Run`, `Attack` state names must exist in the character scene. In 3D, Run consumes an XZ direction; in 2D, it consumes an X direction for a platformer.

```gdscript
class_name IdleState3D
extends CharacterState3D

func enter() -> void:
    var animation: AnimationPlayer = body.get_node("AnimationPlayer")
    animation.play("idle")

func physics_update(_delta: float) -> String:
    if not body.is_on_floor():
        return "Jump"
    if Input.get_vector("move_left", "move_right", "move_forward", "move_back") != Vector2.ZERO:
        return "Run"
    return ""

func handle_input(event: InputEvent) -> String:
    if event.is_action_pressed("jump") and body.is_on_floor():
        return "Jump"
    if event.is_action_pressed("attack"):
        return "Attack"
    return ""
```

```csharp
using Godot;

public partial class IdleState3D : CharacterState3D
{
    public override void Enter() => Body.GetNode<AnimationPlayer>("AnimationPlayer").Play("idle");

    public override string PhysicsUpdate(double delta)
    {
        if (!Body.IsOnFloor()) return "Jump";
        if (Input.GetVector("move_left", "move_right", "move_forward", "move_back") != Vector2.Zero) return "Run";
        return string.Empty;
    }

    public override string HandleInput(InputEvent @event)
    {
        if (@event.IsActionPressed("jump") && Body.IsOnFloor()) return "Jump";
        if (@event.IsActionPressed("attack")) return "Attack";
        return string.Empty;
    }
}
```
