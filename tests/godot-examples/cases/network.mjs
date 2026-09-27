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

export default [
  {
    name: 'network: basic RPC example has a spatial base and updates position',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'chat.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-basics/SKILL.md', '# chat.gd'),
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var chat = load("res://chat.gd").new()
    root.add_child(chat)
    chat.sync_position(Vector2(25, 30))
    check(chat is Node2D and chat.global_position == Vector2(25, 30), "RPC position example must compile and target a spatial node")
    chat.free()
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'network: custom spawn assigns authority on both real loopback peers before ready',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'world.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-basics/references/spawning-networked-objects.md', '# world.gd'),
        'player.gd': `extends Node2D
var authority_at_ready := -1
func _ready() -> void:
    authority_at_ready = get_multiplayer_authority()
`,
        'scenes/player.tscn': `[gd_scene load_steps=2 format=3]
[ext_resource type="Script" path="res://player.gd" id="1"]
[node name="Player" type="Node2D"]
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
    var world_scene := load("res://world.tscn") as PackedScene
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
        server_world.server_spawn_player(client_id, Vector2(5, 10))
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
            check(client_player.position == Vector2(5, 10), "Spawn data must reproduce the position")
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
    name: 'network: synchronizer child delivers snapshots and interpolation follows network time',
    async setup({ repoRoot, projectDir }) {
      await writeProject(projectDir, {
        'display.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-sync/references/interpolation.md', '# remote_player_display.gd'),
        // Override only the clock to exercise the actual documented _process implementation deterministically.
        'test_display.gd': `extends "res://display.gd"
var test_time: float = 1.0
func _now_seconds() -> float:
    return test_time
`,
        'synced_player.gd': await gdscriptBlock(repoRoot, 'skills/multiplayer-sync/SKILL.md', '# synced_player.gd'),
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
    source.synced_position = Vector2(42, 5)
    sync.synchronized.emit()
    check(display._snapshots[-1]["position"] == Vector2(42, 5), "Actual child synchronizer signal must capture the parent's received state")
    display._snapshots.clear()
    display._record_snapshot(1.0, Vector2.ZERO)
    display._record_snapshot(1.05, Vector2(10, 0))
    # 20 Hz network snapshots must progress monotonically across multiple 60 Hz ticks.
    var last_x := -1.0
    for render_time in [1.005, 1.015, 1.025, 1.035, 1.045]:
        display.test_time = render_time + display.interpolation_delay
        display._process(1.0 / 60.0)
        var pos: Vector2 = display.global_position
        check(pos.x > last_x, "Interpolation must not reset each physics tick")
        check(is_equal_approx(pos.x, (render_time - 1.0) / 0.05 * 10.0), "Interpolation must use snapshot timestamps")
        last_x = pos.x
    check(display._sample_position(2.0) == Vector2(10, 0), "An underrun must hold the last snapshot")
    display._record_snapshot(1.05, Vector2(12, 0))
    check(display._snapshots.size() == 2 and display._sample_position(2.0) == Vector2(12, 0), "Duplicate timestamps must not create a zero-length interpolation interval")
    for index in range(100):
        display._record_snapshot(2.0 + index, Vector2(index, 0))
    check(display._snapshots.size() == display.MAX_SNAPSHOTS, "Snapshot storage must remain bounded")
    container.free()
    finish()
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'network: server config applies defaults then file then environment then CLI',
    async setup({ repoRoot, projectDir }) {
      const config = await gdscriptBlock(repoRoot, 'skills/dedicated-server/references/server-config.md', '# server_config.gd');
      await writeProject(projectDir, {
        // Relocate only the fixture path so this test never touches user application data.
        'server_config.gd': config.replace('"user://server.cfg"', '"res://server.cfg"'),
        'server.cfg': '[server]\nport=8000\nmax_players=12\ntick_rate=50\n',
        'test.gd': `extends SceneTree
${checks}
func _initialize() -> void: run.call_deferred()
func run() -> void:
    var saved := {}
    for key in ["SERVER_PORT", "SERVER_MAX_PLAYERS", "SERVER_TICK_RATE"]:
        saved[key] = OS.get_environment(key) if OS.has_environment(key) else null
    OS.set_environment("SERVER_PORT", "9000")
    OS.set_environment("SERVER_MAX_PLAYERS", "16")
    OS.unset_environment("SERVER_TICK_RATE")
    var config = load("res://server_config.gd").new()
    check(config.port == 7777 and config.max_players == 8, "Defaults must be present before loading sources")
    root.add_child(config)
    check(config.port == 7778, "CLI port must override both environment and config file")
    check(config.max_players == 16, "Environment must override the file when CLI does not set a value")
    check(config.tick_rate == 50, "File must override the default when environment and CLI are absent")
    check(config.log_level == 1, "Unspecified settings must keep defaults")
    for key in saved:
        if saved[key] == null:
            OS.unset_environment(key)
        else:
            OS.set_environment(key, saved[key])
    config.free()
    finish()
`,
      });
      return [{ script: 'res://test.gd', args: ['--', '--port', '7778'] }];
    },
  },
];
