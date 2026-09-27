# Damage Number Label (Common)

A screen-space `Label` shared by the [2D spawner](2d-damage-numbers.md) and [3D spawner](3d-damage-numbers.md). Save this root as a `PackedScene` and assign it to the chosen spawner. The animation keeps pooled instances alive, cancels interrupted tweens, and resets opacity on reuse.

> ← Back to [SKILL.md](../SKILL.md)

## Reusable Label scene

```gdscript
## damage_number.gd — attach to a Label; root of a small PackedScene
class_name DamageNumber
extends Label

## Pixels to travel upward during the animation.
@export var rise_distance: float = 40.0

## Duration (seconds) for the full rise-and-fade.
@export var lifetime: float = 0.7

## Optional: tint critical hits differently before spawning.
@export var critical_color: Color = Color(1.0, 0.3, 0.1)
@export var normal_color: Color   = Color(1.0, 1.0, 1.0)

var _tween: Tween


func show_damage(amount: int, is_critical: bool = false) -> void:
    # Reuse can interrupt an animation; cancel its motion and completion callback.
    if _tween:
        _tween.kill()
    text           = str(amount) if not is_critical else "!" + str(amount)
    add_theme_font_size_override("font_size", 24 if not is_critical else 32)
    modulate       = critical_color if is_critical else normal_color
    modulate.a     = 1.0
    show()
    _play_animation()


func _play_animation() -> void:
    _tween = create_tween()
    _tween.set_parallel(true)

    # Rise upward
    _tween.tween_property(self, "position:y", position.y - rise_distance, lifetime) \
        .set_ease(Tween.EASE_OUT) \
        .set_trans(Tween.TRANS_QUAD)

    # Fade out (start fading at halfway point)
    _tween.tween_property(self, "modulate:a", 0.0, lifetime * 0.5) \
        .set_delay(lifetime * 0.5) \
        .set_ease(Tween.EASE_IN)

    _tween.finished.connect(hide)
```



```csharp
// DamageNumber.cs — attach to a Label; root of a small PackedScene
using Godot;

public partial class DamageNumber : Label
{
    [Export] public float RiseDistance { get; set; } = 40.0f;
    [Export] public float Lifetime { get; set; } = 0.7f;
    [Export] public Color CriticalColor { get; set; } = new(1.0f, 0.3f, 0.1f);
    [Export] public Color NormalColor { get; set; } = new(1.0f, 1.0f, 1.0f);

    private Tween _tween;

    public void ShowDamage(int amount, bool isCritical = false)
    {
        // Reuse cancels both the previous animation and its completion callback.
        _tween?.Kill();
        Text = isCritical ? $"!{amount}" : amount.ToString();
        AddThemeFontSizeOverride("font_size", isCritical ? 32 : 24);
        Modulate = new Color(isCritical ? CriticalColor : NormalColor, 1.0f);
        Show();
        PlayAnimation();
    }

    private void PlayAnimation()
    {
        _tween = CreateTween();
        _tween.SetParallel(true);

        // Rise upward
        _tween.TweenProperty(this, "position:y", Position.Y - RiseDistance, Lifetime)
            .SetEase(Tween.EaseType.Out)
            .SetTrans(Tween.TransitionType.Quad);

        // Fade out (start fading at halfway point)
        _tween.TweenProperty(this, "modulate:a", 0.0f, Lifetime * 0.5f)
            .SetDelay(Lifetime * 0.5f)
            .SetEase(Tween.EaseType.In);

        _tween.Finished += Hide;
    }
}
```

**Pool notes:** The simple modular pool above may replace a still-visible number when all slots are busy. Each spawn resets its position, text, font size, color, and opacity, and cancels the old tween so it cannot move or hide the new number. Increase the pool size or track available instances with a free list if early replacement is undesirable. For a non-pooled variant, instantiate on every hit and use `queue_free` / `QueueFree` on completion instead of hiding; never combine that lifetime with this retained-reference pool.

---
