# Common / 2D / 3D organization — 2026-09-27

PR #2 was merged into the fork's master at `a3b7d0b` before this change. This revision organizes the whole skills collection rather than limiting the work to the files changed by PR #1.

## Result

- 56 stable skill IDs; required `SKILL.md` entry filenames retained, titles identify Common/2D/3D.
- 191 renamed reference paths recorded in [dimension-renames.json](../dimension-renames.json).
- 297 references: 129 common, 76 2D, 92 3D.
- 69 paired topics recorded in [dimension-coverage.json](../dimension-coverage.json), including both newly added counterparts and separated existing implementations.
- Generated [catalog](../dimension-catalog.md), additive dimension fields in `skills/index.json`, and routing from the bootstrap and domain entries.
- Markdown links and root `@` imports updated. Metadata tests reject broken routes, unscoped reference names and missing members of a documented pair.

The [organization guide](../dimensions.md) explains the boundary between common systems and spatial code, including dimension-specific engine/addon features.

## Substantive differences

The 3D implementations account for XYZ versus XZ motion, vertical velocity, world units, camera projection and behind-camera visibility, World3D sharing, quaternion orientation where applicable, and the separate physics/rendering APIs. Common lifecycle, data, Control UI, audio buses and transport remain shared.

Touched recipes also correct real issues found during the split: node-level particle subemitters, spatial stencil syntax and canvas limitations, physics-shape parent rules, 3D steering sign, typed C# numeric results, and editor tool export semantics. Known-type GDScript scene instantiation uses typed assignment; conditional casts are used only where an optional runtime type is part of the contract.

## Validation

- `npm test`: 97 hook/validator/metadata tests.
- Actual Godot 4.7.2 examples: 53 cases (24 preserved regressions and 29 new dimension cases). The new cases cover loopback networking, snapshots/prediction/history, movement/state ownership, coordinate conversions, collision/teleports/torque, procedural placement, projection, minimaps, spatial audio pools, particles, sprites, tweens, saves and typed scene spawning.
- gdUnit4 CLI regression: discovery, report generation, and expected failing-test exit behavior.
- 176 documented C# selections compile against Godot.NET.Sdk 4.7.2 with zero errors and warnings. Independent recipes with repeated names use fixture namespaces; source code is extracted without rewriting class names.
- Phantom Camera v0.11.0.2: 11 documented C# classes also compile against the pinned addon's actual wrapper sources. That separate build reports nullable-field and unused-addon-field warnings, with zero errors.
- Skill validator: zero errors. Remaining warnings are accepted language-specific examples and two pre-existing mobile-plugin C# parity gaps.
- Independent repository routing review resolved 3D networking, 2D masking, common inventory with 3D HUD, and 3D state/navigation to the appropriate files.

Headless tests do not validate GPU appearance or editor interaction. Third-party addon runtime sessions and native extension builds were not exercised. A fresh Claude Code plugin-routing smoke was attempted read-only but stopped at its configured execution cost cap before producing a final result; it is not counted as passed. The full multi-host installation/mentor integration suite was not run.
