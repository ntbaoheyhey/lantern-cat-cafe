// Reproducible local stages after the already-completed image-to-3D export.
// No inference, credentials, purchases, browser clicks or model requests.
import { spawn } from 'node:child_process';
import { readFile, writeFile, mkdir, access, copyFile, rename, rmdir, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const [directory, install, ...extra] = process.argv.slice(2);
if (!directory || extra.length || install && install !== '--install-preview') {
  throw Error('Usage: prepare-mochi.mjs NEW_OUTPUT_DIR [--install-preview]. Known cast/victory deformation: production installation is not supported.');
}
const out = resolve(directory);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const source = resolve(root, 'assets/source/look-v3/image-to3d/mochi-source.glb');
const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
const exists = file => access(file).then(() => true, () => false);
const sourceSha256 = await hash(source);
if (sourceSha256 !== 'eb84d0f8ca114736806432a18c0abd7249f3fb451c642c53fb28a1a85c0912a6') throw Error('This rig is authored for the inspected Mochi source only');
const recipes = ['prepare-mochi.mjs', 'simplify-textured.mjs', 'rig-generated.py', 'inspect-glb.py'];
const recipeHashes = Object.fromEntries(await Promise.all(recipes.map(async name => [name, await hash(root + '/tools/cardrpg-look/art-rebuild/' + name)])));
await mkdir(out, { recursive: true });
const manifestPath = out + '/pipeline.json';
const manifest = await exists(manifestPath) ? JSON.parse(await readFile(manifestPath)) : {
  source, sourceSha256, recipeHashes, startedAt: new Date().toISOString(), steps: [],
  runtimeAccepted: false, qualityStatus: 'PARTIAL',
  knownIssues: ['B-R1-008: fused arm/apron/shield stretch in cast and victory; repair cap reached.'],
  toolchain: { node: process.version, platform: process.platform, architecture: process.arch } };
if (manifest.sourceSha256 !== sourceSha256 || JSON.stringify(manifest.recipeHashes) !== JSON.stringify(recipeHashes)) throw Error('Recipe changed: preserve prior attempt and choose a new output directory');
const lease = out + '/.running';
await mkdir(lease).catch(error => {
  if (error.code === 'EEXIST') throw Error('Output is locked by another or interrupted run: ' + lease + '. Verify its process before removing the lock.');
  throw error;
});
const save = async () => {
  await writeFile(manifestPath + '.tmp', JSON.stringify(manifest, null, 2) + '\n');
  await rename(manifestPath + '.tmp', manifestPath);
};
const python = '/Users/bao/tools/cardrpg-look/venv/bin/python';
async function step(id, command, args, output, sidecars = []) {
  if (await exists(root + '/STOP-B')) throw Error('STOP-B requested; preserving completed stages');
  const saved = manifest.steps.find(s => s.id === id && s.status === 'DONE');
  if (saved) {
    for (const [file, expected] of Object.entries(saved.outputs)) {
      if (await hash(file) !== expected) throw Error('Output changed after completed stage: ' + id + ' ' + file);
    }
    console.log(JSON.stringify({ stage: id, status: 'REUSED' })); return;
  }
  if (manifest.steps.some(s => s.id === id)) throw Error('Preserve interrupted/failed stage ' + id + '; choose a new output directory.');
  const record = { id, command, args, startedAt: new Date().toISOString(), output, status: 'RUNNING' };
  manifest.steps.push(record); await save();
  const lines = [];
  const code = await new Promise(resolve => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', b => lines.push(b)); child.stderr.on('data', b => lines.push(b));
    child.once('error', error => { lines.push(Buffer.from(String(error))); resolve(-1); });
    child.once('close', (code, signal) => {
      if (signal) lines.push(Buffer.from('Terminated by ' + signal));
      resolve(code ?? -1);
    });
  });
  await writeFile(out + '/' + id + '.log', Buffer.concat(lines));
  record.finishedAt = new Date().toISOString(); record.exitCode = code;
  record.status = 'FAILED';
  if (code === 0) {
    record.sha256 = await hash(output);
    record.outputs = Object.fromEntries(await Promise.all([output, ...sidecars].map(async file => [file, await hash(file)])));
    record.status = 'DONE';
  }
  await save(); console.log(JSON.stringify({ stage: id, status: record.status }));
  if (code !== 0) throw Error('Stage failed; inspect ' + out + '/' + id + '.log');
}
try {
  await writeFile(lease + '/owner.json', JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + '\n');
  await step('source', python, ['tools/cardrpg-look/art-rebuild/inspect-glb.py', source, '--out', out + '/source.json'], out + '/source.json');
  await step('simplify', process.execPath, ['tools/cardrpg-look/art-rebuild/simplify-textured.mjs', source, out + '/surface.glb', '.23', '.006'], out + '/surface.glb', [out + '/surface.json']);
  await step('rig', python, ['tools/cardrpg-look/art-rebuild/rig-generated.py', '--source', out + '/surface.glb', '--out', out + '/rig.glb', '--revision', '3'], out + '/rig.glb', [out + '/rig.json']);
  await step('pack', '/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform',
    ['optimize', out + '/rig.glb', out + '/mochi.glb', '--compress', 'meshopt', '--flatten', 'false',
      '--join', 'false', '--instance', 'false', '--palette', 'false', '--simplify', 'false', '--prune', 'false',
      '--texture-compress', 'webp', '--texture-size', '1024'], out + '/mochi.glb');
  await step('inspect', python, ['tools/cardrpg-look/art-rebuild/inspect-glb.py', out + '/mochi.glb', '--out', out + '/packed.json'], out + '/packed.json');
  if (install) {
    if (await exists(root + '/STOP-B')) throw Error('STOP-B requested');
    const preview = root + '/assets/cardrpg-look/v3-generated/mochi.glb';
    await mkdir(dirname(preview), { recursive: true });
    if (await exists(preview) && await hash(preview) !== await hash(out + '/mochi.glb')) {
      await copyFile(preview, out + '/previous-preview-' + await hash(preview) + '.glb');
    }
    await copyFile(out + '/mochi.glb', preview);
    manifest.installedPreview = preview;
  }
  manifest.status = 'LOCAL_STAGES_COMPLETE'; manifest.finishedAt = new Date().toISOString();
} catch (e) { manifest.status = 'PARTIAL'; manifest.error = String(e); throw e; }
finally {
  try { await save(); } finally {
    await unlink(lease + '/owner.json').catch(error => { if (error.code !== 'ENOENT') throw error; });
    await rmdir(lease);
  }
}
console.log(JSON.stringify({ status: manifest.status, qualityStatus: manifest.qualityStatus,
  runtimeAccepted: false, model: out + '/mochi.glb', manifest: manifestPath }));
