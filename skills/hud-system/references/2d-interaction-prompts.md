# Interaction Prompts (2D)

> ← Back to [SKILL.md](../SKILL.md) · [3D counterpart](3d-interaction-prompts.md)

Use a HUD `Label` to follow an interactable while keeping the text a fixed pixel size. Put it under an untransformed `CanvasLayer` in the same viewport as the world; any intermediate `Control` transforms must also be identity. This recipe uses the main viewport's default world canvas. It accounts for `Camera2D` position and zoom through the viewport canvas transform.

The example displays the first supported key/button binding for an Input Map action named `interact`. Add the player to the `player` group and assign the prompt reference on the interactable. This is a proximity prompt, not an interaction executor: action handling belongs to the player/controller. If several objects overlap, the most recently entered one is selected; a game requiring nearest-target selection should resolve candidates in its interaction controller.

## Screen-space prompt

```gdscript
## interaction_prompt_2d.gd
class_name InteractionPrompt2D
extends Label

@export var offset: Vector2 = Vector2(0.0, -48.0)

var _target: Node2D

func _ready() -> void:
    hide()

func show_for(target: Node2D, action_name: StringName = &"interact") -> void:
    _target = target
    text = "Press %s to interact" % _get_key_label(action_name)
    _process(0.0)

func hide_for(target: Node2D) -> void:
    if _target == target:
        _target = null
        hide()

func _process(_delta: float) -> void:
    if not is_instance_valid(_target):
        hide()
        return
    show()
    global_position = get_viewport().get_canvas_transform() * _target.global_position + offset

func _get_key_label(action_name: StringName) -> String:
    for event in InputMap.action_get_events(action_name):
        if event is InputEventKey:
            return event.as_text_physical_keycode()
        if event is InputEventJoypadButton:
            return event.as_text()
    return "[%s]" % action_name
```

```csharp
using Godot;

public partial class InteractionPrompt2D : Label
{
    [Export] public Vector2 Offset { get; set; } = new(0, -48);

    private Node2D _target;

    public override void _Ready() => Hide();

    public void ShowFor(Node2D target, string actionName = "interact")
    {
        _target = target;
        Text = $"Press {GetKeyLabel(actionName)} to interact";
        _Process(0);
    }

    public void HideFor(Node2D target)
    {
        if (_target == target)
        {
            _target = null;
            Hide();
        }
    }

    public override void _Process(double delta)
    {
        if (!GodotObject.IsInstanceValid(_target))
        {
            Hide();
            return;
        }
        Show();
        GlobalPosition = GetViewport().GetCanvasTransform() * _target.GlobalPosition + Offset;
    }

    private static string GetKeyLabel(string actionName)
    {
        foreach (var ev in InputMap.ActionGetEvents(actionName))
        {
            if (ev is InputEventKey key)
                return key.AsTextPhysicalKeycode();
            if (ev is InputEventJoypadButton button)
                return button.AsText();
        }
        return $"[{actionName}]";
    }
}
```

## Interactable area

Attach this to an `Area2D` with a `CollisionShape2D` child. Set its collision mask to include the player's physics body layer and enable monitoring.

```gdscript
## interactable_2d.gd
extends Area2D

@export var prompt: InteractionPrompt2D

func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node2D) -> void:
    if body.is_in_group("player"):
        prompt.show_for(self)

func _on_body_exited(body: Node2D) -> void:
    if body.is_in_group("player"):
        prompt.hide_for(self)
```

```csharp
using Godot;

public partial class Interactable2D : Area2D
{
    [Export] public InteractionPrompt2D Prompt { get; set; }

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }

    private void OnBodyEntered(Node2D body)
    {
        if (body.IsInGroup("player"))
            Prompt.ShowFor(this);
    }

    private void OnBodyExited(Node2D body)
    {
        if (body.IsInGroup("player"))
            Prompt.HideFor(this);
    }
}
```

A `Label` parented to the world `Node2D` is an alternative when the label should move and scale with the world. Leave `top_level` disabled to retain its parent transform; place it at a local offset above the object.
