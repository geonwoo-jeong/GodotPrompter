# Steering Behaviors (3D)

Reference for `skills/ai-navigation/SKILL.md` — full implementations of seek, flee, arrive, and wander steering behaviors.

> ← Back to [SKILL.md](../SKILL.md)

---

The player group contains one Node3D. Steering is on XZ, gravity on Y, and distances use world units. This is ground steering without obstacle avoidance; use the navigation mover when paths must avoid geometry.

Steering behaviors are lightweight calculations that run every physics frame. Combine them to produce natural-looking movement without a full navigation mesh.

### GDScript

```gdscript
extends CharacterBody3D

@export var speed: float = 4.0
@export var arrive_radius: float = 3.0    # start slowing down at this distance
@export var arrive_stop: float = 0.2       # stop at this distance
@export var wander_angle_change: float = 0.4  # radians per frame max

var _wander_angle: float = 0.0


# ── Seek ────────────────────────────────────────────────────────────────────
# Accelerate toward target at full speed.
func seek(target_pos: Vector3) -> Vector3:
	var offset := target_pos - global_position
	offset.y = 0.0
	return offset.normalized() * speed


# ── Flee ────────────────────────────────────────────────────────────────────
# Accelerate directly away from target at full speed.
func flee(target_pos: Vector3) -> Vector3:
	return -seek(target_pos)


# ── Arrive ──────────────────────────────────────────────────────────────────
# Like seek, but smoothly decelerates inside arrive_radius.
func arrive(target_pos: Vector3) -> Vector3:
	var to_target: Vector3 = target_pos - global_position
	to_target.y = 0.0
	var dist: float = to_target.length()
	if dist < arrive_stop:
		return Vector3.ZERO
	var ramped_speed: float = speed * (dist / arrive_radius)
	var clamped_speed: float = minf(ramped_speed, speed)
	return to_target.normalized() * clamped_speed


# ── Wander ──────────────────────────────────────────────────────────────────
# Project a circle ahead of the agent, then jitter a point on its edge.
func wander() -> Vector3:
	var circle_distance: float = 2.0
	var circle_radius: float = 1.0
	_wander_angle += randf_range(-wander_angle_change, wander_angle_change)
	var horizontal := Vector3(velocity.x, 0.0, velocity.z)
	var circle_center: Vector3 = horizontal.normalized() * circle_distance
	if circle_center == Vector3.ZERO:
		circle_center = Vector3.RIGHT * circle_distance
	var displacement: Vector3 = Vector3(
		cos(_wander_angle) * circle_radius,
		0.0, sin(_wander_angle) * circle_radius
	)
	return (circle_center + displacement).normalized() * speed


# ── Usage example ────────────────────────────────────────────────────────────
func _physics_process(delta: float) -> void:
	var vertical_speed: float = velocity.y
	if not is_on_floor():
		vertical_speed -= ProjectSettings.get_setting("physics/3d/default_gravity") * delta
	# Swap the desired behavior:
	velocity = arrive(get_tree().get_first_node_in_group("player").global_position)
	# velocity = flee(...)
	# velocity = wander()
	velocity.y = vertical_speed
	move_and_slide()
```

### C#

```csharp
using Godot;

public partial class SteeringEnemy3D : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 4f;
    [Export] public float ArriveRadius { get; set; } = 3f;
    [Export] public float ArriveStop { get; set; } = 0.2f;
    [Export] public float WanderAngleChange { get; set; } = 0.4f;

    private float _wanderAngle;

    // ── Seek ──────────────────────────────────────────────────────────────
    public Vector3 Seek(Vector3 targetPos)
    {
        Vector3 offset = targetPos - GlobalPosition;
        offset.Y = 0f;
        return offset.Normalized() * Speed;
    }

    // ── Flee ──────────────────────────────────────────────────────────────
    public Vector3 Flee(Vector3 targetPos)
        => -Seek(targetPos);

    // ── Arrive ────────────────────────────────────────────────────────────
    public Vector3 Arrive(Vector3 targetPos)
    {
        Vector3 toTarget = targetPos - GlobalPosition;
        toTarget.Y = 0f;
        float dist = toTarget.Length();
        if (dist < ArriveStop) return Vector3.Zero;
        float rampedSpeed = Speed * (dist / ArriveRadius);
        float clampedSpeed = Mathf.Min(rampedSpeed, Speed);
        return toTarget.Normalized() * clampedSpeed;
    }

    // ── Wander ────────────────────────────────────────────────────────────
    public Vector3 Wander()
    {
        float circleDistance = 2f;
        float circleRadius = 1f;
        _wanderAngle += (float)GD.RandRange(-WanderAngleChange, WanderAngleChange);
        Vector3 horizontal = new(Velocity.X, 0f, Velocity.Z);
        Vector3 circleCenter = horizontal.Normalized() * circleDistance;
        if (circleCenter == Vector3.Zero)
            circleCenter = Vector3.Right * circleDistance;
        var displacement = new Vector3(
            Mathf.Cos(_wanderAngle) * circleRadius,
            0f, Mathf.Sin(_wanderAngle) * circleRadius
        );
        return (circleCenter + displacement).Normalized() * Speed;
    }

    // ── Usage example ─────────────────────────────────────────────────────
    public override void _PhysicsProcess(double delta)
    {
        float verticalSpeed = Velocity.Y;
        if (!IsOnFloor()) verticalSpeed -= ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle() * (float)delta;
        var player = GetTree().GetFirstNodeInGroup("player") as Node3D;
        Velocity = Arrive(player.GlobalPosition);
        // Velocity = Flee(...);
        // Velocity = Wander();
        Vector3 velocity = Velocity;
        velocity.Y = verticalSpeed;
        Velocity = velocity;
        MoveAndSlide();
    }
}
```
