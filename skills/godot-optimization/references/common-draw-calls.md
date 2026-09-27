# Rendering Optimization (Common)

Measure rendering time and draw calls in a representative scene on target hardware. A lower draw-call count alone does not guarantee a faster frame: fill rate, shader cost, lighting, and overdraw can dominate.

> ← Back to [SKILL.md](../SKILL.md)

- [2D batching, atlases, culling, and MultiMesh](2d-rendering.md)
- [3D materials, culling, MultiMesh, and LOD](3d-rendering.md)

Share resources when their values are identical. Changing a shared material's ordinary uniform changes all users; varying data per instance requires an instance parameter supported by that renderer/material, a vertex color, or MultiMesh custom data. Duplicating a material creates a distinct resource and is not shared-material batching.

Only suspend off-screen cosmetic work. An enemy can affect gameplay while off screen, and split-screen cameras may have different visibility. A visibility notifier reports visibility; it does not automatically stop the parent script or disable physics.
