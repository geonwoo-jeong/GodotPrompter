import { gdscriptBlock, writeProject } from '../helpers.mjs';

const harness = body => `extends SceneTree
var failures := 0
func _initialize() -> void:
    run.call_deferred()
func expect(condition: bool, message: String) -> void:
    if not condition:
        failures += 1
        push_error(message)
func finish() -> void:
    if failures == 0:
        print("GODOT_EXAMPLES_OK")
    quit(1 if failures else 0)
func run() -> void:
${body}
`;
const indent = text => text.split('\n').map(line => line ? `    ${line}` : '').join('\n');

export default [
  {
    name: 'ui: health bars follow the component damage and healing signals',
    async setup({ repoRoot, projectDir }) {
      const health = await gdscriptBlock(repoRoot, 'skills/hud-system/SKILL.md', 'class_name HealthBar');
      const component = await gdscriptBlock(repoRoot, 'skills/scene-organization/SKILL.md', 'class_name HealthComponent');
      await writeProject(projectDir, {
        'health_bar.gd': health,
        'health_component.gd': component,
        'test.gd': harness(`    var component := HealthComponent.new()
    root.add_child(component)
    var bars := [ProgressBar.new(), TextureProgressBar.new()]
    for bar in bars:
        bar.set_script(load("res://health_bar.gd"))
        root.add_child(bar)
        bar.bind(component)
        bar.tween_duration = 0.02
        expect(bar.max_value == 100 and bar.value == 100, "Binding must initialize either bar")
    # The shipped component emits (old=100, new=25), not (current, maximum).
    component.take_damage(75)
    await bars.back()._tween.finished
    for bar in bars:
        expect(is_equal_approx(bar.value, 25.0) and bar.max_value == 100, "Old/new payloads must preserve the component's maximum")
    # Healing emits (old=25, new=60); the maximum still comes from the component.
    component.max_health = 120
    component.heal(35)
    await bars.back()._tween.finished
    for bar in bars:
        expect(is_equal_approx(bar.value, 60.0) and bar.max_value == 120, "Healing must update the value and read the component's maximum")
    expect(component.health_changed.get_connections().size() == 2, "Each bar must connect once")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'ui: damage pool survives completion and cancels recycled tweens',
    async setup({ repoRoot, projectDir }) {
      const source = 'skills/hud-system/references/2d-damage-numbers.md';
      const number = await gdscriptBlock(repoRoot, 'skills/hud-system/references/common-damage-numbers.md', 'class_name DamageNumber');
      const spawner = await gdscriptBlock(repoRoot, source, 'const POOL_SIZE');
      await writeProject(projectDir, {
        'damage_number.gd': number,
        'spawner.gd': spawner,
        'test.gd': harness(`    var number := DamageNumber.new()
    number.lifetime = 0.08
    var scene := PackedScene.new()
    expect(scene.pack(number) == OK, "Damage scene must pack")
    number.free()
    var spawner = load("res://spawner.gd").new()
    spawner.damage_number_scene = scene
    var hud := CanvasLayer.new()
    root.add_child(hud)
    hud.add_child(spawner)
    root.canvas_transform = Transform2D(0.0, Vector2(50, 75))
    spawner.spawn(Vector2(10, 20), 1, true)
    expect(spawner.get_child(0).position == Vector2(60, 95), "World positions must include the camera's canvas transform")
    expect(spawner.get_child(0).get_global_transform_with_canvas().origin == Vector2(60, 95), "The HUD CanvasLayer must not apply the world transform twice")
    root.canvas_transform = Transform2D.IDENTITY
    await spawner.get_child(0)._tween.finished
    expect(spawner.get_child_count() == 20, "Completed numbers must remain in the pool")
    for child in spawner.get_children():
        expect(is_instance_valid(child) and not child.visible, "Idle slots must be alive and hidden")
    # Fill the other 19 slots, then wrap to the first completed slot.
    for i in 19:
        spawner.spawn(Vector2(30, 40), 2)
    spawner.spawn(Vector2(100, 100), 3, true)
    var first: DamageNumber = spawner.get_child(0)
    var interrupted_tween := first._tween
    interrupted_tween.pause()
    interrupted_tween.custom_step(0.03)
    for i in 19:
        spawner.spawn(Vector2(30, 40), 4)
    first.lifetime = 0.25
    spawner.spawn(Vector2(200, 200), 5)
    first._tween.pause()
    expect(not interrupted_tween.is_valid(), "Recycling must kill the previous tween and its callback")
    expect(first.position == Vector2(200, 200), "Recycling must reset the starting position")
    expect(first.text == "5" and first.get_theme_font_size("font_size") == 24, "Recycling must reset crit text and font size")
    expect(first.modulate == Color(first.normal_color, 1.0), "Recycling must reset color and opacity")
    # The interrupted tween would have completed and hidden this slot by now.
    first._tween.custom_step(0.10)
    expect(first.visible, "The old tween must not hide a recycled number")
    expect(first.position.x == 200 and first.position.y > 160, "Only the new rise animation may move the slot")
    first._tween.custom_step(0.25)
    expect(is_instance_valid(first) and not first.visible, "The replacement animation must hide without freeing")
    expect(spawner.get_child_count() == 20, "Repeated wraps must not allocate or delete pool slots")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'ui: anchor examples preserve size and margins on resize',
    async setup({ repoRoot, projectDir }) {
      const anchors = await gdscriptBlock(repoRoot, 'skills/godot-ui/references/common-anchors-in-code.md', '# Fill parent completely');
      await writeProject(projectDir, {
        'layout.gd': `extends Control\nfunc configure() -> void:\n${indent(anchors)}\n`,
        'test.gd': harness(`    var layout = load("res://layout.gd").new()
    root.add_child(layout)
    layout.size = Vector2(1000, 600)
    for node_name in ["Panel", "HUDLabel", "SidePanel"]:
        var child := Control.new()
        child.name = node_name
        layout.add_child(child)
    layout.configure()
    expect(layout.get_node("Panel").get_rect() == Rect2(0, 0, 1000, 600), "Full Rect must fill its parent")
    expect(layout.get_node("HUDLabel").get_rect() == Rect2(784, 16, 200, 60), "HUD must keep its stated size and margins")
    expect(layout.get_node("SidePanel").get_rect() == Rect2(500, 0, 500, 600), "Side panel must fill the right half")
    layout.size = Vector2(1400, 900)
    expect(layout.get_node("HUDLabel").get_rect() == Rect2(1184, 16, 200, 60), "HUD must retain size and edge margins after resize")
    expect(layout.get_node("Panel").get_rect() == Rect2(0, 0, 1400, 900), "Full Rect must track parent resize")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'ui: minimap shares the world and configures viewport visibility',
    async setup({ repoRoot, projectDir }) {
      const setup = await gdscriptBlock(repoRoot, 'skills/hud-system/references/2d-minimap.md', 'extends CanvasLayer');
      const camera = await gdscriptBlock(repoRoot, 'skills/hud-system/references/2d-minimap.md', 'extends Camera2D');
      await writeProject(projectDir, {
        'minimap.gd': setup,
        'minimap_camera.gd': camera,
        'test.gd': harness(`    var hud = load("res://minimap.gd").new()
    var container := SubViewportContainer.new()
    container.name = "MinimapContainer"
    var minimap := SubViewport.new()
    minimap.name = "MinimapViewport"
    minimap.size = Vector2i(256, 256)
    container.add_child(minimap)
    hud.add_child(container)
    root.add_child(hud)
    expect(root.canvas_cull_mask == 1, "Main viewport must show the world layer")
    expect(minimap.canvas_cull_mask == 3, "Minimap viewport must include both requested layers")
    expect(minimap.find_world_2d() == root.find_world_2d(), "Both views must reference the same World2D")
    var target := Node2D.new()
    target.position = Vector2(100, 50)
    root.add_child(target)
    var camera = load("res://minimap_camera.gd").new()
    camera.follow_target = target
    minimap.add_child(camera)
    camera.set_process(false)
    camera._process(1.0)
    var one_step: Vector2 = camera.global_position
    expect(one_step.x > 0 and one_step.x <= 100, "Camera follow must not overshoot on a long frame")
    camera.global_position = Vector2.ZERO
    camera._process(0.5)
    camera._process(0.5)
    expect(camera.global_position.is_equal_approx(one_step), "Follow rate must give the same result across frame subdivisions")
    camera.follow_speed = 0
    camera._process(1.0)
    expect(camera.global_position.is_equal_approx(one_step), "A zero follow rate must leave the camera stationary")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'ui: runtime stretch example updates the active window',
    async setup({ repoRoot, projectDir }) {
      const scaling = await gdscriptBlock(repoRoot, 'skills/responsive-ui/SKILL.md', '# Read current viewport size');
      await writeProject(projectDir, {
        'scaling.gd': `extends Node\nfunc apply_scaling() -> void:\n${indent(scaling)}\n`,
        'test.gd': harness(`    root.content_scale_mode = Window.CONTENT_SCALE_MODE_DISABLED
    var scaling = load("res://scaling.gd").new()
    root.add_child(scaling)
    scaling.apply_scaling()
    expect(root.content_scale_mode == Window.CONTENT_SCALE_MODE_CANVAS_ITEMS, "Example must change the existing window, not just ProjectSettings")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
];
