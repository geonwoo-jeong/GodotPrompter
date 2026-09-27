# Enum Enemy (2D)

> ← Back to [SKILL.md](../SKILL.md)

A minimal obstacle-free XY example. For obstacle-aware movement use the navigation recipes.

### GDScript

```gdscript
extends CharacterBody2D

enum State { IDLE, PATROL, CHASE, ATTACK }

@export var patrol_range: float = 200.0
@export var chase_range: float = 300.0
@export var attack_range: float = 50.0
@export var speed: float = 80.0

var current_state: State = State.IDLE
var patrol_target: Vector2 = Vector2.ZERO

@onready var player: Node2D = get_tree().get_first_node_in_group("player")


func _physics_process(delta: float) -> void:
	match current_state:
		State.IDLE:
			_state_idle()
		State.PATROL:
			_state_patrol()
		State.CHASE:
			_state_chase()
		State.ATTACK:
			_state_attack()

	move_and_slide()


func _state_idle() -> void:
	velocity = Vector2.ZERO
	if _player_in_range(chase_range):
		current_state = State.CHASE
	elif randf() < 0.005:
		patrol_target = global_position + Vector2(randf_range(-patrol_range, patrol_range), 0.0)
		current_state = State.PATROL


func _state_patrol() -> void:
	var direction := (patrol_target - global_position)
	if direction.length() < 4.0:
		current_state = State.IDLE
		return
	velocity = direction.normalized() * speed
	if _player_in_range(chase_range):
		current_state = State.CHASE


func _state_chase() -> void:
	if not is_instance_valid(player):
		current_state = State.IDLE
		return
	if _player_in_range(attack_range):
		current_state = State.ATTACK
		return
	if not _player_in_range(chase_range):
		current_state = State.PATROL
		return
	velocity = (player.global_position - global_position).normalized() * speed


func _state_attack() -> void:
	velocity = Vector2.ZERO
	if not _player_in_range(attack_range):
		current_state = State.CHASE


func _player_in_range(range: float) -> bool:
	if not is_instance_valid(player):
		return false
	return global_position.distance_to(player.global_position) <= range
```

### C# Equivalent

```csharp
using Godot;

public partial class SimpleEnemy : CharacterBody2D
{
    private enum State { Idle, Patrol, Chase, Attack }

    [Export] public float PatrolRange { get; set; } = 200f;
    [Export] public float ChaseRange  { get; set; } = 300f;
    [Export] public float AttackRange { get; set; } = 50f;
    [Export] public float Speed       { get; set; } = 80f;

    private State _currentState = State.Idle;
    private Vector2 _patrolTarget = Vector2.Zero;
    private Node2D _player;

    public override void _Ready()
    {
        _player = GetTree().GetFirstNodeInGroup("player") as Node2D;
    }

    public override void _PhysicsProcess(double delta)
    {
        switch (_currentState)
        {
            case State.Idle:   StateIdle();   break;
            case State.Patrol: StatePatrol(); break;
            case State.Chase:  StateChase();  break;
            case State.Attack: StateAttack(); break;
        }
        MoveAndSlide();
    }

    private void StateIdle()
    {
        Velocity = Vector2.Zero;
        if (PlayerInRange(ChaseRange))
        {
            _currentState = State.Chase;
        }
        else if (GD.Randf() < 0.005f)
        {
            _patrolTarget = GlobalPosition + new Vector2((float)GD.RandRange(-PatrolRange, PatrolRange), 0f);
            _currentState = State.Patrol;
        }
    }

    private void StatePatrol()
    {
        var direction = _patrolTarget - GlobalPosition;
        if (direction.Length() < 4f) { _currentState = State.Idle; return; }
        Velocity = direction.Normalized() * Speed;
        if (PlayerInRange(ChaseRange)) _currentState = State.Chase;
    }

    private void StateChase()
    {
        if (!IsInstanceValid(_player)) { _currentState = State.Idle; return; }
        if (PlayerInRange(AttackRange)) { _currentState = State.Attack; return; }
        if (!PlayerInRange(ChaseRange)) { _currentState = State.Patrol; return; }
        Velocity = (_player.GlobalPosition - GlobalPosition).Normalized() * Speed;
    }

    private void StateAttack()
    {
        Velocity = Vector2.Zero;
        if (!PlayerInRange(AttackRange)) _currentState = State.Chase;
    }

    private bool PlayerInRange(float range) =>
        IsInstanceValid(_player) && GlobalPosition.DistanceTo(_player.GlobalPosition) <= range;
}
```
