# Scene Trees (3D)

[Back](../SKILL.md). Health, inventory, events and state lifecycle are common. Transform-bearing containers use Node3D; shapes and the navigation agent stay directly under the body that owns them.

```
Enemy (CharacterBody3D)
├── CollisionShape3D
├── Visuals (Node3D)
│   └── MeshInstance3D
├── AnimationPlayer
├── HealthComponent (Node)
├── Hitbox (Area3D)
│   └── CollisionShape3D
├── NavigationAgent3D
└── StateMachine (Node)

Level (Node3D)
├── GridMap
├── Entities (Node3D)
│   ├── Player (CharacterBody3D)
│   └── Enemy (instance of the scene above)
├── NavigationRegion3D (NavigationMesh)
├── Camera3D
└── HUD (CanvasLayer)
    └── Control
```

Wire the navigation region to the level's walkable geometry. CanvasLayer/Control remain screen-space UI in either game dimension. Keep root transforms on the body and visual effects on its Visuals child.
