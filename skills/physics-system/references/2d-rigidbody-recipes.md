# RigidBody Recipes (2D)

Physics-driven forces, contacts, and steering for RigidBody2D.

> ← Back to [SKILL.md](../SKILL.md)

## Thrust and Steering

Use `_integrate_forces` for direct body-state changes. A 2D angular velocity/torque is a scalar; a 3D one is a Vector3. Configure `ui_up`, `ui_left`, and `ui_right` in Input Map. Disabling sleep here ensures a stationary controllable body receives input callbacks.

```gdscript
extends RigidBody2D

func _ready() -> void:
    can_sleep = false

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    if Input.is_action_pressed("ui_up"):
        state.apply_central_force(Vector2(0, -250).rotated(state.transform.get_rotation()))
    var turn: float = Input.get_axis("ui_left", "ui_right")
    state.apply_torque(turn * 20000.0)
```

```csharp
public partial class PhysicsShip2D : RigidBody2D
{
    public override void _Ready() => CanSleep = false;
    public override void _IntegrateForces(PhysicsDirectBodyState2D state)
    {
        if (Input.IsActionPressed("ui_up")) state.ApplyCentralForce(new Vector2(0, -250).Rotated(state.Transform.Rotation));
        float turn = Input.GetAxis("ui_left", "ui_right");
        state.ApplyTorque(turn * 20000.0f);
    }
}
```

## Contact Signals, Impulse, and Freeze

A force is applied repeatedly while active; an impulse is applied once per event. Collision signals require both contact monitoring and a nonzero contact count.

```gdscript
extends RigidBody2D

func _ready() -> void:
    contact_monitor = true
    max_contacts_reported = 4
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node) -> void:
    print("Contact with ", body.name)

func knock_back(impulse: Vector2) -> void:
    apply_central_impulse(impulse)

func set_frozen(enabled: bool) -> void:
    freeze_mode = RigidBody2D.FREEZE_MODE_STATIC
    freeze = enabled
```

```csharp
public partial class PhysicsCrate2D : RigidBody2D
{
    public override void _Ready()
    {
        ContactMonitor = true;
        MaxContactsReported = 4;
        BodyEntered += body => GD.Print("Contact with ", body.Name);
    }
    public void KnockBack(Vector2 impulse) => ApplyCentralImpulse(impulse);
    public void SetFrozen(bool enabled)
    {
        FreezeMode = FreezeModeEnum.Static;
        Freeze = enabled;
    }
}
```

Use a shared `PhysicsMaterial` for friction and bounce. `rough` selects the higher friction when either material requests it; `absorbent` subtracts that material’s bounce contribution. Duplicate the resource only for per-body changes.

## Orientation Through Physics

Assign the target in the Inspector. Set angular velocity through the body state instead of assigning a transform every frame.

```gdscript
extends RigidBody2D

@export var target: Node2D
@export var turn_speed: float = 3.0  # Radians per second; local +X faces forward.

func _integrate_forces(state: PhysicsDirectBodyState2D) -> void:
    var direction: Vector2 = target.global_position - state.transform.origin
    if direction.is_zero_approx():
        state.angular_velocity = 0.0
        return
    var error: float = wrapf(direction.angle() - state.transform.get_rotation(), -PI, PI)
    state.angular_velocity = clampf(error / state.step, -turn_speed, turn_speed)
```

```csharp
public partial class HomingBody2D : RigidBody2D
{
    [Export] public Node2D Target { get; set; }
    [Export] public float TurnSpeed { get; set; } = 3.0f;
    public override void _IntegrateForces(PhysicsDirectBodyState2D state)
    {
        Vector2 direction = Target.GlobalPosition - state.Transform.Origin;
        if (direction.IsZeroApprox()) { state.AngularVelocity = 0; return; }
        float error = Mathf.Wrap(direction.Angle() - state.Transform.Rotation, -Mathf.Pi, Mathf.Pi);
        state.AngularVelocity = Mathf.Clamp(error / state.Step, -TurnSpeed, TurnSpeed);
    }
}
```
