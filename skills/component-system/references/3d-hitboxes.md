# Hitbox and Hurtbox Components (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-hitboxes.md)

Use `Area3D` with a `CollisionShape3D` child for each component. Assign a 3D shape sized in world units and the common `HealthComponent` from [scene-organization](../../scene-organization/SKILL.md). The 3D class suffixes allow both adapters in one project.

Set the hitbox collision layer to 0, mask to hurtbox layer 2, and `monitoring = true`. Set the hurtbox layer to 2, mask to 0, `monitorable = true`, and `monitoring = false`. A hit occurs on entry; cooldown and invincibility timers are the same dimension-independent policy as in 2D. Persistent overlap does not automatically repeat the hit.

## 4. HitboxComponent3D

Attach to any entity that deals damage. Configure `damage` in the Inspector.

### GDScript (`hitbox_component_3d.gd`)

```gdscript
class_name HitboxComponent3D
extends Area3D

## Damage dealt to the target hurtbox on contact.
@export var damage: int = 10

## Minimum seconds between successive hits (0 = no cooldown).
@export var cooldown_duration: float = 0.5

signal hit(target_hurtbox: HurtboxComponent3D)

var _on_cooldown: bool = false

@onready var _cooldown_timer: Timer = _build_timer()


func _ready() -> void:
	area_entered.connect(_on_area_entered)


func _on_area_entered(area: Area3D) -> void:
	if _on_cooldown:
		return
	if area is not HurtboxComponent3D:
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

### C# (`HitboxComponent3D.cs`)

```csharp
using Godot;

public partial class HitboxComponent3D : Area3D
{
    /// <summary>Damage dealt to the target hurtbox on contact.</summary>
    [Export] public int Damage { get; set; } = 10;

    /// <summary>Minimum seconds between successive hits (0 = no cooldown).</summary>
    [Export] public float CooldownDuration { get; set; } = 0.5f;

    [Signal] public delegate void HitEventHandler(HurtboxComponent3D targetHurtbox);

    private bool _onCooldown;
    private Timer _cooldownTimer;

    public override void _Ready()
    {
        _cooldownTimer = new Timer { OneShot = true };
        _cooldownTimer.Timeout += OnCooldownTimeout;
        AddChild(_cooldownTimer);

        AreaEntered += OnAreaEntered;
    }

    private void OnAreaEntered(Area3D area)
    {
        if (_onCooldown) return;
        if (area is not HurtboxComponent3D hurtbox) return;

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

## 5. HurtboxComponent3D

Attach to any entity that can take damage. Wire it to a sibling `HealthComponent` via `@export`.

### GDScript (`hurtbox_component_3d.gd`)

```gdscript
class_name HurtboxComponent3D
extends Area3D

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

### C# (`HurtboxComponent3D.cs`)

```csharp
using Godot;

public partial class HurtboxComponent3D : Area3D
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

