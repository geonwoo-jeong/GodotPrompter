# Damage Number Spawner (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-damage-numbers.md) · [Shared Label scene](common-damage-numbers.md)

Use the same pooled `DamageNumber` Label as in 2D. The adapter accepts a `Vector3` hit position and projects it through the gameplay `Camera3D`. Assign that camera and the shared Label scene in the Inspector. Put this spawner beneath the HUD's untransformed `CanvasLayer`; the HUD and camera must render into the same viewport, with no transformed `CanvasItem` ancestors between the spawner and layer.

A point behind the camera is discarded before a pool slot is reused. `unproject_position()` maps to viewport pixels; it does not test whether a wall occludes the hit. This recipe keeps a number at its initial screen position while it rises, matching the 2D recipe. For labels that stay attached to a moving actor, update projection each frame as in [3D interaction prompts](3d-interaction-prompts.md).

## Pooled spawner

```gdscript
## damage_number_spawner_3d.gd
extends Node

@export var damage_number_scene: PackedScene
@export var camera: Camera3D

const POOL_SIZE := 20
var _pool: Array[DamageNumber] = []
var _pool_index: int = 0

func _ready() -> void:
    for i in POOL_SIZE:
        var dn: DamageNumber = damage_number_scene.instantiate()
        dn.hide()
        add_child(dn)
        _pool.append(dn)

func spawn(world_position: Vector3, amount: int, is_critical: bool = false) -> void:
    if camera.is_position_behind(world_position):
        return
    var screen_pos: Vector2 = camera.unproject_position(world_position)
    var dn := _pool[_pool_index]
    _pool_index = (_pool_index + 1) % POOL_SIZE
    dn.position = screen_pos
    dn.show_damage(amount, is_critical)
```

```csharp
using Godot;

public partial class DamageNumberSpawner3D : Node
{
    [Export] public PackedScene DamageNumberScene { get; set; }
    [Export] public Camera3D Camera { get; set; }

    private const int PoolSize = 20;
    private readonly DamageNumber[] _pool = new DamageNumber[PoolSize];
    private int _poolIndex;

    public override void _Ready()
    {
        for (int i = 0; i < PoolSize; i++)
        {
            var dn = DamageNumberScene.Instantiate<DamageNumber>();
            dn.Hide();
            AddChild(dn);
            _pool[i] = dn;
        }
    }

    public void Spawn(Vector3 worldPosition, int amount, bool isCritical = false)
    {
        if (Camera.IsPositionBehind(worldPosition))
            return;
        Vector2 screenPos = Camera.UnprojectPosition(worldPosition);
        var dn = _pool[_poolIndex];
        _poolIndex = (_poolIndex + 1) % PoolSize;
        dn.Position = screenPos;
        dn.ShowDamage(amount, isCritical);
    }
}
```

Call `spawn(victim.global_position, damage)` / `Spawn(victim.GlobalPosition, damage)` with a `Node3D` victim. A global damage event must carry `Vector3` for this adapter; the 2D `Vector2` signal signature cannot be reused unchanged. The animation, pooling lifetime, color reset, and interruption rules stay in the [common Label reference](common-damage-numbers.md).

API: [Camera3D projection and behind-camera checks](https://docs.godotengine.org/en/stable/classes/class_camera3d.html#class-camera3d-method-unproject-position).
