# Sprite Hit Flash (2D)

[Common animation guide](../SKILL.md) · [3D counterpart](3d-hit-flash.md)

## Hit Flash (Modulate Tween)

```gdscript
@onready var _sprite: Sprite2D = $Sprite2D

func flash_hit() -> void:
    var tween := create_tween()
    tween.tween_property(_sprite, "modulate", Color(3.0, 3.0, 3.0, 1.0), 0.05)
    tween.tween_property(_sprite, "modulate", Color.WHITE, 0.1)
```

```csharp
public void FlashHit()
{
    var tween = CreateTween();
    tween.TweenProperty(_sprite, "modulate", new Color(3f, 3f, 3f, 1f), 0.05);
    tween.TweenProperty(_sprite, "modulate", Colors.White, 0.1);
}
```

For a true white-out flash that overrides the sprite texture, use a `canvas_item` shader with a `flash_amount` uniform — see **shader-basics**.


Attach this to a Node with a Sprite2D child. In C#, declare `private Sprite2D _sprite;` and initialize it with `GetNode<Sprite2D>("Sprite2D")` in `_Ready()`.
