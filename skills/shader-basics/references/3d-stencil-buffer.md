# Stencil Masking (3D, Godot 4.5+)

[Common shader guide](../SKILL.md) · [2D masking counterpart](2d-masking.md)

Spatial shaders use a separate `stencil_mode` statement. Stencil is experimental in Godot 4.7, and reading requires the transparent pass. It is not a canvas_item render mode. For built-in outlines or X-ray effects, StandardMaterial3D's Stencil Mode Inspector presets are a simpler starting point.

## Write a visible mask

Assign this to a mask mesh. It writes the value 1 where its visible surface passes the depth test. This deliberately visible mask is useful for checking geometry and draw order before building a portal effect.

```glsl
shader_type spatial;
render_mode unshaded;
stencil_mode write, compare_always, 1;

void fragment() {
    ALBEDO = vec3(0.1, 0.1, 0.1);
}
```

## Read the mask

Assign this to another mesh. Writing ALPHA places it in the transparent pass so it can read the earlier stencil value. Normal depth testing still applies: this example demonstrates masking, not automatic visibility through walls.

```glsl
shader_type spatial;
render_mode unshaded;
stencil_mode read, compare_equal, 1;

void fragment() {
    ALBEDO = vec3(0.2, 0.8, 1.0);
    ALPHA = 1.0;
}
```

These `.gdshader` files are identical for GDScript and C#. Check renderer support and ordering on the intended target. For custom X-ray/portal work, explicitly design depth tests and transparency ordering; setting alpha to zero is not a general guarantee that a mask writes correctly.

Sources: [Godot spatial shader stencil modes](https://docs.godotengine.org/en/4.7/tutorials/shaders/shader_reference/spatial_shader.html#stencil-modes), [Godot 4.7 material shader generation](https://github.com/godotengine/godot/blob/4.7-stable/scene/resources/material.cpp).
