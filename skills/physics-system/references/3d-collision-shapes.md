# Collision Shapes and Teleports (3D)

Shape sizing and interpolation reset for 3D bodies.

> ← Back to [SKILL.md](../SKILL.md)

## Sized Shape and Teleport Reset

This script expects a direct CollisionShape child. It creates a private shape resource, so resizing does not change other bodies that used a shared resource.

```gdscript
extends CharacterBody3D

func _ready() -> void:
    var body_shape := BoxShape3D.new()
    body_shape.size = Vector3(1, 2, 1)
    $CollisionShape3D.shape = body_shape

func teleport_to(destination: Vector3) -> void:
    global_position = destination
    reset_physics_interpolation()
```

```csharp
public partial class SizedBody3D : CharacterBody3D
{
    public override void _Ready()
    {
        var bodyShape = new BoxShape3D { Size = new Vector3(1, 2, 1) };
        GetNode<CollisionShape3D>("CollisionShape3D").Shape = bodyShape;
    }
    public void TeleportTo(Vector3 destination)
    {
        GlobalPosition = destination;
        ResetPhysicsInterpolation();
    }
}
```

Use primitive shapes for moving bodies. Imported static mesh geometry can use a concave trimesh; moving concave geometry needs convex decomposition instead. CylinderShape3D and HeightMapShape3D are 3D-specific shapes, not names to translate into 2D APIs.
