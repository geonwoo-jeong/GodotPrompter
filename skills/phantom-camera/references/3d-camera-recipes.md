# Phantom Camera Recipes (3D)

[Back to skill](../SKILL.md). Targets addon v0.11.0.2. Put PhantomCameraHost directly under Camera3D; each block is a separate script. The trigger example detects a child Area on the player.

```gdscript
extends PhantomCamera3D

func _ready() -> void:
    look_at_mode = LookAtMode.SIMPLE
    look_at_target = get_node("../Boss")
    look_at_damping = true
    look_at_damping_value = 0.25  # single scalar, not per-axis
    up_target = get_node("../GroundNormalMarker")  # overrides `up` continuously
```

```csharp
using Godot;
using PhantomCamera;

public partial class BossLookAtSetup : Node
{
    [Export] private Node3D _pCamNode; // has a PhantomCamera3D node/script attached
    [Export] private Node3D _boss;
    [Export] private Node3D _groundNormalMarker;

    public override void _Ready()
    {
        // LookAtMode has no wrapper setter (getter-only) — set it on the underlying node.
        _pCamNode.Set("look_at_mode", (int)LookAtMode.Simple);

        var pCam = _pCamNode.AsPhantomCamera3D();
        pCam.LookAtTarget = _boss;
        pCam.LookAtDamping = true;
        pCam.LookAtDampingValue = 0.25f; // single scalar, not per-axis
        pCam.UpTarget = _groundNormalMarker;
    }
}
```

```gdscript
# Cutscene PCam: slow, elastic-eased transition when it takes priority
extends PhantomCamera3D

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
    [Export] private Node3D _pCamNode; // has a PhantomCamera3D node/script attached

    public override void _Ready()
    {
        var pCam = _pCamNode.AsPhantomCamera3D();
        pCam.TweenResource = PhantomCameraTween.New();
        pCam.TweenDuration = 1.5f;   // passthrough — writes TweenResource.Duration
        pCam.TweenTransition = TransitionType.Elastic;
        pCam.TweenEase = EaseType.EaseOut;
    }
}
```

```gdscript
# CameraRig.gd — on the Camera3D/Camera3D
extends Camera3D

@onready var host: PhantomCameraHost = $PhantomCameraHost

func _ready() -> void:
    # host.camera_2d / host.camera_3d are populated automatically from get_parent()
    var active := host.get_active_pcam()
    print("Active PCam: ", active.name if active else "none")
```

```csharp
// CameraRig.cs — on the Camera3D/Camera3D
using Godot;
using PhantomCamera;

public partial class CameraRig : Camera3D
{
    private PhantomCameraHost _host;

    public override void _Ready()
    {
        // Host.Camera3D / Host.Camera3D are populated automatically from GetParent()
        _host = GetNode<Node>("PhantomCameraHost").AsPhantomCameraHost();
        var active = _host.GetActivePhantomCamera();
        GD.Print("Active PCam: ", active is PhantomCamera3D p ? p.Node3D.Name.ToString() : "none");
    }
}
```

```gdscript
# TriggerArea.gd — raise priority while the player is inside, restore on exit
extends Area3D

@export var area_pcam: PhantomCamera3D

func _ready() -> void:
    area_entered.connect(_on_entered)
    area_exited.connect(_on_exited)

func _on_entered(area: Area3D) -> void:
    if area.get_parent() is CharacterBody3D:
        area_pcam.set_priority(20)

func _on_exited(area: Area3D) -> void:
    if area.get_parent() is CharacterBody3D:
        area_pcam.set_priority(0)
```

```csharp
using Godot;
using PhantomCamera;

public partial class TriggerArea : Area3D
{
    [Export] private Node3D _areaPCamNode;
    private PhantomCamera3D _areaPCam;

    public override void _Ready()
    {
        _areaPCam = _areaPCamNode.AsPhantomCamera3D();
        AreaEntered += a => { if (a.GetParent() is CharacterBody3D) _areaPCam.Priority = 20; };
        AreaExited  += a => { if (a.GetParent() is CharacterBody3D) _areaPCam.Priority = 0; };
    }
}
```

```gdscript
# Player-follow with damping — PhantomCamera3D inspector or code
extends PhantomCamera3D

func _ready() -> void:
    follow_mode = FollowMode.SIMPLE
    follow_target = get_node("../Player")
    follow_damping = true
    follow_damping_value = Vector3(0.15, 0.15, 0.15)  # lower = snappier
```

```csharp
using Godot;
using PhantomCamera;

public partial class PlayerFollowSetup : Node
{
    [Export] private Node3D _pCamNode; // has a PhantomCamera3D node/script attached
    [Export] private Node3D _player;

    public override void _Ready()
    {
        // FollowMode has no wrapper setter (getter-only) — set it on the underlying node.
        _pCamNode.Set("follow_mode", (int)FollowMode3D.Simple);

        var pCam = _pCamNode.AsPhantomCamera3D();
        pCam.FollowTarget = _player;
        pCam.FollowDamping = true;
        pCam.FollowDampingValue = new Vector3(0.15f, 0.15f, 0.15f); // lower = snappier
    }
}
```

```gdscript
extends PhantomCamera3D

func _ready() -> void:
    follow_mode = FollowMode.GROUP
    follow_targets = [get_node("../Player"), get_node("../Boss")]
    auto_follow_distance = true
    auto_follow_distance_min = 3.0
    auto_follow_distance_max = 12.0
```

```csharp
using Godot;
using PhantomCamera;

public partial class GroupFollow3D : Node
{
    [Export] private Node3D _pCamNode;
    [Export] private Node3D _player;
    [Export] private Node3D _boss;
    public override void _Ready()
    {
        _pCamNode.Set("follow_mode", (int)FollowMode3D.Group);
        var pCam = _pCamNode.AsPhantomCamera3D();
        pCam.FollowTargets = new[] { _player, _boss };
        pCam.AutoFollowDistance = true;
        pCam.AutoFollowDistanceMin = 3f;
        pCam.AutoFollowDistanceMax = 12f;
    }
}
```
