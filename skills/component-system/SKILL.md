---
name: component-system
description: Use when building reusable node components — composition patterns, component communication, and interface design
---

# Component System in Godot 4.3+ (Common)

> **Scope:** Common architecture for 2D and 3D games; choose the dimension-specific reference when world coordinates or spatial nodes are involved.

Build behavior through composition. Attach small, focused components to any entity rather than climbing an inheritance chain. All examples target Godot 4.3+ with no deprecated APIs.

> **Related skills:** **scene-organization** for scene tree composition, **event-bus** for decoupled component communication, **resource-pattern** for data-driven component configuration, **physics-system** for Area2D/3D overlap detection and collision shapes, **ability-system** for an AbilityComponent example built on this pattern.

---

## 1. Why Components

| Problem with inheritance | How components solve it |
|--------------------------|-------------------------|
| Deep chains are brittle — change one class, break many | Each component is an isolated scene with a single job |
| Sharing behavior across unrelated entities requires awkward base classes | Drop a component onto any entity that needs that behavior |
| Adding a new combination means a new subclass | Mix and match components freely at the scene level |

Key benefits:

- **Reuse across entities** — a `HealthComponent` works on a player, an enemy, a destructible crate, or a boss with no code changes.
- **Separation of concerns** — damage detection, health tracking, and state animation are each their own file. Debugging is local.
- **Mix-and-match behaviors** — give an enemy a `HitboxComponent` and a `PatrolComponent` independently. Removing one does not affect the other.

---

## 2. Component Design Rules

1. **One responsibility per component.** If you find yourself naming it `HealthAndShieldAndRegenComponent`, split it.
2. **Use signals and explicit dependencies.** Emit signals for notifications; inject required interfaces with exported references. Avoid `get_parent().get_node("SiblingComponent")` to discover dependencies.
3. **Stateless where possible.** Prefer deriving state from inputs and `@export` configuration over storing mutable state. When state is necessary, keep it private.
4. **Use `@export` for all configuration.** Damage amount, cooldown duration, and layer masks belong in the Inspector, not hardcoded constants.

---

## 3. Common Components

| Component | Purpose | Key Signals |
|---|---|---|
| `HealthComponent` | Tracks current and max HP, applies damage and healing | `health_changed(old_value, new_value)`, `died` |
| `HitboxComponent` | Detects overlapping hurtboxes and triggers damage | `hit(target_hurtbox)` |
| `HurtboxComponent` | Receives hits, routes damage to `HealthComponent` | `hurt(damage_amount)` |
| `InteractableComponent` | Marks an entity as interactable and fires on player overlap | `interacted(interactor)` |
| `StateMachineComponent` | Delegates `_process` and `_physics_process` to child state nodes | `state_changed(from, to)` |

---

## 4. Spatial Damage Adapters

Choose [2D hitboxes and hurtboxes](references/2d-hitboxes.md) for `Area2D` / `CollisionShape2D`, or [3D hitboxes and hurtboxes](references/3d-hitboxes.md) for `Area3D` / `CollisionShape3D`. Each includes complete GDScript and C# classes, collision-layer setup, cooldown, and invincibility timers. Health values, signals, and ability data are shared.

---

## 6. Component Communication

Use signals for notifications and explicit references for required interfaces. Avoid discovering siblings through implicit parent paths.

```
┌─────────────────────────────────────────────────────┐
│  Entity (Node2D / Node3D)                            │
│                                                      │
│  ┌──────────────┐    hit(hurtbox)                    │
│  │ HitboxComponent ──────────────────────────────┐  │
│  └──────────────┘                                 │  │
│                                                   ▼  │
│                              ┌─────────────────────┐ │
│                              │  HurtboxComponent   │ │
│                              │  receive_hit(dmg)   │ │
│                              │  ──── calls ──────► │ │
│                              │  HealthComponent    │ │
│                              │  .take_damage(dmg) │ │
│                              └────────┬────────────┘ │
│                                       │              │
│                              health_changed / died   │
│                                       │              │
│                              ┌────────▼────────────┐ │
│                              │  HealthComponent    │ │
│                              │  emits: died        │ │
│                              └─────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Flow explained:**

1. `HitboxComponent` detects an overlapping `HurtboxComponent` via `area_entered`.
2. It emits `hit(target_hurtbox)` (for the entity's own logic, e.g. playing a sound) and calls `target_hurtbox.receive_hit(damage)` — the only cross-component call, and it targets the direct interface of the hurtbox, not a sibling.
3. `HurtboxComponent.receive_hit()` emits `hurt(damage_amount)` for animation/VFX, then calls `health_component.take_damage(damage)` on its explicitly wired reference.
4. `HealthComponent.take_damage()` updates HP and emits `health_changed` or `died`. Listeners (UI, GameManager, etc.) connect to those signals without touching the combat components.

---

## 7. Wiring Components

Three patterns in order of preference:

### @export typed node reference — works across the scene tree

```gdscript
# hurtbox_component.gd
@export var health_component: HealthComponent

