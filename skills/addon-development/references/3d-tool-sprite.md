# Tool Sprite (3D)

[Back](../SKILL.md). Use the matching sprite node as the scene root. Texture2D is the image resource in either dimension.

### GDScript

```gdscript
@tool
extends Sprite3D

# Engine.is_editor_hint() is true when running inside the editor,
# false during a running game. Use it to guard editor-only logic.
func _process(delta: float) -> void:
    if Engine.is_editor_hint():
        # This block runs in the editor viewport — safe to call editor APIs.
        update_configuration_warnings()
    else:
        # Normal game logic here.
        pass


# _get_configuration_warnings() returns an array of strings shown as
# yellow warning icons on the node in the Scene panel.
func _get_configuration_warnings() -> PackedStringArray:
    var warnings := PackedStringArray()
    if texture == null:
        warnings.append("Texture is not set. Assign a Texture2D in the Inspector.")
    return warnings
```

### C#

```csharp
using Godot;

[Tool]
public partial class MyToolSprite3D : Sprite3D
{
    public override void _Process(double delta)
    {
        if (Engine.IsEditorHint())
        {
            // Editor-only logic — safe to call editor APIs here.
            UpdateConfigurationWarnings();
        }
        else
        {
            // Normal game logic.
        }
    }

    public override string[] _GetConfigurationWarnings()
    {
        if (Texture == null)
            return new[] { "Texture is not set. Assign a Texture2D in the Inspector." };
        return System.Array.Empty<string>();
    }
}
```

`@tool` scripts also run in the game and are included in exports. Guard editor-only calls with Engine.is_editor_hint() / Engine.IsEditorHint(); editor plugins use their own editor-only compilation guards.

**Key rules:**
- Add `@tool` / `[Tool]` at the top of every script that needs editor access.
- Always guard runtime-only code with `Engine.is_editor_hint()` to avoid crashing the editor when processing begins before the scene is fully loaded.
- Call `update_configuration_warnings()` whenever a property changes that might affect the warning state.

