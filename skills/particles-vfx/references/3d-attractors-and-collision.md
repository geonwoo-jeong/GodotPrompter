# Attractors & Collision (3D)

Reference for `skills/particles-vfx/SKILL.md` — `GPUParticlesAttractor*3D` types and `GPUParticlesCollision*3D` collision setup.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Attractors & Collision (3D only)

### Attractors

Pull or repel particles. Enable **Attractor Interaction** on the ParticleProcessMaterial first.

| Node                              | Shape       | Notes                     |
|-----------------------------------|-------------|---------------------------|
| `GPUParticlesAttractorBox3D`      | Box         | `size` controls extents   |
| `GPUParticlesAttractorSphere3D`   | Sphere      | `radius` controls size    |
| `GPUParticlesAttractorVectorField3D` | Vector field | Uses 3D texture for directions |

```gdscript
# Create a sphere attractor that pulls particles in
var attractor := GPUParticlesAttractorSphere3D.new()
attractor.radius = 5.0
attractor.strength = 3.0      # positive = pull, negative = repel
attractor.attenuation = 1.0   # falloff curve
attractor.position = Vector3(0, 2, 0)
add_child(attractor)

# Don't forget to enable on the material!
var mat: ParticleProcessMaterial = $GPUParticles3D.process_material
mat.attractor_interaction_enabled = true
```

```csharp
var attractor = new GpuParticlesAttractorSphere3D();
attractor.Radius = 5.0f;
attractor.Strength = 3.0f;
attractor.Attenuation = 1.0f;
attractor.Position = new Vector3(0, 2, 0);
AddChild(attractor);

var mat = GetNode<GpuParticles3D>("GPUParticles3D").ProcessMaterial as ParticleProcessMaterial;
mat.AttractorInteractionEnabled = true;
```

### Collision Nodes

Make particles bounce or stop on surfaces.

| Node                                | Shape         | Notes                          |
|-------------------------------------|---------------|--------------------------------|
| `GPUParticlesCollisionBox3D`        | Box           | Simple, fast                   |
| `GPUParticlesCollisionSphere3D`     | Sphere        | Simple, fast                   |
| `GPUParticlesCollisionHeightField3D`| Height field  | Terrain — auto-updates         |
| `GPUParticlesCollisionSDF3D`        | SDF (baked)   | Complex geometry, Forward+ only |

Configure collision response on the ParticleProcessMaterial:

```gdscript
mat.collision_mode = ParticleProcessMaterial.COLLISION_RIGID  # bounce off
mat.collision_bounce = 0.3   # bounciness
mat.collision_friction = 0.5  # sliding resistance
```

```csharp
mat.CollisionMode = ParticleProcessMaterial.CollisionModeEnum.Rigid;
mat.CollisionBounce = 0.3f;
mat.CollisionFriction = 0.5f;
```

---

For 2D collision, see [2D particle collision](2d-collision.md). Turbulence is shared and documented in [process material basics](common-process-material-basics.md).
