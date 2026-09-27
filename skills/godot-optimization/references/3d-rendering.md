# Rendering Optimization (3D)

> ← Back to [SKILL.md](../SKILL.md)

## Shared Materials and LOD

Reuse the same mesh/material resources for matching objects. Use import-generated mesh LOD and `GeometryInstance3D.lod_bias` to tune detail; visibility ranges can switch between representations. These 3D mesh features have no direct CanvasItem equivalent. A 2D game can instead choose simpler sprites/animations at low screen size.

`gi_mode` controls participation in global illumination; it does not merge meshes. Vary per-instance shader data only when the selected renderer and shader support it; otherwise use vertex/instance color or accept the cost of separate materials.

## Off-Screen Cosmetic Processing

Add a VisibleOnScreenNotifier child with bounds covering the effect. This example switches only the parent’s rendered-frame callback; leave gameplay and physics running when they must affect off-screen actors.

```gdscript
extends Node3D

@onready var visibility_notifier: VisibleOnScreenNotifier3D = $VisibleOnScreenNotifier3D

func _ready() -> void:
    visibility_notifier.screen_entered.connect(_on_screen_entered)
    visibility_notifier.screen_exited.connect(_on_screen_exited)
    set_process(false)

func _on_screen_entered() -> void:
    set_process(true)

func _on_screen_exited() -> void:
    set_process(false)
```

```csharp
public partial class CulledEffect3D : Node3D
{
    public override void _Ready()
    {
        var notifier = GetNode<VisibleOnScreenNotifier3D>("VisibleOnScreenNotifier3D");
        notifier.ScreenEntered += () => SetProcess(true);
        notifier.ScreenExited += () => SetProcess(false);
        SetProcess(false);
    }
}
```

## MultiMesh Instancing

Assign a mesh and point list before calling `build_instances`. Transforms are local to the MultiMeshInstance. Set the transform format before the instance count. MultiMesh batches repeated geometry but has a shared visibility bound; split a large world into chunks for useful culling.

```gdscript
extends MultiMeshInstance3D

@export var instance_mesh: Mesh
@export var points: PackedVector3Array = PackedVector3Array()

func build_instances() -> void:
    var instances := MultiMesh.new()
    instances.transform_format = MultiMesh.TRANSFORM_3D
    instances.mesh = instance_mesh
    instances.instance_count = points.size()
    for i in points.size():
        instances.set_instance_transform(i, Transform3D(Basis.IDENTITY, points[i]))
    multimesh = instances
```

```csharp
public partial class InstancedGeometry3D : MultiMeshInstance3D
{
    [Export] public Mesh InstanceMesh { get; set; }
    [Export] public Vector3[] Points { get; set; } = System.Array.Empty<Vector3>();
    public void BuildInstances()
    {
        var instances = new MultiMesh
        {
            TransformFormat = MultiMesh.TransformFormatEnum.Transform3D,
            Mesh = InstanceMesh,
            InstanceCount = Points.Length
        };
        for (int i = 0; i < Points.Length; i++)
            instances.SetInstanceTransform(i, new Transform3D(Basis.Identity, Points[i]));
        Multimesh = instances;
    }
}
```
