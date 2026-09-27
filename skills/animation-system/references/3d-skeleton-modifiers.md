# Skeleton Modifiers (3D)

Reference for `skills/animation-system/SKILL.md` — procedural skeleton modifiers (4.4+): `LookAtModifier3D`, `SpringBoneSimulator3D`.

> ← Back to [SKILL.md](../SKILL.md)

---

## LookAtModifier3D (Godot 4.4+)

Procedurally rotates a bone to look at a world-space target. Ideal for head tracking and eye contact without extra animation clips.

```
Skeleton3D
└── LookAtModifier3D
    (bone_name = "Head", target_node points to LookTarget)
```

```gdscript
@onready var look_at: LookAtModifier3D = $Skeleton3D/LookAtModifier3D

func _ready() -> void:
    look_at.bone_name = "Head"
    look_at.target_node = $"../LookTarget".get_path()
    look_at.use_angle_limitation = true
    look_at.symmetry_limitation = true
    look_at.primary_limit_angle = deg_to_rad(45.0)
    look_at.secondary_limit_angle = deg_to_rad(70.0)

func stop_looking() -> void:
    look_at.influence = 0.0  # blend back to animation
```

```csharp
_lookAt = GetNode<LookAtModifier3D>("Skeleton3D/LookAtModifier3D");
_lookAt.BoneName = "Head";
_lookAt.TargetNode = GetNode("../LookTarget").GetPath();
_lookAt.UseAngleLimitation = true;
_lookAt.SymmetryLimitation = true;
_lookAt.PrimaryLimitAngle = Mathf.DegToRad(45f);
_lookAt.SecondaryLimitAngle = Mathf.DegToRad(70f);
```

`symmetry_limitation` is a boolean: it applies equal positive and negative limits. Set the actual angles in `primary_limit_angle` and `secondary_limit_angle` (radians), not in that flag.

## SpringBoneSimulator3D (Godot 4.4+)

Simulates spring physics on bones — hair, capes, tails, antennas bounce and sway procedurally. Add `SpringBoneSimulator3D` as child of `Skeleton3D`, configure spring chains in the Inspector (root bone, end bone, stiffness, damping, gravity, drag).

| Property    | Effect                                                   |
|-------------|----------------------------------------------------------|
| `Stiffness` | How strongly the bone returns to rest (higher = stiffer) |
| `Damping`   | How quickly oscillations settle (higher = less bouncy)   |
| `Gravity`   | Downward pull on the chain                               |
| `Drag`      | Air resistance (slows movement)                          |

> **Tip:** Start with Stiffness 5.0, Damping 0.5, Gravity 1.0 for hair. Increase Stiffness to 15+ for stiff antennas.
