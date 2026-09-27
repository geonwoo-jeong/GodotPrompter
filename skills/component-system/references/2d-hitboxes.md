# Hitbox and Hurtbox Components (2D)

> ← Back to [SKILL.md](../SKILL.md) · [3D counterpart](3d-hitboxes.md)

Use `Area2D` with a `CollisionShape2D` child for each component. The health resource and its signals remain [common](../../scene-organization/SKILL.md). These classes retain the names `HitboxComponent` and `HurtboxComponent` for existing 2D scenes.

Set the hitbox collision layer to 0, mask to hurtbox layer 2, and `monitoring = true`. Set the hurtbox layer to 2, mask to 0, `monitorable = true`, and `monitoring = false`. Enable shapes and assign the health component in the Inspector. A hit occurs on entry; a cooldown suppresses additional entries, and does not schedule repeated damage while overlap continues.

## 4. HitboxComponent

Attach to any entity that deals damage. Configure `damage` in the Inspector.

### GDScript (`hitbox_component.gd`)

```gdscript
class_name HitboxComponent
extends Area2D

## Damage dealt to the target hurtbox on contact.
@export var damage: int = 10

## Minimum seconds between successive hits (0 = no cooldown).
@export var cooldown_duration: float = 0.5

signal hit(target_hurtbox: HurtboxComponent)

var _on_cooldown: bool = false

@onready var _cooldown_timer: Timer = _build_timer()


func _ready() -> void:
	area_entered.connect(_on_area_entered)


func _on_area_entered(area: Area2D) -> void:
	if _on_cooldown:
		return
	if area is not HurtboxComponent:
		return
	hit.emit(area)
	area.receive_hit(damage)
	if cooldown_duration > 0.0:
		_on_cooldown = true
		_cooldown_timer.start(cooldown_duration)


func _on_cooldown_timeout() -> void:
	_on_cooldown = false


func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(_on_cooldown_timeout)
	add_child(t)
	return t
```

### C# (`HitboxComponent.cs`)

```csharp
using Godot;

public partial class HitboxComponent : Area2D
{
    /// <summary>Damage dealt to the target hurtbox on contact.</summary>
    [Export] public int Damage { get; set; } = 10;

    /// <summary>Minimum seconds between successive hits (0 = no cooldown).</summary>
    [Export] public float CooldownDuration { get; set; } = 0.5f;

    [Signal] public delegate void HitEventHandler(HurtboxComponent targetHurtbox);

    private bool _onCooldown;
    private Timer _cooldownTimer;

    public override void _Ready()
    {
        _cooldownTimer = new Timer { OneShot = true };
        _cooldownTimer.Timeout += OnCooldownTimeout;
        AddChild(_cooldownTimer);

        AreaEntered += OnAreaEntered;
    }

    private void OnAreaEntered(Area2D area)
    {
        if (_onCooldown) return;
        if (area is not HurtboxComponent hurtbox) return;

        EmitSignal(SignalName.Hit, hurtbox);
        hurtbox.ReceiveHit(Damage);

        if (CooldownDuration > 0f)
        {
            _onCooldown = true;
            _cooldownTimer.Start(CooldownDuration);
        }
    }

    private void OnCooldownTimeout() => _onCooldown = false;
}
```

---

## 5. HurtboxComponent

Attach to any entity that can take damage. Wire it to a sibling `HealthComponent` via `@export`.

### GDScript (`hurtbox_component.gd`)

```gdscript
class_name HurtboxComponent
extends Area2D

## Reference to the HealthComponent on the same entity.
@export var health_component: HealthComponent

## Invincibility frame duration in seconds (0 = none).
@export var invincibility_duration: float = 0.0

signal hurt(damage_amount: int)

var _invincible: bool = false

@onready var _iframes_timer: Timer = _build_timer()


func receive_hit(damage: int) -> void:
	if _invincible:
		return
	hurt.emit(damage)
	if health_component:
		health_component.take_damage(damage)
	if invincibility_duration > 0.0:
		_invincible = true
		_iframes_timer.start(invincibility_duration)


func _on_iframes_timeout() -> void:
	_invincible = false


func _build_timer() -> Timer:
	var t := Timer.new()
	t.one_shot = true
	t.timeout.connect(_on_iframes_timeout)
	add_child(t)
	return t
```

### C# (`HurtboxComponent.cs`)

```csharp
using Godot;

public partial class HurtboxComponent : Area2D
{
    /// <summary>Reference to the HealthComponent on the same entity.</summary>
    [Export] public HealthComponent HealthComponent { get; set; }

    /// <summary>Invincibility frame duration in seconds (0 = none).</summary>
    [Export] public float InvincibilityDuration { get; set; } = 0f;

    [Signal] public delegate void HurtEventHandler(int damageAmount);

    private bool _invincible;
    private Timer _iframesTimer;

    public override void _Ready()
    {
        _iframesTimer = new Timer { OneShot = true };
        _iframesTimer.Timeout += OnIframesTimeout;
        AddChild(_iframesTimer);
    }

    public void ReceiveHit(int damage)
    {
        if (_invincible) return;

        EmitSignal(SignalName.Hurt, damage);
        HealthComponent?.TakeDamage(damage);

        if (InvincibilityDuration > 0f)
        {
            _invincible = true;
            _iframesTimer.Start(InvincibilityDuration);
        }
    }

    private void OnIframesTimeout() => _invincible = false;
}
```

---

