---
name: multiplayer-basics
description: Use when implementing multiplayer — MultiplayerAPI, ENet/WebSocket peers, RPCs, and authority model
---

# Multiplayer Basics in Godot 4.3+ (Common)

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, C# follows.

**Related skills:** See **multiplayer-sync** for state synchronization and interpolation. See **dedicated-server** for headless export and server deployment.

---

**Dimension routing:** ENet, RPCs, and ownership are common. Use [2D spawning](references/2d-spawning-networked-objects.md), [3D spawning](references/3d-spawning-networked-objects.md), [2D joins](references/2d-player-join-flow.md), or [3D joins](references/3d-player-join-flow.md) for spatial scenes.

## 1. Multiplayer Architecture

Godot uses a **client-server model** built on top of `MultiplayerAPI`. One peer acts as the server; all others are clients. Every peer has a unique integer ID assigned by the network layer:

| Peer ID | Role |
|---------|------|
| `1` | The server (always) |
| `2`+ | Connected clients — randomly generated unique IDs, **not** sequential |

**Multiplayer authority** is the concept of ownership over a node. Only the authoritative peer writes that node's canonical replicated state. In client-authoritative movement, that owner also reads input. In server-authoritative prediction, clients read local input and send it for server validation. By default the server (peer `1`) is the authority for every node. Call `set_multiplayer_authority(peer_id)` to transfer ownership to a client.

```
Server (peer 1)
    ├── Owns game state by default
    ├── Spawns and validates objects
    └── Routes RPCs
Client (peer 2, 3, …)
    ├── Sends input to server via RPC
    └── Receives state updates from server
```

---

## 2. Setting Up ENetMultiplayerPeer

Both sides use the same three steps: create an `ENetMultiplayerPeer`, call `create_server(port, max_clients)` or `create_client(address, port)`, then assign it to `multiplayer.multiplayer_peer` and connect the four `MultiplayerAPI` signals. **Check the `create_*` return value** — it returns an `Error`, and a silent `ERR_CANT_CREATE` (port already in use) otherwise looks exactly like a hang.

The server is always peer ID `1`; clients receive randomly generated unique IDs, so never assume they are sequential.

Full server and client implementations with every signal handler, in GDScript and C#: [references/common-enet-setup.md](references/common-enet-setup.md)

---

## 3. RPCs

