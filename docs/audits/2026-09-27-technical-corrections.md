# Technical corrections — 2026-09-27

This fork corrects findings against upstream commit
[`3e8d0f005f9604e1dbdad3de693e39555384c5af`](https://github.com/jame581/GodotPrompter/commit/3e8d0f005f9604e1dbdad3de693e39555384c5af)
(v1.14.0). Skill routing, workflow, architecture preferences, and attribution remain
upstream's. This is a focused correction set, not certification of every example.

Validation targets **Godot 4.7.2**, **gdUnit4 6.2.1**, and **Godot.NET.Sdk 4.7.2**
with **.NET SDK 10.0.401**. The resource discovery recipe is explicitly marked
Godot 4.4+; abstract GDScript and deep-duplicate APIs retain their version notes.
The engine-independent validator and hook suites remain required as well.

## Correction and verification matrix

Paths below are relative to `skills/`. “Runtime” means an extracted GDScript
example executed by Godot, not a C# runtime check. C# snippets are separately
compiled where listed in the coverage manifest.

| Finding | Corrected location | Verification |
|---|---|---|
| Abstract-class annotation placement and class requirement | `gdscript-patterns/references/abstract-classes.md` | Parse base and concrete subclasses; inspect abstract flag and shared behavior |
| Nonexistent line-loop mesh constant | `gdscript-advanced/references/tool-script-recipes.md` | Run the actual circle generator with supported line-strip primitive and closing vertex |
| Untyped `Array.map()` result assigned directly to typed array | `gdscript-patterns/SKILL.md` | Execute typed assignment with `assign()` and inspect element type/results |
| Non-Variant drag/drop override | `inventory-system/references/ui-binding.md` | Parse and exercise invalid payload rejection and valid slot transfer; C# compile |
| Spatial RPC example inherits plain Node | `multiplayer-basics/SKILL.md` | Execute the RPC handler on its spatial node; C# compile |
| Damage-number pool reuses freed nodes | `hud-system/references/damage-numbers.md` | Run completion/reuse, replacement tween cancellation, and world-to-HUD conversion; C# compile |
| Parallel tween frees node before fade completes | `tween-animation/SKILL.md` | Check midpoint lifetime and deletion only after the chained fade; C# compile |
| Inactive nested state machines start and receive input | `state-machine/SKILL.md`, `references/node-based-machine.md`, `references/hierarchical-and-parallel.md` | Startup, transition, reentry, explicit activation/deactivation, and input behavior; C# compile |
| Rebinding accepts button releases and key echo | `input-handling/references/action-rebinding.md` | Keyboard, mouse, and joypad release/press cases; C# compile |
| Authority changed only on spawning server | `multiplayer-basics/references/spawning-networked-objects.md`, `references/player-join-flow.md` | Two real loopback peers agree before `_ready()`; C# compile |
| Snapshot signal connected to player instead of synchronizer | `multiplayer-sync/SKILL.md` | Actual child signal feeds display snapshots; C# compile |
| Physics fraction used as network snapshot timing | `multiplayer-sync/references/interpolation.md` | Buffered interpolation follows timestamped snapshots and display delay; C# compile |
| CSV plural/context syntax and automatic substitution claims | `localization/SKILL.md`, `references/csv-plural-context.md` | Import CSV and exercise contextual strings and English/Russian/Czech plural forms; C# compile |
| Short inventory save leaves previous trailing items | `inventory-system/references/serialization.md` | Replacement load, empty save, stable-ID round trip, one change notification |
| Health script attached to incompatible progress-bar type | `hud-system/SKILL.md` | Attach to both ProgressBar and TextureProgressBar and exercise component signals; C# compile |
| Camera2D given nonexistent cull mask | `hud-system/references/minimap.md` | Shared World2D, SubViewport canvas mask, icon visibility layers, and camera follow; C# compile |
| Fixed corner widget omits two offsets | `godot-ui/references/anchors-in-code.md` | Check dimensions and margins before/after parent resize; C# compile |
| Runtime ProjectSettings edits do not update active window scaling | `responsive-ui/SKILL.md` | Execute Window content-scale settings; clarify canvas-items/viewport scaling; C# compile |
| Aim/Copy/FABRIK use nonexistent flat properties | `animation-system/references/bone-constraints.md`, `references/ik-recipes.md` | Indexed bone/axis/chain/target configuration in engine; C# compile |
| LookAt symmetry boolean assigned an angle | `animation-system/references/skeleton-modifiers.md` | Check enabled limits, symmetry flag, and angle values; C# compile |
| GUI and shortcut input order reversed | `input-handling/SKILL.md`, `references/event-propagation.md` | Compare documented order with real GUI consumption |
| Server configuration contradicts promised precedence | `dedicated-server/references/server-config.md` | Defaults → file → environment → CLI, including actual CLI arguments; C# compile |
| Resource cannot read Input / fictitious runtime make_unique | `resource-pattern/SKILL.md`, `references/sharing-vs-unique.md` | API review: distinguish Node callbacks, explicit method calls, Inspector Make Unique, and duplication |
| Zero synchronization intervals described as disabling updates | `multiplayer-sync/SKILL.md`, `references/bandwidth-optimization.md` | Versioned API review; clarify replication modes, spawn flag, filter methods, and explicit payload packing |
| Dedicated server export described as special binary/code stripping | `dedicated-server/SKILL.md`, `references/deployment.md` | Versioned export/source review; use standard headless executable, resource stripping, dedicated_server feature |
| Inventory path-saving advice contradicts stable-ID implementation | `inventory-system/SKILL.md` | Align prose to serializer and runtime ID round-trip check |
| DirAccess extension scan misses exported/remapped resources | `inventory-system/references/serialization.md`, `resource-pattern/references/collections.md` | Load a PCK with hidden payload and `.tres.remap`; require exactly one discovered item; C# compile |
| Ambiguous C# Thread / Dictionary imports | `multithreading/SKILL.md`, `inventory-system/references/serialization.md` | Compile actual snippets with real GodotSharp and framework types |
| Resource deep-copy explanation overstates external-resource copying | `resource-pattern/references/sharing-vs-unique.md`, `references/configuration-pattern.md` | Versioned API review; compile explicit DuplicateDeep All expression |
| MultiMesh rotation/scaling changes previously assigned position | `3d-essentials/references/lod-and-culling.md` | Assert actual transform arguments preserve requested positions; C# compile |
| gdUnit4 paths, flags, separator, and runner identity are wrong | `godot-testing/SKILL.md`, `gdunit4-reference.md`, `references/running-tests.md` | Four documented commands execute a real GDScript test; reports created; failed assertion returns nonzero |

Two nearby UI explanations are also aligned with engine behavior: default-canvas
Controls can be affected by Camera2D, and SubViewportContainer stretching is
distinct from masking a minimap texture. Resource lifetime wording now refers to
reference counts and distinguishes automatic Node callbacks from ordinary methods.

Full repository verification exposed an additional POSIX path-alias defect in
the session hook. Physical directory paths now keep macOS `/var` and
`/private/var`, and symlinked project paths, consistent for instruction discovery
and mentor-state keys. Two new alias regressions complement the existing hook
suite; Windows retains the native-drive `cygpath` convention. The mentor skill's
state-file instructions match that convention.

## Reproducing the checks

See [executable documentation checks](../../tests/godot-examples/README.md) for
commands and [the C# manifest](../../tests/godot-examples/csharp-samples.json)
for the exact compile selections. The CI workflow runs the validator, ordinary
tests, engine examples, gdUnit4 CLI checks, and C# compilation.

The engine suite contains **24 behavioral cases**; the separate gdUnit4 CLI test
executes four passing commands and one intentional failure. C# compilation covers
**41 selections**, including required companion types. Tests consume Markdown
directly; wrappers provide scene setup and assertions rather than replacement
implementations. The new state-machine reference keeps its expanded lifecycle
example below the skill entry-point size budget.

The runtime checks have also been exercised against the original documentation
to distinguish fixes from unchanged passing behavior. Older source can fail
parsing or extraction before a behavioral assertion, so a red result alone is
not treated as proof of the exact original defect.

## Limits

This does not execute C# gameplay or C# gdUnit4 tests, measure real-network jitter,
validate visual output on a GPU, or certify all examples for older Godot releases.
The packaged resource check uses a constructed PCK with export-style remapping,
not a full game export. Statements about export/duplication/replication semantics
are checked against the versioned APIs and source in addition to behavioral tests.

## Primary references

- [Godot 4.7 class reference](https://docs.godotengine.org/en/4.7/classes/index.html)
- [Godot 4.7 CSV translations](https://docs.godotengine.org/en/4.7/tutorials/i18n/localization_using_spreadsheets.html)
- [Godot 4.7 dedicated server export](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_for_dedicated_servers.html)
- [Godot 4.7.2 engine source](https://github.com/godotengine/godot/tree/4.7.2-stable)
- [gdUnit4 6.2.1 CI runner](https://github.com/godot-gdunit-labs/gdUnit4/blob/v6.2.1/addons/gdUnit4/src/core/runners/GdUnitTestCIRunner.gd)
