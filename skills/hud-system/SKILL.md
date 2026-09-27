---
name: hud-system
description: Use when building in-game HUDs — health bars, score displays, minimap, notifications, and damage numbers
---

# HUD Systems in Godot 4.3+ (Common)

> **Scope:** Common architecture for 2D and 3D games; choose the dimension-specific reference when world coordinates or spatial nodes are involved.

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **godot-ui** for Control node layout and themes, **component-system** for HealthComponent integration, **event-bus** for score/notification signals, **inventory-system** for inventory UI patterns, **2d-essentials** for CanvasLayer setup and draw order, **ability-system** for cooldown bar and resource bar binding patterns.

---

## 1. HUD Architecture

### Why CanvasLayer

A default `CanvasLayer` keeps HUD controls in their own screen-space canvas, unaffected by a `Camera2D` canvas transform. It also provides consistent overlay ordering in a 3D game. Keep `follow_viewport_enabled` disabled and the layer transform unchanged for the screen-coordinate recipes below. A `Camera3D` renders the 3D world; it does not itself transform `Control` nodes.

### Scene Tree

```
World (Node2D / Node3D)
├── WorldGeometry        ← 2D tiles/sprites or 3D meshes
├── Player (CharacterBody2D / CharacterBody3D)
│   ├── Camera2D / Camera3D
│   ├── HealthComponent
│   └── HurtboxComponent
├── Enemies
└── HUD (CanvasLayer — layer: 1)
    ├── MarginContainer (anchor: Full Rect — provides edge padding)
    │   ├── TopBar (HBoxContainer)
    │   │   ├── HealthBarPanel (PanelContainer)
    │   │   │   └── HealthBar (TextureProgressBar or ProgressBar)
    │   │   └── ScoreLabel (Label)
    │   └── BottomBar (HBoxContainer)
    │       └── InteractionPrompt (Label — hidden by default)
    ├── DamageNumbersLayer (Node — screen-space Label pool)
    ├── MinimapContainer (SubViewportContainer)
    │   └── MinimapViewport (SubViewport)
    │       ├── MinimapCamera (Camera2D / Camera3D)
    │       └── (shared World2D / World3D supplied by setup)
    └── NotificationStack (VBoxContainer — anchored top-right)
```

**Key rules:**
- Keep all HUD scenes under a single `CanvasLayer`. Do not mix HUD nodes into the game world tree.
- Use `layer = 1` for the main HUD. Use higher values (e.g. `10`) for overlays or pause menus that must appear above the HUD.
- Damage number Labels live beneath an untransformed HUD layer too. Their spawner converts 2D or 3D world coordinates into viewport pixels; choose the adapter matching the world.

---

## 2. Health Bar

### ProgressBar vs TextureProgressBar

| Node | When to use |
|---|---|
| `ProgressBar` | Prototyping, plain-colour bars |
| `TextureProgressBar` | Pixel-art or stylised bars using sprite sheets |

Both expose `min_value`, `max_value`, and `value`. Set `step = 0` so tweening produces a smooth animation rather than snapping to integer steps.

They are separate subclasses of `Range`; a script extending `Range` can attach to either node.

The `HealthComponent` in **scene-organization** emits `(old_value, new_value)`. Animate to `new_value` and read the maximum from `health_component.max_health`.

### GDScript

```gdscript
## health_bar.gd — attach to a ProgressBar or TextureProgressBar
class_name HealthBar
extends Range

## Reference to the HealthComponent this bar tracks.
## Assign in the Inspector or connect programmatically from the HUD root.
@export var health_component: HealthComponent

## Duration (seconds) for the smooth tween on health change.
@export var tween_duration: float = 0.25

var _tween: Tween


func _ready() -> void:
    step = 0.0  # allow fractional values for smooth animation
    if health_component:
        _connect_component(health_component)


## Call this if the HealthComponent is not available at _ready time
## (e.g. the player spawns after the HUD).
func bind(component: HealthComponent) -> void:
    if health_component:
        health_component.health_changed.disconnect(_on_health_changed)
    health_component = component
    _connect_component(component)


func _connect_component(component: HealthComponent) -> void:
    max_value = component.max_health
    value     = component.current_health
    component.health_changed.connect(_on_health_changed)


func _on_health_changed(_old_value: int, new_value: int) -> void:
    max_value = health_component.max_health
    _animate_to(new_value)


func _animate_to(target_value: float) -> void:
    if _tween:
        _tween.kill()
    _tween = create_tween()
    _tween.set_ease(Tween.EASE_OUT)
    _tween.set_trans(Tween.TRANS_QUAD)
    _tween.tween_property(self, "value", target_value, tween_duration)
```

