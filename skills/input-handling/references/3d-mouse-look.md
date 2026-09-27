# Mouse Look (3D)

> ← Back to [SKILL.md](../SKILL.md)

Attach the body snippet to an upright Node3D/CharacterBody3D with a child `Head`. The planar counterpart is [mouse aiming in 2D](2d-world-input.md).

### Mouse Motion (Camera Look)

Use `_input()` or `_unhandled_input()` depending on whether UI should block the look.

#### GDScript

```gdscript
@export var mouse_sensitivity: float = 0.002

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        # Horizontal look (yaw)
        rotate_y(-event.relative.x * mouse_sensitivity)
        # Vertical look (pitch) on a child Head node
        $Head.rotate_x(-event.relative.y * mouse_sensitivity)
        $Head.rotation.x = clamp($Head.rotation.x, -PI / 2.0, PI / 2.0)
```

#### C#

```csharp
[Export] public float MouseSensitivity { get; set; } = 0.002f;

public override void _Ready()
{
    Input.MouseMode = Input.MouseModeEnum.Captured;
}

public override void _Input(InputEvent @event)
{
    if (@event is InputEventMouseMotion motion
        && Input.MouseMode == Input.MouseModeEnum.Captured)
    {
        RotateY(-motion.Relative.X * MouseSensitivity);
        var head = GetNode<Node3D>("Head");
        head.RotateX(-motion.Relative.Y * MouseSensitivity);
        Vector3 rot = head.Rotation;
        rot.X = Mathf.Clamp(rot.X, -Mathf.Pi / 2f, Mathf.Pi / 2f);
        head.Rotation = rot;
    }
}
```
