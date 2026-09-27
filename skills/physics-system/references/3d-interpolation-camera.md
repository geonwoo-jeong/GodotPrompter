# Interpolated Follow Camera (3D)

Keep this Camera3D independent from its physics-driven target. Assign Target in the Inspector; enable project physics interpolation.

> ← Back to [SKILL.md](../SKILL.md)

`Node3D.get_global_transform_interpolated()` supplies the rendered target transform. The camera itself updates per rendered frame with its own interpolation disabled, avoiding double interpolation. The offset must be nonzero and not parallel to Vector3.UP when using look_at.

```gdscript
extends Camera3D

@export var target: Node3D
@export var follow_offset: Vector3 = Vector3(0, 4, 8)

func _ready() -> void:
    top_level = true
    physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
    target.get_global_transform_interpolated()  # Start the interpolation pump.

func _process(_delta: float) -> void:
    var target_position: Vector3 = target.get_global_transform_interpolated().origin
    global_position = target_position + follow_offset
    look_at(target_position, Vector3.UP)
```

```csharp
public partial class PhysicsFollowCamera3D : Camera3D
{
    [Export] public Node3D Target { get; set; }
    [Export] public Vector3 FollowOffset { get; set; } = new(0, 4, 8);
    public override void _Ready()
    {
        TopLevel = true;
        PhysicsInterpolationMode = PhysicsInterpolationModeEnum.Off;
        Target.GetGlobalTransformInterpolated();
    }
    public override void _Process(double delta)
    {
        Vector3 targetPosition = Target.GetGlobalTransformInterpolated().Origin;
        GlobalPosition = targetPosition + FollowOffset;
        LookAt(targetPosition, Vector3.Up);
    }
}
```
