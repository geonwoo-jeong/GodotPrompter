# World Input (3D)

> ← Back to [SKILL.md](../SKILL.md)

Assign an upright, unscaled `movement_frame` Node3D (for example the character yaw pivot) and the active Camera3D. Input.GetVector returns a Vector2 even here; map X to right and Y to local Z, leaving vertical speed to the character's gravity logic. The rotation-only basis preserves analog input magnitude.

A screen coordinate does not identify a unique 3D position. Cast from the camera projection through the physics world, using the camera viewport's mouse position. Run `pick_world_point()` during `_physics_process` after a queued click, since direct physics-space access belongs on the physics tick. The result may be empty; use collision masks to choose selectable objects and exclude the player RID if necessary.

```gdscript
extends Node3D

@export var movement_frame: Node3D
@export var camera: Camera3D
@export_flags_3d_physics var pick_mask: int = 1

func movement_direction(input_vector: Vector2) -> Vector3:
    return movement_frame.global_basis.orthonormalized() * Vector3(input_vector.x, 0.0, input_vector.y)

func pick_world_point(max_distance: float = 1000.0) -> Dictionary:
    var screen_position := camera.get_viewport().get_mouse_position()
    var origin := camera.project_ray_origin(screen_position)
    var end := origin + camera.project_ray_normal(screen_position) * max_distance
    var query := PhysicsRayQueryParameters3D.create(origin, end, pick_mask)
    return get_world_3d().direct_space_state.intersect_ray(query)
```

```csharp
using Godot;

public partial class WorldInput3D : Node3D
{
    [Export] public Node3D MovementFrame { get; set; }
    [Export] public Camera3D Camera { get; set; }
    [Export(PropertyHint.Layers3DPhysics)] public uint PickMask { get; set; } = 1;

    public Vector3 MovementDirection(Vector2 input)
        => MovementFrame.GlobalBasis.Orthonormalized() * new Vector3(input.X, 0f, input.Y);

    public Godot.Collections.Dictionary PickWorldPoint(float maxDistance = 1000f)
    {
        Vector2 screen = Camera.GetViewport().GetMousePosition();
        Vector3 origin = Camera.ProjectRayOrigin(screen);
        Vector3 end = origin + Camera.ProjectRayNormal(screen) * maxDistance;
        var query = PhysicsRayQueryParameters3D.Create(origin, end, PickMask);
        return GetWorld3D().DirectSpaceState.IntersectRay(query);
    }
}
```
