# Collision Shapes and Teleports (2D)

Shape sizing and interpolation reset for 2D bodies.

> ← Back to [SKILL.md](../SKILL.md)

## Sized Shape and Teleport Reset

This script expects a direct CollisionShape child. It creates a private shape resource, so resizing does not change other bodies that used a shared resource.

```gdscript
extends CharacterBody2D

func _ready() -> void:
    var body_shape := RectangleShape2D.new()
    body_shape.size = Vector2(32, 48)
    $CollisionShape2D.shape = body_shape

func teleport_to(destination: Vector2) -> void:
    global_position = destination
    reset_physics_interpolation()
```

```csharp
public partial class SizedBody2D : CharacterBody2D
{
    public override void _Ready()
    {
        var bodyShape = new RectangleShape2D { Size = new Vector2(32, 48) };
        GetNode<CollisionShape2D>("CollisionShape2D").Shape = bodyShape;
    }
    public void TeleportTo(Vector2 destination)
    {
        GlobalPosition = destination;
        ResetPhysicsInterpolation();
    }
}
```

## One-Way Platforms (Godot 4.7+)

One-way shape collision is a 2D feature. The custom direction requires Godot 4.7+. There is no CollisionShape3D one-way flag to translate this to.

```gdscript
var shape: CollisionShape2D = $CollisionShape2D
shape.one_way_collision = true
shape.one_way_collision_direction = Vector2(1, 0)
```

```csharp
var shape = GetNode<CollisionShape2D>("CollisionShape2D");
shape.OneWayCollision = true;
shape.OneWayCollisionDirection = new Vector2(1, 0);
```
