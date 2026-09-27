import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function referenceDimension(path) {
  const scope = path.split('/').at(-1).match(/^(common|2d|3d)-/)?.[1];
  if (!scope) throw new Error(`Reference needs common-, 2d-, or 3d- prefix: ${path}`);
  return scope;
}

export function skillDimension(title) {
  const scope = title?.match(/\((Common|2D|3D)\)$/)?.[1].toLowerCase();
  if (!scope) throw new Error(`Skill title needs a dimension suffix: ${title}`);
  return scope;
}

// Only repository documentation links, outside code fences. External URLs and
// anchor-only links do not name a local file. Fragment headings are not checked.
export function brokenMarkdownLinks(file) {
  const markdown = readFileSync(file, 'utf8').replace(/^(`{3,}|~{3,}).*\n[\s\S]*?^\1\s*$/gm, '');
  const broken = [];
  for (const match of markdown.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
    const target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || !target.endsWith('.md')) continue;
    if (!existsSync(resolve(dirname(file), decodeURIComponent(target)))) broken.push(target);
  }
  for (const match of markdown.matchAll(/^@([^\n]+\.md)\s*$/gm)) {
    if (!existsSync(resolve(dirname(file), match[1]))) broken.push(match[1]);
  }
  return broken;
}
