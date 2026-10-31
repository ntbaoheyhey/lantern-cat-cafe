#!/usr/bin/env node
// Usage: node reports/redesign/compare.mjs <before-dir> <after-dir> [output.html]
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const extensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);
async function screenshots(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const name = join(prefix, entry.name);
    // Ignore symlinks to keep traversal within the selected folder.
    if (entry.isDirectory()) result.push(...await screenshots(directory, name));
    else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) result.push(name);
  }
  return result;
}
function imageURL(output, directory, name) {
  return relative(dirname(output), join(directory, name)).split(sep).map(encodeURIComponent).join('/');
}
export async function compare(beforeDir, afterDir, outputFile = 'reports/redesign/comparison.html') {
  const before = resolve(beforeDir), after = resolve(afterDir), output = resolve(outputFile);
  for (const directory of [before, after]) if (!(await stat(directory)).isDirectory()) throw new Error(`Not a screenshot directory: ${directory}`);
  const [beforeFiles, afterFiles] = await Promise.all([screenshots(before), screenshots(after)]);
  const left = new Set(beforeFiles), right = new Set(afterFiles);
  const names = [...new Set([...left, ...right])].sort();
  if (!names.length) throw new Error('No screenshots found in either directory');
  const figure = (directory, name, present, label) => present
    ? `<figure><figcaption>${label}</figcaption><a href="${escape(imageURL(output, directory, name))}"><img loading="lazy" src="${escape(imageURL(output, directory, name))}" alt="${escape(`${label}: ${name}`)}"></a></figure>`
    : `<figure class="missing"><figcaption>${label}</figcaption><p>Missing screenshot</p></figure>`;
  const matched = names.filter(name => left.has(name) && right.has(name)).length;
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Screenshot comparison — living draft</title>
<style>
  * { box-sizing: border-box; } body { margin: 0; padding: 24px; font: 16px system-ui; color: #f1e7da; background: #211927; }
  h1 { font-size: 24px; } header p { overflow-wrap: anywhere; } section { margin: 32px 0; } h2 { font-size: 18px; overflow-wrap: anywhere; }
  .pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; }
  figure { margin: 0; padding: 12px; border: 1px solid #826187; background: #302239; min-width: 0; }
  figcaption { margin-bottom: 12px; } img { display: block; width: 100%; height: auto; }
  .missing { border-style: dashed; } a { color: inherit; } .badge { color: #ffc887; }
</style>
<header><h1>Screenshot comparison</h1><p>Living draft. Matched by relative filename; missing files remain visible. Open an image to inspect its original size.</p>
<p>Before: ${escape(before)}<br>After: ${escape(after)}</p><p>${names.length} screenshot names; ${matched} matched pairs.</p></header>
${names.map(name => `<section><h2>${escape(name)}${left.has(name) && right.has(name) ? '' : ' <span class="badge">— unmatched</span>'}</h2><div class="pair">${figure(before, name, left.has(name), 'Before')}${figure(after, name, right.has(name), 'After')}</div></section>`).join('\n')}
</html>\n`;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
  return { output, names: names.length, matched };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [before, after, output] = process.argv.slice(2);
  if (!before || !after) { console.error('Usage: node reports/redesign/compare.mjs <before-dir> <after-dir> [output.html]'); process.exitCode = 1; }
  else { try { console.log(JSON.stringify(await compare(before, after, output))); } catch (error) { console.error(error.message); process.exitCode = 1; } }
}
