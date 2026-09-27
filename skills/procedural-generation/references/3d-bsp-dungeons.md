# BSP Dungeon Generation (3D)

Reference for `skills/procedural-generation/SKILL.md` — Binary Space Partitioning for room-based dungeons, corridor connection. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
The partition remains a planar floor plan: logical (x, y) maps to world-grid (x, 0, z). Rooms need not become 3D boxes to build a walkable 3D dungeon; stacked floors or volumetric BSP require additional vertical connectivity rules.

## 3. BSP Dungeon Generation

Binary Space Partitioning recursively splits a rectangle into rooms, then connects them with corridors. Use bounds at least `(min_room_size + 2)` on both axes. Call `generate` then `connect_rooms`; the latter paints both rooms and corridors into a GridMap with an assigned MeshLibrary and a valid floor item ID. Clear the layer before regenerating if replacing the previous layout.

### GDScript

```gdscript
class_name BSPDungeon3D
extends RefCounted

var rng := RandomNumberGenerator.new()
var min_room_size: int = 5
var rooms: Array[Rect2i] = []

func generate(bounds: Rect2i, gen_seed: int) -> Array[Rect2i]:
    rng.seed = gen_seed
    rooms.clear()
    _split(bounds)
    return rooms

func _split(area: Rect2i) -> void:
    # Each leaf needs a minimum interior plus a one-cell margin on each side.
    var minimum_leaf: int = min_room_size + 2
    # Stop splitting when neither axis can fit two valid leaves.
    if area.size.x < minimum_leaf * 2 and area.size.y < minimum_leaf * 2:
        # Shrink to create room with margins
        var room := Rect2i(
            area.position + Vector2i(1, 1),
            area.size - Vector2i(2, 2)
        )
        if room.size.x >= min_room_size and room.size.y >= min_room_size:
            rooms.append(room)
        return

    # Choose split direction based on aspect ratio
    var split_horizontal: bool
    if area.size.y < minimum_leaf * 2:
        split_horizontal = false
    elif area.size.x < minimum_leaf * 2:
        split_horizontal = true
    elif area.size.x > area.size.y * 1.25:
        split_horizontal = false  # split vertically (wide room)
    elif area.size.y > area.size.x * 1.25:
        split_horizontal = true   # split horizontally (tall room)
    else:
        split_horizontal = rng.randi() % 2 == 0

    if split_horizontal:
        var split_y: int = rng.randi_range(
            area.position.y + minimum_leaf,
            area.end.y - minimum_leaf
        )
        _split(Rect2i(area.position, Vector2i(area.size.x, split_y - area.position.y)))
        _split(Rect2i(Vector2i(area.position.x, split_y), Vector2i(area.size.x, area.end.y - split_y)))
    else:
        var split_x: int = rng.randi_range(
            area.position.x + minimum_leaf,
            area.end.x - minimum_leaf
        )
        _split(Rect2i(area.position, Vector2i(split_x - area.position.x, area.size.y)))
        _split(Rect2i(Vector2i(split_x, area.position.y), Vector2i(area.end.x - split_x, area.size.y)))
```

### Connecting Rooms with Corridors

```gdscript
func connect_rooms(grid_map: GridMap, floor_tile: int) -> void:
    for room in rooms:
        for y in range(room.position.y, room.end.y):
            for x in range(room.position.x, room.end.x):
                grid_map.set_cell_item(Vector3i(x, 0, y), floor_tile)
    for i in range(rooms.size() - 1):
        var center_a: Vector2i = rooms[i].position + rooms[i].size / 2
        var center_b: Vector2i = rooms[i + 1].position + rooms[i + 1].size / 2

        # L-shaped corridor: horizontal then vertical
        if rng.randi() % 2 == 0:
            _carve_horizontal(grid_map, center_a.x, center_b.x, center_a.y, floor_tile)
            _carve_vertical(grid_map, center_a.y, center_b.y, center_b.x, floor_tile)
        else:
            _carve_vertical(grid_map, center_a.y, center_b.y, center_a.x, floor_tile)
            _carve_horizontal(grid_map, center_a.x, center_b.x, center_b.y, floor_tile)

func _carve_horizontal(grid_map: GridMap, x1: int, x2: int, y: int, tile: int) -> void:
    for x in range(mini(x1, x2), maxi(x1, x2) + 1):
        grid_map.set_cell_item(Vector3i(x, 0, y), tile)

func _carve_vertical(grid_map: GridMap, y1: int, y2: int, x: int, tile: int) -> void:
    for y in range(mini(y1, y2), maxi(y1, y2) + 1):
        grid_map.set_cell_item(Vector3i(x, 0, y), tile)
```

