# Dash and Wall Jump (3D)

> ← Back to [SKILL.md](../SKILL.md)

Use these as separate CharacterBody3D controllers or merge their decisions into one movement loop. Inputs are `ui_left/right/up/down`, `ui_accept`, and a custom `dash` action. Speeds are world units/second; Y is up. Both recipes keep gravity independent from XZ movement.

## Ground-plane Dash

One dash per airtime, reset on landing, with a cooldown. The dash overrides horizontal velocity only, so it does not cancel gravity or a jump. An upright body faces local -Z.

```gdscript
extends CharacterBody3D

@export var speed: float = 6.0
@export var dash_speed: float = 18.0
@export var dash_duration: float = 0.15
@export var dash_cooldown: float = 0.4
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var _dash_left: float = 0.0
var _cooldown_left: float = 0.0
var _air_dash_used: bool = false
var _dash_direction: Vector3 = Vector3.FORWARD

func _physics_process(delta: float) -> void:
    _dash_left = maxf(0.0, _dash_left - delta)
    _cooldown_left = maxf(0.0, _cooldown_left - delta)
    if is_on_floor():
        _air_dash_used = false
    else:
        velocity.y -= _gravity * delta
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    var direction := Vector3(input_dir.x, 0.0, input_dir.y)
    if Input.is_action_just_pressed("dash") and _cooldown_left == 0.0 and not _air_dash_used:
        _dash_direction = direction.normalized() if direction != Vector3.ZERO else -global_basis.z.normalized()
        _dash_left = dash_duration
        _cooldown_left = dash_cooldown
        _air_dash_used = true
    var horizontal: Vector3 = _dash_direction * dash_speed if _dash_left > 0.0 else direction * speed
    velocity.x = horizontal.x
    velocity.z = horizontal.z
    move_and_slide()
```

```csharp
using Godot;

public partial class DashPlayer3D : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 6f;
    [Export] public float DashSpeed { get; set; } = 18f;
    [Export] public float DashDuration { get; set; } = 0.15f;
    [Export] public float DashCooldown { get; set; } = 0.4f;
    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();
    private float _dashLeft;
    private float _cooldownLeft;
    private bool _airDashUsed;
    private Vector3 _dashDirection = Vector3.Forward;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        _dashLeft = Mathf.Max(0f, _dashLeft - dt);
        _cooldownLeft = Mathf.Max(0f, _cooldownLeft - dt);
        Vector3 velocity = Velocity;
        if (IsOnFloor()) _airDashUsed = false;
        else velocity.Y -= _gravity * dt;
        Vector2 input = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Vector3 direction = new(input.X, 0f, input.Y);
        if (Input.IsActionJustPressed("dash") && _cooldownLeft == 0f && !_airDashUsed)
        {
            _dashDirection = direction != Vector3.Zero ? direction.Normalized() : -GlobalBasis.Z.Normalized();
            _dashLeft = DashDuration;
            _cooldownLeft = DashCooldown;
            _airDashUsed = true;
        }
        Vector3 horizontal = _dashLeft > 0f ? _dashDirection * DashSpeed : direction * Speed;
        velocity.X = horizontal.X;
        velocity.Z = horizontal.Z;
        Velocity = velocity;
        MoveAndSlide();
    }
}
```

## Wall Slide and Jump

Project the contact normal onto XZ, then add positive-Y jump velocity. A short input lock preserves the push away from the wall. Wall contacts are the result of the previous `move_and_slide()` call.

```gdscript
extends CharacterBody3D

@export var speed: float = 6.0
@export var jump_speed: float = 5.0
@export var wall_push_speed: float = 6.0
@export var wall_slide_speed: float = 2.0
@export var wall_control_lock: float = 0.15
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var _lock_left: float = 0.0

func _physics_process(delta: float) -> void:
    _lock_left = maxf(0.0, _lock_left - delta)
    if not is_on_floor():
        velocity.y -= _gravity * delta
    if _lock_left == 0.0:
        var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
        velocity.x = input_dir.x * speed
        velocity.z = input_dir.y * speed
    if is_on_wall() and not is_on_floor():
        velocity.y = maxf(velocity.y, -wall_slide_speed)
        if Input.is_action_just_pressed("ui_accept"):
            var normal := get_wall_normal()
            var outward := Vector3(normal.x, 0.0, normal.z).normalized()
            velocity = outward * wall_push_speed + Vector3.UP * jump_speed
            _lock_left = wall_control_lock
    elif is_on_floor() and Input.is_action_just_pressed("ui_accept"):
        velocity.y = jump_speed
    move_and_slide()
```

```csharp
using Godot;

public partial class WallJumpPlayer3D : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 6f;
    [Export] public float JumpSpeed { get; set; } = 5f;
    [Export] public float WallPushSpeed { get; set; } = 6f;
    [Export] public float WallSlideSpeed { get; set; } = 2f;
    [Export] public float WallControlLock { get; set; } = 0.15f;
    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();
    private float _lockLeft;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        _lockLeft = Mathf.Max(0f, _lockLeft - dt);
        Vector3 velocity = Velocity;
        if (!IsOnFloor()) velocity.Y -= _gravity * dt;
        if (_lockLeft == 0f)
        {
            Vector2 input = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
            velocity.X = input.X * Speed;
            velocity.Z = input.Y * Speed;
        }
        if (IsOnWall() && !IsOnFloor())
        {
            velocity.Y = Mathf.Max(velocity.Y, -WallSlideSpeed);
            if (Input.IsActionJustPressed("ui_accept"))
            {
                Vector3 normal = GetWallNormal();
                Vector3 outward = new Vector3(normal.X, 0f, normal.Z).Normalized();
                velocity = outward * WallPushSpeed + Vector3.Up * JumpSpeed;
                _lockLeft = WallControlLock;
            }
        }
        else if (IsOnFloor() && Input.IsActionJustPressed("ui_accept")) velocity.Y = JumpSpeed;
        Velocity = velocity;
        MoveAndSlide();
    }
}
```
