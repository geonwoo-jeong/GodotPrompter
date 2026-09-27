import { gdscriptBlock, writeProject } from '../helpers.mjs';

export default [
  ...['2d', '3d'].map(dimension => ({
    name: `dimensions-core: ${dimension} save restores all position coordinates and inventory`,
    async setup({ repoRoot, projectDir }) {
      const type = dimension === '2d' ? 'Node2D' : 'Node3D';
      const position = dimension === '2d' ? 'Vector2(12, -7)' : 'Vector3(12, -7, 43)';
      const zero = dimension === '2d' ? 'Vector2.ZERO' : 'Vector3.ZERO';
      const manager = await gdscriptBlock(repoRoot, `skills/save-load/references/${dimension}-json-saves.md`, '# save_manager.gd');
      await writeProject(projectDir, {
        'save_manager.gd': manager.replace('user://saves/', 'res://saves/'),
        'player.gd': `extends ${type}\nvar health := 80\nvar inventory: Array = ["sword"]\n`,
        'test.gd': `extends SceneTree
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var world := Node.new()
    root.add_child(world)
    world.add_to_group("world")
    var player = load("res://player.gd").new()
    world.add_child(player)
    player.add_to_group("player")
    player.global_position = ${position}
    var manager = load("res://save_manager.gd").new()
    root.add_child(manager)
    assert(manager.save_game("roundtrip"))
    player.global_position = ${zero}
    player.health = 1
    player.inventory.clear()
    assert(manager.load_game("roundtrip"))
    assert(player.global_position == ${position}, "The dimension-specific JSON format must retain every axis")
    assert(player.health == 80 and player.inventory == ["sword"])
    manager.free()
    world.free()
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  })),
  ...['2d', '3d'].map(dimension => ({
    name: `dimensions-core: ${dimension} runtime scene loading preserves root and local transform`,
    async setup({ repoRoot, projectDir }) {
      const type = dimension === '2d' ? 'Node2D' : 'Node3D';
      const vector = dimension === '2d' ? 'Vector2(2, 3)' : 'Vector3(2, 3, 4)';
      const method = dimension === '2d' ? 'spawn_sprite_scene' : 'spawn_model';
      const code = await gdscriptBlock(repoRoot, `skills/assets-pipeline/references/${dimension}-runtime-scene-loading.md`, `func ${method}`);
      await writeProject(projectDir, {
        // Bind the documented compile-time asset to the fixture; retain its method unchanged.
        'loader.gd': 'extends Node\n' + code.replace(/preload\("[^"]+"\)/, 'preload("res://scene.tscn")'),
        'scene.tscn': `[gd_scene format=3]\n[node name="Instance" type="${type}"]\nposition = ${vector}\n`,
        'test.gd': `extends SceneTree
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var loader = load("res://loader.gd").new()
    root.add_child(loader)
    var instance = loader.${method}("res://scene.tscn")
    assert(instance is ${type} and instance.get_parent() == loader)
    assert(instance.position == ${vector})
    loader.free()
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  })),
  ...['2d', '3d'].map(dimension => ({
    name: `dimensions-core: ${dimension} variadic spawning converts world coordinates before ready`,
    async setup({ repoRoot, projectDir }) {
      const type = dimension === '2d' ? 'Node2D' : 'Node3D';
      const vector = dimension === '2d' ? 'Vector2(20, 40)' : 'Vector3(20, 40, 60)';
      const offset = dimension === '2d' ? 'Vector2(3, 5)' : 'Vector3(3, 5, 7)';
      await writeProject(projectDir, {
        'spawner.gd': await gdscriptBlock(repoRoot, `skills/gdscript-patterns/references/${dimension}-variadic-spawning.md`, 'func spawn_enemies'),
        'enemy.gd': `extends ${type}\nvar ready_position\nfunc _ready() -> void: ready_position = global_position\n`,
        'test.gd': `extends SceneTree
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var container = load("res://spawner.gd").new()
    container.position = ${offset}
    root.add_child(container)
    var enemy = load("res://enemy.gd").new()
    var scene := PackedScene.new()
    assert(scene.pack(enemy) == OK)
    enemy.free()
    container.spawn_enemies(scene, ${vector}, -${vector})
    assert(container.get_child_count() == 2)
    assert(container.get_child(0).ready_position == ${vector})
    assert(container.get_child(1).ready_position == -${vector})
    container.free()
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  })),
  {
    name: 'dimensions-core: 3d abstract hierarchy spawns a typed projectile at the actor position',
    async setup({ repoRoot, projectDir }) {
      const source = 'skills/gdscript-patterns/references/3d-abstract-classes.md';
      await writeProject(projectDir, {
        'base_enemy.gd': await gdscriptBlock(repoRoot, source, '# base_enemy.gd'),
        'ranged_enemy.gd': await gdscriptBlock(repoRoot, source, '# ranged_enemy.gd'),
        'test.gd': `extends SceneTree
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var actor := RangedEnemy.new()
    root.add_child(actor)
    actor.position = Vector3(3, 5, 7)
    var projectile := Node3D.new()
    var scene := PackedScene.new()
    assert(scene.pack(projectile) == OK)
    projectile.free()
    actor.projectile_scene = scene
    actor.perform_attack()
    var spawned := root.get_child(root.get_child_count() - 1)
    assert(spawned is Node3D and spawned.global_position == actor.global_position)
    actor.take_damage(10)
    assert(actor.health == 90)
    spawned.free()
    actor.free()
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
];
