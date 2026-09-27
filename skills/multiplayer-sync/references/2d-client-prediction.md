# Client Prediction and Reconciliation (2D)

> [Common synchronization concepts](../SKILL.md) · [3D counterpart](3d-client-prediction.md)

This complete bounded core predicts collision-free planar movement at a fixed tick duration. The server and client must use the same speed and tick duration. The transport layer supplies ordered, validated input sequence numbers and authoritative acknowledgements; this class itself does not send RPCs or grant clients authority.

For a CharacterBody2D controller, replace `step_position` / `StepPosition` with a motor that can restore **all** simulated state and replay one explicit fixed-duration step. Calling `move_and_slide()` repeatedly from a network callback does not establish a replay clock. Dynamic collisions, gravity, velocity, and moving platforms require additional snapshot state. Smooth a separate visual offset after correcting simulation state.

## Prediction core

`predict` returns the next sequence number, or `-1` when the 128-entry window is full. A full window pauses further prediction until an acknowledgement or explicit authoritative reset arrives; dropping unacknowledged input would make subsequent reconciliation incomplete. The 3D variant uses `Vector3` so it can represent XZ movement or flight; map a 2D input action vector onto the intended plane before calling it.

```gdscript
# prediction_2d.gd
extends RefCounted

const MAX_PENDING := 128
var speed: float = 200.0
var tick_seconds: float = 1.0 / 60.0
var position: Vector2 = Vector2.ZERO
var _next_sequence := 0
var _last_ack := -1
var _pending: Array[Dictionary] = []

func predict(direction: Vector2) -> int:
    if _pending.size() >= MAX_PENDING:
        return -1
    var sequence := _next_sequence
    _next_sequence += 1
    var bounded_direction := direction.limit_length(1.0)
    _pending.append({"sequence": sequence, "direction": bounded_direction})
    position = step_position(position, bounded_direction)
    return sequence

func step_position(start: Vector2, direction: Vector2) -> Vector2:
    return start + direction * speed * tick_seconds

func reconcile(authoritative_position: Vector2, ack_sequence: int) -> bool:
    if ack_sequence <= _last_ack or ack_sequence >= _next_sequence:
        return false
    _last_ack = ack_sequence
    while not _pending.is_empty() and _pending[0]["sequence"] <= ack_sequence:
        _pending.pop_front()
    position = authoritative_position
    for pending in _pending:
        position = step_position(position, pending["direction"])
    return true

func reset_to(authoritative_position: Vector2, next_sequence: int = 0) -> void:
    position = authoritative_position
    _pending.clear()
    _next_sequence = next_sequence
    _last_ack = next_sequence - 1
```

```csharp
// Prediction2D.cs
using Godot;
using System.Collections.Generic;

public partial class Prediction2D : RefCounted
{
    public const int MaxPending = 128;
    public float Speed { get; set; } = 200.0f;
    public float TickSeconds { get; set; } = 1f / 60f;
    public Vector2 Position { get; private set; } = Vector2.Zero;
    private int _nextSequence;
    private int _lastAck = -1;
    private readonly Queue<(int Sequence, Vector2 Direction)> _pending = new();

    public int Predict(Vector2 direction)
    {
        if (_pending.Count >= MaxPending) return -1;
        int sequence = _nextSequence++;
        var boundedDirection = direction.LimitLength(1f);
        _pending.Enqueue((sequence, boundedDirection));
        Position = StepPosition(Position, boundedDirection);
        return sequence;
    }

    public Vector2 StepPosition(Vector2 start, Vector2 direction)
        => start + direction * Speed * TickSeconds;

    public bool Reconcile(Vector2 authoritativePosition, int ackSequence)
    {
        if (ackSequence <= _lastAck || ackSequence >= _nextSequence) return false;
        _lastAck = ackSequence;
        while (_pending.Count > 0 && _pending.Peek().Sequence <= ackSequence)
            _pending.Dequeue();
        Position = authoritativePosition;
        foreach (var pending in _pending)
            Position = StepPosition(Position, pending.Direction);
        return true;
    }

    public void ResetTo(Vector2 authoritativePosition, int nextSequence = 0)
    {
        Position = authoritativePosition;
        _pending.Clear();
        _nextSequence = nextSequence;
        _lastAck = nextSequence - 1;
    }
}
```

## Transport integration

1. The owning client samples input once per fixed physics tick, calls `predict`, and sends that sequence number and direction. Keep authority on the server.
2. The server identifies the sender with `multiplayer.get_remote_sender_id()` / `Multiplayer.GetRemoteSenderId()`, checks that sender owns the input stream, validates finite direction values, and clamps length. It queues input and consumes at most one step per simulation tick; an RPC arrival is not itself a simulation tick.
3. The server acknowledges the **last actually simulated sequence**, alongside the authoritative position at that sequence. A packet arriving does not mean its input has been simulated.
4. The client calls `reconcile`. Stale acknowledgements are ignored; remaining inputs replay in sequence order. Reset both peers' stream on respawn/reconnect.

Reliable ordered input messages simplify this small example but may stall under loss. A production unreliable protocol needs batched redundant inputs, duplicate rejection, sequence-gap handling, and a bounded server queue; simply changing an RPC annotation is insufficient.
