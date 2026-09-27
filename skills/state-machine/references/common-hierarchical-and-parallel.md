> ← Back to [SKILL.md](../SKILL.md)

# Hierarchical and Parallel State Machines (Common)

When a single flat FSM grows beyond 8–10 states, or when separate concerns (movement, combat, animation) create a combinatorial explosion, split into hierarchical or parallel machines.

## The Problem: State Explosion

A character with 3 movement states (idle, walk, run) and 3 combat states (none, attack, block) creates 9 combined states in a flat FSM. Add crouching and that's 18. Hierarchical/parallel machines keep it at 3 + 3 = 6.

## Approach A: Hierarchical (Nested State Machines)

States can contain sub-state machines. The outer machine handles high-level states; inner machines handle details. Use the [node-based machine lifecycle](common-node-based-machine.md): nested machines register in `_ready()` but stay inactive until their owning state enters. Re-entering a parent resets its sub-machine to its initial state.

**Scene Tree:**

```
Player (CharacterBody2D or CharacterBody3D)
└── StateMachine (handles: OnGround, InAir, Climbing)
    ├── OnGround (contains sub-states: Idle, Walk, Run, Crouch)
    │   └── SubStateMachine
    │       ├── Idle
    │       ├── Walk
    │       ├── Run
    │       └── Crouch
    ├── InAir (contains sub-states: Jump, Fall, DoubleJump)
    │   └── SubStateMachine
    │       ├── Jump
    │       ├── Fall
    │       └── DoubleJump
    └── Climbing
```

**GDScript — Hierarchical State (extends the Node-based State from Section 3):**

```gdscript
# hierarchical_state.gd — a state that owns a sub-state machine
class_name HierarchicalState
extends State

@export var sub_state_machine: StateMachine

func enter() -> void:
	if sub_state_machine:
		sub_state_machine.activate()

func exit() -> void:
	if sub_state_machine:
		sub_state_machine.deactivate()

func physics_update(delta: float) -> String:
	# Body-specific subclasses decide transitions out of this parent.
	# The active sub-machine handles its own internal transitions.
	return ""
```

**C# — Hierarchical State:**

```csharp
public partial class HierarchicalState : State
{
    [Export] public StateMachine SubStateMachine { get; set; }

    public override void Enter()
    {
        if (SubStateMachine != null)
        {
            SubStateMachine.Activate();
        }
    }

    public override void Exit()
    {
        if (SubStateMachine != null)
        {
            SubStateMachine.Deactivate();
        }
    }

    public override string PhysicsUpdate(double delta)
    {
        // Body-specific subclasses decide transitions out of this parent.
        return string.Empty;
    }
}
```

## Approach B: Parallel State Machines

Run multiple independent state machines simultaneously. Each handles a different concern. The following Node is an animation coordinator below either body type; a single movement controller owns `move_and_slide()`. Do not rely on parent/child processing order to move a body before its states have updated velocity.

**Scene Tree:**

```
Player (CharacterBody2D or CharacterBody3D)
├── MovementSM (StateMachine: Idle, Walk, Run, Jump, Fall)
├── CombatSM   (StateMachine: None, Attack, Block, Dodge)
└── AnimationSM (StateMachine: reads from Movement + Combat to pick animation)
```

**GDScript — Parallel machines on a character:**

```gdscript
extends Node

@onready var movement_sm: StateMachine = $MovementSM
@onready var combat_sm: StateMachine = $CombatSM

func get_animation_name() -> String:
	# Combine states to pick the right animation
	var move_state: String = movement_sm.current_state.name
	var combat_state: String = combat_sm.current_state.name

	if combat_state == "Attack":
		return "attack"  # combat overrides movement animation
	match move_state:
		"Run":
			return "run"
		"Jump", "Fall":
			return "air"
		_:
			return "idle"
```

**C#:**

```csharp
public partial class ParallelPlayer : Node
{
    private StateMachine _movementSM;
    private StateMachine _combatSM;

    public override void _Ready()
    {
        _movementSM = GetNode<StateMachine>("MovementSM");
        _combatSM = GetNode<StateMachine>("CombatSM");
    }

    public string GetAnimationName()
    {
        string moveState = _movementSM.CurrentState.Name;
        string combatState = _combatSM.CurrentState.Name;

        if (combatState == "Attack") return "attack";
        return moveState switch
        {
            "Run" => "run",
            "Jump" or "Fall" => "air",
            _ => "idle"
        };
    }
}
```

## Which to Choose

| Pattern | Use When |
|---------|----------|
| **Flat FSM** | ≤ 8 states, single concern |
| **Hierarchical** | States naturally nest (OnGround has sub-states), transitions exist between top-level groups |
| **Parallel** | Independent concerns (movement + combat + animation), no nesting relationship |
