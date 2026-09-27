import { gdscriptBlock, writeProject } from '../helpers.mjs';

const indent = source => source.trimEnd().split('\n').map(line => `    ${line}`).join('\n');
const assertions = `
func check(condition: bool, message: String) -> bool:
    if not condition:
        push_error(message)
        quit(1)
        return false
    return true
`;

function runner(body) {
  return `extends SceneTree\n\nfunc _initialize() -> void:\n    call_deferred("run_test")\n\nfunc run_test() -> void:\n${indent(body)}\n${assertions}`;
}

function skeletonSetup(names) {
  return `var skeleton := Skeleton3D.new()
skeleton.name = "Skeleton3D"
for bone_name in ${JSON.stringify(names)}:
    skeleton.add_bone(bone_name)
actor.add_child(skeleton)`;
}

export default [
  {
    name: 'animation: chained deletion waits for the parallel tween fade',
    async setup({ repoRoot, projectDir }) {
      const block = await gdscriptBlock(repoRoot, 'skills/tween-animation/SKILL.md', '# These two run at the same time');
      await writeProject(projectDir, {
        'example.gd': `extends Node2D\n\nfunc build_tween() -> Tween:\n${indent(block)}\n    return tween\n`,
        'test.gd': runner(`var actor := Node2D.new()
actor.set_script(load("res://example.gd"))
root.add_child(actor)
var tween: Tween = actor.build_tween()
tween.pause()
tween.custom_step(0.51)
if not check(not actor.is_queued_for_deletion(), "Node was deleted before its fade completed"):
    return
if not check(actor.position.is_equal_approx(Vector2(300, 200)) and actor.scale.is_equal_approx(Vector2(2, 2)), "Parallel movement and scale did not finish first"):
    return
if not check(actor.modulate.a > 0.0 and actor.modulate.a < 1.0, "Fade must be in progress before deletion"):
    return
tween.custom_step(0.30)
if not check(is_zero_approx(actor.modulate.a) and actor.is_queued_for_deletion(), "Node must be deleted only after fully fading"):
    return
await process_frame
print("GODOT_EXAMPLES_OK")
quit(0)`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'animation: AimModifier configures indexed bones and Euler axis',
    async setup({ repoRoot, projectDir }) {
      const block = await gdscriptBlock(repoRoot, 'skills/animation-system/references/bone-constraints.md', 'var aim :=');
      await writeProject(projectDir, {
        'example.gd': `extends Node3D\n\n${block}`,
        'test.gd': runner(`var actor := Node3D.new()
actor.set_script(load("res://example.gd"))
${skeletonSetup(['RightArm', 'RightHand'])}
skeleton.set_bone_rest(1, Transform3D(Basis.IDENTITY, Vector3(1, 1, 0)))
root.add_child(actor)
var aim: AimModifier3D = skeleton.get_child(0)
if not check(aim.get_setting_count() == 1, "Aim modifier setting was not allocated"):
    return
if not check(aim.get_apply_bone(0) == 0 and aim.get_reference_bone(0) == 1, "Aim modifier did not resolve the intended bones"):
    return
if not check(aim.is_using_euler(0) and aim.get_primary_rotation_axis(0) == Vector3.AXIS_X, "Aim modifier Euler axis was not configured"):
    return
actor.queue_free()
await process_frame
print("GODOT_EXAMPLES_OK")
quit(0)`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'animation: CopyTransform copies rotation without position or scale',
    async setup({ repoRoot, projectDir }) {
      const block = await gdscriptBlock(repoRoot, 'skills/animation-system/references/bone-constraints.md', 'var copy :=');
      await writeProject(projectDir, {
        'example.gd': `extends Node3D\n\n${block}`,
        'test.gd': runner(`var actor := Node3D.new()
actor.set_script(load("res://example.gd"))
${skeletonSetup(['LeftArm', 'RightArm'])}
root.add_child(actor)
var copy: CopyTransformModifier3D = skeleton.get_child(0)
if not check(copy.get_setting_count() == 1 and copy.get_apply_bone(0) == 0 and copy.get_reference_bone(0) == 1, "Copy modifier did not resolve its source and destination"):
    return
if not check(copy.is_rotation_copying(0) and not copy.is_position_copying(0) and not copy.is_scale_copying(0), "Copy modifier must enable rotation only"):
    return
actor.queue_free()
await process_frame
print("GODOT_EXAMPLES_OK")
quit(0)`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'animation: FABRIK derives a connected chain and resolves its target path',
    async setup({ repoRoot, projectDir }) {
      const block = await gdscriptBlock(repoRoot, 'skills/animation-system/references/ik-recipes.md', 'var ik := FABRIK3D.new()');
      await writeProject(projectDir, {
        'example.gd': `extends Node3D\n\n${block}`,
        'test.gd': runner(`var actor := Node3D.new()
actor.set_script(load("res://example.gd"))
${skeletonSetup(['Shoulder', 'Elbow', 'Wrist'])}
skeleton.set_bone_parent(1, 0)
skeleton.set_bone_parent(2, 1)
skeleton.set_bone_rest(1, Transform3D(Basis.IDENTITY, Vector3.UP))
skeleton.set_bone_rest(2, Transform3D(Basis.IDENTITY, Vector3.UP))
# Setting rest transforms does not initialize the current pose. Give the solver
# nonzero bone lengths before the actor and its modifier enter the scene tree.
skeleton.reset_bone_poses()
var target := Node3D.new()
target.name = "IKTarget"
target.position = Vector3(1, 1, 0)
actor.add_child(target)
root.add_child(actor)
var ik: FABRIK3D = skeleton.get_child(0)
if not check(ik.get_setting_count() == 1 and ik.get_root_bone(0) == 0 and ik.get_end_bone(0) == 2, "FABRIK endpoints were not configured"):
    return
if not check(ik.get_joint_count(0) == 3, "FABRIK must derive all three connected bones"):
    return
if not check(ik.get_node(ik.get_target_node(0)) == target, "FABRIK target must resolve relative to the modifier"):
    return
# Run a real solver update before finishing the test, so frame scheduling cannot
# hide an invalid pose or a solver error behind successful configuration checks.
await ik.modification_processed
# Let modifier processing finish before removing the entire fixture synchronously.
await process_frame
root.remove_child(actor)
actor.free()
print("GODOT_EXAMPLES_OK")
quit(0)`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'animation: LookAt uses symmetric flags and explicit angle limits',
    async setup({ repoRoot, projectDir }) {
      const block = await gdscriptBlock(repoRoot, 'skills/animation-system/references/skeleton-modifiers.md', 'look_at.symmetry_limitation');
      await writeProject(projectDir, {
        'example.gd': `extends Node3D\n\n${block}`,
        'test.gd': runner(`var container := Node3D.new()
var actor := Node3D.new()
actor.set_script(load("res://example.gd"))
${skeletonSetup(['Head'])}
var modifier := LookAtModifier3D.new()
modifier.name = "LookAtModifier3D"
skeleton.add_child(modifier)
var target := Node3D.new()
target.name = "LookTarget"
target.position = Vector3(0, 1, -3)
container.add_child(target)
container.add_child(actor)
root.add_child(container)
if not check(modifier.bone == 0 and modifier.get_node(modifier.target_node) == target, "LookAt must resolve its bone and target"):
    return
if not check(modifier.use_angle_limitation and modifier.symmetry_limitation, "LookAt must use symmetric angle limits"):
    return
if not check(is_equal_approx(modifier.primary_limit_angle, deg_to_rad(45.0)) and is_equal_approx(modifier.secondary_limit_angle, deg_to_rad(70.0)), "LookAt angles must be stored in angle properties"):
    return
actor.stop_looking()
if not check(is_zero_approx(modifier.influence), "Stopping LookAt must restore animation influence"):
    return
container.queue_free()
await process_frame
print("GODOT_EXAMPLES_OK")
quit(0)`),
      });
      return ['res://test.gd'];
    },
  },
];
