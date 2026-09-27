# Particle Trails (2D)

[3D counterpart](3d-trails.md) · [Common particles guide](../SKILL.md)

GPUParticles2D owns its trail tessellation settings. It does not use a RibbonTrailMesh or a StandardMaterial3D. Configure a particle texture and a ParticleProcessMaterial with Disable Z enabled and nonzero velocity before enabling trails. Use Forward+ or Mobile for the trail rendering path.

```gdscript
extends GPUParticles2D

func _ready() -> void:
    trail_enabled = true
    trail_lifetime = 0.3
    trail_sections = 8
    trail_section_subdivisions = 4
```

```csharp
using Godot;

public partial class ParticleTrails2D : GpuParticles2D
{
    public override void _Ready()
    {
        TrailEnabled = true;
        TrailLifetime = 0.3;
        TrailSections = 8;
        TrailSectionSubdivisions = 4;
    }
}
```

Increase the visibility rect to include the full moving trail. Higher section counts add geometry; start with a short trail and increase only when curves visibly need it.
