# Spatial Audio (3D)

> ← Back to [SKILL.md](../SKILL.md) · [2D counterpart](2d-spatial-audio.md) · [3D one-shot pool](3d-sfx-pooling.md)

An `AudioStreamPlayer3D` follows its parent `Node3D` and spatializes in world units, conventionally meters. Configure an `SFX` bus and assign the imported `AudioStream` in the Inspector. Use a mono source for a point emitter. The same stream/bus controls as the [common audio system](../SKILL.md) apply.

## Actor-owned player

```gdscript
## footsteps_3d.gd
extends AudioStreamPlayer3D

func _ready() -> void:
    bus = &"SFX"
    unit_size = 4.0
    max_distance = 50.0
    attenuation_model = ATTENUATION_INVERSE_DISTANCE
    max_polyphony = 4

func play_step() -> void:
    play()
```

```csharp
using Godot;

public partial class Footsteps3D : AudioStreamPlayer3D
{
    public override void _Ready()
    {
        Bus = "SFX";
        UnitSize = 4.0f;
        MaxDistance = 50.0f;
        AttenuationModel = AttenuationModelEnum.InverseDistance;
        MaxPolyphony = 4;
    }

    public void PlayStep() => Play();
}
```

`unit_size` controls distance scaling for the chosen attenuation model. A positive `max_distance` additionally fades the source to silence at that distance. Tune both for the scene scale instead of copying 2D pixel distances. Cone emission and Doppler tracking are 3D-specific options; enable Doppler on both the source and camera when using it.

## Listener

By default the current `Camera3D` supplies the listener transform. To listen from another position, add an `AudioListener3D` beneath the desired `Node3D`, such as the player. A minimap viewport should not enable an additional 3D audio listener.

```gdscript
extends AudioListener3D

func _ready() -> void:
    make_current()
```

```csharp
using Godot;

public partial class PlayerAudioListener3D : AudioListener3D
{
    public override void _Ready() => MakeCurrent();
}
```

For an `Area3D` audio bus override, configure `audio_bus_override` / `audio_bus_name` and set the player's `area_mask` to include the area layer. Set the mask explicitly when using this feature: its default changes in Godot 4.7. Use the [3D pool](3d-sfx-pooling.md) for detached one-shot effects; parent a player to the actor for a moving loop.

API: [AudioStreamPlayer3D](https://docs.godotengine.org/en/stable/classes/class_audiostreamplayer3d.html).
