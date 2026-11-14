/** Apply the unchanged S5 checker without replacing the accepted review pack. */
import {readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, symlinkSync, lstatSync, unlinkSync} from 'node:fs';
import {resolve} from 'node:path';
import {checkGates, formatGate} from '../v3b2/check-gates.mjs';

const root = resolve(import.meta.dirname, '../..');
const [trial, sceneList = 'battle,boss,home,bag,gacha,forge'] = process.argv.slice(2);
if (!/^[A-Za-z0-9-]+$/.test(trial ?? '')) throw Error('Supply a measured trial label.');
const scenes = sceneList.split(',');
if (!scenes.length || scenes.some(s => !['battle','boss','home','bag','gacha','forge'].includes(s))) {
  throw Error('Unknown scene.');
}
const base = 'reports/v3-shell/b2';
const view = resolve(root, 'tmp/b2-candidate-gates', trial);
mkdirSync(resolve(view, base), {recursive: true});
function linkEntries(folder, excluded) {
  for (const entry of readdirSync(resolve(root, folder), {withFileTypes: true})) {
    if (excluded.includes(entry.name)) continue;
    const destination = resolve(view, folder, entry.name);
    // Older receipts use absolute paths. Re-root only their temporary copies;
    // the checker's repository boundary and the original evidence stay intact.
    if (entry.isFile() && entry.name.endsWith('.json')) {
      const bytes = readFileSync(resolve(root, folder, entry.name), 'utf8');
      if (bytes.includes(root)) {
        if (existsSync(destination) && lstatSync(destination).isSymbolicLink()) unlinkSync(destination);
        writeFileSync(destination, bytes.replaceAll(root, view));
        continue;
      }
    }
    if (!existsSync(destination)) symlinkSync(resolve(root, folder, entry.name), destination);
  }
}
linkEntries('.', ['.git', 'tmp', 'reports']);
linkEntries('reports', ['v3-shell']);
linkEntries('reports/v3-shell', ['b2']);
linkEntries(base, ['OUR-AUDIO.json', 'econ']);
const economyView = resolve(view, base, 'econ');
if (existsSync(economyView) && lstatSync(economyView).isSymbolicLink()) unlinkSync(economyView);
mkdirSync(economyView, {recursive: true});
linkEntries(base + '/econ', []);
const accepted = JSON.parse(readFileSync(resolve(root, base, 'OUR-AUDIO.json')));
const candidate = {...accepted, renders: accepted.renders.filter(r => !scenes.includes(r.name))};
for (const scene of scenes) {
  const render = JSON.parse(readFileSync(resolve(root, base, 'mix', `${trial}-${scene}.json`)));
  if (render.trial !== trial || render.name !== scene) throw Error('Mismatched capture.');
  candidate.renders.push(render);
}
writeFileSync(resolve(view, base, 'OUR-AUDIO.json'), JSON.stringify(candidate, null, 2) + '\n');
const rows = checkGates({root: view}).filter(row => scenes.some(scene => row.id.startsWith(`S5.${scene}.`)));
if (rows.length !== scenes.length * 9) throw Error('Incomplete checker selection.');
const output = rows.map(formatGate);
output.push(`TOTAL ${rows.filter(row => row.status === 'PASS').length} PASS / ${rows.filter(row => row.status !== 'PASS').length} FAIL / ${rows.length} gates`);
writeFileSync(resolve(root, base, 'mix', `${trial}-${scenes.join('-')}-gates.log`), output.join('\n') + '\n');
console.log(output.filter(line => line.startsWith('FAIL') || line.startsWith('TOTAL')).join('\n'));
process.exitCode = rows.every(row => row.status === 'PASS') ? 0 : 1;
