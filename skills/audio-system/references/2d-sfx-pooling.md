# Positional SFX Pool (2D)

> ← Back to [SKILL.md](../SKILL.md) · [3D counterpart](3d-sfx-pooling.md) · [Common pool](common-sfx-pooling.md)

## 7. 2D Positional SFX Pool

For one-shot sounds at a fixed `Vector2` world position. Create an `SFX` bus and use a positive pool size. Place this manager in the world viewport; an autoload works for the main world. It does not follow a moving actor after playback begins: use an actor-owned player for engine loops or other attached sounds. Round-robin reuse interrupts the oldest slot when the pool is full.

### GDScript

```gdscript
# sfx_pool_2d.gd — add as autoload named SFXPool2D
extends Node

@export var pool_size: int = 16

var _players: Array[AudioStreamPlayer2D] = []
var _index: int = 0


func _ready() -> void:
    for i in pool_size:
        var player := AudioStreamPlayer2D.new()
        player.bus = "SFX"
        add_child(player)
        _players.append(player)


func play_at(stream: AudioStream, global_pos: Vector2, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
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

public partial class SfxPool2D : Node
{
    [Export] public int PoolSize { get; set; } = 16;

    private AudioStreamPlayer2D[] _players;
    private int _index;

    public override void _Ready()
    {
        _players = new AudioStreamPlayer2D[PoolSize];
        for (int i = 0; i < PoolSize; i++)
        {
            var player = new AudioStreamPlayer2D { Bus = "SFX" };
            AddChild(player);
            _players[i] = player;
        }
    }

    public void PlayAt(AudioStream stream, Vector2 globalPos, float volumeDb = 0.0f, float pitchScale = 1.0f)
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
SFXPool2D.play_at(
    preload("res://audio/sfx/explosion.wav"),
    enemy.global_position,
    -3.0
)
```

---


```csharp
// At the call site; sfxPool is a reference to SfxPool2D.
sfxPool.PlayAt(GD.Load<AudioStream>("res://audio/sfx/explosion.wav"), enemy.GlobalPosition, -3.0f);
```
