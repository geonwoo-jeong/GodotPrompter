import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/** Read examples from the shipped Markdown so tests cannot silently drift from it. */
export async function codeBlocks(repoRoot, relativePath, language = 'gdscript') {
  const source = await readFile(path.join(repoRoot, relativePath), 'utf8');
  const blocks = [...source.matchAll(new RegExp('```' + language + '\\r?\\n([\\s\\S]*?)```', 'g'))].map(match => match[1]);
  if (!blocks.length) throw new Error(`No ${language} blocks in ${relativePath}`);
  return blocks;
}

export async function gdscriptBlock(repoRoot, relativePath, marker) {
  const blocks = await codeBlocks(repoRoot, relativePath);
  if (Number.isInteger(marker)) {
    if (!blocks[marker]) throw new Error(`Missing block ${marker} in ${relativePath}`);
    return blocks[marker];
  }
  const matches = blocks.filter(block => block.includes(marker));
  if (matches.length !== 1) throw new Error(`Expected one block containing ${JSON.stringify(marker)} in ${relativePath}, found ${matches.length}`);
  return matches[0];
}

export async function writeProject(projectDir, files) {
  const project = 'config_version=5\n[application]\nconfig/name="GodotPrompter example regressions"\n[rendering]\nrenderer/rendering_method="gl_compatibility"\n';
  const all = { 'project.godot': project, ...files };
  for (const [relative, contents] of Object.entries(all)) {
    const target = path.join(projectDir, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
}
