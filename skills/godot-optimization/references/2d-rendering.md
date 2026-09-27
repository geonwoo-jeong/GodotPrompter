# Rendering Optimization (2D)

> ← Back to [SKILL.md](../SKILL.md)

## Batching and Atlases

Arrange CanvasItems so compatible draw operations can batch without changing required draw order. Share textures/materials where appropriate; an AtlasTexture selects a region of a larger texture. Measure effects of clipping, blending, lights, and ordering on the actual renderer.

CanvasGroup composites children as a single visual group, useful for group opacity and custom effects. Its backbuffer work can cost performance; it is not a blanket instruction to wrap sprites for speed. [Official CanvasGroup documentation](https://docs.godotengine.org/en/stable/classes/class_canvasgroup.html).

## Off-Screen Cosmetic Processing

Add a VisibleOnScreenNotifier child with bounds covering the effect. This example switches only the parent’s rendered-frame callback; leave gameplay and physics running when they must affect off-screen actors.

```gdscript
extends Node2D

@onready var visibility_notifier: VisibleOnScreenNotifier2D = $VisibleOnScreenNotifier2D

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
public partial class CulledEffect2D : Node2D
{
    public override void _Ready()
    {
        var notifier = GetNode<VisibleOnScreenNotifier2D>("VisibleOnScreenNotifier2D");
        notifier.ScreenEntered += () => SetProcess(true);
        notifier.ScreenExited += () => SetProcess(false);
        SetProcess(false);
    }
}
```

## MultiMesh Instancing

Assign a mesh and point list before calling `build_instances`. Transforms are local to the MultiMeshInstance. Set the transform format before the instance count. MultiMesh batches repeated geometry but has a shared visibility bound; split a large world into chunks for useful culling.

```gdscript
extends MultiMeshInstance2D

@export var instance_mesh: Mesh
@export var points: PackedVector2Array = PackedVector2Array()

func build_instances() -> void:
    var instances := MultiMesh.new()
    instances.transform_format = MultiMesh.TRANSFORM_2D
    instances.mesh = instance_mesh
    instances.instance_count = points.size()
    for i in points.size():
        instances.set_instance_transform_2d(i, Transform2D(0.0, points[i]))
    multimesh = instances
```

```csharp
public partial class InstancedGeometry2D : MultiMeshInstance2D
{
    [Export] public Mesh InstanceMesh { get; set; }
    [Export] public Vector2[] Points { get; set; } = System.Array.Empty<Vector2>();
    public void BuildInstances()
    {
        var instances = new MultiMesh
        {
            TransformFormat = MultiMesh.TransformFormatEnum.Transform2D,
            Mesh = InstanceMesh,
            InstanceCount = Points.Length
        };
        for (int i = 0; i < Points.Length; i++)
            instances.SetInstanceTransform2D(i, new Transform2D(0.0f, Points[i]));
        Multimesh = instances;
    }
}
```
