# Scene Injection (3D)

Reference for `skills/dependency-injection/SKILL.md` — parent scene injects dependencies into children at `_ready()`. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Scene Injection

A parent scene constructs or loads its children and sets their dependencies in `_ready()`. Children declare what they need via `@export` properties or setter methods; the parent fills them in. Children stay free of hard-coded paths.

**3D movement:** This agent flies in all three axes without gravity; ground navigation belongs in **ai-navigation**. Distances and speeds are world units, not pixels.

**Example: Level injects the player reference into all Enemy children.**

### GDScript

```gdscript
# enemy.gd — declares its dependency; does not go looking for the player
class_name Enemy
extends CharacterBody3D

## Set by the Level scene in _ready(). Enemy will not search for the player itself.
var player: CharacterBody3D = null


func _physics_process(delta: float) -> void:
    if player == null:
        return
    # Move toward the injected player reference
    var direction := (player.global_position - global_position).normalized()
    velocity = direction * 4.0
    move_and_slide()
```

```gdscript
# level.gd — owns both Player and Enemies; injects the reference
extends Node3D

@onready var player: CharacterBody3D = $Player


func _ready() -> void:
    # Inject the player reference into every enemy in the Enemies group
    for enemy in get_tree().get_nodes_in_group("enemies"):
        if enemy is Enemy:
            enemy.player = player
```

### C#

```csharp
using Godot;

// Enemy.cs — receives its dependency; does not search the tree
public partial class Enemy : CharacterBody3D
{
    /// <summary>Set by the Level scene in _Ready(). Do not call GetNode here.</summary>
    public CharacterBody3D Player { get; set; }

    public override void _PhysicsProcess(double delta)
    {
        if (Player == null) return;

        Vector3 direction = (Player.GlobalPosition - GlobalPosition).Normalized();
        Velocity = direction * 4f;
        MoveAndSlide();
    }
}
```

```csharp
using Godot;

// Level.cs — owns Player and Enemies; wires the dependency
public partial class Level : Node3D
{
    private CharacterBody3D _player;

    public override void _Ready()
    {
        _player = GetNode<CharacterBody3D>("Player");

        foreach (Node node in GetTree().GetNodesInGroup("enemies"))
        {
            if (node is Enemy enemy)
                enemy.Player = _player;
        }
    }
}
```

---