`@rpc` (GDScript) / `[Rpc]` (C#) marks a method as callable across the network. Choose the mode and transfer settings carefully — they affect both security and performance.

### RPC Modes

| Mode | Who may call it | Executes on |
|------|-----------------|-------------|
| `"authority"` (default) | Only the authority peer | The peer(s) it is sent to |
| `"any_peer"` | Any connected peer | The peer(s) it is sent to |

### Transfer Modes

| Mode | Delivery | Order | Use For |
|------|----------|-------|---------|
| `"reliable"` | Guaranteed | In-order | Chat, spawn events, important state |
| `"unreliable"` | Best-effort | Unordered | High-frequency position updates |
| `"unreliable_ordered"` | Best-effort | In-order per channel | Smooth movement streams |

### GDScript

```gdscript
# chat.gd — chat has no spatial dependency.
extends Node

# Any peer can call; server validates then broadcasts to all peers.
@rpc("any_peer", "reliable")
func send_chat_message(text: String) -> void:
	if not multiplayer.is_server():
		return
	var sender_id := multiplayer.get_remote_sender_id()
	_broadcast_chat.rpc(sender_id, text)


# Only the authority (server) can call this; runs on every peer.
@rpc("authority", "reliable", "call_local")
func _broadcast_chat(sender_id: int, text: String) -> void:
	print("[%d]: %s" % [sender_id, text])


```

**Sending to specific peers:**

```gdscript
# Send to everyone (including self if call_local is set):
send_chat_message.rpc("Hello!")

# Send to one specific peer:
send_chat_message.rpc_id(target_peer_id, "Hello!")
```

### C#

```csharp
// Chat.cs
using Godot;

public partial class Chat : Node
{
    // Any peer can call; executes on the server only.
    [Rpc(MultiplayerApi.RpcMode.AnyPeer, TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    public void SendChatMessage(string text)
    {
        if (!Multiplayer.IsServer()) return;
        int senderId = Multiplayer.GetRemoteSenderId();
        Rpc(MethodName.BroadcastChat, senderId, text);
    }

    // Authority only; runs on every peer including the caller.
    [Rpc(MultiplayerApi.RpcMode.Authority,
         CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void BroadcastChat(int senderId, string text)
        => GD.Print($"[{senderId}]: {text}");


}
```

**Sending to specific peers in C#:**

```csharp
// Broadcast to all:
Rpc(MethodName.SendChatMessage, "Hello!");

// Send to one peer:
RpcId(targetPeerId, MethodName.SendChatMessage, "Hello!");
```

---

## 4. Authority Model

Every node has exactly one authoritative peer — the peer that is permitted to send state updates for that node. Other peers should treat incoming state as read-only.

Choose [2D client authority movement](references/2d-authority-movement.md) or [3D client authority movement](references/3d-authority-movement.md). The authority API and ownership rules are common; body type, vectors, and speed units differ.

**API summary:**

| Method | Returns | Notes |
|--------|---------|-------|
| `multiplayer.get_unique_id()` | `int` | This peer's ID |
| `get_multiplayer_authority()` | `int` | ID of the peer that owns this node |
| `is_multiplayer_authority()` | `bool` | True if this peer owns this node |
| `set_multiplayer_authority(id)` | `void` | Set locally on every peer, e.g. in the custom spawn callback; not automatically replicated |

---

## 5. Spawning Networked Objects

Use `MultiplayerSpawner` to replicate scene instances across peers. The server adds a child to the spawned node's parent, the spawner mirrors it on every peer with synchronized state. For automatic scene replication, register scenes with `add_spawnable_scene()` and add their instances under `spawn_path` on the authority. For custom spawn data, use `spawn_function` and `spawn(data)`.

> See [2D spawning](references/2d-spawning-networked-objects.md) or [3D spawning](references/3d-spawning-networked-objects.md) for `MultiplayerSpawner` scene setup and the spawn-on-server flow (GDScript + C#).

---

## 6. Player Join Flow

The full lobby-join lifecycle: peer connects → server allocates a slot → load lobby scene → spawn player node → broadcast peer-list to all clients → on "start match" RPC, transition all peers to gameplay scene.

> See [2D join flow](references/2d-player-join-flow.md) or [3D join flow](references/3d-player-join-flow.md) for the full GDScript and C# implementation (peer-connected handler, slot allocation, lobby state, gameplay transition).

---

## 7. Disconnect Handling

Listen for `peer_disconnected(id)` on the `multiplayer` API. On the server: free the disconnected peer's player node and broadcast the updated peer-list. On clients: detect a server-disconnect and route to a reconnect / main-menu screen.

> See [references/common-disconnect-handling.md](references/common-disconnect-handling.md) for the timeout detection settings, server-side cleanup, and client-side reconnect flow (GDScript + C#).

---

## 8. Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Calling an RPC on the wrong authority | `rpc_id` silently ignored; method never runs | Check `is_multiplayer_authority()` before sending; use `"any_peer"` only where intentional |
| Desync from unordered RPCs | Positions jitter or snap | Use `"unreliable_ordered"` for streams; use `"reliable"` for critical state changes |
| Reading input in `_process` vs `_physics_process` | Movement desyncs on different frame rates | Always move `CharacterBody2D` / `CharacterBody3D` in `_physics_process`; send sync RPCs from there too |
| Not checking `is_multiplayer_authority()` before input | Every peer controls every player | Add an `if not is_multiplayer_authority(): return` guard at the top of input handling |
| Spawning without `MultiplayerSpawner` | Object appears on server, missing on clients | Use registered spawnable scenes under `spawn_path`, or custom `spawn_function` with `spawn(data)` |
| Forgetting `call_local` on authority RPCs | Server state diverges from its own node | Add `"call_local"` when the sender also needs to execute the RPC locally |
| Using `rpc()` before the peer is assigned | Crash or silent failure | Assign `multiplayer.multiplayer_peer` before calling any RPC |
| Not stripping `res://` scenes from exported builds | Clients can read server-only scripts | Use `export_exclude` or PCK encryption for sensitive server code |

---

## 9. Checklist

- [ ] `ENetMultiplayerPeer.create_server()` / `create_client()` return `OK` before assigning to `multiplayer.multiplayer_peer`
- [ ] All four multiplayer signals connected: `peer_connected`, `peer_disconnected`, `connected_to_server`, `connection_failed`
- [ ] Every node that reads player input guards with `if not is_multiplayer_authority(): return`
- [ ] Input processing and `sync_position` RPC are both in `_physics_process`, not `_process`
- [ ] RPC modes chosen deliberately: `"any_peer"` only for client → server calls; `"authority"` for server → client
- [ ] Unreliable RPCs used only for high-frequency updates (position, rotation); reliable for events (spawn, damage, chat)
- [ ] `MultiplayerSpawner` configured with all spawnable scenes before the first player joins
- [ ] `set_multiplayer_authority(peer_id)` set consistently on every peer inside the custom spawn callback before the node enters the tree
- [ ] `peer_disconnected` handler frees the player node and removes it from tracking collections
- [ ] `server_disconnected` handler on clients returns to main menu and nulls `multiplayer.multiplayer_peer`
- [ ] `is_instance_valid()` checked before dereferencing any stored node reference in disconnect callbacks
- [ ] No `rpc()` calls made before `multiplayer.multiplayer_peer` is assigned
