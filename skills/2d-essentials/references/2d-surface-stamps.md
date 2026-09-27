# Surface Marks (2D)

[2D guide](../SKILL.md) · [3D Decal counterpart](../../3d-essentials/references/3d-decals.md)

For paint, impact marks, or footprints in a 2D world, place a Sprite2D on the receiving Node2D. A sprite stamp is not a projected Decal: it will not wrap onto irregular receiver geometry. Use a texture mask or custom drawing for that requirement.

The function accepts a point in world coordinates. Parent first, then assign global position so transformed receivers work correctly. Rotation is receiver-local; choose the angle from the surface/contact direction when spawning.

```gdscript
func add_stamp(receiver: Node2D, texture: Texture2D, world_position: Vector2, angle: float) -> Sprite2D:
    var stamp := Sprite2D.new()
    stamp.texture = texture
    stamp.z_index = 1
    receiver.add_child(stamp)
    stamp.global_position = world_position
    stamp.rotation = angle
    return stamp
```

```csharp
public Sprite2D AddStamp(Node2D receiver, Texture2D texture, Vector2 worldPosition, float angle)
{
    var stamp = new Sprite2D { Texture = texture, ZIndex = 1 };
    receiver.AddChild(stamp);
    stamp.GlobalPosition = worldPosition;
    stamp.Rotation = angle;
    return stamp;
}
```

Set a lifetime or reuse stamps from a pool when marks can accumulate. The parent receiver owns their lifetime when it is removed.
