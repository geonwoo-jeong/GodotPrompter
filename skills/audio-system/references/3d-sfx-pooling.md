# Positional SFX Pool (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-sfx-pooling.md) · [Common pool](common-sfx-pooling.md)

## 7. 3D Positional SFX Pool

For one-shot sounds at a fixed `Vector3` world position. Create an `SFX` bus and use a positive pool size. Place this manager in the world viewport; an autoload works for the main world. It does not follow a moving actor after playback begins: use an actor-owned player for engine loops or other attached sounds. Round-robin reuse interrupts the oldest slot when the pool is full.

### GDScript

```gdscript
# sfx_pool_3d.gd — add as autoload named SFXPool3D
extends Node

@export var pool_size: int = 16

var _players: Array[AudioStreamPlayer3D] = []
var _index: int = 0


func _ready() -> void:
    for i in pool_size:
        var player := AudioStreamPlayer3D.new()
        player.bus = "SFX"
        player.unit_size = 4.0
        player.max_distance = 50.0
        add_child(player)
        _players.append(player)


func play_at(stream: AudioStream, global_pos: Vector3, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
    var player := _players[_index]
    _index = (_index + 1) % pool_size

    player.global_position = global_pos
    player.stream = stream
    player.volume_db = volume_db
    player.pitch_scale = pitch_scale
    player.play()
```

### C#

```csharp
using Godot;

public partial class SfxPool3D : Node
{
    [Export] public int PoolSize { get; set; } = 16;

    private AudioStreamPlayer3D[] _players;
    private int _index;

    public override void _Ready()
    {
        _players = new AudioStreamPlayer3D[PoolSize];
        for (int i = 0; i < PoolSize; i++)
        {
            var player = new AudioStreamPlayer3D { Bus = "SFX", UnitSize = 4.0f, MaxDistance = 50.0f };
            AddChild(player);
            _players[i] = player;
        }
    }

    public void PlayAt(AudioStream stream, Vector3 globalPos, float volumeDb = 0.0f, float pitchScale = 1.0f)
    {
        var player = _players[_index];
        _index = (_index + 1) % PoolSize;

        player.GlobalPosition = globalPos;
        player.Stream = stream;
        player.VolumeDb = volumeDb;
        player.PitchScale = pitchScale;
        player.Play();
    }
}
```

**Usage:**

```gdscript
# Play an explosion sound at the enemy's position
SFXPool3D.play_at(
    preload("res://audio/sfx/explosion.wav"),
    enemy.global_position,
    -3.0
)
```

---


```csharp
// At the call site; sfxPool is a reference to SfxPool3D.
sfxPool.PlayAt(GD.Load<AudioStream>("res://audio/sfx/explosion.wav"), enemy.GlobalPosition, -3.0f);
```

Distances are world units, conventionally meters. Tune `unit_size`, `max_distance`, and the attenuation model for the scale of the game; copying pixel distances from 2D produces inappropriate falloff. See [3D spatial audio](3d-spatial-audio.md) for listener setup.
