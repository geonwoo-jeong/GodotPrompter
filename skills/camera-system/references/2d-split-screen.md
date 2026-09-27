# Shared-world Split Screen (2D)

> ← Back to [SKILL.md](../SKILL.md)

Follow the [common layout and input setup](common-split-screen.md). Attach this to the level's Node2D root and assign the two viewports. Each viewport contains an enabled/current Camera2D, following one player in the shared world. Configure container sizing in the Inspector as described in the common guide.

```gdscript
extends Node2D

@export var views: Array[SubViewport] = []

func _ready() -> void:
    for index in views.size():
        var view := views[index]
        view.world_2d = get_world_2d()
        view.audio_listener_enable_2d = index == 0
```

```csharp
using Godot;

public partial class SharedViews2D : Node2D
{
    [Export] public Godot.Collections.Array<SubViewport> Views { get; set; } = new();

    public override void _Ready()
    {
        for (int index = 0; index < Views.Count; index++)
        {
            SubViewport view = Views[index];
            view.World2D = GetWorld2D();
            view.AudioListenerEnable2D = index == 0;
        }
    }
}
```
