#!/usr/bin/env node
// Compile selected real Markdown examples against the official Godot C# SDK.
// No Godot API stubs. This is a compile check, not an engine/runtime test.
import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const workArg = args.indexOf('--work-dir');
if (workArg < 0 || !args[workArg + 1]) {
  console.error('Usage: DOTNET=/path/to/dotnet node tests/godot-examples/csharp-compile.mjs --work-dir /absolute/scratch/path');
  process.exit(2);
}
const scratch = resolve(args[workArg + 1]);
await mkdir(scratch, { recursive: true });
const project = await mkdtemp(join(scratch, 'csharp-examples-'));
const samples = JSON.parse(await readFile(join(repo, 'tests/godot-examples/csharp-samples.json'), 'utf8'));
for (const sample of samples) {
  const markdown = await readFile(join(repo, sample.source), 'utf8');
  const blocks = [...markdown.matchAll(/^```csharp\r?\n([\s\S]*?)^```/gm)];
  const block = blocks[sample.block];
  const inlineIndex = sample.inline ? markdown.indexOf('`' + sample.inline + '`') : -1;
  if (sample.inline ? inlineIndex < 0 : !block) throw new Error(`Missing C# selection: ${sample.source}`);
  const code = sample.inline ? `${sample.prefix ?? ''}${sample.inline}${sample.suffix ?? ''}` : block[1];
  const expected = sample.contains ?? (sample.wrap ? sample.inline : `class ${sample.className} `);
  if (expected && !code.includes(expected)) throw new Error(`C# selection shifted: ${sample.source} (${sample.className})`);
  const sourceLine = markdown.slice(0, sample.inline ? inlineIndex : block.index).split('\n').length + (sample.inline ? 0 : 1);
  const mapped = `#line ${sourceLine} ${JSON.stringify(join(repo, sample.source))}\n${code}\n#line default\n`;
  let output = /^using Godot;$/m.test(code) ? '' : 'using Godot;\n';
  if (sample.wrap) {
    output += `public partial class ${sample.className} : ${sample.baseType ?? 'Node'}\n{\n${sample.members ?? ''}\n`;
    if (sample.wrap === 'body') output += 'public void CompileExample()\n{\n';
    output += mapped;
    if (sample.wrap === 'body') output += '}\n';
    output += '}\n';
  } else {
    // Complete source examples retain their exact text (including their own imports).
    output += mapped;
  }
  await writeFile(join(project, `${sample.className}.cs`), output);
}
await writeFile(join(project, 'Examples.csproj'), `<Project Sdk="Godot.NET.Sdk/4.7.2">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <EnableDynamicLoading>true</EnableDynamicLoading>
    <Nullable>disable</Nullable>
    <ImplicitUsings>disable</ImplicitUsings>
  </PropertyGroup>
</Project>\n`);
await writeFile(join(project, 'project.godot'), 'config_version=5\n[application]\nconfig/name="Markdown CSharp Compile Checks"\n[dotnet]\nproject/assembly_name="Examples"\n');
await writeFile(join(project, 'NuGet.Config'), '<?xml version="1.0" encoding="utf-8"?><configuration><packageSources><clear/><add key="nuget.org" value="https://api.nuget.org/v3/index.json"/></packageSources></configuration>\n');
const dotnet = process.env.DOTNET || 'dotnet';
await mkdir(join(scratch, 'tmp'), { recursive: true });
const env = {
  ...process.env,
  DOTNET_CLI_HOME: join(scratch, 'cli-home'),
  NUGET_PACKAGES: join(scratch, 'nuget-packages'),
  NUGET_HTTP_CACHE_PATH: join(scratch, 'nuget-http-cache'),
  NUGET_SCRATCH: join(scratch, 'nuget-scratch'),
  TMPDIR: join(scratch, 'tmp'),
  TMP: join(scratch, 'tmp'),
  TEMP: join(scratch, 'tmp'),
  DOTNET_CLI_TELEMETRY_OPTOUT: '1',
  DOTNET_NOLOGO: '1',
  DOTNET_SKIP_FIRST_TIME_EXPERIENCE: '1',
  DOTNET_GENERATE_ASPNET_CERTIFICATE: 'false',
  DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE: 'true',
};
console.log(`Compiling ${samples.length} Markdown C# selections with Godot.NET.Sdk 4.7.2`);
console.log(`Generated project: ${project}`);
const result = spawnSync(dotnet, ['build', join(project, 'Examples.csproj'), '--nologo', '--verbosity', 'minimal'], {
  cwd: project, env, encoding: 'utf8', timeout: 300_000, maxBuffer: 8 * 1024 * 1024,
});
process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');
if (result.error) console.error(result.error.message);
const summary = { sdk: 'Godot.NET.Sdk/4.7.2', targetFramework: 'net10.0', project, sampleCount: samples.length, samples, exitCode: result.status, error: result.error?.message };
await writeFile(join(scratch, 'csharp-latest-result.json'), JSON.stringify(summary, null, 2) + '\n');
await writeFile(join(scratch, 'csharp-latest-build.log'), (result.stdout ?? '') + (result.stderr ?? ''));
process.exit(result.status ?? 1);
