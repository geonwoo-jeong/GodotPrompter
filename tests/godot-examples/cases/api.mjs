import { codeBlocks, gdscriptBlock, writeProject } from '../helpers.mjs';

const indent = source => source.split('\n').map(line => `    ${line}`).join('\n');
const assertion = `
func expect(condition: bool, message: String) -> bool:
    if not condition:
        push_error(message)
        quit(1)
    return condition
`;

export default [
  {
    name: 'api: abstract enemy classes parse and concrete subclasses share behavior',
    async setup({ repoRoot, projectDir }) {
      const blocks = await codeBlocks(repoRoot, 'skills/gdscript-patterns/references/abstract-classes.md');
      await writeProject(projectDir, {
        'base_enemy.gd': blocks[0],
        'melee_enemy.gd': blocks[1],
        'ranged_enemy.gd': blocks[2],
        'test.gd': `extends SceneTree
${assertion}
func _initialize() -> void:
    var base_script: Script = load("res://base_enemy.gd")
    if not expect(base_script.is_abstract(), "Base script must be declared abstract"): return
    var melee := MeleeEnemy.new()
    var ranged := RangedEnemy.new()
    melee.take_damage(25)
    ranged.take_damage(40)
    var valid := melee.health == 75 and ranged.health == 60
    valid = valid and melee.get_display_name() == "Melee Enemy"
    valid = valid and ranged.get_display_name() == "Ranged Enemy"
    melee.free()
    ranged.free()
    if not expect(valid, "Concrete subclasses must implement abstract methods and inherit damage handling"): return
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'api: typed Array map result is assigned without losing its type',
    async setup({ repoRoot, projectDir }) {
      const source = await gdscriptBlock(repoRoot, 'skills/gdscript-patterns/SKILL.md', 'var numbers: Array[int]');
      await writeProject(projectDir, {
        'test.gd': `extends SceneTree
${assertion}
func _initialize() -> void:
${indent(source)}
    if not expect(doubled == [2, 4, 6, 8, 10, 12, 14, 16], "Map must double every number"): return
    if not expect(doubled.get_typed_builtin() == TYPE_INT, "Map destination must remain Array[int]"): return
    if not expect(evens == [2, 4, 6, 8] and total == 36, "Filter/reduce results changed"): return
    if not expect(not has_negative and all_positive and items[0]["name"] == "A", "Predicate/sort results changed"): return
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'api: procedural circle uses a supported primitive and closes its line strip',
    async setup({ repoRoot, projectDir }) {
      const source = await gdscriptBlock(repoRoot, 'skills/gdscript-advanced/references/tool-script-recipes.md', 'class_name CircleVisualizer');
      await writeProject(projectDir, {
        'circle.gd': source,
        'test.gd': `extends SceneTree
${assertion}
func _initialize() -> void:
    var circle := CircleVisualizer.new()
    circle.radius = 2.0
    circle.segments = 12
    circle._rebuild_mesh()
    var generated_mesh: ArrayMesh = circle.mesh
    var vertices: PackedVector3Array = generated_mesh.surface_get_arrays(0)[Mesh.ARRAY_VERTEX]
    var valid := generated_mesh.surface_get_primitive_type(0) == Mesh.PRIMITIVE_LINE_STRIP
    valid = valid and vertices.size() == 13 and vertices[0].is_equal_approx(vertices[-1])
    for vertex in vertices:
        valid = valid and is_equal_approx(vertex.length(), 2.0) and is_zero_approx(vertex.y)
    circle.free()
    if not expect(valid, "Circle must contain 12 radius-2 segments plus the repeated closing vertex"): return
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'api: MultiMesh rotation and scale preserve requested instance positions',
    async setup({ repoRoot, projectDir }) {
      const source = await gdscriptBlock(repoRoot, 'skills/3d-essentials/references/lod-and-culling.md', 'func spawn_grass');
      // The headless dummy renderer returns identity from MultiMesh transform getters.
      // Record the actual values passed by the unchanged example to the renderer.
      const observed = source.replace(
        'mm.set_instance_transform(i, xform)',
        'mm.set_instance_transform(i, xform)\n        recorded_transforms.append(xform)',
      );
      await writeProject(projectDir, {
        'spawner.gd': `extends Node3D\nvar recorded_transforms: Array[Transform3D] = []\n${observed}`,
        'meshes/grass_blade.tres': '[gd_resource type="QuadMesh" format=3]\n[resource]\n',
        'test.gd': `extends SceneTree
${assertion}
func _initialize() -> void:
    seed(321)
    var spawner: Node3D = load("res://spawner.gd").new()
    var positions := PackedVector3Array([Vector3(10, 2, -3), Vector3(-7, 0, 11), Vector3(2, -5, 8)])
    spawner.spawn_grass(positions)
    var mm: MultiMesh = spawner.get_child(0).multimesh
    var valid: bool = mm.instance_count == positions.size() and spawner.recorded_transforms.size() == positions.size()
    for i in positions.size():
        var transform: Transform3D = spawner.recorded_transforms[i]
        var scale := transform.basis.get_scale()
        valid = valid and transform.origin.is_equal_approx(positions[i])
        valid = valid and scale.x >= 0.8 and scale.x <= 1.2
        valid = valid and is_equal_approx(scale.x, scale.y) and is_equal_approx(scale.y, scale.z)
    spawner.free()
    if not expect(valid, "Random orientation/size must preserve each supplied position"): return
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'api: CSV context and three-form plurals import and format in each locale',
    async setup({ repoRoot, projectDir }) {
      const relativePath = 'skills/localization/references/csv-plural-context.md';
      const [csv] = await codeBlocks(repoRoot, relativePath, 'csv');
      const context = await gdscriptBlock(repoRoot, relativePath, 'var file_noun');
      const plural = await gdscriptBlock(repoRoot, relativePath, 'var enemy_count');
      await writeProject(projectDir, {
        'translations.csv': csv,
        'test.gd': `extends SceneTree
${assertion}
func context_example() -> Array[String]:
${indent(context)}
    return [file_noun, file_verb, file_default]

func plural_example() -> String:
${indent(plural)}
    return msg

func _initialize() -> void:
    var expected := {
        "en": ["File", "File", "1 enemy", "3 enemies", "5 enemies"],
        "cs": ["Soubor", "Uložit", "1 nepřítel", "3 nepřátelé", "5 nepřátel"],
        "de": ["Datei", "Ablegen", "1 Feind", "3 Feinde", "5 Feinde"],
    }
    for locale in expected:
        var translation: Translation = load("res://translations.%s.translation" % locale)
        if not expect(translation != null, "CSV must import a translation for " + locale): return
        TranslationServer.add_translation(translation)
    for locale in expected:
        TranslationServer.set_locale(locale)
        var values: Array = expected[locale]
        var translated_context := context_example()
        if not expect(translated_context == [values[0], values[1], "ITEM_FILE"], "Context/fallback mismatch: " + locale): return
        if not expect(plural_example() == values[3], "Shipped plural example mismatch: " + locale): return
        for i in 3:
            var count: int = [1, 3, 5][i]
            var message := tr_n("ENEMY_COUNT", "ENEMY_COUNT_PLURAL", count).format({"count": count})
            if not expect(message == values[i + 2], "Plural form mismatch: %s/%d => %s" % [locale, count, message]): return
    print("GODOT_EXAMPLES_OK")
    quit()
`,
      });
      return ['res://test.gd'];
    },
  },
];
