# Chase, Attack and Patrol (2D)

> ← Back to [SKILL.md](../SKILL.md)

Derives from [NavigationMover2D](2d-navigation-agent.md). Assign the player and fixed waypoint list. Connect `attack_requested` to your attack/animation logic; cooldown repeats while the player remains in range. Detection uses 2D pixel distance, so a 3D enemy does not attack someone several floors above solely because XZ positions match. This simple distance test does not provide line of sight; add a physics ray when required.

```gdscript
extends NavigationMover2D

signal attack_requested

enum State { PATROL, CHASE, ATTACK }
@export var player: Node2D
@export var waypoints: Array[Marker2D] = []
@export var detect_range: float = 250.0
@export var attack_range: float = 40.0
@export var escape_range: float = 320.0
@export var attack_cooldown: float = 0.8
@export var patrol_wait: float = 1.0
var _state: State = State.PATROL
var _index: int = 0
var _attack_left: float = 0.0
var _wait_left: float = 0.0

func _ready() -> void:
    super._ready()
    _patrol_target()

func _physics_process(delta: float) -> void:
    _attack_left = maxf(0.0, _attack_left - delta)
    if not is_instance_valid(player):
        set_target(global_position)
        super._physics_process(delta)
        return
    var distance := global_position.distance_to(player.global_position)
    match _state:
        State.PATROL:
            if distance <= detect_range:
                _state = State.CHASE
                _wait_left = 0.0
            elif not waypoints.is_empty() and NavigationServer2D.map_get_iteration_id(nav_agent.get_navigation_map()) > 0 and nav_agent.is_navigation_finished():
                _wait_left += delta
                if _wait_left >= patrol_wait:
                    _wait_left = 0.0
                    _index = (_index + 1) % waypoints.size()
                    _patrol_target()
        State.CHASE:
            if distance <= attack_range:
                _state = State.ATTACK
                set_target(global_position)
            elif distance >= escape_range:
                _state = State.PATROL
                _patrol_target()
            else:
                set_target(player.global_position)
        State.ATTACK:
            if distance > attack_range:
                _state = State.CHASE
            elif _attack_left == 0.0:
                attack_requested.emit()
                _attack_left = attack_cooldown
    super._physics_process(delta)

func _patrol_target() -> void:
    set_target(global_position if waypoints.is_empty() else waypoints[_index].global_position)
```

```csharp
using Godot;

public partial class ChaseAttackEnemy2D : NavigationMover2D
{
    [Signal] public delegate void AttackRequestedEventHandler();
    private enum State { Patrol, Chase, Attack }
    [Export] public Node2D Player { get; set; }
    [Export] public Godot.Collections.Array<Marker2D> Waypoints { get; set; } = new();
    [Export] public float DetectRange { get; set; } = 250.0f;
    [Export] public float AttackRange { get; set; } = 40.0f;
    [Export] public float EscapeRange { get; set; } = 320.0f;
    [Export] public float AttackCooldown { get; set; } = 0.8f;
    [Export] public float PatrolWait { get; set; } = 1f;
    private State _state;
    private int _index;
    private float _attackLeft;
    private float _waitLeft;

    public override void _Ready()
    {
        base._Ready();
        PatrolTarget();
    }

    public override void _PhysicsProcess(double delta)
    {
        _attackLeft = Mathf.Max(0f, _attackLeft - (float)delta);
        if (!IsInstanceValid(Player))
        {
            SetTarget(GlobalPosition);
            base._PhysicsProcess(delta);
            return;
        }
        float distance = GlobalPosition.DistanceTo(Player.GlobalPosition);
        switch (_state)
        {
            case State.Patrol:
                if (distance <= DetectRange) { _state = State.Chase; _waitLeft = 0f; }
                else if (Waypoints.Count > 0 && NavigationServer2D.MapGetIterationId(Agent.GetNavigationMap()) > 0 && Agent.IsNavigationFinished())
                {
                    _waitLeft += (float)delta;
                    if (_waitLeft >= PatrolWait)
                    {
                        _waitLeft = 0f;
                        _index = (_index + 1) % Waypoints.Count;
                        PatrolTarget();
                    }
                }
                break;
            case State.Chase:
                if (distance <= AttackRange) { _state = State.Attack; SetTarget(GlobalPosition); }
                else if (distance >= EscapeRange) { _state = State.Patrol; PatrolTarget(); }
                else SetTarget(Player.GlobalPosition);
                break;
            case State.Attack:
                if (distance > AttackRange) _state = State.Chase;
                else if (_attackLeft == 0f)
                {
                    EmitSignal(SignalName.AttackRequested);
                    _attackLeft = AttackCooldown;
                }
                break;
        }
        base._PhysicsProcess(delta);
    }

    private void PatrolTarget() => SetTarget(Waypoints.Count == 0 ? GlobalPosition : Waypoints[_index].GlobalPosition);
}
```
