# Canvas Editor Overlay (2D)

[Back](../SKILL.md). Godot has EditorNode3DGizmoPlugin for 3D; 2D tools draw through EditorPlugin's canvas overlay callbacks. This plugin previews the selected Node2D's origin. It does not edit the scene or add runtime drawing. Use the Inspector for values; an interactive tool must implement _forward_canvas_gui_input and record edits with EditorUndoRedoManager.

```gdscript
@tool
extends EditorPlugin

var selected: Node2D

func _handles(object: Object) -> bool:
    return object is Node2D

func _edit(object: Object) -> void:
    selected = object if object is Node2D else null
    update_overlays()

func _forward_canvas_draw_over_viewport(overlay: Control) -> void:
    if is_instance_valid(selected):
        var point := selected.get_global_transform_with_canvas().origin
        overlay.draw_circle(point, 6.0, Color.ORANGE)
```

```csharp
#if TOOLS
using Godot;

[Tool]
public partial class CanvasOriginOverlay : EditorPlugin
{
    private Node2D _selected;
    public override bool _Handles(GodotObject obj) => obj is Node2D;
    public override void _Edit(GodotObject obj)
    {
        _selected = obj as Node2D;
        UpdateOverlays();
    }
    public override void _ForwardCanvasDrawOverViewport(Control overlay)
    {
        if (GodotObject.IsInstanceValid(_selected))
            overlay.DrawCircle(_selected.GetGlobalTransformWithCanvas().Origin, 6f, Colors.Orange);
    }
}
#endif
```

The conditional C# cast handles the editor passing null or an unrelated object when selection changes. It is not a required casting pattern for known scene roots.
