# Joint-Based Ragdoll (2D)

Use RigidBody2D parts connected with PinJoint2D; the PhysicalBoneSimulator3D workflow is specific to Skeleton3D.

> ← Back to [SKILL.md](../SKILL.md)

Create one RigidBody2D per limb with a CollisionShape2D and visual child. Add PinJoint2D nodes at joint positions and assign `node_a`/`node_b` to adjacent bodies. Enable joint angular limits where appropriate. Exclude connected limbs from mutual collisions using the joint's `disable_collision` setting, and separate the character controller from ragdoll collision layers.

## Start and Stop Simulation

Assign the body parts in the Inspector. Initially freeze the parts; an AnimationPlayer may pose them while frozen. Stop that transform animation before starting simulation so it does not fight physics. This example preserves the current pose when stopped; returning to an animation pose requires a separate transition.

```gdscript
extends Node2D

@export var parts: Array[RigidBody2D] = []

func set_ragdoll_active(active: bool) -> void:
    for part in parts:
        part.freeze = not active
        if active:
            part.sleeping = false
        else:
            part.linear_velocity = Vector2.ZERO
            part.angular_velocity = 0.0
```

```csharp
public partial class Ragdoll2D : Node2D
{
    [Export] public Godot.Collections.Array<RigidBody2D> Parts { get; set; } = new();
    public void SetRagdollActive(bool active)
    {
        foreach (var part in Parts)
        {
            part.Freeze = !active;
            if (active) part.Sleeping = false;
            else
            {
                part.LinearVelocity = Vector2.Zero;
                part.AngularVelocity = 0.0f;
            }
        }
    }
}
```
