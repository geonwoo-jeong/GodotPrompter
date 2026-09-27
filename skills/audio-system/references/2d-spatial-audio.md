# Spatial Audio (2D)

> ← Back to [SKILL.md](../SKILL.md) · [3D counterpart](3d-spatial-audio.md) · [2D one-shot pool](2d-sfx-pooling.md)

An `AudioStreamPlayer2D` uses position in canvas/world pixels for attenuation and panning. Put it beneath the actor's `Node2D` so its position follows that actor. Configure an `SFX` bus and assign an imported `AudioStream` in the Inspector; call the playback method from the movement animation or event that marks a footstep.

## Actor-owned player

```gdscript
## footsteps_2d.gd
extends AudioStreamPlayer2D

func _ready() -> void:
    bus = &"SFX"
    max_distance = 1000.0
    attenuation = 1.0
    max_polyphony = 4

func play_step() -> void:
    play()
```

```csharp
using Godot;

public partial class Footsteps2D : AudioStreamPlayer2D
{
    public override void _Ready()
    {
        Bus = "SFX";
        MaxDistance = 1000.0f;
        Attenuation = 1.0f;
        MaxPolyphony = 4;
    }

    public void PlayStep() => Play();
}
```

`max_distance` defines the distance at which this source becomes silent; `attenuation` controls the falloff curve. This is independent from the voice count `max_polyphony`. The [2D pool](2d-sfx-pooling.md) handles detached one-shot sounds at a fixed position; actor-owned players are appropriate for sounds that should follow a moving emitter.

## Listener

Without an explicit `AudioListener2D`, the viewport uses its screen center as the listener position. To listen at the player even when the camera is offset, add this node beneath the player. Keep the active audio listener in the viewport rendering the world.

```gdscript
extends AudioListener2D

func _ready() -> void:
    make_current()
```

```csharp
using Godot;

public partial class PlayerAudioListener2D : AudioListener2D
{
    public override void _Ready() => MakeCurrent();
}
```

For an `Area2D` audio bus override, enable the corresponding bit in the player's `area_mask` and configure `audio_bus_override` / `audio_bus_name` on the area. Set this mask explicitly when using the feature: its default changes in Godot 4.7. Do not confuse this mask with the area's physics collision mask.

API: [AudioStreamPlayer2D](https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer2d.html).
