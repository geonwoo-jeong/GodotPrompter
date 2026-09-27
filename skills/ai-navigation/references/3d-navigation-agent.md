# Navigation Agent (3D)

> ← Back to [SKILL.md](../SKILL.md)

Attach this base to a `CharacterBody3D` with `NavigationAgent3D` and collision children. Create and bake a `NavigationRegion3D`. Tune agent path/target desired distances to your scale (world units); too-small thresholds can cause overshoot. `radius` configures avoidance, while the baked polygon/mesh clearance determines where paths fit.

Ground agents use XZ steering and retain Y for gravity. Keep `use_3d_avoidance` false for grounded planar avoidance. Flying agents need full XYZ movement and a different navigation representation; this example does not turn a ground navmesh into volumetric pathfinding.

With avoidance enabled, submit desired velocity once and move only from `velocity_computed`. Without avoidance, apply it immediately. Finished paths submit zero horizontal velocity so old movement does not continue.

```gdscript
class_name NavigationMover3D
extends CharacterBody3D

@export var speed: float = 4.0
@onready var nav_agent: NavigationAgent3D = $NavigationAgent3D
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready() -> void:
    nav_agent.velocity_computed.connect(_apply_velocity)

func set_target(target_position: Vector3) -> void:
    nav_agent.target_position = target_position

func _physics_process(delta: float) -> void:
    # Map data is synchronized after the navigation server's first update.
    if NavigationServer3D.map_get_iteration_id(nav_agent.get_navigation_map()) == 0:
        return
    if not is_on_floor():
        velocity.y -= _gravity * delta
    var desired := Vector3.ZERO
    if not nav_agent.is_navigation_finished():
        var offset := nav_agent.get_next_path_position() - global_position
        offset.y = 0.0
        desired = offset.normalized() * speed
    if nav_agent.avoidance_enabled:
        nav_agent.velocity = desired
    else:
        _apply_velocity(desired)

func _apply_velocity(safe_velocity: Vector3) -> void:
    velocity.x = safe_velocity.x
    velocity.z = safe_velocity.z
    move_and_slide()
```

```csharp
using Godot;

public partial class NavigationMover3D : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 4f;
    protected NavigationAgent3D Agent;
    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();

    public override void _Ready()
    {
        Agent = GetNode<NavigationAgent3D>("NavigationAgent3D");
        Agent.VelocityComputed += ApplyVelocity;
    }

    public void SetTarget(Vector3 target) => Agent.TargetPosition = target;

    public override void _PhysicsProcess(double delta)
    {
        if (NavigationServer3D.MapGetIterationId(Agent.GetNavigationMap()) == 0) return;
        Vector3 velocity = Velocity;
        if (!IsOnFloor()) velocity.Y -= _gravity * (float)delta;
        Velocity = velocity;
        Vector3 desired = Vector3.Zero;
        if (!Agent.IsNavigationFinished())
        {
            Vector3 offset = Agent.GetNextPathPosition() - GlobalPosition;
            offset.Y = 0f;
            desired = offset.Normalized() * Speed;
        }
        if (Agent.AvoidanceEnabled) Agent.Velocity = desired;
        else ApplyVelocity(desired);
    }

    private void ApplyVelocity(Vector3 safeVelocity)
    {
        Vector3 velocity = Velocity;
        velocity.X = safeVelocity.X;
        velocity.Z = safeVelocity.Z;
        Velocity = velocity;
        MoveAndSlide();
    }
}
```
