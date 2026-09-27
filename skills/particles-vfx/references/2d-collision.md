# Particle Collision (2D)

[3D counterpart](3d-attractors-and-collision.md) · [Common particles guide](../SKILL.md)

2D GPU particles collide with the viewport's signed distance field generated from LightOccluder2D polygons. A CollisionShape2D alone does not populate this field. Add a LightOccluder2D to each blocking shape, assign an OccluderPolygon2D, and leave SDF Collision enabled. Use Forward+ or Mobile and test the viewport's SDF coverage at the intended camera zoom.

With a ParticleProcessMaterial assigned to the GPUParticles2D, enable its collision response:

```gdscript
extends GPUParticles2D

func _ready() -> void:
    var mat: ParticleProcessMaterial = process_material
    mat.particle_flag_disable_z = true
    mat.collision_mode = ParticleProcessMaterial.COLLISION_RIGID
    mat.collision_bounce = 0.3
    mat.collision_friction = 0.5
    collision_base_size = 0.5
```

```csharp
using Godot;

public partial class ParticleCollision2D : GpuParticles2D
{
    public override void _Ready()
    {
        var mat = (ParticleProcessMaterial)ProcessMaterial;
        mat.ParticleFlagDisableZ = true;
        mat.CollisionMode = ParticleProcessMaterial.CollisionModeEnum.Rigid;
        mat.CollisionBounce = 0.3f;
        mat.CollisionFriction = 0.5f;
        CollisionBaseSize = 0.5f;
    }
}
```

There is no GPUParticlesAttractor2D counterpart. Use the process material's radial/tangential acceleration for emitter-centered attraction or write a particle shader for arbitrary targets; do not rename the 3D attractor classes.
