# Raycasting and Picking (2D)

Node rays, direct physics queries, and mouse selection for 2D.

> ← Back to [SKILL.md](../SKILL.md)

## RayCast Node

Set the child ray’s `target_position` and collision mask in the Inspector. It updates once per physics tick.

```gdscript
extends Node2D

@onready var ray: RayCast2D = $RayCast2D

func _physics_process(_delta: float) -> void:
    if ray.is_colliding():
        print(ray.get_collider(), " at ", ray.get_collision_point())
```

```csharp
public partial class RaySensor2D : Node2D
{
    private RayCast2D _ray;
    public override void _Ready() => _ray = GetNode<RayCast2D>("RayCast2D");
    public override void _PhysicsProcess(double delta)
    {
        if (_ray.IsColliding()) GD.Print(_ray.GetCollider(), " at ", _ray.GetCollisionPoint());
    }
}
```

## Direct Space Query

This script is attached to a collision body, so its RID can be excluded. Perform direct queries in the physics callback; space access may be locked outside it.

```gdscript
extends CharacterBody2D

func _physics_process(_delta: float) -> void:
    var query := PhysicsRayQueryParameters2D.create(global_position, global_position + Vector2(0, 100))
    query.exclude = [get_rid()]
    query.collision_mask = 0b0100
    var result: Dictionary = get_world_2d().direct_space_state.intersect_ray(query)
    if not result.is_empty():
        print(result.position, " normal: ", result.normal)
```

```csharp
public partial class GroundProbe2D : CharacterBody2D
{
    public override void _PhysicsProcess(double delta)
    {
        var query = PhysicsRayQueryParameters2D.Create(GlobalPosition, GlobalPosition + new Vector2(0, 100));
        query.Exclude = new Godot.Collections.Array<Rid> { GetRid() };
        query.CollisionMask = 0b0100;
        var result = GetWorld2D().DirectSpaceState.IntersectRay(query);
        if (result.Count > 0) GD.Print(result["position"], " normal: ", result["normal"]);
    }
}
```

## Mouse Picking

Convert viewport input coordinates through the canvas transform; this respects Camera2D movement and zoom. Attach to the same world canvas as the selectable bodies. A point query finds overlaps, whereas the 3D counterpart projects a ray.

```gdscript
extends Node2D

var _mouse_position: Vector2
var _pick_pending: bool = false

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
        _mouse_position = event.position
        _pick_pending = true

func _physics_process(_delta: float) -> void:
    if not _pick_pending:
        return
    _pick_pending = false
    var query := PhysicsPointQueryParameters2D.new()
    query.position = get_canvas_transform().affine_inverse() * _mouse_position
    query.collide_with_areas = true
    var results: Array[Dictionary] = get_world_2d().direct_space_state.intersect_point(query)
    for result in results:
        print("Clicked: ", result.collider)
```

```csharp
public partial class MousePicker2D : Node2D
{
    private Vector2 _mousePosition;
    private bool _pickPending;
    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseButton { ButtonIndex: MouseButton.Left, Pressed: true } click)
        {
            _mousePosition = click.Position;
            _pickPending = true;
        }
    }
    public override void _PhysicsProcess(double delta)
    {
        if (!_pickPending) return;
        _pickPending = false;
        var query = new PhysicsPointQueryParameters2D
        {
            Position = GetCanvasTransform().AffineInverse() * _mousePosition,
            CollideWithAreas = true
        };
        foreach (var result in GetWorld2D().DirectSpaceState.IntersectPoint(query))
            GD.Print("Clicked: ", result["collider"]);
    }
}
```
