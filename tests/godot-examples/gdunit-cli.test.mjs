import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { writeProject } from './helpers.mjs';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
const godot = process.env.GODOT_BIN || 'godot';
const addon = process.env.GDUNIT4_PATH;
assert.ok(addon, 'Set GDUNIT4_PATH to the gdUnit4 6.2.1 addon directory');
assert.match(await readFile(path.join(addon, 'plugin.cfg'), 'utf8'), /version="6\.2\.1"/);

test('gdUnit4: documented command discovers tests, writes reports and returns failures', { timeout: 180_000 }, async () => {
  const projectDir = await mkdtemp(path.join(tmpdir(), 'godot-prompter-gdunit-'));
  const run = (args) => {
    const result = spawnSync(godot, args, { cwd: projectDir, encoding: 'utf8', timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    if (result.error) assert.fail(`${result.error.message}\n${output}`);
    assert.doesNotMatch(output, /SCRIPT ERROR:|Parse Error:/, output);
    return { ...result, output };
  };
  try {
    await writeProject(projectDir, {
      'tests/unit/test_health_component.gd': 'extends GdUnitTestSuite\n\nfunc test_marker() -> void:\n    print("GDUNIT_MARKER_EXECUTED")\n    assert_int(2 + 2).is_equal(4)\n',
    });
    await cp(addon, path.join(projectDir, 'addons/gdUnit4'), { recursive: true });
    const imported = run(['--headless', '--editor', '--import', '--quit']);
    assert.equal(imported.status, 0, imported.output);
    const markdown = await readFile(path.join(repoRoot, 'skills/godot-testing/references/running-tests.md'), 'utf8');
    const commands = markdown.split('\n').filter(line => line.startsWith('godot ') && line.includes('GdUnitCmdTool.gd'));
    assert.equal(commands.length, 4, 'Keep all four documented CLI variants covered');
    for (const command of commands) {
      if (command.includes('--report-directory')) {
        await rm(path.join(projectDir, 'reports'), { recursive: true, force: true });
      }
      const result = run(command.split(/\s+/).slice(1));
      assert.equal(result.status, 0, result.output);
      assert.match(result.output, /GDUNIT_MARKER_EXECUTED/, result.output);
    }
    assert.ok((await readdir(path.join(projectDir, 'reports'))).length, 'Reports must be written');
    await writeFile(path.join(projectDir, 'tests/unit/test_health_component.gd'), 'extends GdUnitTestSuite\n\nfunc test_marker() -> void:\n    assert_int(2 + 2).is_equal(5)\n');
    const failed = run(commands[3].split(/\s+/).slice(1));
    assert.notEqual(failed.status, 0, `Runner must fail CI when a test fails:\n${failed.output}`);
  } finally {
    await rm(projectDir, { recursive: true, force: true });
  }
});
