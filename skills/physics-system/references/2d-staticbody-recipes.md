# Static and Moving Bodies (2D)

Conveyor and moving-platform recipes for 2D.

> ← Back to [SKILL.md](../SKILL.md)

## Conveyor Belt

Constant linear velocity changes contact motion without moving the StaticBody transform.

```gdscript
extends StaticBody2D

@export var belt_speed: float = 100.0

func _ready() -> void:
    constant_linear_velocity = Vector2(belt_speed, 0)
```

```csharp
public partial class Conveyor2D : StaticBody2D
{
    [Export] public float BeltSpeed { get; set; } = 100.0f;
    public override void _Ready() => ConstantLinearVelocity = new Vector2(BeltSpeed, 0);
}
```

## Moving Platform

Use AnimatableBody for a platform whose transform moves. Keep `sync_to_physics` enabled and run the Tween on physics ticks.

```gdscript
extends AnimatableBody2D

@export var travel: Vector2 = Vector2(0, -200)
@export var duration: float = 2.0

func _ready() -> void:
    var start: Vector2 = position
    var tween: Tween = create_tween().set_process_mode(Tween.TWEEN_PROCESS_PHYSICS).set_loops()
    tween.tween_property(self, "position", start + travel, duration)
    tween.tween_property(self, "position", start, duration)
```

```csharp
public partial class MovingPlatform2D : AnimatableBody2D
{
    [Export] public Vector2 Travel { get; set; } = new(0, -200);
    [Export] public float Duration { get; set; } = 2.0f;
    public override void _Ready()
    {
        Vector2 start = Position;
        var tween = CreateTween().SetProcessMode(Tween.TweenProcessMode.Physics).SetLoops();
        tween.TweenProperty(this, "position", start + Travel, Duration);
        tween.TweenProperty(this, "position", start, Duration);
    }
}
```
