# Raycasting and Picking (3D)

Node rays, direct physics queries, and mouse selection for 3D.

> ← Back to [SKILL.md](../SKILL.md)

## RayCast Node

Set the child ray’s `target_position` and collision mask in the Inspector. It updates once per physics tick.

```gdscript
extends Node3D

@onready var ray: RayCast3D = $RayCast3D

func _physics_process(_delta: float) -> void:
    if ray.is_colliding():
        print(ray.get_collider(), " at ", ray.get_collision_point())
```

```csharp
public partial class RaySensor3D : Node3D
{
    private RayCast3D _ray;
    public override void _Ready() => _ray = GetNode<RayCast3D>("RayCast3D");
    public override void _PhysicsProcess(double delta)
    {
        if (_ray.IsColliding()) GD.Print(_ray.GetCollider(), " at ", _ray.GetCollisionPoint());
    }
}
```

## Direct Space Query

This script is attached to a collision body, so its RID can be excluded. Perform direct queries in the physics callback; space access may be locked outside it.

```gdscript
extends CharacterBody3D

func _physics_process(_delta: float) -> void:
    var query := PhysicsRayQueryParameters3D.create(global_position, global_position + Vector3(0, -5, 0))
    query.exclude = [get_rid()]
    query.collision_mask = 0b0100
    var result: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
    if not result.is_empty():
        print(result.position, " normal: ", result.normal)
```

```csharp
public partial class GroundProbe3D : CharacterBody3D
{
    public override void _PhysicsProcess(double delta)
    {
        var query = PhysicsRayQueryParameters3D.Create(GlobalPosition, GlobalPosition + new Vector3(0, -5, 0));
        query.Exclude = new Godot.Collections.Array<Rid> { GetRid() };
        query.CollisionMask = 0b0100;
        var result = GetWorld3D().DirectSpaceState.IntersectRay(query);
        if (result.Count > 0) GD.Print(result["position"], " normal: ", result["normal"]);
    }
}
```

## Mouse Picking

The viewport must have an active Camera3D. The pending flag keeps a click at viewport coordinate (0, 0) valid and makes each click perform one physics query.

```gdscript
extends Node3D

const RAY_LENGTH: float = 1000.0
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
    var camera: Camera3D = get_viewport().get_camera_3d()
    var origin: Vector3 = camera.project_ray_origin(_mouse_position)
    var end: Vector3 = origin + camera.project_ray_normal(_mouse_position) * RAY_LENGTH
    var query := PhysicsRayQueryParameters3D.create(origin, end)
    query.collide_with_areas = true
    var result: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
    if not result.is_empty():
        print("Clicked: ", result.collider, " at ", result.position)
```

```csharp
public partial class MousePicker3D : Node3D
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
        Camera3D camera = GetViewport().GetCamera3D();
        Vector3 origin = camera.ProjectRayOrigin(_mousePosition);
        Vector3 end = origin + camera.ProjectRayNormal(_mousePosition) * 1000.0f;
        var query = PhysicsRayQueryParameters3D.Create(origin, end);
        query.CollideWithAreas = true;
        var result = GetWorld3D().DirectSpaceState.IntersectRay(query);
        if (result.Count > 0) GD.Print("Clicked: ", result["collider"], " at ", result["position"]);
    }
}
```
