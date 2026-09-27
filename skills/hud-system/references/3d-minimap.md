# Minimap (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-minimap.md) · [Common display and mask](common-minimap-display.md)

A second, orthogonal `Camera3D` renders the same `World3D` into a `SubViewport`. Use world-space meshes for markers and a `Camera3D.cull_mask` to select visible layers. `Viewport.canvas_cull_mask` filters canvas items and cannot filter 3D meshes.

## Scene and world setup

```
World (Node3D)
├── Player (CharacterBody3D)
│   └── GameplayCamera (Camera3D)
└── HUD (CanvasLayer, script below)
    └── MinimapContainer (SubViewportContainer)
        └── MinimapViewport (SubViewport, 256×256)
            └── MinimapCamera (Camera3D, follow script below)
```

Assign `main_camera` to the gameplay camera. Set normal geometry's `VisualInstance3D.layers` to layer 1, minimap-only markers to layer 2, and the `MinimapCamera` target to the player. Each mesh or other visual instance needs its own layer setting. Place marker meshes above the terrain so they are not hidden by it; a cull mask alone does not disable depth testing.

```gdscript
extends CanvasLayer

@export var main_camera: Camera3D

func _ready() -> void:
    var minimap: SubViewport = $MinimapContainer/MinimapViewport
    var minimap_camera: Camera3D = $MinimapContainer/MinimapViewport/MinimapCamera
    minimap.world_3d = get_viewport().find_world_3d()
    minimap.render_target_update_mode = SubViewport.UPDATE_ALWAYS
    main_camera.cull_mask = 1
    minimap_camera.cull_mask = 1 | 2
```

```csharp
using Godot;

public partial class MinimapSetup3D : CanvasLayer
{
    [Export] public Camera3D MainCamera { get; set; }

    public override void _Ready()
    {
        var minimap = GetNode<SubViewport>("MinimapContainer/MinimapViewport");
        var minimapCamera = GetNode<Camera3D>("MinimapContainer/MinimapViewport/MinimapCamera");
        minimap.World3D = GetViewport().FindWorld3D();
        minimap.RenderTargetUpdateMode = SubViewport.UpdateMode.Always;
        MainCamera.CullMask = 1;
        minimapCamera.CullMask = 1 | 2;
    }
}
```

## Orthogonal follow camera

The camera looks straight down the Y axis, with world -Z at the top of the map. Its `size` controls the visible span in world units; raising an orthogonal camera does not zoom it out. Choose height and far plane values that enclose the terrain's elevation range. Keep `SubViewport.own_world_3d = false` and `disable_3d = false`; leave the minimap's 3D audio listener disabled.

```gdscript
## minimap_camera_3d.gd
extends Camera3D

@export var follow_target: Node3D
@export var height: float = 40.0
@export var map_span: float = 64.0
@export var follow_speed: float = 10.0

func _ready() -> void:
    projection = PROJECTION_ORTHOGONAL
    size = map_span
    rotation = Vector3(-PI / 2.0, 0.0, 0.0)
    if follow_target:
        global_position = follow_target.global_position + Vector3.UP * height
    make_current()

func _process(delta: float) -> void:
    if not follow_target:
        return
    var destination := follow_target.global_position + Vector3.UP * height
    global_position = global_position.lerp(destination, 1.0 - exp(-follow_speed * delta))
```

```csharp
using Godot;

public partial class MinimapCamera3D : Camera3D
{
    [Export] public Node3D FollowTarget { get; set; }
    [Export] public float Height { get; set; } = 40.0f;
    [Export] public float MapSpan { get; set; } = 64.0f;
    [Export] public float FollowSpeed { get; set; } = 10.0f;

    public override void _Ready()
    {
        Projection = ProjectionType.Orthogonal;
        Size = MapSpan;
        Rotation = new Vector3(-Mathf.Pi / 2.0f, 0, 0);
        if (FollowTarget != null)
            GlobalPosition = FollowTarget.GlobalPosition + Vector3.Up * Height;
        MakeCurrent();
    }

    public override void _Process(double delta)
    {
        if (FollowTarget == null)
            return;
        Vector3 destination = FollowTarget.GlobalPosition + Vector3.Up * Height;
        float weight = 1.0f - Mathf.Exp(-FollowSpeed * (float)delta);
        GlobalPosition = GlobalPosition.Lerp(destination, weight);
    }
}
```

For an icon-only map set the minimap camera's mask to layer 2. Ordinary lighting, materials, depth, and shadow rules still apply to the 3D pass. Display scaling and circular clipping use the same [common canvas material](common-minimap-display.md) as a 2D minimap.

APIs: [Camera3D](https://docs.godotengine.org/en/stable/classes/class_camera3d.html), [Viewport worlds](https://docs.godotengine.org/en/stable/classes/class_viewport.html#class-viewport-property-world-3d).
