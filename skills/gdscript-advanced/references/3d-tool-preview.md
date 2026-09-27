# Procedural Editor Preview (3D)

[Back](../SKILL.md). MeshInstance3D needs an ArrayMesh; vertices lie in the XZ plane.

## 1. Editor preview for a procedural node

A `@tool` script that previews a procedural mesh in the editor without running the game.

```gdscript
@tool
class_name CircleVisualizer extends MeshInstance3D

@export var radius: float = 1.0:
    set(value):
        radius = value
        if Engine.is_editor_hint():
            _rebuild_mesh()

@export var segments: int = 32:
    set(value):
        segments = max(3, value)
        if Engine.is_editor_hint():
            _rebuild_mesh()

func _ready() -> void:
    if Engine.is_editor_hint():
        _rebuild_mesh()

func _rebuild_mesh() -> void:
    var arrays: Array = []
    arrays.resize(Mesh.ARRAY_MAX)
    var verts: PackedVector3Array = PackedVector3Array()
    for i in segments:
        var angle := i * TAU / segments
        verts.append(Vector3(cos(angle) * radius, 0, sin(angle) * radius))
    verts.append(verts[0])  # LINE_STRIP closes only when the first vertex is repeated.
    arrays[Mesh.ARRAY_VERTEX] = verts
    var array_mesh := ArrayMesh.new()
    array_mesh.add_surface_from_arrays(Mesh.PRIMITIVE_LINE_STRIP, arrays)
    mesh = array_mesh
```

