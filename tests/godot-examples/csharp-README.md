# C# example compilation

This opt-in check compiles selected Markdown examples with **Godot.NET.Sdk 4.7.2**,
including the real GodotSharp assembly and Godot source generators from NuGet.org.
It needs .NET SDK 10 and Node.js; a Godot .NET editor is not needed for compilation.

```sh
node tests/godot-examples/csharp-compile.mjs --work-dir /absolute/scratch/path
```

Set `DOTNET=/absolute/path/to/dotnet` for a portable SDK. The generated project,
NuGet caches, CLI state, logs, and temporary files stay under `--work-dir`. The
script does not install an SDK or change system configuration. Initial restoration
requires access to NuGet.org. The Godot package version is pinned to 4.7.2; the
project targets `net10.0` while GodotSharp's compatible assembly targets `net8.0`.

`csharp-samples.json` is the explicit coverage manifest. It currently selects 40
fenced C# blocks and the documented `DuplicateDeep(Resource.DeepDuplicateMode.All)`
inline expression. Each run reads the current Markdown, so it checks documentation
changes rather than copies kept in test fixtures. Most selections are whole
classes. Short examples receive a `partial Node`/`Node2D` class or method wrapper;
the LookAt snippet also receives its declared `LookAtModifier3D` field. No engine
API is mocked. `#line` maps compiler errors to the source Markdown. Class names and
key expressions guard against accidentally selecting a different block after edits.

Coverage includes the indexed skeleton/IK APIs, LookAt properties, thread alias,
state machine lifecycle classes, input rebinding/persistence, pooled damage numbers,
health bar, minimap/canvas APIs, offsets/window scaling, Tween chain, multiplayer
spawning/interpolation, server configuration, inventory registry/UI, and resource
configuration/duplication, exported resource discovery, localization, and MultiMesh
placement. Complete companion snippets supply game-specific types
such as State, InventorySlot, SyncedPlayer, and HealthComponent.

This is **compile validation**, not a C# runtime test, a rendered-game test, or an
exhaustive review of every C# example. In particular, matching signal argument types
does not establish their meaning, and dynamic `Connect`/property-path strings still
need engine runtime checks. Nullable analysis is disabled to match concise examples
whose exported node references are assigned in Godot scenes. No warnings are hidden.
