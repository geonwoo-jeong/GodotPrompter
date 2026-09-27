import { gdscriptBlock, writeProject } from '../helpers.mjs';

export default [
  {
    name: 'data: inventory replacement and Variant drag/drop',
    async setup({ repoRoot, projectDir }) {
      const core = 'skills/inventory-system/references/core-classes.md';
      await writeProject(projectDir, {
        'item_data.gd': await gdscriptBlock(repoRoot, core, '# item_data.gd'),
        'inventory.gd': await gdscriptBlock(repoRoot, core, '# inventory.gd'),
        'inventory_slot.gd': await gdscriptBlock(repoRoot, core, '# inventory_slot.gd'),
        'registry.gd': await gdscriptBlock(repoRoot, 'skills/inventory-system/references/serialization.md', '# item_registry.gd'),
        'slot_ui.gd': await gdscriptBlock(repoRoot, 'skills/inventory-system/references/ui-binding.md', '# slot_ui.gd'),
        'test.gd': `extends SceneTree

func _initialize() -> void:
    call_deferred("run")

func run() -> void:
    var item := ItemData.new()
    item.id = "potion"
    item.max_stack_size = 1
    var inventory := Inventory.new()
    inventory.capacity = 3
    root.add_child(inventory)
    var registry = load("res://registry.gd").new()
    registry.item_definitions.assign([item])
    root.add_child(registry)
    assert(inventory.add_item(item, 3) == 0)
    var changes := [0]
    inventory.inventory_changed.connect(func(): changes[0] += 1)
    registry.deserialize_inventory(inventory, [{"id": "potion", "qty": 1}])
    assert(inventory.get_item_count(item) == 1, "Short save must clear trailing slots")
    assert(inventory.slots[1].is_empty() and inventory.slots[2].is_empty())
    assert(changes[0] == 1, "Restoration emits one change")
    var saved: Array = registry.serialize_inventory(inventory)
    inventory.remove_item(item, 1)
    registry.deserialize_inventory(inventory, saved)
    assert(inventory.get_item_count(item) == 1, "Stable ID round trip")
    var widget := SlotUI.new()
    widget.inventory = inventory
    widget.slot_index = 2
    assert(not widget._can_drop_data(Vector2.ZERO, "not a dictionary"))
    widget._drop_data(Vector2.ZERO, "not a dictionary")
    widget._drop_data(Vector2.ZERO, {"from_index": 0})
    assert(inventory.slots[0].is_empty() and inventory.slots[2].item == item)
    registry.deserialize_inventory(inventory, [])
    assert(inventory.get_item_count(item) == 0, "Empty save clears all slots")
    widget.free()
    inventory.free()
    registry.free()
    print("GODOT_EXAMPLES_OK")
    quit(0)
`,
      });
      return ['res://test.gd'];
    },
  },
  {
    name: 'data: resource discovery through remapped PCK paths',
    async setup({ repoRoot, projectDir }) {
      const loader = await gdscriptBlock(repoRoot, 'skills/resource-pattern/references/collections.md', 'func load_all_items');
      const item = await gdscriptBlock(repoRoot, 'skills/resource-pattern/SKILL.md', '# item_data.gd');
      await writeProject(projectDir, {
        'item_data.gd': item,
        'loader.gd': `extends RefCounted\n${loader}`,
        'test.gd': `extends SceneTree

func _initialize() -> void:
    var item := ItemData.new()
    item.name = "Remapped item"
    var binary_path := "res://prompter_item.res"
    assert(ResourceSaver.save(item, binary_path) == OK)
    var remap_path := "res://prompter_item.tres.remap"
    var remap := FileAccess.open(remap_path, FileAccess.WRITE)
    remap.store_string('[remap]\\npath="res://.godot/imported/prompter_item.res"\\n')
    remap.close()
    var packer := PCKPacker.new()
    assert(packer.pck_start("res://prompter_items.pck") == OK)
    assert(packer.add_file("res://.godot/imported/prompter_item.res", binary_path) == OK)
    assert(packer.add_file("res://packed/items/item.tres.remap", remap_path) == OK)
    assert(packer.flush() == OK)
    assert(ProjectSettings.load_resource_pack("res://prompter_items.pck"))
    var loader = load("res://loader.gd").new()
    var items: Array[ItemData] = loader.load_all_items("res://packed/items/")
    assert(items.size() == 1, "Discover the original resource name, not its hidden remapped payload")
    for loaded in items:
        assert(loaded.name == "Remapped item")
    assert("item.tres" in ResourceLoader.list_directory("res://packed/items/"))
    DirAccess.remove_absolute(binary_path)
    DirAccess.remove_absolute(remap_path)
    DirAccess.remove_absolute("res://prompter_items.pck")
    print("GODOT_EXAMPLES_OK")
    quit(0)
`,
      });
      return ['res://test.gd'];
    },
  },
];