### C#

```csharp
// HealthBar.cs — attach to a ProgressBar or TextureProgressBar
using Godot;

public partial class HealthBar : Godot.Range
{
    [Export] public HealthComponent HealthComponent { get; set; }
    [Export] public float TweenDuration { get; set; } = 0.25f;

    private Tween _tween;

    public override void _Ready()
    {
        Step = 0.0;
        if (HealthComponent != null)
            ConnectComponent(HealthComponent);
    }

    /// <summary>Call this when the HealthComponent is not available at _Ready time.</summary>
    public void Bind(HealthComponent component)
    {
        if (HealthComponent != null)
            HealthComponent.HealthChanged -= OnHealthChanged;
        HealthComponent = component;
        ConnectComponent(component);
    }

    private void ConnectComponent(HealthComponent component)
    {
        MaxValue = component.MaxHealth;
        Value    = component.CurrentHealth;
        component.HealthChanged += OnHealthChanged;
    }

    private void OnHealthChanged(int oldValue, int newValue)
    {
        MaxValue = HealthComponent.MaxHealth;
        AnimateTo(newValue);
    }

    private void AnimateTo(float targetValue)
    {
        _tween?.Kill();
        _tween = CreateTween();
        _tween.SetEase(Tween.EaseType.Out);
        _tween.SetTrans(Tween.TransitionType.Quad);
        _tween.TweenProperty(this, "value", targetValue, TweenDuration);
    }
}
```

**Tip:** If you use `TextureProgressBar`, set `fill_mode` to `FILL_LEFT_TO_RIGHT` and assign your bar texture to `texture_progress`. The `value` / `max_value` ratio drives how much of the texture is revealed.

---

## 3. Score / Label Display

### GDScript

```gdscript
## score_display.gd — attach to a Label
class_name ScoreDisplay
extends Label

## Duration (seconds) to count from old to new score value.
@export var count_duration: float = 0.4

var _displayed_score: int = 0
var _tween: Tween


func _ready() -> void:
    EventBus.score_changed.connect(_on_score_changed)
    text = "0"


func _on_score_changed(new_score: int) -> void:
    _animate_counter(_displayed_score, new_score)


func _animate_counter(from: int, to: int) -> void:
    if _tween:
        _tween.kill()

    _tween = create_tween()
    _tween.set_ease(Tween.EASE_OUT)
    _tween.set_trans(Tween.TRANS_QUAD)
    # Tween an intermediate float; update the label text each step.
    _tween.tween_method(_set_counter_value, float(from), float(to), count_duration)


func _set_counter_value(value: float) -> void:
    _displayed_score = int(value)
    text = str(_displayed_score)
```

### C#

```csharp
// ScoreDisplay.cs — attach to a Label
using Godot;

public partial class ScoreDisplay : Label
{
    [Export] public float CountDuration { get; set; } = 0.4f;

    private int _displayedScore = 0;
    private Tween _tween;

    public override void _Ready()
    {
        EventBus.Instance.ScoreChanged += OnScoreChanged;
        Text = "0";
    }

    private void OnScoreChanged(int newScore)
    {
        AnimateCounter(_displayedScore, newScore);
    }

    private void AnimateCounter(int from, int to)
    {
        _tween?.Kill();
        _tween = CreateTween();
        _tween.SetEase(Tween.EaseType.Out);
        _tween.SetTrans(Tween.TransitionType.Quad);
        _tween.TweenMethod(
            Callable.From<double>(SetCounterValue),
            (double)from,
            (double)to,
            CountDuration
        );
    }

    private void SetCounterValue(double value)
    {
        _displayedScore = (int)value;
        Text = _displayedScore.ToString();
    }
}
```

