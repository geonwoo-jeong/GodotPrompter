# Camera Shake (3D)

> ← Back to [SKILL.md](../SKILL.md)

Attach this to a Camera3D under a dedicated follow/look rig. The rig owns movement; this camera owns only its local shake transform. Offsets are world units along the camera's saved local axes, and roll is radians. Store the rest transform so the camera returns to its configured pose. For a first-person camera, keep offsets small enough to avoid clipping into geometry; a spring arm cannot correct a separate large camera-local offset.

```gdscript
extends Camera3D

@export var max_offset: Vector2 = Vector2(0.08, 0.06)
@export var max_roll_degrees: float = 1.5
@export var decay: float = 1.5
@export var noise_speed: float = 30.0
var _trauma: float = 0.0
var _time: float = 0.0
var _rest: Transform3D
var _noise := FastNoiseLite.new()

func _ready() -> void:
    _rest = transform
    _noise.seed = randi()

func add_trauma(amount: float) -> void:
    _trauma = clampf(_trauma + amount, 0.0, 1.0)

func _process(delta: float) -> void:
    _trauma = maxf(0.0, _trauma - decay * delta)
    _time += delta * noise_speed
    var strength := _trauma * _trauma
    var offset := Vector3(_noise.get_noise_2d(_time, 0.0) * max_offset.x,
        _noise.get_noise_2d(0.0, _time) * max_offset.y, 0.0) * strength
    var roll := deg_to_rad(max_roll_degrees) * _noise.get_noise_2d(_time, _time) * strength
    transform = _rest * Transform3D(Basis(Vector3.BACK, roll), offset)
```

```csharp
using Godot;

public partial class ShakeCamera3D : Camera3D
{
    [Export] public Vector2 MaxOffset { get; set; } = new(0.08f, 0.06f);
    [Export] public float MaxRollDegrees { get; set; } = 1.5f;
    [Export] public float Decay { get; set; } = 1.5f;
    [Export] public float NoiseSpeed { get; set; } = 30f;
    private float _trauma;
    private float _time;
    private Transform3D _rest;
    private FastNoiseLite _noise = new();

    public override void _Ready()
    {
        _rest = Transform;
        _noise.Seed = (int)GD.Randi();
    }

    public void AddTrauma(float amount) => _trauma = Mathf.Clamp(_trauma + amount, 0f, 1f);

    public override void _Process(double delta)
    {
        _trauma = Mathf.Max(0f, _trauma - Decay * (float)delta);
        _time += (float)delta * NoiseSpeed;
        float strength = _trauma * _trauma;
        Vector3 offset = new Vector3(_noise.GetNoise2D(_time, 0f) * MaxOffset.X,
            _noise.GetNoise2D(0f, _time) * MaxOffset.Y, 0f) * strength;
        float roll = Mathf.DegToRad(MaxRollDegrees) * _noise.GetNoise2D(_time, _time) * strength;
        Transform = _rest * new Transform3D(new Basis(Vector3.Back, roll), offset);
    }
}
```
