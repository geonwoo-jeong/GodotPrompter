# Common, 2D and 3D documentation

Start with the domain skill, then open its matching dimension reference. The skill IDs and required `SKILL.md` filenames remain stable so installed hosts can still discover them. Titles now identify the entry's scope, and reference filenames use `common-`, `2d-`, or `3d-`.

| Scope | Use it for |
|---|---|
| Common | State lifecycle, resources, inventory, signals, save-file I/O, transport, input events, UI layout, builds and workflow. A shared skill can route to separate spatial implementations. |
| 2D | Canvas XY coordinates, pixel speeds, Node2D bodies/cameras/areas and canvas rendering. |
| 3D | XYZ transforms, world-unit speeds, Camera3D projection, spatial rendering and Node3D bodies/areas. Grounded movement generally uses XZ plus vertical Y. |

The [coverage map](dimension-coverage.json) records the paired topics and the reasons for dimension-specific features.

See the [complete generated catalog](dimension-catalog.md) for every reference, grouped by skill and dimension. The machine-readable [skill index](../skills/index.json) exposes `dimension` and `referencesByDimension` alongside the existing `references` list. [Renamed paths](dimension-renames.json) record where existing documents moved.

## How the examples are shared

Screen-space Control, CanvasLayer, Label, inventory slots and audio buses are common even in a 3D game. Texture2D is also used by 3D materials. Those API names alone do not make a document 2D-only.

Shared algorithms stay together; their spatial adapters are separate. Examples include state machine lifecycle with CharacterBody2D/3D adapters, transport with two spawn implementations, HUD Label animation with two world-to-screen projections, and procedural cell layouts with TileMapLayer/GridMap placement.

Choose one dimension implementation for a given scene. Paired recipes can deliberately use the same script/class names; they are alternatives, not scripts to import together without namespacing. Scene roots must match the declared type. GDScript uses typed assignment when that type is known; conditional casts are reserved for genuinely optional runtime types.

A 3D counterpart states whether it is grounded, flying, or a planar XZ layout. Adding a Z component to a top-down velocity does not implement gravity, navigation or a volumetric generator.

## Features without an identical counterpart

| Feature | Treatment |
|---|---|
| TileMapLayer / GridMap | Separate tile and mesh-library examples; the resources and cell coordinates differ. |
| Skeleton2D / Skeleton3D | Separate cutout and 3D rig recipes. The 3D BoneConstraint/IKModifier APIs are not presented as Skeleton2D APIs. |
| Canvas lights / 3D lighting | Separate rendering recipes; volumetric fog, GI, materials and 3D occlusion remain spatial features. |
| Decals / canvas stamps | A 2D surface-stamp approach is supplied; it is not described as the 3D projection API. |
| Canvas overlays / 3D editor gizmos | Separate editor APIs; no fictitious EditorNode2DGizmoPlugin. |
| Physics backends and bodies | Jolt and SoftBody3D remain 3D-specific. 2D joints provide a distinct ragdoll approach. |
| Canvas shaders / spatial shaders | Separate shader types and effects. Screen compositing, stencil and renderer requirements are identified in their own scope. |
| OpenXR | 3D-only headset/controller poses. Its screen-space UI uses shared Control content on a spatial surface. |
| Popochiu | 2D adventure framework. A 3D Popochiu API is not fabricated; common dialogue/inventory and 3D interaction recipes cover the transferable design. |
| Beehave / LimboAI / Phantom Camera | Shared addon setup plus paired spatial recipes. Language support still follows each addon's actual API. |

## Maintaining the split

For a new spatial topic, add the supported counterpart or explain why the engine/addon feature is dimension-specific. Keep unrelated shared mechanics in a common reference. Include GDScript and C# for engine recipes; language-specific skills retain their documented exemptions.

Run `npm run build:skill-index` after renames or additions. Metadata checks require scoped names and valid Markdown file links. Engine tests extract scripts from the documents; C# checks compile the selected snippets against the real Godot SDK. GPU appearance, editor interaction, and third-party addon runtime behavior still need the relevant renderer/editor/addon environment.
