import { gdscriptBlock, writeProject } from '../helpers.mjs';

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

const coreCases = [2, 3].map(dimension => ({
  name: `dimensions-network: ${dimension}D prediction replays only pending input and historical hits remain bounded`,
  async setup({ repoRoot, projectDir }) {
    const vector = `Vector${dimension}`;
    const point = (x, y, z = 0) => `${vector}(${x}, ${y}${dimension === 3 ? `, ${z}` : ''})`;
    await writeProject(projectDir, {
      'prediction.gd': await gdscriptBlock(repoRoot, `skills/multiplayer-sync/references/${dimension}d-client-prediction.md`, `# prediction_${dimension}d.gd`),
      'history.gd': await gdscriptBlock(repoRoot, `skills/multiplayer-sync/references/${dimension}d-lag-compensation.md`, `# lag_history_${dimension}d.gd`),
      'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var prediction = load("res://prediction.gd").new()
    prediction.speed = 60.0
    prediction.tick_seconds = 1.0 / 60.0
    check(prediction.predict(${vector}.RIGHT) == 0, "First input receives sequence zero")
    check(prediction.predict(${vector}.RIGHT * 3.0) == 1, "Second input receives next sequence")
    check(prediction.position.is_equal_approx(${point(2, 0)}), "Direction must be clamped before applying movement")
    check(prediction.reconcile(${point(5, 0)}, 0), "Valid acknowledgement must reconcile")
    check(prediction.position.is_equal_approx(${point(6, 0)}), "Only the unacknowledged second input replays")
    check(not prediction.reconcile(${point(99, 0)}, 0), "Duplicate acknowledgement must not overwrite current state")
    check(not prediction.reconcile(${point(99, 0)}, 100), "Unissued future sequence must be rejected")
    prediction.reset_to(${vector}.ZERO)
    for index in range(prediction.MAX_PENDING):
        check(prediction.predict(${vector}.RIGHT) == index, "Pending window accepts each ordered input")
    var full_position: ${vector} = prediction.position
    check(prediction.predict(${vector}.RIGHT) == -1, "Full buffer must reject further prediction")
    check(prediction.position == full_position, "Rejected prediction must not move the player")
    check(prediction.reconcile(${point(128, 0)}, 127), "Acknowledgement releases full input window")
    check(prediction.predict(${vector}.RIGHT) == 128, "Sequence continues after window release")
    var history = load("res://history.gd").new()
    history.max_snapshots = 2
    history.hit_radius = 0.5
    var targets := {7: ${point(5, 0)}}
    history.record_snapshot(1, targets)
    targets[7] = ${point(5, 9)}
    check(history.hits_target(7, ${vector}.ZERO, ${vector}.RIGHT, 10.0, 1), "Stored snapshot must copy positions before caller mutates dictionary")
    check(not history.hits_target(7, ${vector}.ZERO, ${vector}.ZERO, 10.0, 1), "Zero direction is not a shot")
    check(not history.hits_target(7, ${vector}.ZERO, ${vector}.RIGHT, 2.0, 1), "Finite range must reject distant targets")
    check(not history.hits_target(7, ${vector}.ZERO, -${vector}.RIGHT, 10.0, 1), "Targets behind the ray must not hit")
    check(not history.hits_target(99, ${vector}.ZERO, ${vector}.RIGHT, 10.0, 1), "Missing target must not hit")
    history.record_snapshot(2, targets)
    history.record_snapshot(3, targets)
    check(not history.hits_target(7, ${vector}.ZERO, ${vector}.RIGHT, 10.0, 1), "Expired snapshots must be pruned")
    check(history._history.size() == 2, "History must remain within configured count")
    history.record_snapshot(2, {7: ${point(5, 0)}})
    check(not history.hits_target(7, ${vector}.ZERO, ${vector}.RIGHT, 10.0, 2), "Stale captures must not replace retained history")
    finish()
`,
    });
    return ['res://test.gd'];
  },
}));

const interestCases = [2, 3].map(dimension => ({
  name: `dimensions-network: ${dimension}D visibility uses matching world coordinates and configured distance`,
  async setup({ repoRoot, projectDir }) {
    const vector = `Vector${dimension}`;
    await writeProject(projectDir, {
      'interest.gd': await gdscriptBlock(repoRoot, `skills/multiplayer-sync/references/${dimension}d-interest-management.md`, `# interest_${dimension}d.gd`),
      'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var interest = load("res://interest.gd").new()
    var sync := MultiplayerSynchronizer.new()
    sync.name = "MultiplayerSynchronizer"
    interest.add_child(sync)
    root.add_child(interest)
    interest.set_physics_process(false)
    var player := Node${dimension}D.new()
    root.add_child(player)
    player.add_to_group("player_7")
    interest.visibility_distance = 10.0
    player.global_position = ${vector}.RIGHT * 8.0
    check(interest._is_peer_in_range(7), "Near matching-dimension player is visible")
    player.global_position = ${vector}.RIGHT * 12.0
    check(not interest._is_peer_in_range(7), "Far matching-dimension player is filtered")
    check(not interest._is_peer_in_range(99), "Absent player is filtered")
    check(sync.visibility_update_mode == MultiplayerSynchronizer.VISIBILITY_PROCESS_PHYSICS, "Visibility must follow physics updates")
    player.free()
    interest.free()
    finish()
`,
    });
    return ['res://test.gd'];
  },
}));

export default [
  {
    name: 'dimensions-network: 3D custom spawn assigns authority on both real loopback peers before ready',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'world.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-basics/references/3d-spawning-networked-objects.md', '# world.gd'),
        'player.gd': `extends Node3D
var authority_at_ready := -1
func _ready() -> void:
    authority_at_ready = get_multiplayer_authority()
`,
        'scenes/player.tscn': `[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://player.gd" id="1"]
[node name="Player" type="Node3D"]
script = ExtResource("1")
`,
        'world.tscn': `[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://world.gd" id="1"]
[node name="World" type="Node"]
script = ExtResource("1")
[node name="Players" type="Node" parent="."]
[node name="MultiplayerSpawner" type="MultiplayerSpawner" parent="."]
spawn_path = NodePath("../Players")
`,
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var server_branch := Node.new()
    server_branch.name = "ServerBranch"
    var client_branch := Node.new()
    client_branch.name = "ClientBranch"
    root.add_child(server_branch)
    root.add_child(client_branch)
    var server_api := SceneMultiplayer.new()
    var client_api := SceneMultiplayer.new()
    set_multiplayer(server_api, server_branch.get_path())
    set_multiplayer(client_api, client_branch.get_path())
    var server_peer := ENetMultiplayerPeer.new()
    var client_peer := ENetMultiplayerPeer.new()
    server_peer.set_bind_ip("127.0.0.1")
    check(server_peer.create_server(0, 2) == OK, "Loopback server must start on an ephemeral port")
    if failed:
        finish()
        return
    check(client_peer.create_client("127.0.0.1", server_peer.host.get_local_port()) == OK, "Loopback client must initialize")
    server_api.multiplayer_peer = server_peer
    client_api.multiplayer_peer = client_peer
    var world_scene: PackedScene = load("res://world.tscn")
    var server_world := world_scene.instantiate()
    var client_world := world_scene.instantiate()
    server_branch.add_child(server_world)
    client_branch.add_child(client_world)
    for attempt in range(100):
        if client_peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTED and server_api.get_peers().size() == 1:
            break
        await create_timer(0.02).timeout
    check(client_peer.get_connection_status() == MultiplayerPeer.CONNECTION_CONNECTED, "Loopback connection must complete within two seconds")
    if not failed:
        var client_id := client_api.get_unique_id()
        server_world.server_spawn_player(client_id, Vector3(5, 10, 15))
        var client_players := client_world.get_node("Players")
        for attempt in range(100):
            if client_players.get_child_count() == 1:
                break
            await create_timer(0.02).timeout
        check(client_players.get_child_count() == 1, "Spawned player must arrive on client")
        if client_players.get_child_count() == 1:
            var server_player := server_world.get_node("Players").get_child(0)
            var client_player := client_players.get_child(0)
            check(server_player.get_multiplayer_authority() == client_id, "Server copy must have the assigned client authority")
            check(client_player.get_multiplayer_authority() == client_id, "Client copy must have the same authority")
            check(server_player.authority_at_ready == client_id and client_player.authority_at_ready == client_id, "Authority must be correct before ready on both peers")
            check(client_player.is_multiplayer_authority(), "The owning client must pass its input authority guard")
            check(client_player.position == Vector3(5, 10, 15), "Spawn data must reproduce the position")
            check(client_player.is_in_group("player_%d" % client_id), "Spawn callback registers player for join cleanup and spatial interest")
    # Tear down replicated nodes before closing peers, avoiding invalid-peer shutdown errors.
    client_branch.free()
    server_branch.free()
    client_api.multiplayer_peer = OfflineMultiplayerPeer.new()
    server_api.multiplayer_peer = OfflineMultiplayerPeer.new()
    client_peer.close()
    server_peer.close()
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'dimensions-network: 3D synchronizer child delivers snapshots and interpolation follows network time',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'display.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-sync/references/3d-interpolation.md', '# remote_player_display.gd'),
        // Override only the clock to exercise the actual documented _process implementation deterministically.
        'test_display.gd': `extends "res://display.gd"
var test_time: float = 1.0
func _now_seconds() -> float:
    return test_time
`,
        'synced_player.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-sync/references/3d-synced-player.md', '# synced_player.gd'),
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var container := Node.new()
    var source = load("res://synced_player.gd").new()
    source.name = "SyncedPlayer"
    var sync := MultiplayerSynchronizer.new()
    sync.name = "MultiplayerSynchronizer"
    source.add_child(sync)
    container.add_child(source)
    var display = load("res://test_display.gd").new()
    container.add_child(display)
    root.add_child(container)
    source.set_physics_process(false)
    display.set_process(false)
    source.synced_position = Vector3(42, 5, 7)
    sync.synchronized.emit()
    check(display._snapshots[-1]["position"] == Vector3(42, 5, 7), "Actual child synchronizer signal must capture the parent's received state")
    display._snapshots.clear()
    display._record_snapshot(1.0, Vector3.ZERO)
    display._record_snapshot(1.05, Vector3(10, 0, 0))
    # 20 Hz network snapshots must progress monotonically across multiple 60 Hz ticks.
    var last_x := -1.0
    for render_time in [1.005, 1.015, 1.025, 1.035, 1.045]:
        display.test_time = render_time + display.interpolation_delay
        display._process(1.0 / 60.0)
        var pos: Vector3 = display.global_position
        check(pos.x > last_x, "Interpolation must not reset each physics tick")
        check(is_equal_approx(pos.x, (render_time - 1.0) / 0.05 * 10.0), "Interpolation must use snapshot timestamps")
        last_x = pos.x
    check(display._sample_position(2.0) == Vector3(10, 0, 0), "An underrun must hold the last snapshot")
    display._record_snapshot(1.05, Vector3(12, 0, 0))
    check(display._snapshots.size() == 2 and display._sample_position(2.0) == Vector3(12, 0, 0), "Duplicate timestamps must not create a zero-length interpolation interval")
    for index in range(100):
        display._record_snapshot(2.0 + index, Vector3(index, 0, 0))
    check(display._snapshots.size() == display.MAX_SNAPSHOTS, "Snapshot storage must remain bounded")
    container.free()
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  ...coreCases,
  ...interestCases,
];
