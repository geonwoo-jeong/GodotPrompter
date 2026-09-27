# Executable documentation checks

These checks read the shipped Markdown code blocks and place them in temporary
Godot projects. They cover the technical corrections listed in
[the audit matrix](../../docs/audits/2026-09-27-technical-corrections.md).
The normal `npm test` command remains the fast, engine-independent suite.

## GDScript and engine behavior

Install Godot 4.7.2 and Node.js, then run:

```sh
npm run test:examples
```

Set `GODOT_BIN` to an absolute executable path if `godot` is not on PATH. The suite
includes 24 cases covering actual parsing, input dispatch, object lifecycle,
two loopback multiplayer peers, CSV import, and remapped resources in a PCK.
Projects are removed after each test; `GODOT_TEST_KEEP=1` retains them for debugging.
`GODOT_EXAMPLES_ROOT=/absolute/path/to/another/checkout` can exercise older
documentation with the same behavioral checks. A moved or missing snippet can
also fail extraction, so inspect the failure before calling it a reproduced bug.

The engine runs headlessly. UI checks assert geometry, visibility, and signal
behavior, not rendered pixels. MultiMesh checks record the transforms passed by
the example to the engine because the headless dummy renderer does not retain
instance transforms. IK checks exercise configuration and target resolution;
they do not evaluate final rendered poses or animation quality.

## gdUnit4 commands

Use a checkout of gdUnit4 6.2.1, then point at its addon directory:

```sh
GDUNIT4_PATH=/absolute/path/to/gdUnit4/addons/gdUnit4 npm run test:gdunit-cli
```

The addon is copied into a temporary project. All four commands in the running
tests reference must discover and execute a passing GDScript test. The report
command must create reports and return nonzero for an intentionally failing test.
The existing project or addon is not modified. This does not execute C# gdUnit4
suites; those additionally require the Godot .NET editor and matching packages.

## C# compilation

With .NET SDK 10 available:

```sh
npm run test:csharp -- --work-dir /absolute/scratch/path
```

This compiles 41 selections against the official Godot.NET.Sdk 4.7.2. See
[C# compilation details](csharp-README.md) for the manifest, prerequisites, and
limits. It checks real engine types and source generators, not C# gameplay behavior.

The `Validate` workflow runs all three checks with pinned Godot and gdUnit4
versions. No game addon or engine binary is vendored in this repository.
