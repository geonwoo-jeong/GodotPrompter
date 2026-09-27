# SFX Pooling (Common)

Reference for `skills/audio-system/SKILL.md` — pooled `AudioStreamPlayer` for high-volume SFX without instancing churn. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. SFX Pool

Limit simultaneous non-positional sounds with a reusable pool. Choose a positive pool size; each voice can play independently, and round-robin reuse interrupts the oldest slot.

### GDScript

```gdscript
# sfx_pool.gd — add as autoload named SFXPool
extends Node

@export var pool_size: int = 16

var _players: Array[AudioStreamPlayer] = []
var _index: int = 0


func _ready() -> void:
    for i in pool_size:
        var player := AudioStreamPlayer.new()
        player.bus = "SFX"
        add_child(player)
        _players.append(player)


func play(stream: AudioStream, volume_db: float = 0.0, pitch_scale: float = 1.0) -> void:
    var player := _players[_index]
    _index = (_index + 1) % pool_size

    player.stream = stream
    player.volume_db = volume_db
    player.pitch_scale = pitch_scale
    player.play()


func play_random_pitch(stream: AudioStream, min_pitch: float = 0.9, max_pitch: float = 1.1) -> void:
    play(stream, 0.0, randf_range(min_pitch, max_pitch))
```

### C#

```csharp
using Godot;

public partial class SfxPool : Node
{
    [Export] public int PoolSize { get; set; } = 16;

    private AudioStreamPlayer[] _players;
    private int _index;

    public override void _Ready()
    {
        _players = new AudioStreamPlayer[PoolSize];
        for (int i = 0; i < PoolSize; i++)
        {
            var player = new AudioStreamPlayer { Bus = "SFX" };
            AddChild(player);
            _players[i] = player;
        }
    }

    public void Play(AudioStream stream, float volumeDb = 0.0f, float pitchScale = 1.0f)
    {
        var player = _players[_index];
        _index = (_index + 1) % PoolSize;

        player.Stream = stream;
        player.VolumeDb = volumeDb;
        player.PitchScale = pitchScale;
        player.Play();
    }

    public void PlayRandomPitch(AudioStream stream, float minPitch = 0.9f, float maxPitch = 1.1f)
    {
        Play(stream, 0.0f, (float)GD.RandRange(minPitch, maxPitch));
    }
}
```

**Usage:**

```gdscript
# Slightly randomize pitch to avoid repetitive sound
SFXPool.play_random_pitch(preload("res://audio/sfx/footstep.wav"))

# Fixed pitch and volume
SFXPool.play(preload("res://audio/sfx/explosion.wav"), -3.0, 1.0)
```

> **Why pool?** Creating new AudioStreamPlayer nodes every frame is wasteful. A pool recycles a fixed number of players in round-robin order. If pool_size players are already playing, the oldest one gets interrupted — this is usually fine for SFX.

---

For positional playback choose the [2D pool](2d-sfx-pooling.md) or [3D pool](3d-sfx-pooling.md). Music and UI sounds can use this non-positional pool in either kind of game.
