# Fire, Explosion, and Dust Recipes (3D)

[Common particles guide](../SKILL.md) · [2D counterpart](2d-vfx-recipes.md)

This factory returns an unparented emitter with emission disabled. Use a soft particle texture with alpha. Values use world units and upward-positive Y; a billboard QuadMesh supplies visible particle geometry. Tune culling bounds in the editor for the finished effect.

## Build an effect

```gdscript
extends Node3D

enum EffectKind { FIRE, EXPLOSION, DUST }

func create_effect(kind: EffectKind, texture: Texture2D) -> GPUParticles3D:
    var particles := GPUParticles3D.new()
    particles.emitting = false
    particles.local_coords = false
    particles.one_shot = kind != EffectKind.FIRE
    particles.amount = 50 if kind == EffectKind.FIRE else 30 if kind == EffectKind.EXPLOSION else 8
    particles.lifetime = 0.8 if kind == EffectKind.FIRE else 0.5
    particles.explosiveness = 0.0 if kind == EffectKind.FIRE else 1.0
    var mat := ParticleProcessMaterial.new()
    mat.particle_flag_disable_z = false
    mat.direction = Vector3.UP
    mat.spread = 180.0 if kind == EffectKind.EXPLOSION else 25.0
    mat.initial_velocity_min = 2.0 * 0.5
    mat.initial_velocity_max = 2.0
    mat.gravity = Vector3(0, -2, 0) if kind == EffectKind.DUST else Vector3.ZERO
    var gradient := Gradient.new()
    gradient.set_color(0, Color(0.7, 0.65, 0.55, 0.6) if kind == EffectKind.DUST else Color(1.0, 0.6, 0.15, 1.0))
    gradient.set_color(1, Color(0.5, 0.2, 0.1, 0.0))
    var ramp := GradientTexture1D.new()
    ramp.gradient = gradient
    mat.color_ramp = ramp
    particles.process_material = mat
    var draw_material := StandardMaterial3D.new()
    draw_material.albedo_texture = texture
    draw_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
    draw_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
    draw_material.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
    draw_material.vertex_color_use_as_albedo = true
    var quad := QuadMesh.new()
    quad.size = Vector2(0.25, 0.25)
    quad.material = draw_material
    particles.draw_pass_1 = quad
    return particles
```

```csharp
using Godot;

public partial class ParticleRecipes3D : Node3D
{
    public enum EffectKind { Fire, Explosion, Dust }

    public GpuParticles3D CreateEffect(EffectKind kind, Texture2D texture)
    {
        var particles = new GpuParticles3D
        {
            Emitting = false,
            LocalCoords = false,
            OneShot = kind != EffectKind.Fire,
            Amount = kind == EffectKind.Fire ? 50 : kind == EffectKind.Explosion ? 30 : 8,
            Lifetime = kind == EffectKind.Fire ? 0.8 : 0.5,
            Explosiveness = kind == EffectKind.Fire ? 0.0f : 1.0f,
        };
        var mat = new ParticleProcessMaterial
        {
            ParticleFlagDisableZ = false,
            Direction = Vector3.Up,
            Spread = kind == EffectKind.Explosion ? 180.0f : 25.0f,
            InitialVelocityMin = 2.0f * 0.5f,
            InitialVelocityMax = 2.0f,
            Gravity = kind == EffectKind.Dust ? new Vector3(0, -2, 0) : Vector3.Zero,
        };
        var gradient = new Gradient();
        gradient.SetColor(0, kind == EffectKind.Dust ? new Color(0.7f, 0.65f, 0.55f, 0.6f) : new Color(1.0f, 0.6f, 0.15f, 1.0f));
        gradient.SetColor(1, new Color(0.5f, 0.2f, 0.1f, 0.0f));
        mat.ColorRamp = new GradientTexture1D { Gradient = gradient };
        particles.ProcessMaterial = mat;
        var drawMaterial = new StandardMaterial3D
        {
            AlbedoTexture = texture,
            Transparency = BaseMaterial3D.TransparencyEnum.Alpha,
            ShadingMode = BaseMaterial3D.ShadingModeEnum.Unshaded,
            BillboardMode = BaseMaterial3D.BillboardModeEnum.Particles,
            VertexColorUseAsAlbedo = true,
        };
        particles.DrawPass1 = new QuadMesh { Size = new Vector2(0.25f, 0.25f), Material = drawMaterial };
        return particles;
    }
}
```

## Start a burst

Call from the factory node after it has entered the scene tree. Set the world position after adding the emitter. The finished signal cleans up one-shot effects when their particles finish. For continuous fire, set `emitting = true` after adding it and free the emitter when the fire source is removed; continuous effects do not emit `finished`.

```gdscript
var effect := create_effect(EffectKind.EXPLOSION, preload("res://textures/particles/soft_circle.png"))
add_child(effect)
effect.global_position = global_position
effect.finished.connect(effect.queue_free)
effect.restart()
```

```csharp
var effect = CreateEffect(EffectKind.Explosion, GD.Load<Texture2D>("res://textures/particles/soft_circle.png"));
AddChild(effect);
effect.GlobalPosition = GlobalPosition;
effect.Finished += effect.QueueFree;
effect.Restart();
```
