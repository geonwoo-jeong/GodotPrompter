# Memory and Node Pooling (Common)

> ← Back to [SKILL.md](../SKILL.md)

## Resource Lifetime

Resources are cached by path and shared by default. The cache does not keep an otherwise unreferenced Resource alive: Godot uses reference counting. Duplicate a Resource for mutable per-instance data, and release references when it is no longer needed. GDScript has no tracing garbage collector or `OS.gc()` call. C# wrappers also involve .NET garbage collection, so dropping the last managed variable does not imply immediate reclamation.

Nodes require explicit ownership through the scene tree or manual cleanup. Prefer `queue_free()` during gameplay; `free()` destroys immediately and can invalidate references held by a running callback.

## Measure Memory

```gdscript
func print_memory_stats() -> void:
    print("Static RAM: ", Performance.get_monitor(Performance.MEMORY_STATIC))
    print("Video RAM: ", Performance.get_monitor(Performance.RENDER_VIDEO_MEM_USED))
    print("Nodes: ", Performance.get_monitor(Performance.OBJECT_NODE_COUNT))
```

```csharp
public void PrintMemoryStats()
{
    GD.Print("Static RAM: ", Performance.GetMonitor(Performance.Monitor.MemoryStatic));
    GD.Print("Video RAM: ", Performance.GetMonitor(Performance.Monitor.RenderVideoMemUsed));
    GD.Print("Nodes: ", Performance.GetMonitor(Performance.Monitor.ObjectNodeCount));
}
```

## Detached Node Pool

Pool only when profiling shows repeated instantiation is costly. Idle nodes remain outside the scene tree, so they neither render nor participate in world physics. `acquire()` returns a detached node: reset its position and gameplay state before adding it to an active parent. `release()` removes it from that parent and returns it to the pool. The pool must outlive its active instances. Only release nodes acquired from this pool, and release each at most once.

`_ready()` runs once per node lifetime; use explicit reset methods for each reuse. Signals, velocities, timers, and custom state need a project-specific reset. This example intentionally has a fixed capacity: `null` means the caller chooses to skip the effect or use a different policy.

```gdscript
class_name ReusableNodePool
extends Node

@export var scene: PackedScene
@export_range(1, 1000) var capacity: int = 20
var _available: Array[Node] = []

func _ready() -> void:
    for i in capacity:
        _available.append(scene.instantiate())

func acquire() -> Node:
    if _available.is_empty():
        return null
    return _available.pop_back()

func release(instance: Node) -> void:
    instance.get_parent().remove_child(instance)
    _available.append(instance)

func _exit_tree() -> void:
    for instance in _available:
        instance.free()
    _available.clear()
```

```csharp
public partial class ReusableNodePool : Node
{
    [Export] public PackedScene Scene { get; set; }
    [Export(PropertyHint.Range, "1,1000")] public int Capacity { get; set; } = 20;
    private readonly System.Collections.Generic.Stack<Node> _available = new();
    public override void _Ready()
    {
        for (int i = 0; i < Capacity; i++) _available.Push(Scene.Instantiate());
    }
    public Node Acquire() => _available.Count == 0 ? null : _available.Pop();
    public void Release(Node instance)
    {
        instance.GetParent().RemoveChild(instance);
        _available.Push(instance);
    }
    public override void _ExitTree()
    {
        foreach (Node instance in _available) instance.Free();
        _available.Clear();
    }
}
```

See the [2D pool placement](2d-pool-placement.md) and [3D pool placement](3d-pool-placement.md) callers. Physics bodies also need velocity/state reset before insertion; moving a hidden collider far away is not deactivation.
