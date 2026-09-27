# Variadic Spawning (2D)

[Back](../SKILL.md). Requires Godot 4.5+. A Node2D container spawns matching scene roots at supplied world positions. Convert positions to the container's local coordinates before adding children so their _ready() sees the intended transform. See the common variadic reference for language rules.

```gdscript
extends Node2D

func spawn_enemies(scene: PackedScene, ...positions: Array) -> void:
    for world_position: Vector2 in positions:
        var enemy: Node2D = scene.instantiate()
        enemy.position = to_local(world_position)
        add_child(enemy)
```
