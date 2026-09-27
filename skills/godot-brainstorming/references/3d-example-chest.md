> ← Back to [SKILL.md](../SKILL.md)

# Worked Example: A "Chest" Interactable (3D)

A complete walk-through showing how the brainstorming process turns into code and a documented design entry. The five planning steps (Name & root, Responsibility groups, Node types, Signal map, Reuse candidates) live in SKILL.md Section 2.

Connect InteractionArea body_entered/body_exited in the editor to the named handlers. Assign your game's LootTable resource; it returns an Array[ItemData]. The scene has one local player and an AnimationPlayer clip named `open`.

## Resulting GDScript sketch

```gdscript
# chest.gd
class_name Chest
extends StaticBody3D

signal opened(loot: Array[ItemData])

@export var loot_table: LootTable

var _is_open: bool = false
var _player_nearby: bool = false

@onready var animation_player: AnimationPlayer = $AnimationPlayer
@onready var prompt_label: Label3D = $PromptLabel3D
@onready var interaction_area: Area3D = $InteractionArea


func _unhandled_input(event: InputEvent) -> void:
	if _player_nearby and not _is_open and event.is_action_pressed("interact"):
		_open()


func _open() -> void:
	_is_open = true
	prompt_label.hide()
	animation_player.play("open")
	opened.emit(loot_table.roll())


func _on_area_body_entered(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = true
		prompt_label.show()


func _on_area_body_exited(body: Node3D) -> void:
	if body.is_in_group("player"):
		_player_nearby = false
		prompt_label.hide()
```

## C#

```csharp
// Chest.cs
using Godot;
using System.Collections.Generic;

[GlobalClass]
public partial class Chest : StaticBody3D
{
    [Signal]
    public delegate void OpenedEventHandler(Godot.Collections.Array<ItemData> loot);

    [Export]
    public LootTable LootTable { get; set; }

    private bool _isOpen;
    private bool _playerNearby;

    private AnimationPlayer _animationPlayer;
    private Label3D _promptLabel3D;

    public override void _Ready()
    {
        _animationPlayer = GetNode<AnimationPlayer>("AnimationPlayer");
        _promptLabel3D = GetNode<Label3D>("PromptLabel3D");
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (_playerNearby && !_isOpen && @event.IsActionPressed("interact"))
            Open();
    }

    private void Open()
    {
        _isOpen = true;
        _promptLabel3D.Hide();
        _animationPlayer.Play("open");
        EmitSignal(SignalName.Opened, LootTable.Roll());
    }

    private void OnAreaBodyEntered(Node3D body)
    {
        if (body.IsInGroup("player"))
        {
            _playerNearby = true;
            _promptLabel3D.Show();
        }
    }

    private void OnAreaBodyExited(Node3D body)
    {
        if (body.IsInGroup("player"))
        {
            _playerNearby = false;
            _promptLabel3D.Hide();
        }
    }
}
```

## Design Output Format

Capture your design in a comment block at the top of the root script, or in a `DESIGN.md` file next to the scene. A complete design entry has four parts.

### Scene Tree ASCII Diagram

```
Chest (StaticBody3D)          # root — owns all chest state
├── MeshInstance3D                  # visual: closed or open frame
├── AnimationPlayer           # plays "open" animation
├── CollisionShape3D          # physical body shape
├── InteractionArea (Area3D)  # detects player proximity
│   └── CollisionShape3D      # trigger radius
├── PromptLabel3D (Label3D)       # "Press F to open"
└── (exported LootTable resource, assigned on Chest)
```

### Node Responsibilities

| Node | Responsibility |
|---|---|
| `Chest` | Owns `_is_open` flag; handles `interact` input; emits `opened` |
| `MeshInstance3D` | Displays closed or open texture |
| `AnimationPlayer` | Plays `"open"` clip on first open |
| `InteractionArea` | Emits `body_entered` / `body_exited` to drive prompt visibility |
| `PromptLabel3D` | Shown/hidden by `Chest`; no logic of its own |
| `LootTable` | Rolls and returns `Array[ItemData]`; reused by other interactables |

### Signal Map

| Signal | Source | Consumer | Payload |
|---|---|---|---|
| `body_entered` | `InteractionArea` | `Chest` | `body: Node3D` |
| `body_exited` | `InteractionArea` | `Chest` | `body: Node3D` |
| `animation_finished` | `AnimationPlayer` | `Chest` | `anim_name: StringName` |
| `opened` | `Chest` | `InventorySystem` / `EventBus` | `loot: Array[ItemData]` |

### Data Flow

```
Player enters InteractionArea
  → body_entered fires
  → Chest shows PromptLabel3D

Player presses "interact"
  → Chest._unhandled_input fires
  → Chest._open() called
    → AnimationPlayer plays "open"
    → LootTable.roll() returns items
    → opened signal emits with loot array
      → InventorySystem receives loot
  → PromptLabel3D hidden
  → _is_open = true (prevents re-opening)
```
