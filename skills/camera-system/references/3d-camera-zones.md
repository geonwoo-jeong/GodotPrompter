# Room Camera Zones (3D)

> ← Back to [SKILL.md](../SKILL.md)

Camera3D has no Camera2D `limit_left/right/top/bottom` properties. A practical 3D room counterpart is an Area3D that selects a pre-positioned camera on entry. Place a CollisionShape3D in each non-overlapping zone, set its collision mask to the player layer, and assign a Camera3D in the same viewport. On exit the camera stays selected until another zone takes over. For blending, invoke the shared [transition manager](common-transitions.md) instead of `make_current()`.

```gdscript
extends Area3D

@export var room_camera: Camera3D

func _ready() -> void:
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node3D) -> void:
    if body.is_in_group("player"):
        room_camera.make_current()
```

```csharp
using Godot;

public partial class CameraZone3D : Area3D
{
    [Export] public Camera3D RoomCamera { get; set; }

    public override void _Ready() => BodyEntered += OnBodyEntered;

    private void OnBodyEntered(Node3D body)
    {
        if (body.IsInGroup("player")) RoomCamera.MakeCurrent();
    }
}
```