# Inspector: drag the HealthComponent node into the slot.
```

> **Gotcha:** `@export` node references are wired via the editor inspector. If you build scenes programmatically or hand-write `.tscn` files, the reference may be null at runtime. In that case, wire it explicitly in the parent's `_ready()`:
> ```gdscript
> hurtbox.health_component = health_component
> ```

### @onready direct child — simple when the component is a known child

```gdscript
# enemy.gd
@onready var health: HealthComponent = $HealthComponent
```

### get_node pattern — when the path is dynamic or optional

```gdscript
func _ready() -> void:
	var health := get_node_or_null("HealthComponent") as HealthComponent
	if health:
		health.died.connect(_on_died)
```

> Prefer `@export` when the wired node lives elsewhere in the tree. Prefer `@onready` for direct children that are always present. Use `get_node_or_null` when the component is optional.

### C# parity

```csharp
// Pattern 1: [Export] property — drag-and-drop in the Inspector.
public partial class HealthBinding : Node
{
    [Export] public HealthComponent Health { get; set; }
}

// Pattern 2: GetNode<T> for a known child path (equivalent to @onready var x := $Path).
public partial class EnemyComponents : Node
{
    private HealthComponent _health;

    public override void _Ready()
    {
        _health = GetNode<HealthComponent>("HealthComponent");
        _health.Died += QueueFree;
    }
}

// Pattern 3: GetNodeOrNull<T> when the component is optional (equivalent to get_node_or_null).
public partial class Pickup : Node
{
    public override void _Ready()
    {
        var health = GetNodeOrNull<HealthComponent>("HealthComponent");
        if (health != null)
            health.Died += OnDied;
    }

    private void OnDied() { /* ... */ }
}
```

---

## 8. Finding Components at Runtime

Use a static utility to locate the first component of a given type on any entity. This avoids hardcoding node names across different entity scenes.

### GDScript (`component_utils.gd`)

```gdscript
class_name ComponentUtils


## Returns the first child of [param entity] that is an instance of [param component_type],
## or null if none is found.
static func get_component(entity: Node, component_type: GDScript) -> Node:
	for child in entity.get_children():
		if is_instance_of(child, component_type):
			return child
	return null


## Example usage:
##   var health := ComponentUtils.get_component(enemy, HealthComponent) as HealthComponent
##   if health:
##       health.take_damage(5)
```

### C# (`ComponentUtils.cs`)

```csharp
using Godot;

public static class ComponentUtils
{
    /// <summary>
    /// Returns the first child of <paramref name="entity"/> that is of type
    /// <typeparamref name="T"/>, or null if none is found.
    /// </summary>
    public static T GetComponent<T>(Node entity) where T : Node
    {
        foreach (var child in entity.GetChildren())
        {
            if (child is T component)
                return component;
        }
        return null;
    }
}

// Example usage:
//   var health = ComponentUtils.GetComponent<HealthComponent>(enemy);
//   health?.TakeDamage(5);
```

---

## 9. Implementation Checklist

- [ ] Each component is saved as its own `.tscn` scene and reused by instancing
- [ ] Components communicate through signals — no `get_parent().get_node("Sibling")` calls
- [ ] Required component references are explicitly assigned, rather than discovered through parent paths
- [ ] All tuneable values (`damage`, `max_health`, `cooldown_duration`) are `@export`
- [ ] Each component can be tested by attaching it to a minimal test scene in isolation
