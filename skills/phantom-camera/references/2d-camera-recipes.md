# Phantom Camera Recipes (2D)

[Back to skill](../SKILL.md). Targets addon v0.11.0.2. Put PhantomCameraHost directly under Camera2D; each block is a separate script. The trigger example detects a child Area on the player.

```gdscript
# CameraRig.gd — on the Camera2D/Camera3D
extends Camera2D

@onready var host: PhantomCameraHost = $PhantomCameraHost

func _ready() -> void:
    # host.camera_2d / host.camera_3d are populated automatically from get_parent()
    var active := host.get_active_pcam()
    print("Active PCam: ", active.name if active else "none")
```

```csharp
// CameraRig.cs — on the Camera2D/Camera3D
using Godot;
using PhantomCamera;

public partial class CameraRig : Camera2D
{
    private PhantomCameraHost _host;

    public override void _Ready()
    {
        // Host.Camera2D / Host.Camera3D are populated automatically from GetParent()
        _host = GetNode<Node>("PhantomCameraHost").AsPhantomCameraHost();
        var active = _host.GetActivePhantomCamera();
        GD.Print("Active PCam: ", active is PhantomCamera2D p ? p.Node2D.Name.ToString() : "none");
    }
}
```

```gdscript
# TriggerArea.gd — raise priority while the player is inside, restore on exit
extends Area2D

@export var area_pcam: PhantomCamera2D

func _ready() -> void:
    area_entered.connect(_on_entered)
    area_exited.connect(_on_exited)

func _on_entered(area: Area2D) -> void:
    if area.get_parent() is CharacterBody2D:
        area_pcam.set_priority(20)

func _on_exited(area: Area2D) -> void:
    if area.get_parent() is CharacterBody2D:
        area_pcam.set_priority(0)
```

```csharp
using Godot;
using PhantomCamera;

public partial class TriggerArea : Area2D
{
    [Export] private Node2D _areaPCamNode;
    private PhantomCamera2D _areaPCam;

    public override void _Ready()
    {
        _areaPCam = _areaPCamNode.AsPhantomCamera2D();
        AreaEntered += a => { if (a.GetParent() is CharacterBody2D) _areaPCam.Priority = 20; };
        AreaExited  += a => { if (a.GetParent() is CharacterBody2D) _areaPCam.Priority = 0; };
    }
}
```

```gdscript
# Player-follow with damping — PhantomCamera2D inspector or code
extends PhantomCamera2D

func _ready() -> void:
    follow_mode = FollowMode.SIMPLE
    follow_target = get_node("../Player")
    follow_damping = true
    follow_damping_value = Vector2(0.15, 0.15)  # lower = snappier
```

```gdscript
# Boss-fight group shot that auto-zooms to keep both combatants framed
extends PhantomCamera2D

func _ready() -> void:
    follow_mode = FollowMode.GROUP
    follow_targets = [get_node("../Player"), get_node("../Boss")]
    auto_zoom = true
    auto_zoom_min = 1.0
    auto_zoom_max = 2.5
```

```csharp
using Godot;
using PhantomCamera;

public partial class PlayerFollowSetup : Node
{
    [Export] private Node2D _pCamNode; // has a PhantomCamera2D node/script attached
    [Export] private Node2D _player;

    public override void _Ready()
    {
        // FollowMode has no wrapper setter (getter-only) — set it on the underlying node.
        _pCamNode.Set("follow_mode", (int)FollowMode2D.Simple);

        var pCam = _pCamNode.AsPhantomCamera2D();
        pCam.FollowTarget = _player;
        pCam.FollowDamping = true;
        pCam.FollowDampingValue = new Vector2(0.15f, 0.15f); // lower = snappier
    }
}
```

```gdscript
# Cutscene PCam: slow, elastic-eased transition when it takes priority
extends PhantomCamera2D

func _ready() -> void:
    tween_resource = PhantomCameraTween.new()
    tween_duration = 1.5          # passthrough — writes tween_resource.duration
    # TransitionType/EaseType live on PhantomCameraTween — qualify them:
    tween_transition = PhantomCameraTween.TransitionType.ELASTIC
    tween_ease = PhantomCameraTween.EaseType.EASE_OUT
```

```csharp
using Godot;
using PhantomCamera;

public partial class CutsceneCamSetup : Node
{
    [Export] private Node2D _pCamNode; // has a PhantomCamera2D node/script attached

    public override void _Ready()
    {
        var pCam = _pCamNode.AsPhantomCamera2D();
        pCam.TweenResource = PhantomCameraTween.New();
        pCam.TweenDuration = 1.5f;   // passthrough — writes TweenResource.Duration
        pCam.TweenTransition = TransitionType.Elastic;
        pCam.TweenEase = EaseType.EaseOut;
    }
}
```

```csharp
using Godot;
using PhantomCamera;

public partial class GroupFollow2D : Node
{
    [Export] private Node2D _pCamNode;
    [Export] private Node2D _player;
    [Export] private Node2D _boss;
    public override void _Ready()
    {
        _pCamNode.Set("follow_mode", (int)FollowMode2D.Group);
        var pCam = _pCamNode.AsPhantomCamera2D();
        pCam.FollowTargets = new[] { _player, _boss };
        pCam.AutoZoom = true;
        pCam.AutoZoomMin = 1f;
        pCam.AutoZoomMax = 2.5f;
    }
}
```
