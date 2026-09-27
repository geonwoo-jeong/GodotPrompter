import { gdscriptBlock, writeProject } from '../helpers.mjs';

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
    name: 'dimensions movement: XY and XZ spatial adapters preserve coordinates and deadzones',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const dimension of [2, 3]) {
        files[`math${dimension}.gd`] = await gdscriptBlock(repoRoot, `skills/math-essentials/references/${dimension}d-game-math-recipes.md`, `extends Node${dimension}D`);
        files[`input${dimension}.gd`] = await gdscriptBlock(repoRoot, `skills/input-handling/references/${dimension}d-world-input.md`, `extends Node${dimension}D`);
      }
      files['test.gd'] = `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var math2 = load("res://math2.gd").new()
    var math3 = load("res://math3.gd").new()
    var input2 = load("res://input2.gd").new()
    var input3 = load("res://input3.gd").new()
    var frame := Node3D.new()
    root.add_child(math2)
    root.add_child(math3)
    root.add_child(input2)
    root.add_child(input3)
    root.add_child(frame)
    frame.rotation.y = PI / 2.0
    input3.movement_frame = frame
    check(input2.movement_direction(Vector2(0.5, -0.25)) == Vector2(0.5, -0.25), "2D input preserves analog magnitude on XY")
    check(input3.movement_direction(Vector2(0.5, 0.0)).is_equal_approx(Vector3.FORWARD * 0.5), "3D movement rotates XZ input through yaw without amplifying analog input")
    check(math2.approach_with_deadzone(Vector2.ZERO, Vector2(10, 0), 100.0, 2.0, 1.0) == Vector2(8, 0), "2D long frame must stop at deadzone edge")
    check(math3.approach_with_deadzone(Vector3.ZERO, Vector3(0, 0, -10), 100.0, 2.0, 1.0) == Vector3(0, 0, -8), "3D long frame must stop at deadzone edge")
    check(math2.bob_position(Vector2.ZERO, 2.0, PI / 2.0).is_equal_approx(Vector2(0, -2)), "2D upward bob uses negative Y")
    check(math3.bob_position(Vector3.ZERO, 2.0, PI / 2.0).is_equal_approx(Vector3(0, 2, 0)), "3D upward bob uses positive Y")
    check(math3.orbit_position(Vector3(0, 7, 0), 3.0, PI / 2.0).is_equal_approx(Vector3(0, 7, 3)), "3D orbit preserves center height")
    check(math2.target_in_front(Vector2.RIGHT), "2D forward is +X")
    check(math3.target_in_front(Vector3.FORWARD), "3D forward is -Z")
    math3.turn_toward(Vector3(10, 8, 0), 100.0, 1.0)
    check((-math3.global_basis.z).is_equal_approx(Vector3.RIGHT), "3D ground turn ignores target height")
    math3.turn_toward(math3.global_position, 8.0, 0.1)
    for node in [math2, math3, input2, input3, frame]: node.queue_free()
    await process_frame
    finish()
`;
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions movement: platformer gravity and shared state owner work in both body types',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'action_buffer.gd': await gdscriptBlock(repoRoot, 'skills/input-handling/references/common-input-buffering.md', 'class_name ActionBuffer'),
        'player2.gd': await gdscriptBlock(repoRoot, 'skills/player-controller/references/2d-controllers.md', '@export var jump_velocity'),
        'player3.gd': await gdscriptBlock(repoRoot, 'skills/player-controller/references/3d-controllers.md', '@export var coyote_time'),
        'state.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/SKILL.md', 'class_name State\n'),
        'state_machine.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/references/common-node-based-machine.md', 'class_name StateMachine'),
        'state2.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/references/2d-character-states.md', 'class_name CharacterState2D'),
        'state3.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/references/3d-character-states.md', 'class_name CharacterState3D'),
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    InputMap.add_action("jump")
    var buffer := ActionBuffer.new()
    var press := InputEventAction.new()
    press.action = "jump"
    press.pressed = true
    buffer._unhandled_input(press)
    check(not buffer.consume_if(false), "A temporarily forbidden action stays buffered")
    check(buffer.consume_if(true) and not buffer.consume_if(true), "Shared buffer consumes exactly once")
    buffer._unhandled_input(press)
    buffer._physics_process(1.0)
    check(not buffer.consume_if(true), "Expired action must not fire later")
    buffer.free()
    var player2 = load("res://player2.gd").new()
    var player3 = load("res://player3.gd").new()
    root.add_child(player2)
    root.add_child(player3)
    player2.set_physics_process(false)
    player3.set_physics_process(false)
    player2._physics_process(0.1)
    player3._physics_process(0.1)
    check(player2.velocity.y > 0.0, "2D airborne gravity accelerates downward on +Y")
    check(player3.velocity.y < 0.0, "3D airborne gravity accelerates downward on -Y")
    for actor in [CharacterBody2D.new(), CharacterBody3D.new()]:
        var machine := StateMachine.new()
        var state: State = CharacterState2D.new() if actor is CharacterBody2D else CharacterState3D.new()
        state.name = "Idle"
        actor.add_child(machine)
        machine.owner = actor
        machine.add_child(state)
        state.owner = actor
        machine.initial_state = state
        root.add_child(actor)
        check(machine.current_state == state, "Shared machine activates either body adapter")
        check(state.entity == actor and state.get("body") == actor, "Typed adapter retains the actual 2D/3D scene owner")
        machine.deactivate()
        check(machine.current_state == null and not machine.is_physics_processing(), "Shared lifecycle deactivates either dimension")
        actor.queue_free()
    player2.queue_free()
    player3.queue_free()
    await process_frame
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions movement: navigation examples parse and keep gravity when paths finish',
    async setup({ repoRoot, projectDir }) {
      const files = {};
      for (const dimension of [2, 3]) {
        files[`mover${dimension}.gd`] = await gdscriptBlock(repoRoot, `skills/ai-navigation/references/${dimension}d-navigation-agent.md`, `class_name NavigationMover${dimension}D`);
        for (const topic of ['patrol-patterns', 'chase-attack']) {
          files[`${topic}${dimension}.gd`] = await gdscriptBlock(repoRoot, `skills/ai-navigation/references/${dimension}d-${topic}.md`, `extends NavigationMover${dimension}D`);
        }
      }
      // Import representative full recipes too, so API/parser mistakes in the
      // new spatial variants fail this engine check even before instantiation.
      for (const [file, source, marker] of [
        ['enum3.gd', 'state-machine/3d-enum-enemy', 'extends CharacterBody3D'],
        ['steering3.gd', 'ai-navigation/3d-steering-behaviors', 'extends CharacterBody3D'],
        ['shake3.gd', 'camera-system/3d-screen-shake', 'extends Camera3D'],
        ['zone3.gd', 'camera-system/3d-camera-zones', 'extends Area3D'],
        ['shared2.gd', 'camera-system/2d-split-screen', 'extends Node2D'],
        ['shared3.gd', 'camera-system/3d-split-screen', 'extends Node3D'],
        ['path2.gd', 'math-essentials/2d-path-following', 'extends PathFollow2D'],
        ['path3.gd', 'math-essentials/3d-path-following', 'extends PathFollow3D'],
        ['dash3.gd', 'player-controller/3d-movement-recipes', '@export var dash_speed'],
        ['wall3.gd', 'player-controller/3d-movement-recipes', '@export var wall_push_speed'],
      ]) {
        const [skill, reference] = source.split('/');
        files[file] = await gdscriptBlock(repoRoot, `skills/${skill}/references/${reference}.md`, marker);
      }
      for (const name of ['BTNode', 'BTSequence', 'BTSelector', 'BTAction']) {
        files[`${name}.gd`] = await gdscriptBlock(repoRoot, 'skills/ai-navigation/references/common-behavior-trees.md', `class_name ${name}\n`);
      }
      for (const dimension of [2, 3]) {
        files[`bt_actor${dimension}.gd`] = await gdscriptBlock(repoRoot, `skills/ai-navigation/references/${dimension}d-behavior-tree-actor.md`, `extends CharacterBody${dimension}D`);
      }
      files['test.gd'] = `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var actor2 := NavigationMover2D.new()
    var agent2 := NavigationAgent2D.new()
    agent2.name = "NavigationAgent2D"
    actor2.add_child(agent2)
    var actor3 := NavigationMover3D.new()
    var agent3 := NavigationAgent3D.new()
    agent3.name = "NavigationAgent3D"
    actor3.add_child(agent3)
    root.add_child(actor2)
    root.add_child(actor3)
    actor2.set_physics_process(false)
    actor3.set_physics_process(false)
    actor2.velocity = Vector2(20, 10)
    actor2._apply_velocity(Vector2.ZERO)
    check(actor2.velocity == Vector2.ZERO, "Finished 2D path stops both planar axes")
    actor3.velocity = Vector3(4, -2, 5)
    actor3._apply_velocity(Vector3.ZERO)
    check(actor3.velocity == Vector3(0, -2, 0), "Finished ground path stops XZ while preserving falling Y")
    actor3._apply_velocity(Vector3(3, 99, 4))
    check(actor3.velocity == Vector3(3, -2, 4), "Planar avoidance output cannot replace vertical gravity")
    actor2.queue_free()
    actor3.queue_free()
    await process_frame
    finish()
`;
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
];
