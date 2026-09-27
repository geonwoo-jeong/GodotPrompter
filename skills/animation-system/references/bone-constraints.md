# BoneConstraint3D Modifiers

Reference for `skills/animation-system/SKILL.md` — Godot 4.5+ `BoneConstraint3D` subclasses (Aim / Copy / Convert) for bone-relative skeleton modifiers.

> ← Back to [SKILL.md](../SKILL.md)

---

## BoneConstraint3D Modifiers (Godot 4.5+)

Godot 4.5 introduces `BoneConstraint3D` — a new base class for skeleton modifiers that operate relative to another bone rather than a world-space target. Three concrete subclasses ship with 4.5:

| Modifier | What it does |
|----------|-------------|
| `AimModifier3D` | Rotates a bone to aim along its primary axis toward a reference bone |
| `CopyTransformModifier3D` | Copies position/rotation/scale from one bone to another (useful for mirroring or binding secondary rigs) |
| `ConvertTransformModifier3D` | Converts between transform spaces — translates, rotates, or scales a bone based on another bone's transform, with remapping |

These complement `LookAtModifier3D` (which targets a world-space `Node3D`). Use `AimModifier3D` when the aim target is itself a bone on the same skeleton.

The examples below use the indexed settings API, checked on Godot 4.7.2. Allocate a setting with `set_setting_count(1)`, then configure entry `0`. These modifiers do not have flat `bone_name` or `source_bone_name` properties.

**Scene structure:**

```
Character (CharacterBody3D)
└── Skeleton3D
    ├── AimModifier3D         ← child of Skeleton3D
    └── CopyTransformModifier3D
```

**AimModifier3D — bone-to-bone aiming:**

```gdscript
@onready var skeleton: Skeleton3D = $Skeleton3D

func _ready() -> void:
    var aim := AimModifier3D.new()
    skeleton.add_child(aim)
    aim.set_setting_count(1)
    aim.set_apply_bone_name(0, "RightArm")      # bone that aims
    aim.set_reference_bone_name(0, "RightHand") # bone it aims toward
    aim.set_use_euler(0, true)
    aim.set_primary_rotation_axis(0, Vector3.AXIS_X)
```

```csharp
public override void _Ready()
{
    var skeleton = GetNode<Skeleton3D>("Skeleton3D");
    var aim = new AimModifier3D();
    skeleton.AddChild(aim);
    aim.SetSettingCount(1);
    aim.SetApplyBoneName(0, "RightArm");
    aim.SetReferenceBoneName(0, "RightHand");
    aim.SetUseEuler(0, true);
    aim.SetPrimaryRotationAxis(0, Vector3.Axis.X);
}
```

`AimModifier3D` does not provide angle limits or time-based interpolation. For bounded head/eye tracking, use `LookAtModifier3D` and its angle-limit properties; see [skeleton-modifiers.md](skeleton-modifiers.md).

**CopyTransformModifier3D — mirror/bind bones:**

```gdscript
@onready var skeleton: Skeleton3D = $Skeleton3D

func _ready() -> void:
    var copy := CopyTransformModifier3D.new()
    skeleton.add_child(copy)
    copy.set_setting_count(1)
    copy.set_apply_bone_name(0, "LeftArm")      # bone receiving the transform
    copy.set_reference_bone_name(0, "RightArm") # bone being copied
    copy.set_copy_position(0, false)
    copy.set_copy_rotation(0, true)
    copy.set_copy_scale(0, false)
```

```csharp
var skeleton = GetNode<Skeleton3D>("Skeleton3D");
var copy = new CopyTransformModifier3D();
skeleton.AddChild(copy);
copy.SetSettingCount(1);
copy.SetApplyBoneName(0, "LeftArm");
copy.SetReferenceBoneName(0, "RightArm");
copy.SetCopyPosition(0, false);
copy.SetCopyRotation(0, true);
copy.SetCopyScale(0, false);
```

> **API references:** [BoneConstraint3D](https://docs.godotengine.org/en/4.7/classes/class_boneconstraint3d.html), [AimModifier3D](https://docs.godotengine.org/en/4.7/classes/class_aimmodifier3d.html), and [CopyTransformModifier3D](https://docs.godotengine.org/en/4.7/classes/class_copytransformmodifier3d.html). When targeting an older engine, check that version's class reference.

> **When to use:** Prefer `BoneConstraint3D` subclasses over manual bone transform manipulation in `_process()` — they integrate with the modifier pipeline and respect the animation blend stack.
