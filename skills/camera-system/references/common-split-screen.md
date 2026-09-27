# Split Screen Layout and Input (Common)

> ← Back to [SKILL.md](../SKILL.md)

Use a root Control containing an HBoxContainer. Add two SubViewportContainers, each with exactly one SubViewport child. Set both containers to horizontal/vertical Expand + Fill and enable `stretch`. The containers then resize their viewports with the layout; do not separately set sizes from the OS window dimensions.

For local multiplayer in the same level, instantiate the level and players once. Each viewport owns its camera and shares the level's world: [World2D setup](2d-split-screen.md) or [World3D setup](3d-split-screen.md). `own_world_3d = true` creates an independent 3D world and is inappropriate for two views of the same match.

Route devices to the players through InputEvent.device or a per-player input layer. Global Input actions alone do not distinguish players. GUI is still Control-based for both dimensions. Only the primary viewport should enable its spatial audio listener; do not duplicate a level's AudioStreamPlayer nodes.

```
Root (Node)
├── Level (contains both players, instantiated once)
└── UI (Control)
    └── HBoxContainer
        ├── Left (SubViewportContainer; stretch = true)
        │   └── View (SubViewport; own camera)
        └── Right (SubViewportContainer; stretch = true)
            └── View (SubViewport; own camera)
```

The world-sharing scripts below use exported viewports so the layout node names can vary. Configure each camera to follow its corresponding existing player; use the paired follow camera references. The root viewport should not render the same level behind the split panes: cover it with the containers or use a separate shared world holder.
