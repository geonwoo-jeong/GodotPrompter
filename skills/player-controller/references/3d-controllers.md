# Player Controllers (3D)

> ← Back to [SKILL.md](../SKILL.md)

3D uses +Y upward and forward along -Z. Distances here are world units (conventionally meters). Keep the character unscaled and upright.

## 4. 3D First-Person Controller

### GDScript

```gdscript
extends CharacterBody3D

@export var move_speed: float = 5.0
@export var jump_velocity: float = 5.0
@export var mouse_sensitivity: float = 0.002

@onready var head: Node3D = $Head  # Child Node3D that holds Camera3D

var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

func _ready() -> void:
    Input.mouse_mode = Input.MOUSE_MODE_CAPTURED

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
        # Horizontal look: rotate the body (yaw)
        rotate_y(-event.relative.x * mouse_sensitivity)
        # Vertical look: rotate the head (pitch), clamped to ±90°
        head.rotate_x(-event.relative.y * mouse_sensitivity)
        head.rotation.x = clamp(head.rotation.x, -PI / 2.0, PI / 2.0)

    if event.is_action_pressed("ui_cancel"):
        Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y -= _gravity * delta

    # Jump
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_velocity

    # Movement relative to the direction the player is facing
    var input_dir: Vector2 = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    var direction: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

    if direction != Vector3.ZERO:
        velocity.x = direction.x * move_speed
        velocity.z = direction.z * move_speed
    else:
        velocity.x = move_toward(velocity.x, 0.0, move_speed)
        velocity.z = move_toward(velocity.z, 0.0, move_speed)

    move_and_slide()
```

### C#

```csharp
using Godot;

public partial class FPSController : CharacterBody3D
{
    [Export] public float MoveSpeed { get; set; } = 5.0f;
    [Export] public float JumpVelocity { get; set; } = 5.0f;
    [Export] public float MouseSensitivity { get; set; } = 0.002f;

    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();
    private Node3D _head;

    public override void _Ready()
    {
        _head = GetNode<Node3D>("Head");
        Input.MouseMode = Input.MouseModeEnum.Captured;
    }

    public override void _UnhandledInput(InputEvent @event)
    {
        if (@event is InputEventMouseMotion motion
            && Input.MouseMode == Input.MouseModeEnum.Captured)
        {
            // Horizontal look (yaw on body)
            RotateY(-motion.Relative.X * MouseSensitivity);
            // Vertical look (pitch on head), clamped to ±90°
            _head.RotateX(-motion.Relative.Y * MouseSensitivity);
            Vector3 rot = _head.Rotation;
            rot.X = Mathf.Clamp(rot.X, -Mathf.Pi / 2f, Mathf.Pi / 2f);
            _head.Rotation = rot;
        }

        if (@event.IsActionPressed("ui_cancel"))
            Input.MouseMode = Input.MouseModeEnum.Visible;
    }

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        Vector3 vel = Velocity;

        // Gravity
        if (!IsOnFloor())
            vel.Y -= _gravity * dt;

        // Jump
        if (Input.IsActionJustPressed("ui_accept") && IsOnFloor())
            vel.Y = JumpVelocity;

        // Movement relative to facing direction
        Vector2 inputDir = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Vector3 direction = (Transform.Basis * new Vector3(inputDir.X, 0, inputDir.Y)).Normalized();

        if (direction != Vector3.Zero)
        {
            vel.X = direction.X * MoveSpeed;
            vel.Z = direction.Z * MoveSpeed;
        }
        else
        {
            vel.X = Mathf.MoveToward(vel.X, 0f, MoveSpeed);
            vel.Z = Mathf.MoveToward(vel.Z, 0f, MoveSpeed);
        }

        Velocity = vel;
        MoveAndSlide();
    }
}
```

---

## Ground Movement with Coyote Time and Buffered Jump

Map a two-axis input to XZ, retaining Y for gravity. This works with a fixed overhead camera or a third-person camera aligned to the world axes. Unlike the first-person recipe, the body does not define the movement frame. Positive Y is up.

```gdscript
extends CharacterBody3D

@export var speed: float = 6.0
@export var acceleration: float = 24.0
@export var jump_speed: float = 5.0
@export var coyote_time: float = 0.12
@export var jump_buffer_time: float = 0.12
var _gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")
var _coyote_timer: float = 0.0
var _jump_timer: float = 0.0

func _physics_process(delta: float) -> void:
    _coyote_timer = coyote_time if is_on_floor() else maxf(0.0, _coyote_timer - delta)
    _jump_timer = jump_buffer_time if Input.is_action_just_pressed("ui_accept") else maxf(0.0, _jump_timer - delta)
    if not is_on_floor():
        velocity.y -= _gravity * delta
    if _jump_timer > 0.0 and _coyote_timer > 0.0:
        velocity.y = jump_speed
        _jump_timer = 0.0
        _coyote_timer = 0.0
    if Input.is_action_just_released("ui_accept") and velocity.y > 0.0:
        velocity.y *= 0.5
    var input_dir := Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    var horizontal := Vector2(velocity.x, velocity.z).move_toward(input_dir * speed, acceleration * delta)
    velocity.x = horizontal.x
    velocity.z = horizontal.y
    move_and_slide()
```

```csharp
using Godot;

public partial class GroundPlayer3D : CharacterBody3D
{
    [Export] public float Speed { get; set; } = 6f;
    [Export] public float Acceleration { get; set; } = 24f;
    [Export] public float JumpSpeed { get; set; } = 5f;
    [Export] public float CoyoteTime { get; set; } = 0.12f;
    [Export] public float JumpBufferTime { get; set; } = 0.12f;
    private float _gravity = ProjectSettings.GetSetting("physics/3d/default_gravity").AsSingle();
    private float _coyoteTimer;
    private float _jumpTimer;

    public override void _PhysicsProcess(double delta)
    {
        float dt = (float)delta;
        _coyoteTimer = IsOnFloor() ? CoyoteTime : Mathf.Max(0f, _coyoteTimer - dt);
        _jumpTimer = Input.IsActionJustPressed("ui_accept") ? JumpBufferTime : Mathf.Max(0f, _jumpTimer - dt);
        Vector3 velocity = Velocity;
        if (!IsOnFloor()) velocity.Y -= _gravity * dt;
        if (_jumpTimer > 0f && _coyoteTimer > 0f)
        {
            velocity.Y = JumpSpeed;
            _jumpTimer = 0f;
            _coyoteTimer = 0f;
        }
        if (Input.IsActionJustReleased("ui_accept") && velocity.Y > 0f) velocity.Y *= 0.5f;
        Vector2 input = Input.GetVector("ui_left", "ui_right", "ui_up", "ui_down");
        Vector2 horizontal = new Vector2(velocity.X, velocity.Z).MoveToward(input * Speed, Acceleration * dt);
        velocity.X = horizontal.X;
        velocity.Z = horizontal.Y;
        Velocity = velocity;
        MoveAndSlide();
    }
}
```
