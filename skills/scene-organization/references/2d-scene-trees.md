# Scene Trees (2D)

[Back](../SKILL.md). Health, inventory, events and state lifecycle are common. Transform-bearing containers use Node2D; shapes and the navigation agent stay directly under the body that owns them.

```
Enemy (CharacterBody2D)
├── CollisionShape2D
├── Visuals (Node2D)
│   └── Sprite2D
├── AnimationPlayer
├── HealthComponent (Node)
├── Hitbox (Area2D)
│   └── CollisionShape2D
├── NavigationAgent2D
└── StateMachine (Node)

Level (Node2D)
├── TileMapLayer
├── Entities (Node2D)
│   ├── Player (CharacterBody2D)
│   └── Enemy (instance of the scene above)
├── NavigationRegion2D (NavigationPolygon)
├── Camera2D
└── HUD (CanvasLayer)
    └── Control
```

Wire the navigation region to the level's walkable geometry. CanvasLayer/Control remain screen-space UI in either game dimension. Keep root transforms on the body and visual effects on its Visuals child.
