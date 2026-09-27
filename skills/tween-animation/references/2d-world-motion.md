# World Transform Tweens (2D)

[Common Tween guide](../SKILL.md) · [3D counterpart](3d-world-motion.md)

Attach this to a Node2D. Targets are in the node's parent-local space. Replace the current motion tween before retargeting so two tweens never compete for position. For a collision-controlled CharacterBody, drive velocity in physics processing instead of tweening through obstacles.

```gdscript
extends Node2D

var motion: Tween

func move_to(target: Vector2, duration: float = 0.3) -> Tween:
    if motion:
        motion.kill()
    motion = create_tween()
    motion.set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
    motion.tween_property(self, "position", target, duration)
    return motion
```

```csharp
using Godot;

public partial class WorldMotion2D : Node2D
{
    private Tween _motion;

    public Tween MoveTo(Vector2 target, float duration = 0.3f)
    {
        _motion?.Kill();
        _motion = CreateTween();
        _motion.SetTrans(Tween.TransitionType.Cubic).SetEase(Tween.EaseType.Out);
        _motion.TweenProperty(this, "position", target, duration);
        return _motion;
    }
}
```

Node2D rotation is a scalar in radians and its scale is Vector2. CanvasItem alpha uses `modulate:a`.

UI Control tweens remain shared between 2D and 3D games. For camera shake use the dimension-appropriate **camera-system** reference. For fading/dissolving, use the [shader recipes](../../shader-basics/references/2d-shader-recipes.md).
