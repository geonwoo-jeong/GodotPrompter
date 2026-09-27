# Runtime Scene Loading (3D)

[Back](../SKILL.md). The PackedScene root must be Node3D. These methods belong to a Node script; add_child keeps the authored local transform.

## Runtime Scene Loading

```gdscript
# Preload at compile time (known path)
const ENEMY_SCENE: PackedScene = preload("res://models/enemy.glb")

# Load at runtime (path from data)
func spawn_model(path: String) -> Node3D:
    var scene: PackedScene = load(path)
    var instance: Node3D = scene.instantiate()
    add_child(instance)
    return instance
```

```csharp
private static readonly PackedScene EnemyScene = GD.Load<PackedScene>("res://models/enemy.glb");

public Node3D SpawnModel(string path)
{
    var scene = GD.Load<PackedScene>(path);
    var instance = scene.Instantiate<Node3D>();
    AddChild(instance);
    return instance;
}
```

