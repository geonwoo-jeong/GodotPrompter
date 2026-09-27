# `@tool` Script Recipes (Common)

Reference for `skills/gdscript-advanced/SKILL.md` — production-grade `@tool` script patterns.

> ← Back to [SKILL.md](../SKILL.md)

---

## 1. Spatial previews

[2D canvas preview](2d-tool-preview.md) · [3D mesh preview](3d-tool-preview.md). The 3D preview also supplies an editor-only visualization without a third-party DebugDraw singleton.

## 2. Baking a value at editor save time

```gdscript
@tool
extends Node

@export var bake_button: bool = false:
    set(value):
        if value and Engine.is_editor_hint():
            _bake_now()

func _notification(what: int) -> void:
    if what == NOTIFICATION_EDITOR_PRE_SAVE:
        _bake_now()

func _bake_now() -> void:
    # ... compute and write a baked Resource
    pass
```

## 4. Common `@tool` bugs

- **Editor freeze on script reload** — usually an infinite loop in a setter that triggers itself. Always guard setters with a `value != current` check.
- **Crash on add to scene** — touching `get_tree()` or `get_viewport()` before the node is in the tree. Use `if is_inside_tree():` guards.
- **Settings lost on reload** — using `@onready` for tool state. `@onready` doesn't fire reliably in editor — use `_ready` with `is_editor_hint()` checks.
