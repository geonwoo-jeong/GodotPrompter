# World Transform Tweens (3D)

[Common Tween guide](../SKILL.md) · [2D counterpart](2d-world-motion.md)

Attach this to a Node3D. Targets are in the node's parent-local space. Replace the current motion tween before retargeting so two tweens never compete for position. For a collision-controlled CharacterBody, drive velocity in physics processing instead of tweening through obstacles.

```gdscript
extends Node3D

var motion: Tween

func move_to(target: Vector3, duration: float = 0.3) -> Tween:
    if motion:
        motion.kill()
    motion = create_tween()
    motion.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
    motion.tween_property(self, "position", target, duration)
    return motion
```

```csharp
using Godot;

public partial class WorldMotion3D : Node3D
{
    private Tween _motion;

    public Tween MoveTo(Vector3 target, float duration = 0.3f)
    {
        _motion?.Kill();
        _motion = CreateTween();
        _motion.SetTrans(Tween.TransitionType.Cubic).SetEase(Tween.EaseType.Out);
        _motion.TweenProperty(this, "position", target, duration);
        return _motion;
    }
}
```

Node3D rotation and scale are Vector3. For a single-axis turn, tween `rotation:y`; choose the nearest equivalent angle if crossing the ±π boundary. Node3D has no `modulate`: for fading a mesh, animate a unique transparent material or a shader uniform. For a world-space sprite use Sprite3D.modulate.

UI Control tweens remain shared between 2D and 3D games. For camera shake use the dimension-appropriate **camera-system** reference. For fading/dissolving, use the [shader recipes](../../shader-basics/references/3d-shader-recipes.md).
