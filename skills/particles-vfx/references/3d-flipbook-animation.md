# Flipbook Animation (3D)

[2D counterpart](2d-flipbook-animation.md) · [Common particles guide](../SKILL.md)

In 3D, set the sprite sheet on a QuadMesh's StandardMaterial3D. Particle billboarding reads the animation phase from the process material. This is different from 2D's CanvasItemMaterial.

Attach this script to a GPUParticles3D, assign a 4×4 texture sheet, and tune amount/lifetime and visibility AABB in the Inspector.

```gdscript
extends GPUParticles3D

@export var sheet: Texture2D

func _ready() -> void:
    var process := ParticleProcessMaterial.new()
    process.gravity = Vector3.ZERO
    process.anim_speed_min = 1.0
    process.anim_speed_max = 1.0
    process_material = process
    var surface := StandardMaterial3D.new()
    surface.albedo_texture = sheet
    surface.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    surface.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    surface.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
    surface.vertex_color_use_as_albedo = true
    surface.particles_anim_h_frames = 4
    surface.particles_anim_v_frames = 4
    surface.particles_anim_loop = false
    var quad := QuadMesh.new()
    quad.size = Vector2(0.5, 0.5)
    quad.material = surface
    draw_pass_1 = quad
```

```csharp
using Godot;

public partial class FlipbookParticles3D : GpuParticles3D
{
    [Export] public Texture2D Sheet { get; set; }
    public override void _Ready()
    {
        ProcessMaterial = new ParticleProcessMaterial
        {
            Gravity = Vector3.Zero,
            AnimSpeedMin = 1.0f,
            AnimSpeedMax = 1.0f,
        };
        var surface = new StandardMaterial3D
        {
            AlbedoTexture = Sheet,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
            BillboardMode = BaseMaterial3D.BillboardModeEnum.Particles,
            VertexColorUseAsAlbedo = true,
            ParticlesAnimHFrames = 4,
            ParticlesAnimVFrames = 4,
            ParticlesAnimLoop = false,
        };
        DrawPass1 = new QuadMesh { Size = new Vector2(0.5f, 0.5f), Material = surface };
    }
}
```
