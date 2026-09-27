# Player Controllers (2D)

> ← Back to [SKILL.md](../SKILL.md)

Pixel coordinates use +Y downward. These controllers assume an unrotated gravity direction.

## 2. 2D Top-Down Controller

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var acceleration: float = 1500.0
@export var friction: float = 1200.0

func _physics_process(delta: float) -> void:
    # 1. Read input (normalized 4-directional vector)
    var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")

    # 2 & 3. Apply acceleration or friction to velocity
    if input_dir != Vector2.ZERO:
        velocity = velocity.move_toward(input_dir * speed, acceleration * delta)
    else:
        velocity = velocity.move_toward(Vector2.ZERO, friction * delta)

    # 4. Move and resolve collisions
    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class TopDownPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float Acceleration { get; set; } = 1500.0f;
    [Export] public float Friction { get; set; } = 1200.0f;

    public override void _PhysicsProcess(double delta)
    {
        // 1. Read input (normalized 4-directional vector)
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");

        // 2 & 3. Apply acceleration or friction
        if (inputDir != Vector2.Zero)
            Velocity = Velocity.MoveToward(inputDir * Speed, Acceleration * (float)delta);
        else
            Velocity = Velocity.MoveToward(Vector2.Zero, Friction * (float)delta);

        // 4. Move and resolve collisions
        MoveAndSlide();
    }
}
```

---

## 3. 2D Platformer Controller

### GDScript

```gdscript
extends CharacterBody2D

@export var speed: float = 200.0
@export var jump_velocity: float = -400.0
@export var acceleration: float = 1200.0
@export var deceleration: float = 900.0

# Coyote time and jump buffer
@export var coyote_time: float = 0.12
@export var jump_buffer_time: float = 0.12

var _gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")
var _coyote_timer: float = 0.0
var _jump_buffer_timer: float = 0.0

func _physics_process(delta: float) -> void:
    # Coyote time: allow jump briefly after walking off a ledge
    if is_on_floor():
        _coyote_timer = coyote_time
    else:
        _coyote_timer -= delta

    # Jump buffer: register jump input before landing
    if Input.is_action_just_pressed("ui_accept"):
        _jump_buffer_timer = jump_buffer_time
    else:
        _jump_buffer_timer -= delta

    # Apply gravity when airborne
    if not is_on_floor():
        velocity.y += _gravity * delta

    # Jump: consume coyote time and buffer together
    var can_jump: bool = _coyote_timer > 0.0
    if _jump_buffer_timer > 0.0 and can_jump:
        velocity.y = jump_velocity
        _coyote_timer = 0.0
        _jump_buffer_timer = 0.0

    # Variable jump height: cut velocity when button released early
    if Input.is_action_just_released("ui_accept") and velocity.y < 0.0:
        velocity.y *= 0.5

    # Horizontal movement with deceleration
    var input_x: float = Input.get_axis("ui_left", "ui_right")
    if input_x != 0.0:
        velocity.x = move_toward(velocity.x, input_x * speed, acceleration * delta)
    else:
        velocity.x = move_toward(velocity.x, 0.0, deceleration * delta)

    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class PlatformerPlayer : CharacterBody2D
{
    [Export] public float Speed { get; set; } = 200.0f;
    [Export] public float JumpVelocity { get; set; } = -400.0f;
    [Export] public float Acceleration { get; set; } = 1200.0f;
    [Export] public float Deceleration { get; set; } = 900.0f;
    [Export] public float CoyoteTime { get; set; } = 0.12f;
    [Export] public float JumpBufferTime { get; set; } = 0.12f;

    private float _gravity = ProjectSettings.GetSetting("physics/2d/default_gravity").AsSingle();
    private float _coyoteTimer;
    private float _jumpBufferTimer;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;

        // Coyote time
        if (IsOnFloor())
            _coyoteTimer = CoyoteTime;
        else
            _coyoteTimer -= dt;

        // Jump buffer
        if (Input.IsActionJustPressed("ui_accept"))
            _jumpBufferTimer = JumpBufferTime;
        else
            _jumpBufferTimer -= dt;

        // Gravity
        if (!IsOnFloor())
        {
            Vector2 vel = Velocity;
            vel.Y += _gravity * dt;
            Velocity = vel;
        }

        // Jump
        if (_jumpBufferTimer > 0f && _coyoteTimer > 0f)
        {
            Vector2 vel = Velocity;
            vel.Y = JumpVelocity;
            Velocity = vel;
            _coyoteTimer = 0f;
            _jumpBufferTimer = 0f;
        }

        // Variable jump height
        if (Input.IsActionJustReleased("ui_accept") && Velocity.Y < 0f)
        {
            Vector2 vel = Velocity;
            vel.Y *= 0.5f;
            Velocity = vel;
        }

        // Horizontal movement
        float inputX = Input.GetAxis("ui_left", "ui_right");
        Vector2 velocity = Velocity;
        if (inputX != 0f)
            velocity.X = Mathf.MoveToward(velocity.X, inputX * Speed, Acceleration * dt);
        else
            velocity.X = Mathf.MoveToward(velocity.X, 0f, Deceleration * dt);

        Velocity = velocity;
        MoveAndSlide();
    }
}
```

---
