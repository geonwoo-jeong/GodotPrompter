# Inventory Serialization

Reference for `skills/inventory-system/SKILL.md` — save/load via Resource → JSON or ConfigFile, with versioning. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 7. Serialization

Save inventories as `item_id + quantity` pairs. Never serialize the full `ItemData` Resource — instead, look up items at load time from a preloaded registry. This keeps save files small and decoupled from resource paths.

Register an **autoload scene** named `ItemRegistry`: attach this script to its root and assign every item asset to `item_definitions` / `ItemDefinitions` in the Inspector. These explicit Resource references are export dependencies; unlike filesystem extension scans, they survive resource remapping. Keep IDs unique and stable.

Loading replaces the destination inventory: missing trailing entries become empty slots, while entries beyond its current capacity are ignored. Perform any capacity migration before calling this helper.

### GDScript

```gdscript
# item_registry.gd — attach to the autoload scene named ItemRegistry
extends Node

@export var item_definitions: Array[ItemData] = []
var _items: Dictionary = {}  # id → ItemData


func _ready() -> void:
    for item in item_definitions:
        if item != null and not item.id.is_empty():
            _items[item.id] = item


func get_item(id: String) -> ItemData:
    return _items.get(id, null)


# ── Serialize ────────────────────────────────────────────────────────────────

func serialize_inventory(inventory: Inventory) -> Array:
    var data: Array = []
    for slot in inventory.slots:
        if slot.is_empty():
            data.append(null)
        else:
            data.append({"id": slot.item.id, "qty": slot.quantity})
    return data


# ── Deserialize ──────────────────────────────────────────────────────────────

func deserialize_inventory(inventory: Inventory, data: Array) -> void:
    for i in inventory.slots.size():
        inventory.slots[i] = InventorySlot.new()
    for i in mini(data.size(), inventory.slots.size()):
        var entry = data[i]
        if entry == null:
            inventory.slots[i] = InventorySlot.new()
        else:
            var item: ItemData = get_item(entry["id"])
            if item == null:
                push_error("ItemRegistry: unknown item id '%s'" % entry["id"])
                inventory.slots[i] = InventorySlot.new()
                continue
            var slot          := InventorySlot.new()
            slot.item         = item
            slot.quantity     = entry["qty"]
            inventory.slots[i] = slot
    inventory.inventory_changed.emit()
```

**Usage inside a save system:**

```gdscript
# In SaveManager.save_game():
data["inventory"] = ItemRegistry.serialize_inventory(player.inventory)

# In SaveManager.load_game():
ItemRegistry.deserialize_inventory(player.inventory, data["inventory"])
```

### C#

```csharp
// ItemRegistry.cs — attach to the autoload scene named ItemRegistry
using System.Collections.Generic;
using Godot;

public partial class ItemRegistry : Node
{
    private readonly Dictionary<string, ItemData> _items = new();

    [Export] public Godot.Collections.Array<ItemData> ItemDefinitions { get; set; } = new();

    public override void _Ready()
    {
        foreach (var item in ItemDefinitions)
            if (item != null && !string.IsNullOrEmpty(item.Id))
                _items[item.Id] = item;
    }

    public ItemData GetItem(string id)
        => _items.TryGetValue(id, out var item) ? item : null;

    // ── Serialize ─────────────────────────────────────────────────────────────

    public Godot.Collections.Array SerializeInventory(Inventory inventory)
    {
        var data = new Godot.Collections.Array();
        foreach (var slot in inventory.Slots)
        {
            if (slot.IsEmpty())
                data.Add(default(Variant));
            else
                data.Add(new Godot.Collections.Dictionary
                {
                    ["id"]  = slot.Item.Id,
                    ["qty"] = slot.Quantity,
                });
        }
        return data;
    }

    // ── Deserialize ───────────────────────────────────────────────────────────

    public void DeserializeInventory(Inventory inventory, Godot.Collections.Array data)
    {
        for (int i = 0; i < inventory.Slots.Count; i++)
            inventory.Slots[i] = new InventorySlot();
        int count = Mathf.Min(data.Count, inventory.Slots.Count);
        for (int i = 0; i < count; i++)
        {
            if (data[i].VariantType == Variant.Type.Nil)
            {
                inventory.Slots[i] = new InventorySlot();
                continue;
            }

            var entry = data[i].AsGodotDictionary();
            var item  = GetItem(entry["id"].As<string>());
            if (item == null)
            {
                GD.PushError($"ItemRegistry: unknown item id '{entry["id"]}'");
                inventory.Slots[i] = new InventorySlot();
                continue;
            }

            inventory.Slots[i] = new InventorySlot
            {
                Item     = item,
                Quantity = entry["qty"].As<int>(),
            };
        }
        inventory.EmitSignal(Inventory.SignalName.InventoryChanged);
    }
}
```

---

