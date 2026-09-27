# Interpolated Follow Camera (2D)

Node2D does not expose get_global_transform_interpolated(). This explicit camera tracks two physics samples instead.

> ← Back to [SKILL.md](../SKILL.md)

Assign a physics-driven Target in the Inspector. Keep the camera independent (`top_level`), disable its built-in position smoothing and physics interpolation, then interpolate its position once per rendered frame. Give it a later `process_physics_priority` than the target so it samples after target movement. This is a translation-only follow camera; rotation/zoom need their own policy.

Call `reset_follow()` after teleporting the target as well as resetting the target's physics interpolation. Otherwise the cached previous position would still interpolate across the teleport.

```gdscript
extends Camera2D

@export var target: Node2D
var _previous: Vector2
var _current: Vector2

func _ready() -> void:
    top_level = true
    physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
    position_smoothing_enabled = false
    process_callback = Camera2D.CAMERA2D_PROCESS_IDLE
    process_physics_priority = target.process_physics_priority + 1
    reset_follow()

func reset_follow() -> void:
    _current = target.global_position
    _previous = _current
    global_position = _current

func _physics_process(_delta: float) -> void:
    _previous = _current
    _current = target.global_position

func _process(_delta: float) -> void:
    global_position = _previous.lerp(_current, Engine.get_physics_interpolation_fraction())
```

```csharp
public partial class PhysicsFollowCamera2D : Camera2D
{
    [Export] public Node2D Target { get; set; }
    private Vector2 _previous;
    private Vector2 _current;
    public override void _Ready()
    {
        TopLevel = true;
        PhysicsInterpolationMode = PhysicsInterpolationModeEnum.Off;
        PositionSmoothingEnabled = false;
        ProcessCallback = Camera2DProcessCallback.Idle;
        ProcessPhysicsPriority = Target.ProcessPhysicsPriority + 1;
        ResetFollow();
    }
    public void ResetFollow()
    {
        _current = Target.GlobalPosition;
        _previous = _current;
        GlobalPosition = _current;
    }
    public override void _PhysicsProcess(double delta)
    {
        _previous = _current;
        _current = Target.GlobalPosition;
    }
    public override void _Process(double delta)
    {
        GlobalPosition = _previous.Lerp(_current, (float)Engine.GetPhysicsInterpolationFraction());
    }
}
```

[Official interpolation differences](https://docs.godotengine.org/en/stable/tutorials/physics/interpolation/2d_and_3d_physics_interpolation.html) explain why the 3D getter cannot be substituted onto Node2D.