**EventBus signals needed:**

```gdscript
# autoloads/event_bus.gd
signal score_changed(new_score: int)
```

```csharp
// EventBus.cs (partial — score signal)
[Signal] public delegate void ScoreChangedEventHandler(int newScore);
```

Emit from wherever points are awarded:

```gdscript
# Inside a collectible or enemy death handler
EventBus.score_changed.emit(GameState.score)
```

```csharp
// Inside a collectible or enemy death handler
EventBus.Instance.EmitSignal(EventBus.SignalName.ScoreChanged, GameState.Score);
```

---

## 4. Damage Numbers

Floating damage labels share one rise-and-fade animation and pool lifetime. A 2D adapter converts `Vector2` through the canvas transform; a 3D adapter projects `Vector3` through the gameplay camera and excludes points behind it.

> Start with the [common DamageNumber Label](references/common-damage-numbers.md), then choose the [2D spawner](references/2d-damage-numbers.md) or [3D spawner](references/3d-damage-numbers.md). Both include GDScript and C#.

---

## 5. Notification System

Toast / notification stack — a `VBoxContainer` anchored top-right with `max_visible` clamping and queue-driven dismissal. New toasts wait for an old one to expire before showing.

> See [references/common-notifications.md](references/common-notifications.md) for the full GDScript and C# stack with auto-dismiss timers.

---

## 6. Minimap Concept

Render a top-down view in a `SubViewport` sharing the gameplay world. Choose `Camera2D` for a `World2D` or an orthogonal `Camera3D` for a `World3D`. Display scaling and circular clipping are shared Control/shader concerns.

> See [2D minimap](references/2d-minimap.md), [3D minimap](references/3d-minimap.md), and [common display/masking](references/common-minimap-display.md).

---

## 7. Interaction Prompts

A screen-space Label follows the selected interactable each frame. Pair an `Area2D` with canvas projection for a 2D world, or an `Area3D` with camera projection for a 3D world. Both display the configured Input Map key/button binding.

> See [2D interaction prompts](references/2d-interaction-prompts.md) or [3D interaction prompts](references/3d-interaction-prompts.md) for complete prompt and trigger scripts in both languages.

---

## 8. Checklist

- [ ] All HUD nodes are children of a `CanvasLayer` with `layer >= 1` so they are unaffected by camera transforms
- [ ] `ProgressBar.step` is set to `0.0` for smooth tween animation rather than integer snapping
- [ ] Health bar binds to `HealthComponent.health_changed` signal — does not poll in `_process`
- [ ] Tween is killed (`_tween.kill()`) before starting a new one so rapid damage does not stack animations
- [ ] Score counter uses `tween_method` to interpolate the displayed integer — not a jump cut
- [ ] Damage numbers use the canvas transform for 2D or `Camera3D.unproject_position()` with a behind-camera check for 3D
- [ ] Pooled damage numbers hide on completion, remain alive, and cancel/reset their previous animation when reused
- [ ] Notification stack enforces `max_visible` and re-checks the queue after each dismissal
- [ ] Toast auto-dismiss uses a `Timer` node — not `await get_tree().create_timer()`
- [ ] `SubViewport` for minimap has `render_target_update_mode = UPDATE_ALWAYS`
- [ ] Minimap uses `Camera2D` zoom / viewport canvas mask in 2D, or orthogonal `Camera3D` size / camera cull mask in 3D
- [ ] Interaction prompt converts the interactable's world position each frame — not cached at spawn time
- [ ] `InputMap.action_get_events()` is used to display the correct key for the player's current binding
- [ ] HUD nodes that do not need input set `mouse_filter = MOUSE_FILTER_IGNORE` to avoid blocking game clicks
