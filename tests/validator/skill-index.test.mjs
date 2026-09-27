import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('skill index is current', () => {
  const out = execFileSync('node', ['scripts/generate-skill-index.mjs', '--check'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  assert.match(out, /up to date/);
});


test('dimension names classify all shipped references and links resolve', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const { referenceDimension, skillDimension, brokenMarkdownLinks } = await import('../../scripts/lib/dimensions.mjs');
  for (const file of ['AGENTS.md', 'GEMINI.md']) assert.deepEqual(brokenMarkdownLinks(resolve(ROOT, file)), [], file);
  for (const entry of readdirSync(resolve(ROOT, 'skills'), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = resolve(ROOT, 'skills', entry.name);
    const skill = resolve(dir, 'SKILL.md');
    const title = readFileSync(skill, 'utf8').match(/^# (.+)$/m)?.[1];
    skillDimension(title);
    const files = readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.md'));
    for (const file of files) {
      if (file !== 'SKILL.md') referenceDimension(file);
      assert.deepEqual(brokenMarkdownLinks(resolve(dir, file)), [], `${entry.name}/${file} has broken links`);
    }
  }
});

test('dimension classification rejects unscoped filenames and titles', async () => {
  const { referenceDimension, skillDimension } = await import('../../scripts/lib/dimensions.mjs');
  assert.equal(referenceDimension('references/3d-spawning.md'), '3d');
  assert.equal(referenceDimension('references/common-input.md'), 'common');
  assert.throws(() => referenceDimension('references/spawning.md'), /prefix/);
  assert.equal(skillDimension('Physics (Common)'), 'common');
  assert.throws(() => skillDimension('Physics'), /suffix/);
});


test('documented 2D/3D topic pairs keep both counterparts', async () => {
  const { existsSync, readFileSync } = await import('node:fs');
  const { referenceDimension } = await import('../../scripts/lib/dimensions.mjs');
  const coverage = JSON.parse(readFileSync(resolve(ROOT, 'docs/dimension-coverage.json'), 'utf8'));
  assert.ok(coverage.pairedTopics.length > 0);
  for (const topic of coverage.pairedTopics) {
    for (const dimension of ['2d', '3d']) {
      const paths = Array.isArray(topic[dimension]) ? topic[dimension] : [topic[dimension]];
      assert.ok(paths.length, `${topic.topic}: missing ${dimension}`);
      for (const path of paths) {
        assert.equal(referenceDimension(path), dimension, topic.topic);
        assert.ok(existsSync(resolve(ROOT, path)), `${topic.topic}: missing ${path}`);
      }
    }
  }
});
