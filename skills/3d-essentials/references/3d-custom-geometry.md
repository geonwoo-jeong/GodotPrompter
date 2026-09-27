# Custom Geometry (3D)

[3D guide](../SKILL.md) · [2D drawing counterpart](../../2d-essentials/references/2d-custom-drawing.md)

Node3D has no `_draw()` callback. For a few runtime debug lines use an ImmediateMesh on MeshInstance3D; for a large reusable mesh use ArrayMesh or SurfaceTool. This line builder replaces its old surface on each call. Points are local to the MeshInstance3D.

```gdscript
extends MeshInstance3D

var lines := ImmediateMesh.new()

func _ready() -> void:
    mesh = lines
    var material := StandardMaterial3D.new()
    material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    material.albedo_color = Color.YELLOW
    material_override = material

func draw_segment(start: Vector3, end: Vector3) -> void:
    lines.clear_surfaces()
    lines.surface_begin(Mesh.PRIMITIVE_LINES)
    lines.surface_add_vertex(start)
    lines.surface_add_vertex(end)
    lines.surface_end()
```

```csharp
using Godot;

public partial class DebugSegment3D : MeshInstance3D
{
    private readonly ImmediateMesh _lines = new();
    public override void _Ready()
    {
        Mesh = _lines;
        MaterialOverride = new StandardMaterial3D
        {
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
            AlbedoColor = Colors.Yellow,
        };
    }
    public void DrawSegment(Vector3 start, Vector3 end)
    {
        _lines.ClearSurfaces();
        _lines.SurfaceBegin(Godot.Mesh.PrimitiveType.Lines);
        _lines.SurfaceAddVertex(start);
        _lines.SurfaceAddVertex(end);
        _lines.SurfaceEnd();
    }
}
```

Hardware line primitives do not provide a portable thick-line width. Use actual quad/tube geometry when line thickness is part of the game presentation. Clearing surfaces prevents repeated debug updates from accumulating meshes.
