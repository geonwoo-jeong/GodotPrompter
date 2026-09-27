---
name: state-machine
description: Use when implementing state machines in Godot — enum-based, node-based, and resource-based FSM patterns with trade-offs
---

# State Machines in Godot 4.3+ (Common)

Choose the right FSM pattern for your complexity level. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **player-controller** for movement state integration, **ai-navigation** for AI state patterns, **resource-pattern** for resource-based state configuration, **animation-system** for AnimationTree states driven by FSM, **dialogue-system** for dialogue flow as a state machine, **ability-system** for caster state gating (casting/stunned), **limboai** for the LimboAI addon's HSM (`BTState`) if you need a behavior tree alongside your FSM, **beehave** for a GDScript-only BT alternative.

> **When to reach for an addon:** This skill covers the built-in FSM patterns (enum, node-based, resource-based). If your agent needs a full behavior tree, see **limboai** (C++ + HSM, Godot 4.6+) or **beehave** (pure GDScript, Godot 4.1+) instead.

> **Dimension routing:** Shared lifecycle and resource states work in both dimensions. Use [2D character states](references/2d-character-states.md) or [3D character states](references/3d-character-states.md).

---

## 1. Approach Comparison

| Approach       | Complexity | Best For                              |
|----------------|------------|---------------------------------------|
| Enum-Based     | Low        | Simple objects, fewer than 5 states   |
| Node-Based     | Medium     | Characters with complex behavior      |
| Resource-Based | High       | Data-driven or editor-configurable AI |

---

## 2. Approach 1: Enum-Based (Simplest)

Use when you have a small number of states and no significant enter/exit logic.

See [2D enum enemy](references/2d-enum-enemy.md) and [3D enum enemy](references/3d-enum-enemy.md). Transition decisions are shared; the body adapters determine distances and gravity.

> **When to upgrade away from enum-based:**
> - Enter/exit logic starts duplicating across state methods
> - Animation sync requires explicit enter/exit hooks
> - The `match`/`switch` block grows beyond ~100 lines

---

## 3. Approach 2: Node-Based (Recommended for Characters)

Each state is its own node. The `StateMachine` node delegates input and process calls to whichever state is active, and states trigger transitions by name.

### Scene Tree

```
Player (CharacterBody2D or CharacterBody3D)
└── StateMachine (Node)
    ├── Idle  (State)
    ├── Run   (State)
    ├── Jump  (State)
    └── Attack (State)
```

### State Base Class

**GDScript (`state.gd`)**

```gdscript
class_name State
extends Node

## Populated by StateMachine._ready()
var entity: Node
var state_machine: StateMachine


## Called when this state becomes active.
func enter() -> void:
	pass


## Called when this state is deactivated.
func exit() -> void:
	pass


## Mirrors _process. Return a state name string to transition, or "" to stay.
func update(delta: float) -> String:
	return ""


## Mirrors _physics_process. Return a state name string to transition, or "".
func physics_update(delta: float) -> String:
	return ""


## Mirrors _unhandled_input.
func handle_input(event: InputEvent) -> String:
	return ""
```

**C# (`State.cs`)**

```csharp
using Godot;

public partial class State : Node
{
    /// Populated by StateMachine._Ready()
    public Node Entity { get; set; }
    public StateMachine StateMachine { get; set; }

    public virtual void Enter() { }
    public virtual void Exit() { }
    public virtual string Update(double delta) => string.Empty;
    public virtual string PhysicsUpdate(double delta) => string.Empty;
    public virtual string HandleInput(InputEvent @event) => string.Empty;
}
```

### StateMachine Class

The machine registers its child states, assigns their character and machine references, and owns their enter/exit lifecycle. Top-level machines activate automatically; a machine directly under a `State` waits for that state to activate it. Activation always starts at the exported initial state. Deactivation exits once and disables update, physics, and input together.

See [references/common-node-based-machine.md](references/common-node-based-machine.md) for the complete GDScript and C# `StateMachine` implementation, including `activate()` / `Activate()` and `deactivate()` / `Deactivate()`. Use that same implementation for the hierarchical and parallel examples below.

### Concrete States and Body Adapters

The shared `State`/`StateMachine` lifecycle only needs `Node`. Use [typed 2D states](references/2d-character-states.md) or [typed 3D states](references/3d-character-states.md) for `is_on_floor()`, velocity and movement. Do not assume a Node is a CharacterBody or convert a 2D velocity to 3D by changing its type name.

---

## 4. Approach 3: Resource-Based (Data-Driven)

Use when designers need to configure states in the Godot Inspector without modifying code.

### StateData Resource

```gdscript
class_name StateData
extends Resource

@export var state_name: String = ""
@export var animation_name: String = ""
@export var move_speed: float = 0.0
@export var can_transition_to: Array[String] = []
```

Export an `Array[StateData]` on your AI controller. Designers populate each entry in the Inspector — no code changes needed to tune behavior or add states. The runtime reads `can_transition_to` to validate transitions and picks `animation_name` / `move_speed` for each active state.

```csharp
using Godot;

[GlobalClass]
public partial class StateData : Resource
{
    [Export] public string StateName { get; set; } = string.Empty;
    [Export] public string AnimationName { get; set; } = string.Empty;
    [Export] public float MoveSpeed { get; set; } = 0f;
    [Export] public Godot.Collections.Array<string> CanTransitionTo { get; set; } = new();
}
```

Attach an `Array[StateData]` export on your AI controller class (`[Export] public Godot.Collections.Array<StateData> States`). At runtime, look up the active `StateData` by `StateName` and read `AnimationName` / `MoveSpeed` to drive behavior; use `CanTransitionTo` to guard `TransitionTo` calls.

---

## 5. Hierarchical and Parallel State Machines

When a flat FSM grows beyond ~8 states or spans multiple concerns (movement + combat + animation), split into **hierarchical** machines (states own sub-state machines, e.g. `OnGround` containing `Idle/Walk/Run`) or **parallel** machines (independent FSMs for movement, combat, animation running side-by-side). Both keep state counts additive instead of multiplicative.

See [references/common-hierarchical-and-parallel.md](references/common-hierarchical-and-parallel.md) for full scene trees, `HierarchicalState` base class, parallel-machine character example, and a "which to choose" comparison table — GDScript and C# for each.

---

## 6. Decision Flowchart

```
Start
  │
  ▼
Fewer than 5 states?
  ├─ Yes ──────────────────────────────────► Enum-Based
  └─ No
       │
       ▼
     Multiple independent concerns
     (movement + combat + animation)?
       ├─ Yes ──────────────────────────────► Parallel State Machines
       └─ No
            │
            ▼
          States naturally nest
          (sub-states within states)?
            ├─ Yes ────────────────────────► Hierarchical State Machine
            └─ No
                 │
                 ▼
               Designers need to configure
               states in the Inspector?
                 ├─ Yes ──────────────────► Resource-Based
                 └─ No ──────────────────► Node-Based
```

---

## 7. Implementation Checklist

- [ ] Chose the approach that matches actual complexity (enum / node / resource)
- [ ] Every state has explicit `enter()` and `exit()` methods (or equivalent)
- [ ] All transitions are named explicitly — no implicit fallthrough between states
- [ ] Animations are started in `enter()` and cleaned up in `exit()` where needed
- [ ] No circular transition loops that could cause infinite recursion in a single frame
- [ ] Flat FSM is replaced with hierarchical or parallel when states exceed ~8 or span multiple concerns
- [ ] Parallel state machines don't modify the same state (e.g., both setting velocity) — one concern per machine
