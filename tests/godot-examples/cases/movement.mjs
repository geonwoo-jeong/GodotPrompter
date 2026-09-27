import { codeBlocks, gdscriptBlock, writeProject } from '../helpers.mjs';

const checks = `
var failed := false
func check(condition: bool, message: String) -> void:
    if not condition:
        failed = true
        push_error(message)
func finish() -> void:
    if not failed:
        print("GODOT_EXAMPLES_OK")
    quit(1 if failed else 0)
`;

export default [
  {
    name: 'movement: nested state lifecycle owns activation and input',
    async setup({ repoRoot, projectDir }) {
      // The fix moves this class out of SKILL.md. Retain upstream extraction so
      // the same regression can show the original lifecycle failure, not ENOENT.
      let stateMachine;
      try {
        stateMachine = await gdscriptBlock(repoRoot, 'skills/state-machine/references/node-based-machine.md', 'class_name StateMachine');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        stateMachine = await gdscriptBlock(repoRoot, 'skills/state-machine/SKILL.md', 'class_name StateMachine');
      }
      await writeProject(projectDir, {
        'state.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/SKILL.md', 'class_name State\n'),
        'state_machine.gd': stateMachine,
        'hierarchical_state.gd': await gdscriptBlock(repoRoot, 'skills/state-machine/references/hierarchical-and-parallel.md', 'class_name HierarchicalState'),
        'probe_state.gd': `extends State
var enters := 0
var exits := 0
var updates := 0
var physics_updates := 0
var inputs := 0
func enter() -> void: enters += 1
func exit() -> void: exits += 1
func update(_delta: float) -> String:
    updates += 1
    return ""
func physics_update(_delta: float) -> String:
    physics_updates += 1
    return ""
func handle_input(_event: InputEvent) -> String:
    inputs += 1
    return ""
`,
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var actor := CharacterBody2D.new()
    var outer := StateMachine.new()
    actor.add_child(outer)
    outer.owner = actor
    var ground := HierarchicalState.new()
    ground.name = "OnGround"
    var air := HierarchicalState.new()
    air.name = "InAir"
    outer.add_child(ground)
    outer.add_child(air)
    ground.owner = actor
    air.owner = actor
    var ground_sm := StateMachine.new()
    var air_sm := StateMachine.new()
    ground.add_child(ground_sm)
    air.add_child(air_sm)
    ground_sm.owner = actor
    air_sm.owner = actor
    ground.sub_state_machine = ground_sm
    air.sub_state_machine = air_sm
    var idle = load("res://probe_state.gd").new()
    var walk = load("res://probe_state.gd").new()
    var jump = load("res://probe_state.gd").new()
    idle.name = "Idle"
    walk.name = "Walk"
    jump.name = "Jump"
    ground_sm.add_child(idle)
    ground_sm.add_child(walk)
    air_sm.add_child(jump)
    idle.owner = actor
    walk.owner = actor
    jump.owner = actor
    ground_sm.initial_state = idle
    air_sm.initial_state = jump
    outer.initial_state = ground
    root.add_child(actor)
    # Keep this lifecycle test in OnGround without requiring a physical floor.
    outer.set_physics_process(false)
    check(idle.enters == 1, "Active nested state must enter exactly once")
    check(jump.enters == 0, "Inactive branch must not enter during ready")
    check(air_sm.current_state == null, "Inactive machine has no current state")
    check(not air_sm.is_processing() and not air_sm.is_physics_processing(), "Inactive update callbacks must be disabled")
    check(not air_sm.is_processing_unhandled_input(), "Inactive input callback must be disabled")
    if failed:
        actor.queue_free()
        await process_frame
        finish()
        return
    ground_sm.call("activate")
    check(idle.enters == 1, "Repeated activation must be idempotent")
    await physics_frame
    await process_frame
    await process_frame
    check(idle.updates > 0 and jump.updates == 0, "Only the active branch may update")
    check(idle.physics_updates > 0 and jump.physics_updates == 0, "Only the active branch may run physics updates")
    var event := InputEventKey.new()
    event.keycode = KEY_F7
    event.pressed = true
    root.push_input(event)
    check(idle.inputs == 1 and jump.inputs == 0, "Only the active branch may receive input")
    ground_sm.transition_to("Walk")
    check(idle.exits == 1 and walk.enters == 1, "Ordinary child transition must exit and enter once")
    outer.transition_to("InAir")
    check(walk.exits == 1 and jump.enters == 1, "Parent transition must deactivate and activate submachines")
    var old_walk_updates: int = walk.updates
    var old_walk_inputs: int = walk.inputs
    await process_frame
    await process_frame
    root.push_input(event)
    check(walk.updates == old_walk_updates and walk.inputs == old_walk_inputs, "Exited branch must stop update and input")
    check(jump.updates > 0 and jump.inputs == 1, "Newly active branch must receive callbacks")
    ground_sm.call("deactivate")
    check(walk.exits == 1, "Repeated deactivation must not repeat exit")
    outer.transition_to("OnGround")
    check(jump.exits == 1, "Leaving the other branch must exit once")
    check(ground_sm.current_state == idle and idle.enters == 2, "Reentry must restart initial state")
    check(walk.enters == 1, "Reentry must not resume the former child state")
    outer.transition_to("OnGround")
    check(idle.enters == 2, "Transition to current state must not restart the hierarchy")
    outer.call("deactivate")
    check(idle.exits == 2 and ground_sm.current_state == null, "Root deactivation must recursively exit nested state")
    actor.queue_free()
    await process_frame
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'movement: rebinding ignores release and echo until a fresh press',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'rebind_button.gd': await gdscriptBlock(repoRoot, 'skills/input-handling/references/action-rebinding.md', '# rebind_button.gd'),
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    InputMap.add_action("audit_rebind")
    var original := InputEventKey.new()
    original.keycode = KEY_SPACE
    InputMap.action_add_event("audit_rebind", original)
    var button = load("res://rebind_button.gd").new()
    button.action_name = "audit_rebind"
    root.add_child(button)
    button._pressed()
    var event := InputEventKey.new()
    event.keycode = KEY_W
    event.pressed = false
    button._unhandled_input(event)
    check(button._is_listening, "Releasing a previously held key must not finish rebinding")
    check(InputMap.action_get_events("audit_rebind")[0].keycode == KEY_SPACE, "Release must preserve existing binding")
    event.pressed = true
    event.echo = true
    button._unhandled_input(event)
    check(button._is_listening, "Key repeat must not finish rebinding")
    check(InputMap.action_get_events("audit_rebind")[0].keycode == KEY_SPACE, "Echo must preserve existing binding")
    event.echo = false
    event.keycode = KEY_SHIFT
    button._unhandled_input(event)
    check(button._is_listening, "Standalone modifier must still be ignored")
    event.keycode = KEY_E
    button._unhandled_input(event)
    check(not button._is_listening, "Fresh ordinary press must finish rebinding")
    check(InputMap.action_get_events("audit_rebind")[0].keycode == KEY_E, "Fresh press must replace binding")
    for button_event in [InputEventMouseButton.new(), InputEventJoypadButton.new()]:
        button._pressed()
        if button_event is InputEventMouseButton:
            button_event.button_index = MOUSE_BUTTON_MIDDLE
        else:
            button_event.button_index = JOY_BUTTON_A
        var prior_binding: InputEvent = InputMap.action_get_events("audit_rebind")[0]
        button_event.pressed = false
        button._unhandled_input(button_event)
        check(button._is_listening, "Mouse and joypad releases must not finish rebinding")
        check(InputMap.action_get_events("audit_rebind")[0] == prior_binding, "Button releases must preserve the binding")
        button_event.pressed = true
        button._unhandled_input(button_event)
        check(not button._is_listening, "Fresh mouse and joypad presses must finish rebinding")
        check(InputMap.action_get_events("audit_rebind")[0].is_match(button_event), "Fresh button press must become the binding")
    button.queue_free()
    await process_frame
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'movement: documented input flow agrees with actual GUI consumption',
    async setup({ repoRoot, projectDir }) {
      const blocks = await codeBlocks(repoRoot, 'skills/input-handling/SKILL.md', '');
      const flow = blocks.find(block => block.includes('Hardware Event'));
      if (!flow) throw new Error('Input flow diagram missing');
      const labels = { '_input()': 'input', 'UI Control nodes': 'gui', '_shortcut_input()': 'shortcut', '_unhandled_key_input()': 'unhandled_key', '_unhandled_input()': 'unhandled' };
      const expected = flow.split('\n').map(line => Object.keys(labels).find(label => line.trim().startsWith(label))).filter(Boolean).map(label => labels[label]);
      if (expected.length !== 5) throw new Error('Input flow must describe all five callback stages');
      await writeProject(projectDir, {
        'observer.gd': `extends Node
var calls: Array[String] = []
func _input(_event: InputEvent) -> void: calls.append("input")
func _shortcut_input(_event: InputEvent) -> void: calls.append("shortcut")
func _unhandled_key_input(_event: InputEvent) -> void: calls.append("unhandled_key")
func _unhandled_input(_event: InputEvent) -> void: calls.append("unhandled")
`,
        'gui.gd': `extends Control
var observer: Node
var consume := false
func _gui_input(_event: InputEvent) -> void:
    observer.calls.append("gui")
    if consume: accept_event()
`,
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var observer = load("res://observer.gd").new()
    root.add_child(observer)
    var control = load("res://gui.gd").new()
    control.observer = observer
    control.focus_mode = Control.FOCUS_ALL
    root.add_child(control)
    control.grab_focus()
    var event := InputEventKey.new()
    event.keycode = KEY_F7
    event.pressed = true
    root.push_input(event)
    check(observer.calls == ${JSON.stringify(expected)}, "Engine dispatch must match the shipped input-flow diagram")
    observer.calls.clear()
    control.consume = true
    root.push_input(event)
    check(observer.calls == ["input", "gui"], "GUI consumption must prevent later shortcut and gameplay callbacks")
    observer.queue_free()
    control.queue_free()
    await process_frame
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
];
