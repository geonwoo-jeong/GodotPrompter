# Runtime Scene Loading (2D)

[Back](../SKILL.md). The PackedScene root must be Node2D. These methods belong to a Node script; add_child keeps the authored local transform.

## Runtime Scene Loading

```gdscript
# Preload at compile time (known path)
const ENEMY_SCENE: PackedScene = preload("res://scenes/enemy.tscn")

# Load at runtime (path from data)
func spawn_sprite_scene(path: String) -> Node2D:
    var scene: PackedScene = load(path)
    var instance: Node2D = scene.instantiate()
    add_child(instance)
    return instance
```

```csharp
private static readonly PackedScene EnemyScene = GD.Load<PackedScene>("res://scenes/enemy.tscn");

public Node2D SpawnSpriteScene(string path)
{
    var scene = GD.Load<PackedScene>(path);
    var instance = scene.Instantiate<Node2D>();
    AddChild(instance);
    return instance;
}
```

