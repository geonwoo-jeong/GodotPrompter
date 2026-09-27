> ← Back to [SKILL.md](../SKILL.md)

# Runtime Resource Loading (Common)

Use [2D scene roots](2d-runtime-scene-loading.md) or [3D scene roots](3d-runtime-scene-loading.md). Threaded ResourceLoader management below is shared.

## Threaded Resource Loading

Load large resources without freezing the game:

```gdscript
func load_level_async(path: String) -> void:
    ResourceLoader.load_threaded_request(path)

func _process(delta: float) -> void:
    var status := ResourceLoader.load_threaded_get_status(_loading_path)
    match status:
        ResourceLoader.THREAD_LOAD_IN_PROGRESS:
            var progress: Array = []
            ResourceLoader.load_threaded_get_status(_loading_path, progress)
            loading_bar.value = progress[0] * 100.0
        ResourceLoader.THREAD_LOAD_LOADED:
            var scene: PackedScene = ResourceLoader.load_threaded_get(_loading_path)
            get_tree().change_scene_to_packed(scene)
        ResourceLoader.THREAD_LOAD_FAILED:
            push_error("Failed to load: %s" % _loading_path)
```

```csharp
public void LoadLevelAsync(string path)
{
    ResourceLoader.LoadThreadedRequest(path);
}

public override void _Process(double delta)
{
    var progress = new Godot.Collections.Array();
    var status = ResourceLoader.LoadThreadedGetStatus(_loadingPath, progress);
    switch (status)
    {
        case ResourceLoader.ThreadLoadStatus.InProgress:
            loadingBar.Value = (float)progress[0] * 100.0f;
            break;
        case ResourceLoader.ThreadLoadStatus.Loaded:
            var scene = ResourceLoader.LoadThreadedGet(_loadingPath) as PackedScene;
            GetTree().ChangeSceneToPacked(scene);
            break;
        case ResourceLoader.ThreadLoadStatus.Failed:
            GD.PushError($"Failed to load: {_loadingPath}");
            break;
    }
}
```
