# Cellular Automata Cave Generation (3D)

Reference for `skills/procedural-generation/SKILL.md` — random fill + smoothing iterations for organic cave shapes. GDScript + C# with GridMap integration.

> ← Back to [SKILL.md](../SKILL.md)

---
This creates a planar cave floor plan for a 3D level: grid (x, y) maps to GridMap (x, 0, z). Configure MeshLibrary items 0 (wall plus floor) and 1 (floor only). A volumetric cave needs a 3D neighborhood and different density thresholds; see [3D noise generation](3d-noise-generation.md).

## 4. Cellular Automata (Cave Generation)

Simulates natural-looking caves by iterating a simple rule: a cell becomes wall if most of its neighbors are walls.

### GDScript

```gdscript
class_name CaveGenerator3D
extends RefCounted

var rng := RandomNumberGenerator.new()

func generate(width: int, height: int, gen_seed: int, fill_chance: float = 0.45, iterations: int = 5) -> Array[Array]:
    rng.seed = gen_seed

    # Step 1: Random fill
    var grid: Array[Array] = []
    for y in height:
        var row: Array[bool] = []
        for x in width:
            # true = wall, false = floor
            var is_edge: bool = x == 0 or y == 0 or x == width - 1 or y == height - 1
            row.append(is_edge or rng.randf() < fill_chance)
        grid.append(row)

    # Step 2: Smooth with cellular automata rules
    for _i in iterations:
        grid = _smooth(grid, width, height)

    return grid

func _smooth(grid: Array[Array], width: int, height: int) -> Array[Array]:
    var new_grid: Array[Array] = []
    for y in height:
        var row: Array[bool] = []
        for x in width:
            var wall_count: int = _count_neighbors(grid, x, y, width, height)
            # Rule: become wall if 5+ of 9 cells (self + 8 neighbors) are walls
            row.append(wall_count >= 5)
        new_grid.append(row)
    return new_grid

func _count_neighbors(grid: Array[Array], cx: int, cy: int, width: int, height: int) -> int:
    var count: int = 0
    for dy in range(-1, 2):
        for dx in range(-1, 2):
            var nx: int = cx + dx
            var ny: int = cy + dy
            if nx < 0 or ny < 0 or nx >= width or ny >= height:
                count += 1  # out of bounds counts as wall
            elif grid[ny][nx]:
                count += 1
    return count
```

### Usage with GridMap

```gdscript
func apply_cave_to_gridmap(grid_map: GridMap, grid: Array[Array]) -> void:
    var wall_tile: int = 0
    var floor_tile: int = 1

    for y in grid.size():
        for x in grid[y].size():
            var tile := wall_tile if grid[y][x] else floor_tile
            grid_map.set_cell_item(Vector3i(x, 0, y), tile)
```

### C#

```csharp
public partial class CaveGenerator3D : RefCounted
{
    private RandomNumberGenerator _rng = new();

    public bool[][] Generate(int width, int height, ulong genSeed, float fillChance = 0.45f, int iterations = 5)
    {
        _rng.Seed = genSeed;

        // Step 1: Random fill
        bool[][] grid = new bool[height][];
        for (int y = 0; y < height; y++)
        {
            grid[y] = new bool[width];
            for (int x = 0; x < width; x++)
            {
                bool isEdge = x == 0 || y == 0 || x == width - 1 || y == height - 1;
                grid[y][x] = isEdge || _rng.Randf() < fillChance;
            }
        }

        // Step 2: Smooth with cellular automata rules
        for (int i = 0; i < iterations; i++)
            grid = Smooth(grid, width, height);

        return grid;
    }

    private static bool[][] Smooth(bool[][] grid, int width, int height)
    {
        bool[][] newGrid = new bool[height][];
        for (int y = 0; y < height; y++)
        {
            newGrid[y] = new bool[width];
            for (int x = 0; x < width; x++)
            {
                int wallCount = CountNeighbors(grid, x, y, width, height);
                // Rule: become wall if 5+ of 9 cells (self + 8 neighbors) are walls
                newGrid[y][x] = wallCount >= 5;
            }
        }
        return newGrid;
    }

    private static int CountNeighbors(bool[][] grid, int cx, int cy, int width, int height)
    {
        int count = 0;
        for (int dy = -1; dy <= 1; dy++)
            for (int dx = -1; dx <= 1; dx++)
            {
                int nx = cx + dx, ny = cy + dy;
                if (nx < 0 || ny < 0 || nx >= width || ny >= height)
                    count++;  // out of bounds counts as wall
                else if (grid[ny][nx])
                    count++;
            }
        return count;
    }
}

public static class CaveGridmapPainter
{
public static void ApplyCaveToGridmap(GridMap gridMap, bool[][] grid)
{
    int wallTile = 0;
    int floorTile = 1;

    for (int y = 0; y < grid.Length; y++)
        for (int x = 0; x < grid[y].Length; x++)
            gridMap.SetCellItem(new Vector3I(x, 0, y), grid[y][x] ? wallTile : floorTile);
}
}
```

---
