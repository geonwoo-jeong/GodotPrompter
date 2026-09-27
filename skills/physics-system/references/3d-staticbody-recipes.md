# Static and Moving Bodies (3D)

Conveyor and moving-platform recipes for 3D.

> ← Back to [SKILL.md](../SKILL.md)

## Conveyor Belt

Constant linear velocity changes contact motion without moving the StaticBody transform.

```gdscript
extends StaticBody3D

@export var belt_speed: float = 2.0

func _ready() -> void:
    constant_linear_velocity = Vector3(belt_speed, 0, 0)
```

```csharp
public partial class Conveyor3D : StaticBody3D
{
    [Export] public float BeltSpeed { get; set; } = 2.0f;
    public override void _Ready() => ConstantLinearVelocity = new Vector3(BeltSpeed, 0, 0);
}
```

## Moving Platform

Use AnimatableBody for a platform whose transform moves. Keep `sync_to_physics` enabled and run the Tween on physics ticks.

```gdscript
extends AnimatableBody3D

@export var travel: Vector3 = Vector3(0, 2, 0)
@export var duration: float = 2.0

func _ready() -> void:
    var start: Vector3 = position
    var tween: Tween = create_tween().set_process_mode(Tween.TWEEN_PROCESS_PHYSICS).set_loops()
    tween.tween_property(self, "position", start + travel, duration)
    tween.tween_property(self, "position", start, duration)
```

```csharp
public partial class MovingPlatform3D : AnimatableBody3D
{
    [Export] public Vector3 Travel { get; set; } = new(0, 2, 0);
    [Export] public float Duration { get; set; } = 2.0f;
    public override void _Ready()
    {
        Vector3 start = Position;
        var tween = CreateTween().SetProcessMode(Tween.TweenProcessMode.Physics).SetLoops();
        tween.TweenProperty(this, "position", start + Travel, Duration);
        tween.TweenProperty(this, "position", start, Duration);
    }
}
```
