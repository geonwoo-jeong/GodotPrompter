# Noise-Based Generation (3D)

Use two-dimensional noise for terrain height over an XZ ground plane; use three-dimensional noise when density must vary independently through the volume.

> ← Back to [SKILL.md](../SKILL.md)

## Heightmap with GridMap

Assign a MeshLibrary with item 0 (a ground tile), choose GridMap cell_size to match the mesh dimensions, and keep cells centered consistently. This creates columns of surface cells, not a closed terrain mesh. Add supporting layers or generate a mesh if the game needs solid cliffs.

```gdscript
extends GridMap

@export var generation_seed: int = 42
@export var width: int = 40
@export var depth: int = 40
@export var height_scale: float = 6.0

func generate_heightmap() -> void:
    clear()
    var noise := FastNoiseLite.new()
    noise.seed = generation_seed
    noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
    noise.frequency = 0.05
    for z in depth:
        for x in width:
            var height: int = roundi(noise.get_noise_2d(x, z) * height_scale)
            set_cell_item(Vector3i(x, height, z), 0)
```

```csharp
public partial class NoiseTerrain3D : GridMap
{
    [Export] public int GenerationSeed { get; set; } = 42;
    [Export] public int Width { get; set; } = 40;
    [Export] public int Depth { get; set; } = 40;
    [Export] public float HeightScale { get; set; } = 6.0f;
    public void GenerateHeightmap()
    {
        Clear();
        var noise = new FastNoiseLite
        {
            Seed = GenerationSeed,
            NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth,
            Frequency = 0.05f
        };
        for (int z = 0; z < Depth; z++)
            for (int x = 0; x < Width; x++)
            {
                int height = Mathf.RoundToInt(noise.GetNoise2D(x, z) * HeightScale);
                SetCellItem(new Vector3I(x, height, z), 0);
            }
    }
}
```

## Volumetric Density

A positive density marks a solid voxel, and a negative one marks air. Sample global voxel coordinates across chunks to avoid repeating the same noise block at every chunk origin. This is the data stage; meshing, collision generation, and flood-fill connectivity are separate steps.

```gdscript
extends RefCounted

var noise := FastNoiseLite.new()

func configure(generation_seed: int) -> void:
    noise.seed = generation_seed
    noise.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
    noise.frequency = 0.05

func is_solid(voxel: Vector3i) -> bool:
    return noise.get_noise_3d(voxel.x, voxel.y, voxel.z) > 0.0
```

```csharp
public partial class VolumeDensity3D : RefCounted
{
    private readonly FastNoiseLite _noise = new();
    public void Configure(int generationSeed)
    {
        _noise.Seed = generationSeed;
        _noise.NoiseType = FastNoiseLite.NoiseTypeEnum.SimplexSmooth;
        _noise.Frequency = 0.05f;
    }
    public bool IsSolid(Vector3I voxel) => _noise.GetNoise3D(voxel.X, voxel.Y, voxel.Z) > 0.0f;
}
```
