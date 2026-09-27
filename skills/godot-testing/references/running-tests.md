# Running Tests

Reference for `skills/godot-testing/SKILL.md` — GUT CLI, gdUnit4 CLI, GitHub Actions CI workflow.

> ← Back to [SKILL.md](../SKILL.md)

---
## Running Tests

### GUT CLI

```bash
# Run all tests
godot --headless -s addons/gut/gut_cmdln.gd

# Run a specific directory
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests/unit

# Run a specific file
godot --headless -s addons/gut/gut_cmdln.gd -gtest=res://tests/unit/test_health_component.gd

# Verbose output with log file
godot --headless -s addons/gut/gut_cmdln.gd -gdir=res://tests -glog=3 -goutput_dir=res://test_results
```

### gdUnit4 CLI (6.2.1)

Run from the project root after installing the addon and importing the project with `godot --headless --editor --import --quit`. These commands target gdUnit4 **6.2.1** with Godot **4.7.2**. Pass addon options directly to the script; do not insert `--`, because this runner reads `OS.get_cmdline_args()`.

```bash
# Run all logic tests; headless opt-in is required by gdUnit4.
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd --ignoreHeadlessMode --add res://tests

# Run one directory
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd --ignoreHeadlessMode --add res://tests/unit

# Run a specific suite
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd --ignoreHeadlessMode --add res://tests/unit/test_health_component.gd

# Collect all results and write reports
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd --ignoreHeadlessMode --continue --add res://tests --report-directory res://reports
```

For C# or mixed suites, use the **Godot .NET** executable, install the compatible .NET SDK and gdUnit4 C# packages in the project, and run `dotnet build` before the same runner command. The C# API loader is internal to the addon, not an executable test runner. UI interaction tests need a display (for example, `xvfb-run` on Linux) rather than `--ignoreHeadlessMode`.

Source: [gdUnit4 6.2.1 runner options](https://github.com/godot-gdunit-labs/gdUnit4/blob/v6.2.1/addons/gdUnit4/src/core/runners/GdUnitTestCIRunner.gd).

### GitHub Actions CI

This example assumes the project already contains its test addon(s), tests, and, for C#, the required package references. The SDK must match the project’s target framework.

```yaml
# .github/workflows/tests.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-gut:
    name: GUT Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Install Godot
        uses: chickensoft-games/setup-godot@c233594225991af5aec714e52457cc76d6df8fa2 # v2
        with:
          version: '4.7.2'
          use-dotnet: false

      - name: Import project
        run: godot --headless --editor --import --quit

      - name: Run GUT tests
        run: >
          godot --headless
          -s addons/gut/gut_cmdln.gd
          -gdir=res://tests
          -gexit
          -glog=2

  test-gdunit4:
    name: gdUnit4 Tests (GDScript + C#)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

      - name: Install Godot with .NET
        uses: chickensoft-games/setup-godot@c233594225991af5aec714e52457cc76d6df8fa2 # v2
        with:
          version: '4.7.2'
          use-dotnet: true

      - uses: actions/setup-dotnet@67a3573c9a986a3f9c594539f4ab511d57bb3ce9 # v4
        with:
          dotnet-version: '8.0.x' # adjust to the project target framework

      - name: Build C# project
        run: dotnet build

      - name: Import project
        run: godot --headless --editor --import --quit

      - name: Run gdUnit4 tests
        run: >
          godot --headless
          -s addons/gdUnit4/bin/GdUnitCmdTool.gd
          --ignoreHeadlessMode
          --continue
          --add res://tests
          --report-directory res://reports

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        with:
          name: test-report
          path: reports/
```

---

