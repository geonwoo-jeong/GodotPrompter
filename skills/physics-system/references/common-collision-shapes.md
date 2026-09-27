# Collision Shape Selection (Common)

Select shapes by geometry and body behavior; 2D and 3D have distinct shape resource classes.

> ← Back to [SKILL.md](../SKILL.md)

| 2D shape | 3D shape | Typical use |
|---|---|---|
| RectangleShape2D | BoxShape3D | Crates, walls |
| CircleShape2D | SphereShape3D | Balls, triggers |
| CapsuleShape2D | CapsuleShape3D | Characters |
| SeparationRayShape2D | SeparationRayShape3D | Character separation support |
| WorldBoundaryShape2D | WorldBoundaryShape3D | Infinite boundary |
| ConvexPolygonShape2D | ConvexPolygonShape3D | Convex solid geometry |
| ConcavePolygonShape2D | ConcavePolygonShape3D | Static segment/triangle geometry |

Primitives are the first choice for moving bodies. Keep concave shapes on static level bodies; they are hollow and cost more than simple primitives. CollisionShape nodes must be direct children of the collision object. Positioning or rotating a shape to fit the body is supported; avoid nonuniform scaling and edit the shape's size/radius/height instead. Reducing shape count and unnecessary transforms can improve performance, but a required local offset is valid.

- [2D shape sizing, teleport reset, and one-way platforms](2d-collision-shapes.md)
- [3D shape sizing and teleport reset](3d-collision-shapes.md)

A 3D MeshInstance can generate convex/concave collision from its mesh. A 2D Sprite can generate a CollisionPolygon2D sibling from its silhouette. These are editor workflows in both scripting languages.
