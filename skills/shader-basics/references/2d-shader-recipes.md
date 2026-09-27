# 2D Shader Recipes (2D)

Reference for `skills/shader-basics/SKILL.md` — canvas_item shader recipes: dissolve, outline, flash-white, color-swap, scrolling UV, wave distortion.

> ← Back to [SKILL.md](../SKILL.md)

---
## 3. Common 2D Shader Recipes

### Dissolve Effect

```glsl
shader_type canvas_item;

uniform float dissolve_amount : hint_range(0.0, 1.0) = 0.0;
uniform sampler2D noise_texture : filter_linear_mipmap;
uniform vec4 edge_color : source_color = vec4(1.0, 0.5, 0.0, 1.0);
uniform float edge_width : hint_range(0.0, 0.1) = 0.03;

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    float noise = texture(noise_texture, UV).r;

    // Discard pixels below the dissolve threshold
    if (noise < dissolve_amount) {
        discard;
    }

    // Glow at the dissolve edge
    float edge = smoothstep(dissolve_amount, dissolve_amount + edge_width, noise);
    COLOR = mix(edge_color, tex, edge);
    COLOR.a = tex.a;
}
```

Animate from code:

```gdscript
func dissolve(duration: float = 1.0) -> void:
    var mat: ShaderMaterial = $Sprite2D.material
    var tween := create_tween()
    tween.tween_property(mat, "shader_parameter/dissolve_amount", 1.0, duration)
    tween.tween_callback(queue_free)
```

```csharp
public void Dissolve(float duration = 1.0f)
{
    var mat = GetNode<Sprite2D>("Sprite2D").Material as ShaderMaterial;
    var tween = CreateTween();
    tween.TweenProperty(mat, "shader_parameter/dissolve_amount", 1.0f, duration);
    tween.TweenCallback(Callable.From(QueueFree));
}
```

### Outline Effect

```glsl
shader_type canvas_item;

uniform vec4 outline_color : source_color = vec4(0.0, 0.0, 0.0, 1.0);
uniform float outline_width : hint_range(0.0, 10.0, 0.5) = 1.0;

void fragment() {
    vec2 size = TEXTURE_PIXEL_SIZE * outline_width;
    vec4 tex = texture(TEXTURE, UV);

    // Sample neighboring pixels
    float alpha_sum = 0.0;
    alpha_sum += texture(TEXTURE, UV + vec2(size.x, 0.0)).a;
    alpha_sum += texture(TEXTURE, UV + vec2(-size.x, 0.0)).a;
    alpha_sum += texture(TEXTURE, UV + vec2(0.0, size.y)).a;
    alpha_sum += texture(TEXTURE, UV + vec2(0.0, -size.y)).a;

    // If any neighbor has alpha but current pixel is transparent → outline
    if (tex.a < 0.5 && alpha_sum > 0.0) {
        COLOR = outline_color;
    } else {
        COLOR = tex;
    }
}
```

### Flash White (Hit Effect)

```glsl
shader_type canvas_item;

uniform float flash_amount : hint_range(0.0, 1.0) = 0.0;

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    COLOR = mix(tex, vec4(1.0, 1.0, 1.0, tex.a), flash_amount);
}
```

### Color Swap / Palette Shift

```glsl
shader_type canvas_item;

uniform vec4 original_color : source_color = vec4(1.0, 0.0, 0.0, 1.0);
uniform vec4 replacement_color : source_color = vec4(0.0, 0.0, 1.0, 1.0);
uniform float tolerance : hint_range(0.0, 1.0) = 0.1;

void fragment() {
    vec4 tex = texture(TEXTURE, UV);
    float dist = distance(tex.rgb, original_color.rgb);
    if (dist < tolerance) {
        COLOR = vec4(replacement_color.rgb, tex.a);
    } else {
        COLOR = tex;
    }
}
```

### Scrolling UV (Water, Lava, Clouds)

```glsl
shader_type canvas_item;

uniform vec2 scroll_speed = vec2(0.1, 0.05);

void fragment() {
    vec2 scrolled_uv = UV + scroll_speed * TIME;
    COLOR = texture(TEXTURE, scrolled_uv);
}
```

### Wave Distortion

```glsl
shader_type canvas_item;

uniform float wave_amplitude : hint_range(0.0, 0.1) = 0.02;
uniform float wave_frequency : hint_range(0.0, 50.0) = 10.0;
uniform float wave_speed : hint_range(0.0, 10.0) = 2.0;

void fragment() {
    vec2 uv = UV;
    uv.x += sin(uv.y * wave_frequency + TIME * wave_speed) * wave_amplitude;
    COLOR = texture(TEXTURE, uv);
}
```

---


## Toon lighting for lit sprites

Use Light2D nodes and a normal map on the sprite's CanvasTexture. Unlike a 3D material, a flat sprite has no geometric silhouette curvature for a view-dependent Fresnel rim; use the alpha-outline recipe above for edge highlighting. [3D counterparts](3d-shader-recipes.md) include toon, Fresnel, and water geometry.

```glsl
shader_type canvas_item;

uniform float shade_levels : hint_range(2.0, 8.0) = 3.0;

void light() {
    float amount = max(dot(NORMAL, LIGHT_DIRECTION), 0.0);
    float stepped = floor(amount * shade_levels) / shade_levels;
    LIGHT = vec4(COLOR.rgb * LIGHT_COLOR.rgb * LIGHT_ENERGY * stepped, LIGHT_COLOR.a);
}
```

The shader language is shared by GDScript and C#. The existing scrolling-UV and wave-distortion recipes provide 2D water/cloud motion; they do not simulate a 3D displaced water surface.
