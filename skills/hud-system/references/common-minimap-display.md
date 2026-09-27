# Minimap Display and Circular Mask (Common)

> ← Back to [SKILL.md](../SKILL.md) · [2D world setup](2d-minimap.md) · [3D world setup](3d-minimap.md)

The HUD displays a viewport texture in exactly the same way for a 2D or 3D world. Set the `SubViewport` to `UPDATE_ALWAYS`. With `SubViewportContainer.stretch = false`, its child viewport's size determines the displayed size. Enable `stretch` to resize the render to the container; use `stretch_shrink` when a lower internal resolution is acceptable. For a fixed-resolution render displayed at another size, put its `ViewportTexture` in a separate `TextureRect` with suitable expand and stretch modes.

## Circular clipping

Assign a `ShaderMaterial` with this canvas shader to the displaying `SubViewportContainer` or `TextureRect`. It clips the rendered texture, independently of the world dimension. Merely putting the display beneath a circular textured parent does not mask it.

```glsl
shader_type canvas_item;

void fragment() {
    vec2 centered_uv = UV - 0.5;
    COLOR = texture(TEXTURE, UV);
    COLOR.a *= step(length(centered_uv), 0.5);
}
```

This uses a hard circular edge and assumes a square display. Choose filtering and an antialiased alpha transition to suit the art style. Set `mouse_filter` to `MOUSE_FILTER_IGNORE` when the minimap should not intercept input.
