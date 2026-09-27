# Async Navigation Baking (Godot 4.4+) (Common)

> ← Back to [SKILL.md](../SKILL.md)

Use the region's built-in threaded bake after configuring its source geometry. Scene geometry parsing still has main-thread work; threading the bake does not make scene-tree access thread-safe. `bake_finished` means baking completed; navigation map changes become queryable after the server synchronization step. The navigation mover checks the map iteration before querying paths.

## 2D Region

```gdscript
extends Node

func rebake_2d(region: NavigationRegion2D) -> void:
    region.bake_navigation_polygon(true)
    await region.bake_finished
```

```csharp
using Godot;
using System.Threading.Tasks;

public partial class BakeRegion2D : Node
{
    public async Task Rebake2D(NavigationRegion2D region)
    {
        region.BakeNavigationPolygon(true);
        await ToSignal(region, NavigationRegion2D.SignalName.BakeFinished);
    }
}
```

## 3D Region

```gdscript
extends Node

func rebake_3d(region: NavigationRegion3D) -> void:
    region.bake_navigation_mesh(true)
    await region.bake_finished
```

```csharp
using Godot;
using System.Threading.Tasks;

public partial class BakeRegion3D : Node
{
    public async Task Rebake3D(NavigationRegion3D region)
    {
        region.BakeNavigationMesh(true);
        await ToSignal(region, NavigationRegion3D.SignalName.BakeFinished);
    }
}
```

Do not start another bake of the same resource while one is in progress. If using the lower-level server API, parse source geometry first and submit it once; an empty geometry object is not a substitute for parsing the scene.
