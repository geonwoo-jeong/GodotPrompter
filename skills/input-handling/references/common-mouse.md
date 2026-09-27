# Mouse Input (Common)

Reference for `skills/input-handling/SKILL.md` — mouse motion (camera look), mouse modes, button events, custom cursor.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Mouse Input

### World Input

See [2D aiming and movement](2d-world-input.md), [3D pointer rays and ground movement](3d-world-input.md), and [3D mouse look](3d-mouse-look.md). Button events and cursor modes below apply to either world.

### Mouse Modes

| Mode                         | Cursor Visible | Confined | Use For                    |
|------------------------------|----------------|----------|----------------------------|
| `MOUSE_MODE_VISIBLE`         | Yes            | No       | Menus, strategy games      |
| `MOUSE_MODE_HIDDEN`          | No             | No       | Custom cursor via Sprite2D |
| `MOUSE_MODE_CAPTURED`        | No             | Yes      | FPS camera look            |
| `MOUSE_MODE_CONFINED`        | Yes            | Yes      | RTS, keep cursor in window |
| `MOUSE_MODE_CONFINED_HIDDEN` | No             | Yes      | Hidden + confined          |

```gdscript
# Toggle mouse capture (common pattern for FPS games)
func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_cancel"):
        if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
            Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
        else:
            Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
```

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("ui_cancel"))
    {
        Input.MouseMode = Input.MouseMode == Input.MouseModeEnum.Captured
            ? Input.MouseModeEnum.Visible
            : Input.MouseModeEnum.Captured;
    }
}
```

### Mouse Button Events

```gdscript
func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventMouseButton:
        match event.button_index:
            MOUSE_BUTTON_LEFT:
                if event.pressed:
                    _attack()
            MOUSE_BUTTON_RIGHT:
                if event.pressed:
                    _aim_start()
                else:
                    _aim_end()
            MOUSE_BUTTON_WHEEL_UP:
                _next_weapon()
            MOUSE_BUTTON_WHEEL_DOWN:
                _prev_weapon()
```

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event is InputEventMouseButton mouse)
    {
        switch (mouse.ButtonIndex)
        {
            case MouseButton.Left when mouse.Pressed:
                Attack();
                break;
            case MouseButton.Right:
                if (mouse.Pressed) AimStart(); else AimEnd();
                break;
            case MouseButton.WheelUp:
                NextWeapon();
                break;
            case MouseButton.WheelDown:
                PrevWeapon();
                break;
        }
    }
}
```

### Custom Mouse Cursor

```gdscript
# Set in code
func _ready() -> void:
    var cursor := load("res://assets/ui/crosshair.png")
    Input.set_custom_mouse_cursor(cursor, Input.CURSOR_ARROW, Vector2(16, 16))  # hotspot at center

# Or set in Project Settings:
# Display > Mouse Cursor > Custom Image
# Display > Mouse Cursor > Custom Image Hotspot
```

```csharp
public override void _Ready()
{
    var cursor = GD.Load<Resource>("res://assets/ui/crosshair.png");
    Input.SetCustomMouseCursor(cursor, Input.CursorShape.Arrow, new Vector2(16, 16));
}
```

---

