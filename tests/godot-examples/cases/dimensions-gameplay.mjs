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

export default [
  {
    name: 'dimensions-gameplay: 3D damage projection and prompts recover after camera turns',
    async setup({ repoRoot, projectDir }) {
      const hud = 'skills/hud-system/references/';
      await writeProject(projectDir, {
        'damage_number.gd': await gdscriptBlock(repoRoot, hud + 'common-damage-numbers.md', 'class_name DamageNumber'),
        'spawner_3d.gd': await gdscriptBlock(repoRoot, hud + '3d-damage-numbers.md', 'const POOL_SIZE'),
        'prompt_2d.gd': await gdscriptBlock(repoRoot, hud + '2d-interaction-prompts.md', 'class_name InteractionPrompt2D'),
        'prompt_3d.gd': await gdscriptBlock(repoRoot, hud + '3d-interaction-prompts.md', 'class_name InteractionPrompt3D'),
        'interactable_2d.gd': await gdscriptBlock(repoRoot, hud + '2d-interaction-prompts.md', 'extends Area2D'),
        'interactable_3d.gd': await gdscriptBlock(repoRoot, hud + '3d-interaction-prompts.md', 'extends Area3D'),
        'test.gd': harness(`    var viewport := SubViewport.new()
    viewport.size = Vector2i(800, 600)
    root.add_child(viewport)
    var camera := Camera3D.new()
    viewport.add_child(camera)
    camera.make_current()
    var hud := CanvasLayer.new()
    viewport.add_child(hud)
    var number := DamageNumber.new()
    var scene := PackedScene.new()
    expect(scene.pack(number) == OK, "Shared damage Label must pack")
    number.free()
    var spawner = load("res://spawner_3d.gd").new()
    spawner.camera = camera
    spawner.damage_number_scene = scene
    hud.add_child(spawner)
    spawner.spawn(Vector3(0, 0, 5), 8)
    expect(spawner._pool_index == 0, "A hit behind the camera must not consume a pool slot")
    spawner.spawn(Vector3(0, 0, -5), 12)
    var first: DamageNumber = spawner.get_child(0)
    expect(first.visible and first.text == "12", "A visible 3D hit must reuse the common Label")
    expect(first.position.is_equal_approx(Vector2(400, 300)), "World center must project to viewport center")
    expect(first.get_global_transform_with_canvas().origin.is_equal_approx(first.position), "HUD must not apply the projection twice")
    first._tween.kill()
    var target3 := Node3D.new()
    target3.position = Vector3(0, 0, -5)
    viewport.add_child(target3)
    var prompt3 := InteractionPrompt3D.new()
    prompt3.camera = camera
    hud.add_child(prompt3)
    prompt3.set_process(false)
    InputMap.add_action(&"interact")
    prompt3.show_for(target3)
    expect(prompt3.visible and prompt3.position.is_equal_approx(Vector2(400, 252)), "3D prompt must project with its pixel offset")
    camera.rotation.y = PI
    prompt3._process(0)
    expect(not prompt3.visible, "Prompt must hide when the camera turns away")
    camera.rotation.y = 0
    prompt3._process(0)
    expect(prompt3.visible, "A hidden prompt must reappear when the target returns in front")
    target3.free()
    prompt3._process(0)
    expect(not prompt3.visible, "A freed target must not leave a stale prompt")
    var target2 := Node2D.new()
    target2.position = Vector2(30, 40)
    viewport.add_child(target2)
    var prompt2 := InteractionPrompt2D.new()
    hud.add_child(prompt2)
    prompt2.set_process(false)
    viewport.canvas_transform = Transform2D(0, Vector2(50, 75))
    prompt2.show_for(target2)
    expect(prompt2.visible and prompt2.position == Vector2(80, 67), "2D prompt must include camera canvas transform and pixel offset")
    var other := Node2D.new()
    viewport.add_child(other)
    prompt2.hide_for(other)
    expect(prompt2.visible, "An unrelated area exit must not hide the selected prompt")
    prompt2.hide_for(target2)
    expect(not prompt2.visible, "The selected area exit must hide the prompt")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions-gameplay: 3D minimap shares world and follows without overshoot',
    async setup({ repoRoot, projectDir }) {
      const source = 'skills/hud-system/references/3d-minimap.md';
      await writeProject(projectDir, {
        'setup.gd': await gdscriptBlock(repoRoot, source, 'extends CanvasLayer'),
        'camera.gd': await gdscriptBlock(repoRoot, source, 'extends Camera3D'),
        'test.gd': harness(`    var target := Node3D.new()
    target.position = Vector3(10, 3, 20)
    root.add_child(target)
    var main_camera := Camera3D.new()
    root.add_child(main_camera)
    var hud = load("res://setup.gd").new()
    hud.main_camera = main_camera
    var container := SubViewportContainer.new()
    container.name = "MinimapContainer"
    var viewport := SubViewport.new()
    viewport.name = "MinimapViewport"
    viewport.size = Vector2i(256, 256)
    var camera = load("res://camera.gd").new()
    camera.name = "MinimapCamera"
    camera.follow_target = target
    viewport.add_child(camera)
    container.add_child(viewport)
    hud.add_child(container)
    root.add_child(hud)
    camera.set_process(false)
    expect(viewport.find_world_3d() == root.find_world_3d(), "Minimap must render the gameplay World3D")
    expect(main_camera.cull_mask == 1 and camera.cull_mask == 3, "3D visibility must use each camera's cull mask")
    expect(viewport.render_target_update_mode == SubViewport.UPDATE_ALWAYS, "Minimap must update every frame")
    expect(camera.projection == Camera3D.PROJECTION_ORTHOGONAL and camera.size == 64, "3D map must use an orthogonal world-unit span")
    expect(camera.global_position.is_equal_approx(Vector3(10, 43, 20)), "Camera must start above its target")
    expect((-camera.global_basis.z).is_equal_approx(Vector3.DOWN), "Camera must look down the Y axis")
    target.position = Vector3(110, 3, 120)
    camera._process(1.0)
    var one_step: Vector3 = camera.global_position
    expect(one_step.x <= 110 and one_step.z <= 120, "A long frame must not overshoot the target")
    camera.global_position = Vector3(10, 43, 20)
    camera._process(0.5)
    camera._process(0.5)
    expect(camera.global_position.is_equal_approx(one_step), "Follow rate must be independent of frame subdivision")
    finish()`),
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions-gameplay: 2D and 3D hitboxes apply shared health and invincibility rules',
    async setup({ repoRoot, projectDir }) {
      const refs = 'skills/component-system/references/';
      const files = {
        'health.gd': await gdscriptBlock(repoRoot, 'skills/scene-organization/SKILL.md', 'class_name HealthComponent'),
      };
      for (const dim of [2, 3]) {
        const suffix = dim === 2 ? '' : '3D';
        files[`hitbox_${dim}d.gd`] = await gdscriptBlock(repoRoot, refs + `${dim}d-hitboxes.md`, `class_name HitboxComponent${suffix}\n`);
        files[`hurtbox_${dim}d.gd`] = await gdscriptBlock(repoRoot, refs + `${dim}d-hitboxes.md`, `class_name HurtboxComponent${suffix}\n`);
      }
      files['test.gd'] = harness(`    var participants := []
    for dimension in [2, 3]:
        var health := HealthComponent.new()
        root.add_child(health)
        var hit = load("res://hitbox_%dd.gd" % dimension).new()
        var hurt = load("res://hurtbox_%dd.gd" % dimension).new()
        hit.collision_layer = 0
        hit.collision_mask = 2
        hit.cooldown_duration = 0.25
        hurt.collision_layer = 2
        hurt.collision_mask = 0
        hurt.monitoring = false
        hurt.health_component = health
        hurt.invincibility_duration = 0.25
        for area in [hit, hurt]:
            if dimension == 2:
                var shape := CollisionShape2D.new()
                shape.shape = RectangleShape2D.new()
                area.add_child(shape)
            else:
                var shape := CollisionShape3D.new()
                shape.shape = BoxShape3D.new()
                area.add_child(shape)
        root.add_child(hurt)
        root.add_child(hit)
        participants.append([health, hit, hurt])
    # Let the real 2D and 3D physics servers report overlapping areas.
    for i in 4:
        await physics_frame
    for entry in participants:
        expect(entry[0].current_health == 90, "Both area adapters must route one overlap to the common health component")
        entry[2].receive_hit(50)
        expect(entry[0].current_health == 90, "Invincibility must suppress another hit")
    await create_timer(0.3).timeout
    for entry in participants:
        expect(entry[0].current_health == 90, "Persistent overlap must not invent repeated damage after cooldown")
        entry[2].receive_hit(5)
        expect(entry[0].current_health == 85, "Damage must resume after invincibility expires")
    finish()`);
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions-gameplay: positional audio pools preserve dimension and recycle bounded voices',
    async setup({ repoRoot, projectDir }) {
      const refs = 'skills/audio-system/references/';
      const files = {};
      for (const dim of [2, 3]) {
        files[`pool_${dim}d.gd`] = await gdscriptBlock(repoRoot, refs + `${dim}d-sfx-pooling.md`, `var _players: Array[AudioStreamPlayer${dim}D]`);
        files[`footsteps_${dim}d.gd`] = await gdscriptBlock(repoRoot, refs + `${dim}d-spatial-audio.md`, `extends AudioStreamPlayer${dim}D`);
        files[`listener_${dim}d.gd`] = await gdscriptBlock(repoRoot, refs + `${dim}d-spatial-audio.md`, `extends AudioListener${dim}D`);
      }
      files['test.gd'] = harness(`    AudioServer.add_bus()
    AudioServer.set_bus_name(AudioServer.bus_count - 1, "SFX")
    var stream := AudioStreamWAV.new()
    stream.data = PackedByteArray([0, 0, 0, 0])
    var pool2 = load("res://pool_2d.gd").new()
    var pool3 = load("res://pool_3d.gd").new()
    for pool in [pool2, pool3]:
        pool.pool_size = 2
        root.add_child(pool)
    pool2.play_at(stream, Vector2(20, 30), -3.0, 1.2)
    pool2.play_at(stream, Vector2(40, 50))
    pool2.play_at(stream, Vector2(60, 70), -6.0, 0.8)
    pool3.play_at(stream, Vector3(2, 3, 4), -3.0, 1.2)
    pool3.play_at(stream, Vector3(4, 5, 6))
    pool3.play_at(stream, Vector3(6, 7, 8), -6.0, 0.8)
    expect(pool2.get_child_count() == 2 and pool3.get_child_count() == 2, "Both spatial pools must reuse a bounded number of voices")
    expect(pool2.get_child(0).global_position == Vector2(60, 70), "2D reuse must reset the world pixel position")
    expect(pool3.get_child(0).global_position == Vector3(6, 7, 8), "3D reuse must retain all three world coordinates")
    for pool in [pool2, pool3]:
        var player = pool.get_child(0)
        expect(player.stream == stream and player.volume_db == -6.0 and is_equal_approx(player.pitch_scale, 0.8), "Reuse must reset the stream, volume, and pitch")
    expect(pool3.get_child(0).unit_size == 4 and pool3.get_child(0).max_distance == 50, "3D pool distances must use the documented world-unit settings")
    for dimension in [2, 3]:
        var footsteps = load("res://footsteps_%dd.gd" % dimension).new()
        root.add_child(footsteps)
        expect(footsteps.bus == &"SFX" and footsteps.max_polyphony == 4, "Actor emitters must configure bus and voice count")
        var listener = load("res://listener_%dd.gd" % dimension).new()
        root.add_child(listener)
        expect(listener.is_current(), "Explicit spatial listeners must become current")
    finish()`);
      await writeProject(projectDir, files);
      return ['res://test.gd'];
    },
  },
];
