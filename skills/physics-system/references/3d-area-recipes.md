# Area Recipes (3D)

Overlap detection and gravity overrides using Area3D.

> ← Back to [SKILL.md](../SKILL.md)

Add a CollisionShape3D child, enable monitoring, and select the layers to scan. These signals report physics bodies; use area_entered/area_exited for Area-to-Area detection.

## Overlap Detection

```gdscript
extends Area3D

func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
    if body.is_in_group("player"):
        print("Player entered")

func _on_body_exited(body: Node3D) -> void:
    if body.is_in_group("player"):
        print("Player exited")
```

```csharp
public partial class OverlapZone3D : Area3D
{
    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }
    private void OnBodyEntered(Node3D body)
    {
        if (body.IsInGroup("player")) GD.Print("Player entered");
    }
    private void OnBodyExited(Node3D body)
    {
        if (body.IsInGroup("player")) GD.Print("Player exited");
    }
}
```

## Gravity Overrides

Zero gravity replaces the lower-priority gravity contribution. Point gravity attracts toward a local-space center; use a scale appropriate to meters. CharacterBody movement must explicitly consume gravity; RigidBody simulation applies the area override automatically.

```gdscript
extends Area3D

func configure_zero_gravity() -> void:
    gravity_space_override = Area3D.SPACE_OVERRIDE_REPLACE
    gravity = 0.0

func configure_point_gravity() -> void:
    gravity_space_override = Area3D.SPACE_OVERRIDE_COMBINE
    gravity_point = true
    gravity_point_center = Vector3.ZERO
    gravity = 9.8
```

```csharp
public partial class GravityZone3D : Area3D
{
    public void ConfigureZeroGravity()
    {
        GravitySpaceOverride = SpaceOverride.Replace;
        Gravity = 0.0f;
    }
    public void ConfigurePointGravity()
    {
        GravitySpaceOverride = SpaceOverride.Combine;
        GravityPoint = true;
        GravityPointCenter = Vector3.Zero;
        Gravity = 9.8f;
    }
}
```

Areas are processed by priority: `COMBINE` adds gravity, `REPLACE` replaces it and stops, `COMBINE_REPLACE` adds then stops, and `REPLACE_COMBINE` replaces then continues. `DISABLED` leaves gravity unchanged.
