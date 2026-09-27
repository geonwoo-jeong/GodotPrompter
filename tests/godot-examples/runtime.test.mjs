import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.env.GODOT_EXAMPLES_ROOT || fileURLToPath(new URL('../..', import.meta.url));
const godot = process.env.GODOT_BIN || 'godot';
const caseDir = fileURLToPath(new URL('./cases/', import.meta.url));

function run(args, projectDir) {
  const result = spawnSync(godot, args, {
    cwd: projectDir,
    encoding: 'utf8',
    timeout: 60_000,
    maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GODOT_SILENCE_ROOT_WARNING: '1' },
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  if (result.error) assert.fail(`${godot} ${args.join(' ')}\n${result.error.message}\n${output}`);
  assert.equal(result.status, 0, `${godot} ${args.join(' ')}\n${output}`);
  // Godot can report script errors yet exit with code 0. Never accept that as a pass.
  assert.doesNotMatch(output, /(?:SCRIPT ERROR|ERROR):/, output);
  return output;
}

const version = run(['--version'], repoRoot).trim();
assert.match(version, /^4\.(?:[7-9]|[1-9]\d)\./, `Examples require Godot 4.7+; got ${version}`);

for (const file of (await readdir(caseDir)).filter(name => name.endsWith('.mjs')).sort()) {
  const { default: cases } = await import(new URL(`./cases/${file}`, import.meta.url));
  for (const example of cases) {
    test(example.name, { timeout: 180_000 }, async () => {
      const projectDir = await mkdtemp(path.join(tmpdir(), 'godot-prompter-'));
      try {
        const scripts = await example.setup({ repoRoot, projectDir });
        run(['--headless', '--path', projectDir, '--editor', '--import', '--quit'], projectDir);
        for (const entry of scripts) {
          const { script, args = [] } = typeof entry === 'string' ? { script: entry } : entry;
          const output = run(['--headless', '--path', projectDir, '--script', script, ...args], projectDir);
          assert.match(output, /GODOT_EXAMPLES_OK/, `Test did not reach its success marker:\n${output}`);
        }
      } finally {
        if (process.env.GODOT_TEST_KEEP === '1') {
          process.stderr.write(`Kept example project: ${projectDir}\n`);
        } else {
          await rm(projectDir, { recursive: true, force: true });
        }
      }
    });
  }
}
