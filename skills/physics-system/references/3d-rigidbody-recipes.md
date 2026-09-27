# RigidBody Recipes (3D)

Physics-driven forces, contacts, and steering for RigidBody3D.

> ← Back to [SKILL.md](../SKILL.md)

## Thrust and Steering

Use `_integrate_forces` for direct body-state changes. A 2D angular velocity/torque is a scalar; a 3D one is a Vector3. Configure `ui_up`, `ui_left`, and `ui_right` in Input Map. Right input uses negative Y torque because the ship faces local -Z. Disabling sleep here ensures a stationary controllable body receives input callbacks.

```gdscript
extends RigidBody3D

func _ready() -> void:
    can_sleep = false

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
    if Input.is_action_pressed("ui_up"):
        state.apply_central_force(-state.transform.basis.z * 25.0)
    var turn: float = Input.get_axis("ui_left", "ui_right")
    state.apply_torque(Vector3.UP * -turn * 20.0)
```

```csharp
public partial class PhysicsShip3D : RigidBody3D
{
    public override void _Ready() => CanSleep = false;
    public override void _IntegrateForces(PhysicsDirectBodyState3D state)
    {
        if (Input.IsActionPressed("ui_up")) state.ApplyCentralForce(-state.Transform.Basis.Z * 25.0f);
        float turn = Input.GetAxis("ui_left", "ui_right");
        state.ApplyTorque(Vector3.Up * -turn * 20.0f);
    }
}
```

## Contact Signals, Impulse, and Freeze

A force is applied repeatedly while active; an impulse is applied once per event. Collision signals require both contact monitoring and a nonzero contact count.

```gdscript
extends RigidBody3D

func _ready() -> void:
    contact_monitor = true
    max_contacts_reported = 4
    body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node) -> void:
    print("Contact with ", body.name)

func knock_back(impulse: Vector3) -> void:
    apply_central_impulse(impulse)

func set_frozen(enabled: bool) -> void:
    freeze_mode = RigidBody3D.FREEZE_MODE_STATIC
    freeze = enabled
```

```csharp
public partial class PhysicsCrate3D : RigidBody3D
{
    public override void _Ready()
    {
        ContactMonitor = true;
        MaxContactsReported = 4;
        BodyEntered += body => GD.Print("Contact with ", body.Name);
    }
    public void KnockBack(Vector3 impulse) => ApplyCentralImpulse(impulse);
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
extends RigidBody3D

@export var target: Node3D
@export var turn_speed: float = 3.0  # Radians per second; local -Z faces forward.

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
    var direction: Vector3 = target.global_position - state.transform.origin
    if direction.is_zero_approx():
        state.angular_velocity = Vector3.ZERO
        return
    var forward: Vector3 = -state.transform.basis.z.normalized()
    var rotation: Quaternion = Quaternion(forward, direction.normalized())
    var angle: float = rotation.get_angle()
    state.angular_velocity = Vector3.ZERO
    if angle > 0.0001:
        state.angular_velocity = rotation.get_axis() * minf(turn_speed, angle / state.step)
```

```csharp
public partial class HomingBody3D : RigidBody3D
{
    [Export] public Node3D Target { get; set; }
    [Export] public float TurnSpeed { get; set; } = 3.0f;
    public override void _IntegrateForces(PhysicsDirectBodyState3D state)
    {
        Vector3 direction = Target.GlobalPosition - state.Transform.Origin;
        if (direction.IsZeroApprox()) { state.AngularVelocity = Vector3.Zero; return; }
        Vector3 forward = -state.Transform.Basis.Z.Normalized();
        var rotation = new Quaternion(forward, direction.Normalized());
        float angle = rotation.GetAngle();
        state.AngularVelocity = Vector3.Zero;
        if (angle > 0.0001f)
            state.AngularVelocity = rotation.GetAxis() * Mathf.Min(TurnSpeed, angle / state.Step);
    }
}
```
