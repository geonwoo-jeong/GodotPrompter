> ← Back to [SKILL.md](../SKILL.md)

# Node-Based StateMachine Lifecycle (Common)

The machine owns state entry, exit, and callback dispatch. Top-level machines start in `_ready()` / `_Ready()`. A machine directly under a `State` starts inactive: its owning hierarchical state calls `activate()` / `Activate()` and `deactivate()` / `Deactivate()`. Every activation starts from `initial_state` / `InitialState`; repeated activation or deactivation is a no-op.

Assign each machine's initial state in the Inspector. The scene owner must be the character, as in the scene tree in the main skill. States implement `update`, `physics_update`, and `handle_input`; the machine invokes these methods only while active. Disabling `_process` alone does not disable `_unhandled_input`, so all three callbacks are gated together.

## StateMachine implementation

**GDScript (`state_machine.gd`)**

```gdscript
class_name StateMachine
extends Node

@export var initial_state: State

var current_state: State
var states: Dictionary = {}
var _active: bool = false


func _ready() -> void:
	_set_callbacks(false)
	for child in get_children():
		if child is State:
			states[child.name] = child
			child.entity = owner
			child.state_machine = self

	# Nested machines are activated by their owning state, after registration.
	if not get_parent() is State:
		activate()


func activate() -> void:
	if _active or not initial_state:
		return
	current_state = initial_state
	_active = true
	_set_callbacks(true)
	current_state.enter()


func deactivate() -> void:
	if not _active:
		return
	_active = false
	_set_callbacks(false)
	current_state.exit()
	current_state = null


func _set_callbacks(enabled: bool) -> void:
	set_process(enabled)
	set_physics_process(enabled)
	set_process_unhandled_input(enabled)


func _unhandled_input(event: InputEvent) -> void:
	var next := current_state.handle_input(event)
	if next:
		transition_to(next)


func _process(delta: float) -> void:
	var next := current_state.update(delta)
	if next:
		transition_to(next)


func _physics_process(delta: float) -> void:
	var next := current_state.physics_update(delta)
	if next:
		transition_to(next)


func transition_to(state_name: String) -> void:
	if not _active:
		return
	if not states.has(state_name):
		push_error("StateMachine: unknown state '%s'" % state_name)
		return
	if current_state == states[state_name]:
		return
	current_state.exit()
	current_state = states[state_name]
	current_state.enter()
```

**C# (`StateMachine.cs`)**

```csharp
using System.Collections.Generic;
using Godot;

public partial class StateMachine : Node
{
    [Export] public State InitialState { get; set; }

    public State CurrentState { get; private set; }
    private readonly Dictionary<string, State> _states = new();
    private bool _active;

    public override void _Ready()
    {
        SetCallbacks(false);
        foreach (var child in GetChildren())
        {
            if (child is State state)
            {
                _states[state.Name] = state;
                state.Entity = Owner;
                state.StateMachine = this;
            }
        }

        // Nested machines are activated by their owning state, after registration.
        if (GetParent() is not State) Activate();
    }

    public void Activate()
    {
        if (_active || InitialState == null) return;
        CurrentState = InitialState;
        _active = true;
        SetCallbacks(true);
        CurrentState.Enter();
    }

    public void Deactivate()
    {
        if (!_active) return;
        _active = false;
        SetCallbacks(false);
        CurrentState.Exit();
        CurrentState = null;
    }

    private void SetCallbacks(bool enabled)
    {
        SetProcess(enabled);
        SetPhysicsProcess(enabled);
        SetProcessUnhandledInput(enabled);
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        var next = CurrentState.HandleInput(@event);
        if (!string.IsNullOrEmpty(next)) TransitionTo(next);
    }

    public override void _Process(double delta)
    {
        var next = CurrentState.Update(delta);
        if (!string.IsNullOrEmpty(next)) TransitionTo(next);
    }

    public override void _PhysicsProcess(double delta)
    {
        var next = CurrentState.PhysicsUpdate(delta);
        if (!string.IsNullOrEmpty(next)) TransitionTo(next);
    }

    public void TransitionTo(string stateName)
    {
        if (!_active) return;
        if (!_states.TryGetValue(stateName, out var next))
        {
            GD.PushError($"StateMachine: unknown state '{stateName}'");
            return;
        }
        if (CurrentState == next) return;
        CurrentState.Exit();
        CurrentState = next;
        CurrentState.Enter();
    }
}
```
