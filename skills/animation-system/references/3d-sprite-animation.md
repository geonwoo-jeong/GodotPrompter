# Sprite Frame Animation (3D)

Reference for `skills/animation-system/SKILL.md` — billboard sprite animation inside a 3D world: `AnimatedSprite3D` vs `AnimationPlayer + Sprite3D`.

> ← Back to [SKILL.md](../SKILL.md)

---

Use a `CharacterBody3D` with a collision shape and an `AnimatedSprite3D` child. Configure `SpriteFrames` with `idle`/`walk`, set billboard mode in the Inspector, and choose `pixel_size` for your world scale. This example moves on a flat XZ plane without gravity; a grounded controller must preserve vertical velocity. Camera-facing billboards are flat artwork in a 3D world, not skeletal mesh animation.

[2D counterpart](2d-sprite-animation.md).

## AnimatedSprite3D vs AnimationPlayer + Sprite3D

| Approach                       | Pros                                          | Cons                                        |
|--------------------------------|-----------------------------------------------|---------------------------------------------|
| `AnimatedSprite3D`             | Quick setup, built-in SpriteFrames editor     | Frames only; no property tracks             |
| `AnimationPlayer` + `Sprite3D` | Full property animation, method calls, audio  | More setup, need to keyframe region/frame   |

**Use AnimatedSprite3D** for simple characters with only frame animations. **Use AnimationPlayer** when you also need to animate hitboxes, particles, sounds, or other properties in sync.

```gdscript
extends CharacterBody3D

@onready var sprite: AnimatedSprite3D = $AnimatedSprite3D

func _physics_process(delta: float) -> void:
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    if input_dir != Vector2.ZERO:
        velocity = Vector3(input_dir.x, 0.0, input_dir.y) * 5.0
        sprite.play("walk")
        if input_dir.x != 0.0:
            sprite.flip_h = input_dir.x < 0.0
    else:
        velocity = Vector3.ZERO
        sprite.play("idle")

    move_and_slide()
```

```csharp
using Godot;

public partial class BillboardCharacter3D : CharacterBody3D
{
    private AnimatedSprite3D _sprite;

    public override void _Ready()
    {
        _sprite = GetNode<AnimatedSprite3D>("AnimatedSprite3D");
    }

    public override void _PhysicsProcess(double delta)
    {
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        if (inputDir != Vector2.Zero)
        {
            Velocity = new Vector3(inputDir.X, 0.0f, inputDir.Y) * 5.0f;
            _sprite.Play("walk");
            if (inputDir.X != 0.0f)
                _sprite.FlipH = inputDir.X < 0.0f;
        }
        else
        {
            Velocity = Vector3.Zero;
            _sprite.Play("idle");
        }

        MoveAndSlide();
    }
}
```
