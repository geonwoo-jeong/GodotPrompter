# Navigation Agent (2D)

> ← Back to [SKILL.md](../SKILL.md)

Attach this base to a `CharacterBody2D` with `NavigationAgent2D` and collision children. Create and bake a `NavigationRegion2D`. Tune agent path/target desired distances to your scale (pixels); too-small thresholds can cause overshoot. `radius` configures avoidance, while the baked polygon/mesh clearance determines where paths fit.

Top-down agents move on XY without platformer gravity. Navigation meshes do not automatically solve platformer jumps.

With avoidance enabled, submit desired velocity once and move only from `velocity_computed`. Without avoidance, apply it immediately. Finished paths submit zero horizontal velocity so old movement does not continue.

```gdscript
class_name NavigationMover2D
extends CharacterBody2D

@export var speed: float = 120.0
@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

func _ready() -> void:
    nav_agent.velocity_computed.connect(_apply_velocity)

func set_target(target_position: Vector2) -> void:
    nav_agent.target_position = target_position

func _physics_process(delta: float) -> void:
    # Map data is synchronized after the navigation server's first update.
    if NavigationServer2D.map_get_iteration_id(nav_agent.get_navigation_map()) == 0:
        return
    var desired := Vector2.ZERO
    if not nav_agent.is_navigation_finished():
        var offset := nav_agent.get_next_path_position() - global_position
        desired = offset.normalized() * speed
    if nav_agent.avoidance_enabled:
        nav_agent.velocity = desired
    else:
        _apply_velocity(desired)

func _apply_velocity(safe_velocity: Vector2) -> void:
    velocity = safe_velocity
    move_and_slide()
```

```csharp
using Godot;

public partial class NavigationMover2D : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 120f;
    protected NavigationAgent2D Agent;

    public override void _Ready()
    {
        Agent = GetNode<NavigationAgent2D>("NavigationAgent2D");
        Agent.VelocityComputed += ApplyVelocity;
    }

    public void SetTarget(Vector2 target) => Agent.TargetPosition = target;

    public override void _PhysicsProcess(double delta)
    {
        if (NavigationServer2D.MapGetIterationId(Agent.GetNavigationMap()) == 0) return;
        Vector2 desired = Vector2.Zero;
        if (!Agent.IsNavigationFinished())
        {
            Vector2 offset = Agent.GetNextPathPosition() - GlobalPosition;
            desired = offset.Normalized() * Speed;
        }
        if (Agent.AvoidanceEnabled) Agent.Velocity = desired;
        else ApplyVelocity(desired);
    }

    private void ApplyVelocity(Vector2 safeVelocity)
    {
        Velocity = safeVelocity;
        MoveAndSlide();
    }
}
```
