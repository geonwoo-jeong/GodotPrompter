# Waypoint Patrol (2D)

> ← Back to [SKILL.md](../SKILL.md)

Save the [navigation mover](2d-navigation-agent.md) base first. Assign `Marker2D` waypoints in the Inspector. The list is fixed during this patrol. A timer pauses at every completed path, then advances cyclically. A path ending before an unreachable waypoint also advances; use `is_target_reachable()` if your design should retry instead. The base handles XY movement and optional avoidance.

```gdscript
extends NavigationMover2D

@export var waypoints: Array[Marker2D] = []
@export var wait_seconds: float = 1.0
var _index: int = 0
var _wait_left: float = 0.0

func _ready() -> void:
    super._ready()
    if not waypoints.is_empty():
        set_target(waypoints[0].global_position)

func _physics_process(delta: float) -> void:
    if not waypoints.is_empty() and NavigationServer2D.map_get_iteration_id(nav_agent.get_navigation_map()) > 0:
        if nav_agent.is_navigation_finished():
            _wait_left += delta
            if _wait_left >= wait_seconds:
                _wait_left = 0.0
                _index = (_index + 1) % waypoints.size()
                set_target(waypoints[_index].global_position)
        else:
            _wait_left = 0.0
    super._physics_process(delta)
```

```csharp
using Godot;

public partial class PatrolEnemy2D : NavigationMover2D
{
    [Export] public Godot.Collections.Array<Marker2D> Waypoints { get; set; } = new();
    [Export] public float WaitSeconds { get; set; } = 1f;
    private int _index;
    private float _waitLeft;

    public override void _Ready()
    {
        base._Ready();
        if (Waypoints.Count > 0) SetTarget(Waypoints[0].GlobalPosition);
    }

    public override void _PhysicsProcess(double delta)
    {
        if (Waypoints.Count > 0 && NavigationServer2D.MapGetIterationId(Agent.GetNavigationMap()) > 0)
        {
            if (Agent.IsNavigationFinished())
            {
                _waitLeft += (float)delta;
                if (_waitLeft >= WaitSeconds)
                {
                    _waitLeft = 0f;
                    _index = (_index + 1) % Waypoints.Count;
                    SetTarget(Waypoints[_index].GlobalPosition);
                }
            }
            else _waitLeft = 0f;
        }
        base._PhysicsProcess(delta);
    }
}
```
