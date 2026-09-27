# Damage Numbers (2D)

Reference for `skills/hud-system/SKILL.md` — floating damage-number scene with rise-and-fade tween and a pooled spawner. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Damage Numbers

Damage numbers are `Label` nodes that briefly float upward and fade out. The pool below keeps each node alive: hide it when its tween completes, then reset and reuse it for another damage event. For high-frequency damage (e.g. rapid-fire weapons) this avoids per-hit allocation.

> Use the shared [DamageNumber Label](common-damage-numbers.md) scene below either spawner. This adapter accepts world-space `Vector2` positions in the main viewport's default canvas. Keep its HUD `CanvasLayer` and any `CanvasItem` ancestors untransformed so viewport coordinates remain label coordinates.

### GDScript — Spawner (attach to the HUD or a DamageNumbersLayer Node2D)

```gdscript
## damage_number_spawner.gd
extends Node

@export var damage_number_scene: PackedScene

## Simple pool: pre-instantiate a fixed number and recycle them.
## Each instance hides on completion; do not queue_free pooled nodes.
const POOL_SIZE := 20
var _pool: Array[DamageNumber] = []
var _pool_index: int = 0


func _ready() -> void:
    for i in POOL_SIZE:
        var dn: DamageNumber = damage_number_scene.instantiate()
        dn.visible = false
        add_child(dn)
        _pool.append(dn)


## Call this from any node that receives damage events.
## `world_position` is the attacker or victim's global position in world space.
func spawn(world_position: Vector2, amount: int, is_critical: bool = false) -> void:
    # Convert world position to screen space so the label sits above the entity
    var screen_pos: Vector2 = get_viewport().get_canvas_transform() * world_position

    # Wraps around — if POOL_SIZE is too small, older labels get recycled mid-animation.
    var dn := _pool[_pool_index]
    _pool_index = (_pool_index + 1) % POOL_SIZE

    dn.position = screen_pos
    dn.show_damage(amount, is_critical)
```

### C# — Spawner (attach to the HUD or a DamageNumbersLayer Node2D)

```csharp
// DamageNumberSpawner.cs
using Godot;

public partial class DamageNumberSpawner : Node
{
    [Export] public PackedScene DamageNumberScene { get; set; }

    private const int PoolSize = 20;
    private readonly DamageNumber[] _pool = new DamageNumber[PoolSize];
    private int _poolIndex = 0;

    public override void _Ready()
    {
        for (int i = 0; i < PoolSize; i++)
        {
            var dn = DamageNumberScene.Instantiate<DamageNumber>();
            dn.Visible = false;
            AddChild(dn);
            _pool[i] = dn;
        }
    }

    /// <summary>
    /// Call from any node that receives damage events.
    /// <paramref name="worldPosition"/> is the attacker or victim's global position.
    /// </summary>
    public void Spawn(Vector2 worldPosition, int amount, bool isCritical = false)
    {
        var screenPos = GetViewport().GetCanvasTransform() * worldPosition;

        var dn = _pool[_poolIndex];
        _poolIndex = (_poolIndex + 1) % PoolSize;

        dn.Position = screenPos;
        dn.ShowDamage(amount, isCritical);
    }
}
```

**Connecting to a damage event (GDScript):**

```gdscript
# In the HUD root or the DamageNumberSpawner's _ready:
EventBus.damage_dealt.connect(func(pos: Vector2, amount: int, crit: bool) -> void:
    $DamageNumbersLayer/DamageNumberSpawner.spawn(pos, amount, crit)
)
```

**Connecting to a damage event (C#):**

```csharp
// In the HUD root or the DamageNumberSpawner's _Ready:
EventBus.Instance.DamageDealt += (Vector2 pos, int amount, bool crit) =>
{
    GetNode<DamageNumberSpawner>("DamageNumbersLayer/DamageNumberSpawner")
        .Spawn(pos, amount, crit);
};
```

