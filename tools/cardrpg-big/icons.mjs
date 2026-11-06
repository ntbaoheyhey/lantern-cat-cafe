import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const directory = 'assets/cardrpg3/icons';
await mkdir(directory, { recursive: true });
const records = [];
for (const name of (await readdir('assets/cardrpg2/icons')).filter(name => name.endsWith('.svg')).sort()) {
  const source = `assets/cardrpg2/icons/${name}`;
  const original = await readFile(source, 'utf8');
  const svg = original.replace('viewBox=', 'width="64" height="60" shape-rendering="geometricPrecision" viewBox=')
    .replace('stroke-width="2.6"', 'stroke-width="3"');
  const path = `${directory}/${name}`;
  await writeFile(path, svg);
  records.push({ path, source, sourceSha256: createHash('sha256').update(original).digest('hex'),
    sha256: createHash('sha256').update(svg).digest('hex') });
}
await writeFile('assets/provenance/cardrpg-big-icons.json', JSON.stringify({
  tool: 'Node.js, original repo SVG paths with explicit native dimensions and a 3-unit stroke',
  command: 'node tools/cardrpg-big/icons.mjs', externalReferences: [], license: 'CC0-1.0', assets: records,
}, null, 2));
console.log(JSON.stringify({ icons: records.length }));