### C#

```csharp
public partial class BSPDungeon3D : RefCounted
{
    private RandomNumberGenerator _rng = new();
    private int _minRoomSize = 5;
    public Godot.Collections.Array<Rect2I> Rooms { get; } = new();

    public Godot.Collections.Array<Rect2I> Generate(Rect2I bounds, ulong genSeed)
    {
        _rng.Seed = genSeed;
        Rooms.Clear();
        Split(bounds);
        return Rooms;
    }

    private void Split(Rect2I area)
    {
        int minimumLeaf = _minRoomSize + 2;
        if (area.Size.X < minimumLeaf * 2 && area.Size.Y < minimumLeaf * 2)
        {
            var room = new Rect2I(
                area.Position + new Vector2I(1, 1),
                area.Size - new Vector2I(2, 2)
            );
            if (room.Size.X >= _minRoomSize && room.Size.Y >= _minRoomSize)
                Rooms.Add(room);
            return;
        }

        bool splitHorizontal;
        if (area.Size.Y < minimumLeaf * 2)
            splitHorizontal = false;
        else if (area.Size.X < minimumLeaf * 2)
            splitHorizontal = true;
        else if (area.Size.X > area.Size.Y * 1.25f)
            splitHorizontal = false;
        else if (area.Size.Y > area.Size.X * 1.25f)
            splitHorizontal = true;
        else
            splitHorizontal = _rng.Randi() % 2 == 0;

        if (splitHorizontal)
        {
            int splitY = _rng.RandiRange(
                area.Position.Y + minimumLeaf,
                area.End.Y - minimumLeaf
            );
            Split(new Rect2I(area.Position, new Vector2I(area.Size.X, splitY - area.Position.Y)));
            Split(new Rect2I(new Vector2I(area.Position.X, splitY), new Vector2I(area.Size.X, area.End.Y - splitY)));
        }
        else
        {
            int splitX = _rng.RandiRange(
                area.Position.X + minimumLeaf,
                area.End.X - minimumLeaf
            );
            Split(new Rect2I(area.Position, new Vector2I(splitX - area.Position.X, area.Size.Y)));
            Split(new Rect2I(new Vector2I(splitX, area.Position.Y), new Vector2I(area.End.X - splitX, area.Size.Y)));
        }
    }

    public void ConnectRooms(GridMap gridMap, int floorTile)
    {
        foreach (Rect2I room in Rooms)
            for (int y = room.Position.Y; y < room.End.Y; y++)
                for (int x = room.Position.X; x < room.End.X; x++)
                    gridMap.SetCellItem(new Vector3I(x, 0, y), floorTile);
        for (int i = 0; i < Rooms.Count - 1; i++)
        {
            Vector2I centerA = Rooms[i].Position + Rooms[i].Size / 2;
            Vector2I centerB = Rooms[i + 1].Position + Rooms[i + 1].Size / 2;

            if (_rng.Randi() % 2 == 0)
            {
                CarveHorizontal(gridMap, centerA.X, centerB.X, centerA.Y, floorTile);
                CarveVertical(gridMap, centerA.Y, centerB.Y, centerB.X, floorTile);
            }
            else
            {
                CarveVertical(gridMap, centerA.Y, centerB.Y, centerA.X, floorTile);
                CarveHorizontal(gridMap, centerA.X, centerB.X, centerB.Y, floorTile);
            }
        }
    }

    private static void CarveHorizontal(GridMap gridMap, int x1, int x2, int y, int tile)
    {
        for (int x = Mathf.Min(x1, x2); x <= Mathf.Max(x1, x2); x++)
            gridMap.SetCellItem(new Vector3I(x, 0, y), tile);
    }

    private static void CarveVertical(GridMap gridMap, int y1, int y2, int x, int tile)
    {
        for (int y = Mathf.Min(y1, y2); y <= Mathf.Max(y1, y2); y++)
            gridMap.SetCellItem(new Vector3I(x, 0, y), tile);
    }
}
```

---
