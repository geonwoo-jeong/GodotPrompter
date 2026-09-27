# State Machine Examples (3D)

Reference for `skills/animation-system/SKILL.md` — the full GDScript and C# canonical state machine example (CharacterBody3D driving `AnimationNodeStateMachinePlayback`).

> ← Back to [SKILL.md](../SKILL.md)

---

Set up `idle`, `walk`, and `attack` states, transitions, and an active AnimationTree pointing to AnimationPlayer. This flat-plane example has no gravity. For an actual attack, lock locomotion transitions until the attack completes; calling `travel("idle")` every frame would otherwise interrupt it. BlendSpace2D still takes a Vector2 for 3D movement: use the local XZ direction.

[2D counterpart](2d-state-machine-examples.md).

### State Machine — GDScript

```gdscript
extends CharacterBody3D

@onready var anim_tree: AnimationTree = $AnimationTree
@onready var state_machine: AnimationNodeStateMachinePlayback = anim_tree["parameters/playback"]

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    if input_dir != Vector2.ZERO:
        velocity = Vector3(input_dir.x, 0.0, input_dir.y) * 5.0
        state_machine.travel("walk")
    else:
        velocity = Vector3.ZERO
        state_machine.travel("idle")

    move_and_slide()

func attack() -> void:
    # travel() transitions smoothly; use start() for immediate switch
    state_machine.travel("attack")

func get_current_state() -> StringName:
    return state_machine.get_current_node()
```

### State Machine — C#

```csharp
using Godot;

public partial class AnimatedCharacter3D : CharacterBody3D
{
    private AnimationTree _animTree;
    private AnimationNodeStateMachinePlayback _stateMachine;

    public override void _Ready()
    {
        _animTree = GetNode<AnimationTree>("AnimationTree");
        _stateMachine = _animTree.Get("parameters/playback").As<AnimationNodeStateMachinePlayback>();
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        if (inputDir != Vector2.Zero)
        {
            Velocity = new Vector3(inputDir.X, 0.0f, inputDir.Y) * 5.0f;
            _stateMachine.Travel("walk");
        }
        else
        {
            Velocity = Vector3.Zero;
            _stateMachine.Travel("idle");
        }

        MoveAndSlide();
    }

    public void Attack()
    {
        _stateMachine.Travel("attack");
    }
}
```
