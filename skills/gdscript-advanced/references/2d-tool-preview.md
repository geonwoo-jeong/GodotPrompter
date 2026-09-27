# Procedural Editor Preview (2D)

[Back](../SKILL.md). CanvasItem drawing uses local XY pixel coordinates. This GDScript language skill uses the built-in drawing API, without a debug-drawing addon.

```gdscript
@tool
class_name CirclePreview2D
extends Node2D

@export_range(0.0, 1000.0) var radius: float = 32.0:
    set(value):
        radius = value
        queue_redraw()

func _draw() -> void:
    if Engine.is_editor_hint():
        draw_arc(Vector2.ZERO, radius, 0.0, TAU, 33, Color.RED, 1.0, true)
```
