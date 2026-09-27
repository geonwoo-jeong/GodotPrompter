# Behavior Trees (Common)

Reference for `skills/ai-navigation/SKILL.md` — lightweight custom behavior tree implementation (Sequence, Selector, Action) and wiring an enemy with a chase-or-patrol BT.

> ← Back to [SKILL.md](../SKILL.md)

---

A behavior tree (BT) is a tree of nodes evaluated every tick. Three core node types:

| Type | Succeeds when | Fails when |
|---|---|---|
| **Sequence** | all children succeed (AND) | any child fails |
| **Selector** | any child succeeds (OR) | all children fail |
| **Action** | the leaf action completes | the leaf reports failure |

Sequences model "do A then B then C". Selectors model "try A, else try B, else try C".

### Base node

```gdscript
# bt_node.gd — base class
class_name BTNode
extends RefCounted

enum Status { SUCCESS, FAILURE, RUNNING }

func tick(actor: Node, _delta: float) -> Status:
	return Status.FAILURE
```

```csharp
// BTNode.cs — base class
public abstract class BTNode
{
    public enum Status { Success, Failure, Running }

    public virtual Status Tick(Node actor, float delta) => Status.Failure;
}
```

### Sequence

```gdscript
# bt_sequence.gd — run children in order; fail fast
class_name BTSequence
extends BTNode

var children: Array[BTNode] = []


func tick(actor: Node, delta: float) -> Status:
	for child in children:
		var result: BTNode.Status = child.tick(actor, delta)
		if result != Status.SUCCESS:
			return result  # FAILURE or RUNNING stops the sequence
	return Status.SUCCESS
```

```csharp
// BTSequence.cs — run children in order; fail fast
using Godot;
using System.Collections.Generic;

public class BTSequence : BTNode
{
    public List<BTNode> Children { get; set; } = new();

    public override Status Tick(Node actor, float delta)
    {
        foreach (var child in Children)
        {
            var result = child.Tick(actor, delta);
            if (result != Status.Success)
                return result; // Failure or Running stops the sequence
        }
        return Status.Success;
    }
}
```

### Selector

```gdscript
# bt_selector.gd — try children in order; succeed on first success
class_name BTSelector
extends BTNode

var children: Array[BTNode] = []


func tick(actor: Node, delta: float) -> Status:
	for child in children:
		var result: BTNode.Status = child.tick(actor, delta)
		if result != Status.FAILURE:
			return result  # SUCCESS or RUNNING stops the selector
	return Status.FAILURE
```

```csharp
// BTSelector.cs — try children in order; succeed on first success
using Godot;
using System.Collections.Generic;

public class BTSelector : BTNode
{
    public List<BTNode> Children { get; set; } = new();

    public override Status Tick(Node actor, float delta)
    {
        foreach (var child in Children)
        {
            var result = child.Tick(actor, delta);
            if (result != Status.Failure)
                return result; // Success or Running stops the selector
        }
        return Status.Failure;
    }
}
```

### Action leaf

```gdscript
# bt_action.gd — leaf node backed by a callable
class_name BTAction
extends BTNode

var _action: Callable


func _init(action: Callable) -> void:
	_action = action


func tick(actor: Node, delta: float) -> Status:
	return _action.call(actor, delta) as Status
```

```csharp
// BTAction.cs — leaf node backed by a delegate
using Godot;
using System;

public class BTAction : BTNode
{
    private readonly Func<Node, float, Status> _action;

    public BTAction(Func<Node, float, Status> action) => _action = action;

    public override Status Tick(Node actor, float delta) => _action(actor, delta);
}
```



### Wiring a Spatial Actor

Use the [2D actor](2d-behavior-tree-actor.md) or [3D actor](3d-behavior-tree-actor.md). The Sequence/Selector/Action implementation is shared.
