# Resource Collections

Reference for `skills/resource-pattern/SKILL.md` — `Array[Resource]` exports (v1.6.0 C# parity preserved), `ResourcePreloader`, loading all resources from a directory.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Resource Collections

### Array[Resource] exports

Declare a typed array on a Resource or Node to hold multiple sub-resources editable in the Inspector.

```gdscript
# item_database.gd
class_name ItemDatabase
extends Resource

@export var items: Array[ItemData] = []


func find_by_name(item_name: String) -> ItemData:
    for item: ItemData in items:
        if item.name == item_name:
            return item
    return null
```

### ResourcePreloader

`ResourcePreloader` is a Node that loads a named set of resources at scene load, holding strong references so they are not unloaded.

```gdscript
# Attach a ResourcePreloader node named "Preloader" to your scene.
# In the Inspector, add resources with string keys.

@onready var preloader: ResourcePreloader = $Preloader


func _ready() -> void:
    var potion: ItemData = preloader.get_resource("health_potion")
    var sword:  ItemData = preloader.get_resource("iron_sword")
```

### Loading all resources from a directory (Godot 4.4+)

Use `ResourceLoader.list_directory()` instead of filesystem extension scans: it reports original resource names even when the export remaps files. This is a shallow scan. On Godot 4.3, use the typed `ItemDatabase.items` catalog above or a `ResourcePreloader`. In every version, include dynamically discovered assets in the export preset; discovery cannot load assets excluded from the package.

```gdscript
func load_all_items(dir_path: String) -> Array[ItemData]:
    var result: Array[ItemData] = []
    for file_name in ResourceLoader.list_directory(dir_path):
        if file_name.ends_with(".tres") or file_name.ends_with(".res"):
            var res := load(dir_path.path_join(file_name))
            if res is ItemData:
                result.append(res)

    return result
```

```csharp
// ItemDatabase.cs — typed Resource collection exposed to the Inspector.
using Godot;
using Godot.Collections;

[GlobalClass]
public partial class ItemDatabase : Resource
{
    [Export] public Array<ItemData> Items { get; set; } = new();

    public ItemData FindByName(string itemName)
    {
        foreach (ItemData item in Items)
        {
            if (item.Name == itemName)
                return item;
        }
        return null;
    }
}

// Loading all resources from a directory at runtime.
public static class ItemDatabaseLoader
{
    public static Array<ItemData> LoadAllItems(string dirPath)
    {
        var result = new Array<ItemData>();
        foreach (string fileName in ResourceLoader.ListDirectory(dirPath))
        {
            if (fileName.EndsWith(".tres") || fileName.EndsWith(".res"))
            {
                var res = ResourceLoader.Load(dirPath.PathJoin(fileName));
                if (res is ItemData item)
                    result.Add(item);
            }
        }
        return result;
    }
}
```

> Use `Godot.Collections.Array<T>` (not `System.Collections.Generic.List<T>`) for `[Export]` — only the Godot collection is editor-serializable.

---

