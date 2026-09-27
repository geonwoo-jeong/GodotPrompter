import { gdscriptBlock, writeProject } from '../helpers.mjs';

const refs = 'skills/particles-vfx/references/';
const indent = source => source.trimEnd().split('\n').map(line => `    ${line}`).join('\n');
const runner = body => `extends SceneTree\n\nfunc _initialize() -> void:\n    call_deferred("run_test")\n\nfunc run_test() -> void:\n${indent(body)}\n\nfunc check(condition: bool, message: String) -> bool:\n    if not condition:\n        push_error(message)\n        quit(1)\n        return false\n    return true\n`;
const finish = `print("GODOT_EXAMPLES_OK")\nquit(0)`;

export default [
  {
    name: 'dimensions rendering: particle recipes preserve plane, gravity, one-shot lifecycle, and 3D draw material',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const dim of ['2d', '3d']) files[`${dim}.gd`] = await gdscriptBlock(repoRoot, `${refs}${dim}-vfx-recipes.md`, 0);
      files['test.gd'] = runner(`for dim in ["2d", "3d"]:
    var recipe = load("res://%s.gd" % dim).new()
    for kind in [0, 1, 2]:
        var emitter = recipe.create_effect(kind, GradientTexture2D.new())
        var material: ParticleProcessMaterial = emitter.process_material
        if not check(not emitter.emitting and emitter.one_shot == (kind != 0), "Factory must return an armed emitter with the correct lifecycle"):
            return
        if not check(material.particle_flag_disable_z == (dim == "2d"), "Particle simulation plane does not match the dimension"):
            return
        if not check(is_zero_approx(material.color_ramp.gradient.get_color(1).a), "Every effect must fade its final particle color"):
            return
        if kind == 2:
            if not check(material.gravity.y > 0.0 if dim == "2d" else material.gravity.y < 0.0, "Dust gravity points away from the ground"):
                return
        if dim == "3d":
            var surface: StandardMaterial3D = emitter.draw_pass_1.material
            if not check(surface.vertex_color_use_as_albedo and surface.billboard_mode == BaseMaterial3D.BILLBOARD_PARTICLES, "3D particles need their color/alpha and particle billboard material"):
                return
        emitter.free()
    recipe.free()
${finish}`);
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions rendering: subemitters resolve relative paths on the emitter node in both dimensions',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        '2d.gd': await gdscriptBlock(repoRoot, `${refs}common-subemitters.md`, 0),
        '3d.gd': await gdscriptBlock(repoRoot, `${refs}common-subemitters.md`, 1),
        'test.gd': runner(`for dim in ["2d", "3d"]:
    var holder := Node.new()
    var child = GPUParticles2D.new() if dim == "2d" else GPUParticles3D.new()
    child.name = "Secondary"
    child.emitting = false
    child.process_material = ParticleProcessMaterial.new()
    holder.add_child(child)
    var emitter = load("res://%s.gd" % dim).new()
    emitter.name = "Primary"
    emitter.emitting = false
    emitter.process_material = ParticleProcessMaterial.new()
    emitter.child_particles = child
    holder.add_child(emitter)
    root.add_child(holder)
    if not check(emitter.get_node(emitter.sub_emitter) == child, "Subemitter path must resolve from the primary emitter"):
        return
    var material: ParticleProcessMaterial = emitter.process_material
    if not check(material.sub_emitter_mode == ParticleProcessMaterial.SUB_EMITTER_AT_END and material.sub_emitter_amount_at_end == 8, "Material must describe the trigger, independently from the node path"):
        return
    holder.queue_free()
await process_frame
${finish}`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions rendering: replacing world-motion tweens reaches the new dimensional target',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        '2d.gd': await gdscriptBlock(repoRoot, 'skills/tween-animation/references/2d-world-motion.md', 0),
        '3d.gd': await gdscriptBlock(repoRoot, 'skills/tween-animation/references/3d-world-motion.md', 0),
        'test.gd': runner(`for dim in ["2d", "3d"]:
    var actor = load("res://%s.gd" % dim).new()
    root.add_child(actor)
    var first_target = Vector2(80, 90) if dim == "2d" else Vector3(8, 9, 10)
    var final_target = Vector2(40, 20) if dim == "2d" else Vector3(4, 2, -3)
    var first: Tween = actor.move_to(first_target)
    first.pause()
    var replacement: Tween = actor.move_to(final_target)
    replacement.pause()
    if not check(not first.is_valid(), "Retargeting must kill the competing tween"):
        return
    replacement.custom_step(0.31)
    if not check(actor.position.is_equal_approx(final_target), "Tween did not preserve the typed target vector"):
        return
    actor.queue_free()
await process_frame
${finish}`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions rendering: GridMap and 2D stamps convert world coordinates through transformed parents',
    async setup({ repoRoot, projectDir }) {
      const stamp = await gdscriptBlock(repoRoot, 'skills/2d-essentials/references/2d-surface-stamps.md', 0);
      await writeProject(projectDir, {
        'grid.gd': await gdscriptBlock(repoRoot, 'skills/3d-essentials/references/3d-gridmap.md', 0),
        'stamps.gd': `extends Node\n\n${stamp}`,
        'test.gd': runner(`var grid = load("res://grid.gd").new()
var library := MeshLibrary.new()
library.create_item(0)
library.set_item_mesh(0, BoxMesh.new())
grid.mesh_library = library
root.add_child(grid)
grid.position = Vector3(10, 2, -6)
grid.build_floor(3, 2)
if not check(grid.get_used_cells().size() == 6, "GridMap did not fill its requested XZ floor"):
    return
var target_cell := Vector3i(1, 0, 1)
grid.remove_cell_at(grid.to_global(grid.map_to_local(target_cell)))
if not check(grid.get_cell_item(target_cell) == GridMap.INVALID_CELL_ITEM and grid.get_used_cells().size() == 5, "World-space removal must resolve the transformed GridMap cell"):
    return
var receiver := Node2D.new()
root.add_child(receiver)
receiver.position = Vector2(70, 90)
receiver.rotation = 0.4
var tool = load("res://stamps.gd").new()
var stamp: Sprite2D = tool.add_stamp(receiver, GradientTexture2D.new(), Vector2(120, 180), 0.2)
if not check(stamp.global_position.is_equal_approx(Vector2(120, 180)), "Stamp must preserve its world point under a transformed receiver"):
    return
tool.free()
receiver.queue_free()
grid.queue_free()
await process_frame
${finish}`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions rendering: 3D billboard animation follows XZ input and returns to idle',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'sprite.gd': await gdscriptBlock(repoRoot, 'skills/animation-system/references/3d-sprite-animation.md', 0),
        'test.gd': runner(`var actor = load("res://sprite.gd").new()
var sprite := AnimatedSprite3D.new()
sprite.name = "AnimatedSprite3D"
var frames := SpriteFrames.new()
for animation in ["idle", "walk"]:
    frames.add_animation(animation)
    frames.add_frame(animation, GradientTexture2D.new())
sprite.sprite_frames = frames
actor.add_child(sprite)
root.add_child(actor)
actor.set_physics_process(false)
Input.action_press("ui_right")
actor._physics_process(1.0 / 60.0)
Input.action_release("ui_right")
if not check(actor.velocity.is_equal_approx(Vector3(5, 0, 0)) and sprite.animation == &"walk", "3D sprite controller must turn Vector2 input into XZ movement"):
    return
actor._physics_process(1.0 / 60.0)
if not check(actor.velocity == Vector3.ZERO and sprite.animation == &"idle", "Releasing input must stop movement and select idle"):
    return
actor.queue_free()
await process_frame
${finish}`),
      });
      return ['res://test.gd'];
    },
  },
];
