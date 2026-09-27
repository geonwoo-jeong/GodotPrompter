# Sharing vs Unique Resources (Common)

Reference for `skills/resource-pattern/SKILL.md` — when Resources share state vs `.duplicate()` for unique copies (v1.6.0 C# parity preserved).

> ← Back to [SKILL.md](../SKILL.md)

---
## 8. Sharing vs Unique

Resources loaded from the same path are **shared**. Every node that loads `res://data/enemies/goblin.tres` gets the exact same object in memory.

```gdscript
# Both variables point to the same object — modifying one modifies the other.
var a: EnemyStats = load("res://data/enemies/goblin.tres")
var b: EnemyStats = load("res://data/enemies/goblin.tres")
print(a == b)  # true
```

**For per-instance mutable state, call `duplicate()`:**

```gdscript
func _ready() -> void:
    # Shallow duplicate — nested Resources are still shared
    stats = stats.duplicate()

    # Deep duplicate — exact subresource policy depends on the Godot version
    stats = stats.duplicate(true)
```

```csharp
public partial class Enemy : Node
{
    [Export] public EnemyStats StatsTemplate { get; set; }
    private EnemyStats _stats;

    public override void _Ready()
    {
        // Shallow duplicate — referenced sub-resources still point at the original.
        _stats = (EnemyStats)StatsTemplate.Duplicate();

        // Deep duplicate — see the version-specific subresource policy below.
        // _stats = (EnemyStats)StatsTemplate.Duplicate(true);

        _stats.CurrentHealth = _stats.MaxHealth;
    }
}
```

`duplicate()` (`Duplicate()` in C#) returns a new Resource with the same property values. The original `.tres` file is untouched.

**Make Unique in the editor (not a `Resource` method):** The resource's Inspector menu offers **Make Unique**, which assigns a private copy to that property instead of retaining the shared reference. Save the edited scene or Resource to persist that copy. Use this when one scene needs different values than the shared default.

**Godot 4.7 behavior:** `duplicate(true)` recursively copies containers and internal Resources; external file-backed Resources can remain shared. It does not mean every reachable Resource is copied. For an explicit all-subresource policy on 4.7, use `duplicate_deep(Resource.DEEP_DUPLICATE_ALL)` / `DuplicateDeep(Resource.DeepDuplicateMode.All)`. Property usage flags can still override duplication, and custom Resources with required constructor arguments cannot be duplicated. Verify isolation for the nested mutable data you actually own. See the [versioned Resource API](https://docs.godotengine.org/en/4.7/classes/class_resource.html#class-resource-method-duplicate).

**Guideline:**
- Read-only data (item definitions, level config) — share freely, no duplication needed.
- Mutable runtime state (current health, active buffs) — always `duplicate()` in `_ready()`.

---
