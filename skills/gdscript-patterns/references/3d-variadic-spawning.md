# Variadic Spawning (3D)

[Back](../SKILL.md). Requires Godot 4.5+. A Node3D container spawns matching scene roots at supplied world positions. Convert positions to the container's local coordinates before adding children so their _ready() sees the intended transform. See the common variadic reference for language rules.

```gdscript
extends Node3D

func spawn_enemies(scene: PackedScene, ...positions: Array) -> void:
    for world_position: Vector3 in positions:
        var enemy: Node3D = scene.instantiate()
        enemy.position = to_local(world_position)
        add_child(enemy)
```
