# Interaction Prompts (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-interaction-prompts.md)

Use a HUD `Label` to follow an interactable while keeping the text a fixed pixel size. Put it under an untransformed `CanvasLayer` in the same viewport as the world; any intermediate `Control` transforms must also be identity. Assign the gameplay `Camera3D` in the Inspector. A target behind it is hidden, then becomes visible again when the camera turns back. Projection does not check wall occlusion; add a physics visibility query if the interaction design requires it.

The example displays the first supported key/button binding for an Input Map action named `interact`. Add the player to the `player` group and assign the prompt reference on the interactable. This is a proximity prompt, not an interaction executor: action handling belongs to the player/controller. If several objects overlap, the most recently entered one is selected; a game requiring nearest-target selection should resolve candidates in its interaction controller.

## Screen-space prompt

```gdscript
## interaction_prompt_3d.gd
class_name InteractionPrompt3D
extends Label

@export var offset: Vector2 = Vector2(0.0, -48.0)
@export var camera: Camera3D

var _target: Node3D

func _ready() -> void:
    hide()

func show_for(target: Node3D, action_name: StringName = &"interact") -> void:
    _target = target
    text = "Press %s to interact" % _get_key_label(action_name)
    _process(0.0)

func hide_for(target: Node3D) -> void:
    if _target == target:
        _target = null
        hide()

func _process(_delta: float) -> void:
    if not is_instance_valid(_target):
        hide()
        return
    visible = not camera.is_position_behind(_target.global_position)
    if visible:
        global_position = camera.unproject_position(_target.global_position) + offset

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

public partial class InteractionPrompt3D : Label
{
    [Export] public Vector2 Offset { get; set; } = new(0, -48);
    [Export] public Camera3D Camera { get; set; }

    private Node3D _target;

    public override void _Ready() => Hide();

    public void ShowFor(Node3D target, string actionName = "interact")
    {
        _target = target;
        Text = $"Press {GetKeyLabel(actionName)} to interact";
        _Process(0);
    }

    public void HideFor(Node3D target)
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
        Visible = !Camera.IsPositionBehind(_target.GlobalPosition);
        if (Visible)
            GlobalPosition = Camera.UnprojectPosition(_target.GlobalPosition) + Offset;
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

Attach this to an `Area3D` with a `CollisionShape3D` child. Set its collision mask to include the player's physics body layer and enable monitoring.

```gdscript
## interactable_3d.gd
extends Area3D

@export var prompt: InteractionPrompt3D

func _ready() -> void:
    body_entered.connect(_on_body_entered)
    body_exited.connect(_on_body_exited)

func _on_body_entered(body: Node3D) -> void:
    if body.is_in_group("player"):
        prompt.show_for(self)

func _on_body_exited(body: Node3D) -> void:
    if body.is_in_group("player"):
        prompt.hide_for(self)
```

```csharp
using Godot;

public partial class Interactable3D : Area3D
{
    [Export] public InteractionPrompt3D Prompt { get; set; }

    public override void _Ready()
    {
        BodyEntered += OnBodyEntered;
        BodyExited += OnBodyExited;
    }

    private void OnBodyEntered(Node3D body)
    {
        if (body.IsInGroup("player"))
            Prompt.ShowFor(this);
    }

    private void OnBodyExited(Node3D body)
    {
        if (body.IsInGroup("player"))
            Prompt.HideFor(this);
    }
}
```

A `Label3D` parented to the interactable is an alternative when the label should exist in the 3D world and participate in depth testing. Enable billboard mode if it should face the camera.
