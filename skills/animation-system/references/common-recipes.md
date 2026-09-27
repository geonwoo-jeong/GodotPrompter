# Common Animation Recipes (Common)

Reference for `skills/animation-system/SKILL.md` — gameplay-flavored animation recipes.

> ← Back to [SKILL.md](../SKILL.md)

---

The controller only needs an AnimationPlayer child. It works on an independent Node beneath either a 2D or 3D character. Dimension-specific hit feedback: [2D sprite](2d-hit-flash.md), [3D mesh](3d-hit-flash.md).

## Attack Combo

Chain attacks within a buffer window. The Call Method track on each attack animation calls `open_combo_window()` near the end of the swing.

```gdscript
extends Node

@onready var anim_player: AnimationPlayer = $AnimationPlayer

var _combo_step: int = 0
var _combo_window: bool = false

func _ready() -> void:
    anim_player.animation_finished.connect(_on_animation_finished)

func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("attack"):
        if _combo_step == 0:
            _combo_step = 1
            anim_player.play("attack_1")
        elif _combo_window:
            _combo_step += 1
            _combo_window = false
            if _combo_step <= 3:
                anim_player.play("attack_%d" % _combo_step)
            else:
                _reset_combo()

func open_combo_window() -> void:        # called by Call Method track
    _combo_window = true

func _reset_combo() -> void:
    _combo_step = 0
    _combo_window = false

func _on_animation_finished(anim_name: StringName) -> void:
    if anim_name.begins_with("attack"):
        _reset_combo()
        anim_player.play("idle")
```

```csharp
public partial class ComboAnimation : Node
{
    private AnimationPlayer _animPlayer;
    private int _comboStep;
    private bool _comboWindow;

    public override void _Ready()
    {
        _animPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        _animPlayer.AnimationFinished += OnAnimationFinished;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (!@event.IsActionPressed("attack"))
            return;

        if (_comboStep == 0)
        {
            _comboStep = 1;
            _animPlayer.Play("attack_1");
        }
        else if (_comboWindow)
        {
            _comboStep++;
            _comboWindow = false;
            if (_comboStep <= 3)
                _animPlayer.Play($"attack_{_comboStep}");
            else
                ResetCombo();
        }
    }

    // Called by the Call Method track. Must be public — the track resolves it by name.
    public void OpenComboWindow() => _comboWindow = true;

    private void ResetCombo()
    {
        _comboStep = 0;
        _comboWindow = false;
    }

    private void OnAnimationFinished(StringName animName)
    {
        if (animName.ToString().StartsWith("attack"))
        {
            ResetCombo();
            _animPlayer.Play("idle");
        }
    }
}
```
