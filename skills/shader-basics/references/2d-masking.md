# Sprite Masking (2D)

[Common shader guide](../SKILL.md) · [3D stencil counterpart](3d-stencil-buffer.md)

For masking one sprite, sample a mask texture in its canvas_item shader. White reveals the sprite, black hides it. The mask must use the same UV layout as the sprite. This is a material effect and does not require the 3D stencil buffer.

```glsl
shader_type canvas_item;

uniform sampler2D mask_texture;

void fragment() {
    vec4 color = texture(TEXTURE, UV);
    color.a *= texture(mask_texture, UV).r;
    COLOR = color;
}
```

For masking a group of child CanvasItems, use a parent CanvasItem's Clip Children setting with an alpha shape; for a rectangular UI region use Control.clip_contents. Canvas clipping and 3D depth/stencil masking have different scene and ordering rules. The same shader is used from both GDScript and C#.
