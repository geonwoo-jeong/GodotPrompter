# Skeletal Animation (2D)

[Common animation guide](../SKILL.md) · [3D skeletal modifiers](3d-skeleton-modifiers.md)

For a cutout character, create a Skeleton2D with a Bone2D hierarchy, bind Polygon2D vertices to those bones, and keyframe bone transforms in AnimationPlayer. AnimationTree can blend those AnimationPlayer tracks just as it blends 3D animation. Set bone rest poses after arranging the hierarchy.

This example rotates a Bone2D in its local XY plane. Attach it to the Skeleton2D and create an `Arm` Bone2D child; don't animate the same property from AnimationPlayer and a Tween simultaneously.

```gdscript
extends Skeleton2D

@onready var arm: Bone2D = $Arm
var arm_tween: Tween

func point_arm(angle_radians: float) -> void:
    if arm_tween:
        arm_tween.kill()
    arm_tween = create_tween()
    arm_tween.tween_property(arm, "rotation", angle_radians, 0.15)
```

```csharp
using Godot;

public partial class CutoutSkeleton2D : Skeleton2D
{
    private Bone2D _arm;
    private Tween _armTween;
    public override void _Ready() => _arm = GetNode<Bone2D>("Arm");
    public void PointArm(float angleRadians)
    {
        _armTween?.Kill();
        _armTween = CreateTween();
        _armTween.TweenProperty(_arm, "rotation", angleRadians, 0.15);
    }
}
```

`SkeletonModifier3D`, humanoid glTF retargeting, and the 3D IK solver classes do not become 2D APIs by changing their suffix. Godot's separate SkeletonModification2D API is experimental; check the target engine version before choosing it. For straightforward cutout animation, author bone tracks first.
