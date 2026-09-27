# Grid-based Level Building (3D)

[3D guide](../SKILL.md) · [2D TileMapLayer counterpart](../../2d-essentials/references/2d-tilemap.md)

GridMap uses a MeshLibrary, integer Vector3i cells, and discrete orthogonal orientations. It is the 3D grid-placement counterpart to TileMapLayer, but it does not share TileSet terrain autotiling or atlas coordinates.

Create a MeshLibrary asset with a floor item and assign it to `mesh_library` in the Inspector. The item's meshes, collision shapes, and navigation data are authored in the library; `set_cell_item()` only places the item.

```gdscript
extends GridMap

@export var floor_item: int = 0

func build_floor(width: int, depth: int) -> void:
    clear()
    for x in range(width):
        for z in range(depth):
            set_cell_item(Vector3i(x, 0, z), floor_item)

func remove_cell_at(world_position: Vector3) -> void:
    var cell := local_to_map(to_local(world_position))
    set_cell_item(cell, INVALID_CELL_ITEM)
```

```csharp
using Godot;

public partial class GridFloor3D : GridMap
{
    [Export] public int FloorItem { get; set; }

    public void BuildFloor(int width, int depth)
    {
        Clear();
        for (int x = 0; x < width; x++)
            for (int z = 0; z < depth; z++)
                SetCellItem(new Vector3I(x, 0, z), FloorItem);
    }

    public void RemoveCellAt(Vector3 worldPosition)
    {
        Vector3I cell = LocalToMap(ToLocal(worldPosition));
        SetCellItem(cell, -1); // An item index of -1 removes the cell.
    }
}
```

GridMap does not automatically provide arbitrary scene instances per cell. Place interactive props as separate Node3D scenes alongside the grid. For terrain adjacency rules, compute your own item/orientation selection before filling cells.
