# Shared-world Split Screen (3D)

> ← Back to [SKILL.md](../SKILL.md)

Follow the [common layout and input setup](common-split-screen.md). Attach this to the level's Node3D root and assign the two viewports. Each viewport contains an enabled/current Camera3D, following one player in the shared world. Configure container sizing in the Inspector as described in the common guide.

```gdscript
extends Node3D

@export var views: Array[SubViewport] = []

func _ready() -> void:
    for index in views.size():
        var view := views[index]
        view.own_world_3d = false
        view.world_3d = get_world_3d()
        view.audio_listener_enable_3d = index == 0
```

```csharp
using Godot;

public partial class SharedViews3D : Node3D
{
    [Export] public Godot.Collections.Array<SubViewport> Views { get; set; } = new();

    public override void _Ready()
    {
        for (int index = 0; index < Views.Count; index++)
        {
            SubViewport view = Views[index];
            view.OwnWorld3D = false;
            view.World3D = GetWorld3D();
            view.AudioListenerEnable3D = index == 0;
        }
    }
}
```
