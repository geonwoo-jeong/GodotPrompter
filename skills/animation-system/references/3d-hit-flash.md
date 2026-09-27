# Mesh Hit Flash (3D)

[Common animation guide](../SKILL.md) · [2D counterpart](2d-hit-flash.md)

A MeshInstance3D has no CanvasItem `modulate` property. Assign the spatial hit-flash shader from [3D shader recipes](../../shader-basics/references/3d-shader-recipes.md) as its material override. Give each actor a unique ShaderMaterial (Make Unique in the Inspector) so flashes do not affect every instance. The Shader resource can remain shared.

```gdscript
extends MeshInstance3D

@onready var flash_material: ShaderMaterial = material_override
var flash_tween: Tween

func flash_hit() -> void:
    if flash_tween:
        flash_tween.kill()
    flash_material.set_shader_parameter("flash_amount", 1.0)
    flash_tween = create_tween()
    flash_tween.tween_property(flash_material, "shader_parameter/flash_amount", 0.0, 0.15)
```

```csharp
using Godot;

public partial class MeshHitFlash3D : MeshInstance3D
{
    private ShaderMaterial _flashMaterial;
    private Tween _flashTween;

    public override void _Ready() => _flashMaterial = (ShaderMaterial)MaterialOverride;

    public void FlashHit()
    {
        _flashTween?.Kill();
        _flashMaterial.SetShaderParameter("flash_amount", 1.0f);
        _flashTween = CreateTween();
        _flashTween.TweenProperty(_flashMaterial, "shader_parameter/flash_amount", 0.0f, 0.15);
    }
}
```
