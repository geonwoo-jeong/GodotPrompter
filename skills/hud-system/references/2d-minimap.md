# Minimap (2D)

Reference for `skills/hud-system/SKILL.md` — minimap via SubViewport + dedicated Camera2D, with circular mask option. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Minimap Concept

A minimap renders a simplified view of the world using a second `Camera2D` inside a `SubViewport`. The `SubViewportContainer` displays the result as a texture anywhere in the HUD.

### Scene Tree

```
HUD (CanvasLayer)
└── MinimapContainer (SubViewportContainer — custom_minimum_size: 256x256)
    └── MinimapViewport (SubViewport — size: 256x256, disable_3d: true)
        ├── MinimapCamera (Camera2D — zoom: Vector2(0.15, 0.15))
        └── (world nodes are rendered via visibility layers — see below)
```

### How it Works

The `SubViewport` renders a separate view of a shared `World2D`. Assign the main viewport's world to it, then use **visibility layers** to control what each viewport renders:

1. Assign your world `TileMapLayer`, environment, and entities to a **world layer** (e.g. layer 1).
2. Assign minimap-specific indicator sprites (player dot, enemy dots) to a **minimap layer** (e.g. layer 2).
3. Set the main `Viewport.canvas_cull_mask` to show only layer 1.
4. Set `MinimapViewport.canvas_cull_mask` to show layers 1 + 2, or only layer 2 if you want an abstract minimap. `Camera2D` has no `cull_mask` property; that name belongs to `Camera3D`.

`CanvasItem.visibility_layer` is not inherited from its parent: assign layers to each drawable item that needs filtering. Attach this setup to the HUD root in the scene tree above:

```gdscript
extends CanvasLayer

func _ready() -> void:
    var minimap: SubViewport = $MinimapContainer/MinimapViewport
    minimap.world_2d = get_viewport().find_world_2d()
    get_viewport().canvas_cull_mask = 1       # layer 1
    minimap.canvas_cull_mask = 1 | 2         # layers 1 and 2
```

```csharp
using Godot;

public partial class MinimapSetup : CanvasLayer
{
    public override void _Ready()
    {
        var minimap = GetNode<SubViewport>("MinimapContainer/MinimapViewport");
        minimap.World2D = GetViewport().FindWorld2D();
        GetViewport().CanvasCullMask = 1;    // layer 1
        minimap.CanvasCullMask = 1 | 2;      // layers 1 and 2
    }
}
```

### GDScript — MinimapCamera

```gdscript
## minimap_camera.gd — attach to the Camera2D inside the SubViewport
extends Camera2D

## The target node the minimap camera tracks (usually the player).
@export var follow_target: Node2D

## Follow rate per second (0 = no follow; higher values catch up faster).
@export var follow_speed: float = 10.0


func _process(delta: float) -> void:
    if not follow_target:
        return
    global_position = global_position.lerp(follow_target.global_position, 1.0 - exp(-follow_speed * delta))
```

### C# — MinimapCamera

```csharp
// MinimapCamera.cs — attach to the Camera2D inside the SubViewport
using Godot;

public partial class MinimapCamera : Camera2D
{
    /// <summary>The target node the minimap camera tracks (usually the player).</summary>
    [Export] public Node2D FollowTarget { get; set; }

    /// <summary>Follow rate per second (0 = no follow; higher values catch up faster).</summary>
    [Export] public float FollowSpeed { get; set; } = 10.0f;

    public override void _Process(double delta)
    {
        if (FollowTarget == null)
            return;
        float weight = 1.0f - Mathf.Exp(-FollowSpeed * (float)delta);
        GlobalPosition = GlobalPosition.Lerp(FollowTarget.GlobalPosition, weight);
    }
}
```

### SubViewport Settings

| Property | Recommended value | Reason |
|---|---|---|
| `size` | `Vector2i(256, 256)` | Internal render resolution and the container's minimum display size when `stretch` is disabled |
| `render_target_update_mode` | `UPDATE_ALWAYS` | Keeps the minimap live every frame |
| `disable_3d` | `true` | Skip 3D rendering overhead for a 2D minimap |
| `canvas_item_default_texture_filter` | `TEXTURE_FILTER_NEAREST` | Preserves pixel art crispness |

`SubViewportContainer.stretch` defaults to `false`, so the example displays at 256×256. Enable `stretch` to let the container resize the viewport to its own size; `stretch_shrink` can then lower the internal rendering resolution. To display a fixed 256×256 render at 128×128 instead, use a separate `TextureRect` with the viewport's texture and an appropriate expand/stretch mode.

> For a circular frame or scaled display, use the [common minimap display](common-minimap-display.md). For a 3D world, choose the [3D minimap](3d-minimap.md).
