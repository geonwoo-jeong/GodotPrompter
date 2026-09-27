# Subemitters (Common)

[Common particles guide](../SKILL.md)

Subemitters spawn particles when a parent particle dies, collides, or reaches a timed interval. Configure the trigger on ParticleProcessMaterial and assign the target path to **GPUParticles2D/3D.sub_emitter**, not to the material. The target must be the same dimensional node type. Once assigned, it receives particle events instead of emitting on its own.

## 2D setup

Configure both particle nodes' textures and process materials in the scene. Attach this script to the parent GPUParticles2D; assign another GPUParticles2D to `child_particles` in the Inspector. Both nodes must be in the tree before `_ready()`.

```gdscript
extends GPUParticles2D

@export var child_particles: GPUParticles2D

func _ready() -> void:
    var mat: ParticleProcessMaterial = process_material
    mat.sub_emitter_mode = ParticleProcessMaterial.SUB_EMITTER_AT_END
    mat.sub_emitter_amount_at_end = 8
    mat.sub_emitter_keep_velocity = true
    sub_emitter = get_path_to(child_particles)
```

```csharp
using Godot;

public partial class SubEmitter2D : GpuParticles2D
{
    [Export] public GpuParticles2D ChildParticles { get; set; }
    public override void _Ready()
    {
        var mat = (ParticleProcessMaterial)ProcessMaterial;
        mat.SubEmitterMode = ParticleProcessMaterial.SubEmitterModeEnum.AtEnd;
        mat.SubEmitterAmountAtEnd = 8;
        mat.SubEmitterKeepVelocity = true;
        SubEmitter = GetPathTo(ChildParticles);
    }
}
```

## 3D setup

Configure the two GPUParticles3D nodes' draw meshes and process materials first, then attach this script to the parent. Use a unique process material per independently configured parent emitter.

```gdscript
extends GPUParticles3D

@export var child_particles: GPUParticles3D

func _ready() -> void:
    var mat: ParticleProcessMaterial = process_material
    mat.sub_emitter_mode = ParticleProcessMaterial.SUB_EMITTER_AT_END
    mat.sub_emitter_amount_at_end = 8
    mat.sub_emitter_keep_velocity = true
    sub_emitter = get_path_to(child_particles)
```

```csharp
using Godot;

public partial class SubEmitter3D : GpuParticles3D
{
    [Export] public GpuParticles3D ChildParticles { get; set; }
    public override void _Ready()
    {
        var mat = (ParticleProcessMaterial)ProcessMaterial;
        mat.SubEmitterMode = ParticleProcessMaterial.SubEmitterModeEnum.AtEnd;
        mat.SubEmitterAmountAtEnd = 8;
        mat.SubEmitterKeepVelocity = true;
        SubEmitter = GetPathTo(ChildParticles);
    }
}
```

Child `amount` limits the total active particles. Size it for the maximum overlapping events; avoid self-references and cyclic subemitter chains. Collision events require dimension-appropriate collision setup.

API reference: [GPUParticles2D.sub_emitter](https://docs.godotengine.org/en/4.7/classes/class_gpuparticles2d.html#class-gpuparticles2d-property-sub-emitter), [GPUParticles3D.sub_emitter](https://docs.godotengine.org/en/4.7/classes/class_gpuparticles3d.html#class-gpuparticles3d-property-sub-emitter).
