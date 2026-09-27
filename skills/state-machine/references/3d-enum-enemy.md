# Enum Enemy (3D)

> ← Back to [SKILL.md](../SKILL.md)

A minimal obstacle-free XZ example. Detection uses full 3D distance; steering projects onto XZ and gravity stays on Y. Thresholds use world units. For obstacle-aware movement use the navigation recipes.

### GDScript

```gdscript
extends CharacterBody3D

enum State { IDLE, PATROL, CHASE, ATTACK }

@export var patrol_range: float = 6.0
@export var chase_range: float = 10.0
@export var attack_range: float = 1.5
@export var speed: float = 3.0

var current_state: State = State.IDLE
var patrol_target: Vector3 = Vector3.ZERO

@onready var player: Node3D = get_tree().get_first_node_in_group("player")


func _physics_process(delta: float) -> void:
	var vertical_speed: float = velocity.y
	if not is_on_floor():
		vertical_speed -= ProjectSettings.get_setting("physics/3d/default_gravity") * delta
	match current_state:
		State.IDLE:
			_state_idle()
		State.PATROL:
			_state_patrol()
		State.CHASE:
			_state_chase()
		State.ATTACK:
			_state_attack()

	velocity.y = vertical_speed
	move_and_slide()


func _state_idle() -> void:
	velocity = Vector3.ZERO
	if _player_in_range(chase_range):
		current_state = State.CHASE
	elif randf() < 0.005:
		patrol_target = global_position + Vector3(randf_range(-patrol_range, patrol_range), 0.0, randf_range(-patrol_range, patrol_range))
		current_state = State.PATROL


func _state_patrol() -> void:
	var direction := (patrol_target - global_position)
	direction.y = 0.0
	if direction.length() < 0.2:
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
	var direction := player.global_position - global_position
	direction.y = 0.0
	velocity = direction.normalized() * speed


func _state_attack() -> void:
	velocity = Vector3.ZERO
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

public partial class SimpleEnemy3D : CharacterBody3D
{
    private enum State { Idle, Patrol, Chase, Attack }

    [Export] public float PatrolRange { get; set; } = 6f;
    [Export] public float ChaseRange  { get; set; } = 10f;
    [Export] public float AttackRange { get; set; } = 1.5f;
    [Export] public float Speed       { get; set; } = 3f;

    private State _currentState = State.Idle;
    private Vector3 _patrolTarget = Vector3.Zero;
    private Node3D _player;

    public override void _Ready()
    {
        _player = GetTree().GetFirstNodeInGroup("player") as Node3D;
    }

    public override void _PhysicsProcess(double delta)
    {
        float verticalSpeed = Velocity.Y;
        if (!IsOnFloor()) verticalSpeed -= ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle() * (float)delta;
        switch (_currentState)
        {
            case State.Idle:   StateIdle();   break;
            case State.Patrol: StatePatrol(); break;
            case State.Chase:  StateChase();  break;
            case State.Attack: StateAttack(); break;
        }
        Vector3 velocity = Velocity;
        velocity.Y = verticalSpeed;
        Velocity = velocity;
        MoveAndSlide();
    }

    private void StateIdle()
    {
        Velocity = Vector3.Zero;
        if (PlayerInRange(ChaseRange))
        {
            _currentState = State.Chase;
        }
        else if (GD.Randf() < 0.005f)
        {
            _patrolTarget = GlobalPosition + new Vector3((float)GD.RandRange(-PatrolRange, PatrolRange), 0f, (float)GD.RandRange(-PatrolRange, PatrolRange));
            _currentState = State.Patrol;
        }
    }

    private void StatePatrol()
    {
        var direction = _patrolTarget - GlobalPosition;
        direction.Y = 0f;
        if (direction.Length() < 0.2f) { _currentState = State.Idle; return; }
        Velocity = direction.Normalized() * Speed;
        if (PlayerInRange(ChaseRange)) _currentState = State.Chase;
    }

    private void StateChase()
    {
        if (!IsInstanceValid(_player)) { _currentState = State.Idle; return; }
        if (PlayerInRange(AttackRange)) { _currentState = State.Attack; return; }
        if (!PlayerInRange(ChaseRange)) { _currentState = State.Patrol; return; }
        Vector3 direction = _player.GlobalPosition - GlobalPosition;
        direction.Y = 0f;
        Velocity = direction.Normalized() * Speed;
    }

    private void StateAttack()
    {
        Velocity = Vector3.Zero;
        if (!PlayerInRange(AttackRange)) _currentState = State.Chase;
    }

    private bool PlayerInRange(float range) =>
        IsInstanceValid(_player) && GlobalPosition.DistanceTo(_player.GlobalPosition) <= range;
}
```
