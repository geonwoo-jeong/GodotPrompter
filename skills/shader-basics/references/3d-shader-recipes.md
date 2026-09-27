# 3D Shader Recipes (3D)

Reference for `skills/shader-basics/SKILL.md` — spatial shader recipes: toon/cel shading, rim lighting (Fresnel), simple water surface.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Common 3D Shader Recipes

### Toon / Cel Shading

```glsl
shader_type spatial;

uniform vec4 base_color : source_color = vec4(0.8, 0.3, 0.3, 1.0);
uniform int shade_levels : hint_range(2, 8) = 3;

void fragment() {
    ALBEDO = base_color.rgb;
}

void light() {
    // Quantize the light to discrete steps
    float NdotL = dot(NORMAL, LIGHT);
    float intensity = clamp(NdotL, 0.0, 1.0);
    float stepped = floor(intensity * float(shade_levels)) / float(shade_levels);
    DIFFUSE_LIGHT += ALBEDO * ATTENUATION * LIGHT_COLOR * stepped;
}
```

### Rim Lighting / Fresnel

```glsl
shader_type spatial;

uniform vec4 rim_color : source_color = vec4(0.5, 0.8, 1.0, 1.0);
uniform float rim_power : hint_range(0.1, 10.0) = 3.0;

void fragment() {
    ALBEDO = vec3(0.3);
    float fresnel = pow(1.0 - dot(NORMAL, VIEW), rim_power);
    EMISSION = rim_color.rgb * fresnel;
}
```

### Simple Water Surface

```glsl
shader_type spatial;
render_mode blend_mix, depth_draw_opaque, cull_back;

uniform vec4 water_color : source_color = vec4(0.1, 0.3, 0.6, 0.8);
uniform sampler2D wave_noise : filter_linear_mipmap, repeat_enable;
uniform float wave_speed : hint_range(0.0, 1.0) = 0.05;
uniform float wave_height : hint_range(0.0, 2.0) = 0.3;

void vertex() {
    float wave = texture(wave_noise, VERTEX.xz * 0.1 + TIME * wave_speed).r;
    VERTEX.y += wave * wave_height;
}

void fragment() {
    ALBEDO = water_color.rgb;
    ALPHA = water_color.a;
    METALLIC = 0.6;
    ROUGHNESS = 0.1;
}
```

---


## Sprite-effect counterparts on mesh surfaces

These shaders use a texture uniform because spatial shaders have no canvas `TEXTURE` built-in. Assign the mesh's base texture to `albedo_texture`. The same `.gdshader` works in GDScript and C#; only material assignment and uniform calls differ. [2D counterparts](2d-shader-recipes.md).

### Dissolve

```glsl
shader_type spatial;

uniform sampler2D albedo_texture : source_color;
uniform sampler2D noise_texture;
uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform vec4 edge_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform float edge_width : hint_range(0.001, 0.1) = 0.03;

void fragment() {
    vec4 tex = texture(albedo_texture, UV);
    float noise = texture(noise_texture, UV).r;
    if (noise < dissolve_amount) {
        discard;
    }
    float edge = 1.0 - smoothstep(dissolve_amount, dissolve_amount + edge_width, noise);
    ALBEDO = tex.rgb;
    EMISSION = edge_color.rgb * edge;
}
```

This version assumes an opaque mesh. For an alpha-cutout base texture, also discard texels below an alpha threshold. Give each actor a unique ShaderMaterial before animating `dissolve_amount`.

```gdscript
func dissolve_mesh(mesh: MeshInstance3D, duration: float = 1.0) -> void:
    var material: ShaderMaterial = mesh.material_override
    var tween := mesh.create_tween()
    tween.tween_property(material, "shader_parameter/dissolve_amount", 1.0, duration)
    tween.tween_callback(mesh.queue_free)
```

```csharp
public void DissolveMesh(MeshInstance3D mesh, float duration = 1.0f)
{
    var material = (ShaderMaterial)mesh.MaterialOverride;
    var tween = mesh.CreateTween();
    tween.TweenProperty(material, "shader_parameter/dissolve_amount", 1.0f, duration);
    tween.TweenCallback(Callable.From(mesh.QueueFree));
}
```

### Flash White

```glsl
shader_type spatial;
render_mode unshaded;

uniform sampler2D albedo_texture : source_color;
uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;

void fragment() {
    ALBEDO = mix(texture(albedo_texture, UV).rgb, vec3(1.0), flash_amount);
}
```

This unshaded version guarantees a white flash independent of lights. Use the [3D hit-feedback controller](../../animation-system/references/3d-hit-flash.md). For a lit material, integrate the flash into that material's shading model instead of replacing its lighting with this example.

### Color Swap

```glsl
shader_type spatial;

uniform sampler2D albedo_texture : source_color;
uniform vec4 original_color : source_color = vec4(1.0, 0.0, 0.0, 1.0);
uniform vec4 replacement_color : source_color = vec4(0.0, 0.0, 1.0, 1.0);
uniform float tolerance : hint_range(0.0, 1.0) = 0.1;

void fragment() {
    vec3 color = texture(albedo_texture, UV).rgb;
    ALBEDO = distance(color, original_color.rgb) < tolerance ? replacement_color.rgb : color;
}
```

### Scrolling UV with optional wave distortion

```glsl
shader_type spatial;

uniform sampler2D albedo_texture : source_color, repeat_enable;
uniform vec2 scroll_speed = vec2(0.1, 0.05);
uniform float wave_amplitude : hint_range(0.0, 0.1) = 0.0;
uniform float wave_frequency = 10.0;
uniform float wave_speed = 2.0;

void fragment() {
    vec2 uv = UV + scroll_speed * TIME;
    uv.x += sin(uv.y * wave_frequency + TIME * wave_speed) * wave_amplitude;
    ALBEDO = texture(albedo_texture, uv).rgb;
}
```

Use amplitude zero for a pure scroll. This distorts surface texture coordinates; the water recipe above actually displaces mesh vertices and requires sufficient mesh subdivision.

### Outline by an inverted hull

Assign a ShaderMaterial with this shader as the base material's **Next Pass**. Use a closed mesh with consistent normals. Outline width uses model-space units; this technique has a different silhouette/width behavior from the 2D texture-alpha outline.

```glsl
shader_type spatial;
render_mode unshaded, cull_front;

uniform float outline_width : hint_range(0.0, 0.1) = 0.02;
uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);

void vertex() {
    VERTEX += NORMAL * outline_width;
}

void fragment() {
    ALBEDO = outline_color.rgb;
}
```
