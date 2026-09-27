import { codeBlocks, gdscriptBlock, writeProject } from '../helpers.mjs';

const checks = `
var failed := false
func check(condition: bool, message: String) -> void:
    if not condition:
        failed = true
        push_error(message)
func finish() -> void:
    if not failed: print("GODOT_EXAMPLES_OK")
    quit(1 if failed else 0)
`;

export default [
  {
    name: 'dimensions physics: paired area and shape recipes enter real physics worlds',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const d of [2, 3]) {
        files[`area${d}.gd`] = await gdscriptBlock(repoRoot, `skills/physics-system/references/${d}d-area-recipes.md`, 'func _on_body_entered');
        files[`gravity${d}.gd`] = await gdscriptBlock(repoRoot, `skills/physics-system/references/${d}d-area-recipes.md`, 'func configure_zero_gravity');
        files[`body${d}.gd`] = await gdscriptBlock(repoRoot, `skills/physics-system/references/${d}d-collision-shapes.md`, 'func teleport_to');
        // The other full physics scripts are parsed against Godot during editor import.
        for (const topic of ['rigidbody-recipes', 'staticbody-recipes', 'raycasting-recipes', 'interpolation-camera']) {
          const blocks = await codeBlocks(repoRoot, `skills/physics-system/references/${d}d-${topic}.md`);
          for (const [index, source] of blocks.entries()) files[`parse_${d}_${topic}_${index}.gd`] = source;
        }
      }
      for (const d of [2, 3]) {
        for (const topic of ['cellular-automata', 'noise-generation']) {
          const blocks = await codeBlocks(repoRoot, `skills/procedural-generation/references/${d}d-${topic}.md`);
          for (const [index, source] of blocks.entries()) {
            files[`parse_${d}_${topic}_${index}.gd`] = /^extends /m.test(source) ? source : `extends Node\n${source}`;
          }
        }
      }
      files['test.gd'] = `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var zone2 = load("res://area2.gd").new()
    var zone3 = load("res://area3.gd").new()
    var shape2 := CollisionShape2D.new()
    shape2.shape = RectangleShape2D.new()
    shape2.shape.size = Vector2(100, 100)
    zone2.add_child(shape2)
    var shape3 := CollisionShape3D.new()
    shape3.shape = BoxShape3D.new()
    shape3.shape.size = Vector3(10, 10, 10)
    zone3.add_child(shape3)
    var body2 = load("res://body2.gd").new()
    var collider2 := CollisionShape2D.new()
    collider2.name = "CollisionShape2D"
    body2.add_child(collider2)
    var body3 = load("res://body3.gd").new()
    var collider3 := CollisionShape3D.new()
    collider3.name = "CollisionShape3D"
    body3.add_child(collider3)
    root.add_child(zone2)
    root.add_child(zone3)
    root.add_child(body2)
    root.add_child(body3)
    await physics_frame
    await physics_frame
    await process_frame
    check(zone2.overlaps_body(body2), "Area2D must detect the sized CharacterBody2D")
    check(zone3.overlaps_body(body3), "Area3D must detect the sized CharacterBody3D")
    check(collider2.shape.size == Vector2(32, 48), "2D shape dimensions must be assigned")
    check(collider3.shape.size == Vector3(1, 2, 1), "3D shape dimensions must be assigned")
    body2.teleport_to(Vector2(500, 600))
    body3.teleport_to(Vector3(50, 60, 70))
    check(body2.global_position == Vector2(500, 600), "2D teleport must preserve both coordinates")
    check(body3.global_position == Vector3(50, 60, 70), "3D teleport must preserve all coordinates")
    var gravity2 = load("res://gravity2.gd").new()
    var gravity3 = load("res://gravity3.gd").new()
    gravity2.configure_point_gravity()
    gravity3.configure_point_gravity()
    check(gravity2.gravity_point and gravity3.gravity_point, "Both area types must support point gravity")
    gravity2.configure_zero_gravity()
    gravity3.configure_zero_gravity()
    check(gravity2.gravity == 0 and gravity3.gravity == 0, "Both area types must support zero gravity")
    var ship2 = load("res://parse_2_rigidbody-recipes_0.gd").new()
    var ship_shape2 := CollisionShape2D.new()
    ship_shape2.shape = RectangleShape2D.new()
    ship2.add_child(ship_shape2)
    ship2.gravity_scale = 0
    var ship3 = load("res://parse_3_rigidbody-recipes_0.gd").new()
    var ship_shape3 := CollisionShape3D.new()
    ship_shape3.shape = BoxShape3D.new()
    ship3.add_child(ship_shape3)
    ship3.gravity_scale = 0
    root.add_child(ship2)
    root.add_child(ship3)
    Input.action_press("ui_right")
    await physics_frame
    await physics_frame
    await physics_frame
    await process_frame
    Input.action_release("ui_right")
    check(ship2.angular_velocity > 0, "Right input must rotate the 2D ship clockwise")
    check(ship3.angular_velocity.y < 0, "Right input must rotate -Z-forward 3D ship toward +X")
    for node in [zone2, zone3, body2, body3, gravity2, gravity3, ship2, ship3]: node.free()
    finish()
`;
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions physics: BSP produces the same connected TileMap and GridMap floor plan',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const d of [2, 3]) {
        const blocks = await codeBlocks(repoRoot, `skills/procedural-generation/references/${d}d-bsp-dungeons.md`);
        files[`bsp${d}.gd`] = blocks.join('\n');
      }
      files['test.gd'] = `extends SceneTree
${checks}
func _initialize() -> void:
    var atlas := TileSetAtlasSource.new()
    atlas.texture = ImageTexture.create_from_image(Image.create(1, 1, false, Image.FORMAT_RGBA8))
    atlas.texture_region_size = Vector2i.ONE
    atlas.create_tile(Vector2i.ZERO)
    var tiles := TileSet.new()
    tiles.tile_size = Vector2i.ONE
    tiles.add_source(atlas, 0)
    var tile_map := TileMapLayer.new()
    tile_map.tile_set = tiles
    var library := MeshLibrary.new()
    library.create_item(0)
    library.set_item_mesh(0, BoxMesh.new())
    var grid_map := GridMap.new()
    grid_map.mesh_library = library
    var bsp2 = load("res://bsp2.gd").new()
    var bsp3 = load("res://bsp3.gd").new()
    for level_seed in [4, 17, 91]:
        tile_map.clear()
        grid_map.clear()
        var rooms2: Array[Rect2i] = bsp2.generate(Rect2i(0, 0, 35, 25), level_seed)
        var rooms3: Array[Rect2i] = bsp3.generate(Rect2i(0, 0, 35, 25), level_seed)
        check(not rooms2.is_empty() and rooms2 == rooms3, "Same seed must produce matching nonempty room layouts")
        bsp2.connect_rooms(tile_map, Vector2i.ZERO)
        bsp3.connect_rooms(grid_map, 0)
        var cells: Array[Vector2i] = tile_map.get_used_cells()
        check(cells.size() == grid_map.get_used_cells().size(), "2D/3D painted floor counts must match")
        for cell in cells:
            check(grid_map.get_cell_item(Vector3i(cell.x, 0, cell.y)) == 0, "Logical Y must map to world-grid Z")
        for room in rooms2:
            check(room.size.x >= 5 and room.size.y >= 5, "BSP must retain minimum interior dimensions")
            for y in range(room.position.y, room.end.y):
                for x in range(room.position.x, room.end.x):
                    check(tile_map.get_cell_source_id(Vector2i(x, y)) == 0, "Room interiors must be painted as well as corridors")
        var visited: Dictionary = {}
        var pending: Array[Vector2i] = [cells[0]]
        while not pending.is_empty():
            var cell: Vector2i = pending.pop_back()
            if visited.has(cell): continue
            visited[cell] = true
            for direction in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
                var next: Vector2i = cell + direction
                if tile_map.get_cell_source_id(next) == 0 and not visited.has(next): pending.append(next)
        check(visited.size() == cells.size(), "Every generated floor cell must be reachable through corridors")
    tile_map.free()
    grid_map.free()
    finish()
`;
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions physics: detached pool recycles 2D and 3D nodes without live idle instances',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'pool.gd': await gdscriptBlock(repoRoot, 'skills/godot-optimization/references/common-memory-management.md', 'class_name ReusableNodePool'),
        'spawner2.gd': await gdscriptBlock(repoRoot, 'skills/godot-optimization/references/2d-pool-placement.md', 'func spawn_effect'),
        'spawner3.gd': await gdscriptBlock(repoRoot, 'skills/godot-optimization/references/3d-pool-placement.md', 'func spawn_effect'),
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    for dimension in [2, 3]:
        var template: Node = Node2D.new() if dimension == 2 else Node3D.new()
        var packed := PackedScene.new()
        check(packed.pack(template) == OK, "Pool test scene must pack")
        template.free()
        var pool := ReusableNodePool.new()
        pool.scene = packed
        pool.capacity = 1
        root.add_child(pool)
        check(pool.get_child_count() == 0, "Available pool nodes must stay detached")
        var spawner = load("res://spawner%d.gd" % dimension).new()
        spawner.pool = pool
        root.add_child(spawner)
        var position = Vector2(12, 34) if dimension == 2 else Vector3(12, 34, 56)
        var first = spawner.spawn_effect(position)
        check(first.is_inside_tree() and first.position == position, "Acquire must place the node before activation")
        check(spawner.spawn_effect(position) == null, "Exhausted pool must return null without recursion")
        pool.release(first)
        check(not first.is_inside_tree(), "Release must remove idle nodes from the world")
        var second = spawner.spawn_effect(position)
        check(second == first, "Acquire after release must reuse the exact instance")
        pool.release(second)
        spawner.free()
        pool.free()
        check(not is_instance_valid(first), "Pool cleanup must free its detached idle nodes")
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions physics: MultiMesh recipes preserve format and local instance coordinates',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const d of [2, 3]) {
        const source = await gdscriptBlock(repoRoot, `skills/godot-optimization/references/${d}d-rendering.md`, 'func build_instances');
        const setter = d === 2 ? 'set_instance_transform_2d' : 'set_instance_transform';
        // The headless renderer has no backing transform storage. Observe the exact
        // arguments passed to the real engine setter without replacing that call.
        files[`instances${d}.gd`] = source.replace('func build_instances()', 'var recorded: Array = []\n\nfunc build_instances()').replace(
          new RegExp(`(        instances\\.${setter}\\(i, (.*)\\))`),
          '$1\n        recorded.append($2)',
        );
      }
      files['noise3.gd'] = await gdscriptBlock(repoRoot, 'skills/procedural-generation/references/3d-noise-generation.md', 'func generate_heightmap');
      files['density3.gd'] = await gdscriptBlock(repoRoot, 'skills/procedural-generation/references/3d-noise-generation.md', 'func is_solid');
      files['test.gd'] = `extends SceneTree
${checks}
func _initialize() -> void:
    var instances2 = load("res://instances2.gd").new()
    instances2.instance_mesh = QuadMesh.new()
    instances2.points = PackedVector2Array([Vector2(10, 20), Vector2(-3, 8)])
    instances2.build_instances()
    check(instances2.multimesh.transform_format == MultiMesh.TRANSFORM_2D, "2D MultiMesh must select Transform2D")
    check(instances2.multimesh.instance_count == 2, "2D MultiMesh count must match points")
    check(instances2.recorded[0].origin == Vector2(10, 20), "2D instance origin must retain its point")
    var instances3 = load("res://instances3.gd").new()
    instances3.instance_mesh = BoxMesh.new()
    instances3.points = PackedVector3Array([Vector3(10, 20, 30), Vector3(-3, 8, 4)])
    instances3.build_instances()
    check(instances3.multimesh.transform_format == MultiMesh.TRANSFORM_3D, "3D MultiMesh must select Transform3D")
    check(instances3.multimesh.instance_count == 2, "3D MultiMesh count must match points")
    check(instances3.recorded[0].origin == Vector3(10, 20, 30), "3D instance origin must retain its point")
    var terrain = load("res://noise3.gd").new()
    var library := MeshLibrary.new()
    library.create_item(0)
    library.set_item_mesh(0, BoxMesh.new())
    terrain.mesh_library = library
    terrain.width = 4
    terrain.depth = 3
    terrain.generate_heightmap()
    var cells = terrain.get_used_cells()
    check(cells.size() == 12, "Noise terrain must create one surface cell per XZ sample")
    terrain.generate_heightmap()
    check(terrain.get_used_cells() == cells, "Regeneration with the same seed must be stable")
    instances2.free()
    instances3.free()
    terrain.free()
    finish()
`;
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
];
