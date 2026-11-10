// Local, attribute-aware simplification. Every output still requires visual QA.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const { NodeIO, VertexLayout } = require('@gltf-transform/core');
const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
const { weld, compactPrimitive, prune } = require('@gltf-transform/functions');
const { MeshoptSimplifier } = await import(require.resolve('meshoptimizer'));
const [source, output, ratioArg = '.23', errorArg = '.006'] = process.argv.slice(2);
if (!source || !output) throw Error('Usage: simplify-textured.mjs SOURCE NEW_OUTPUT [ratio] [error]');
if (await access(output).then(() => true, () => false)) throw Error('Preserve earlier output; choose a new attempt');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE);
await MeshoptSimplifier.ready;
const doc = await io.read(source);
await doc.transform(weld());
const rows = [];
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  if (prim.listTargets().length || prim.getAttribute('JOINTS_0')) throw Error('Simplify source before authoring its rig');
  const positions = prim.getAttribute('POSITION'), normals = prim.getAttribute('NORMAL'), uv = prim.getAttribute('TEXCOORD_0');
  if (!uv) throw Error('Textured source requires UVs');
  const attrs = new Float32Array(positions.getCount() * 5);
  for (let i = 0; i < positions.getCount(); i++) {
    for (let axis = 0; axis < 3; axis++) attrs[i * 5 + axis] = normals?.getArray()[i * 3 + axis] ?? 0;
    attrs[i * 5 + 3] = uv.getArray()[i * 2]; attrs[i * 5 + 4] = uv.getArray()[i * 2 + 1];
  }
  const indices = new Uint32Array(prim.getIndices().getArray());
  const [reduced, measuredError] = MeshoptSimplifier.simplifyWithAttributes(indices,
    positions.getArray(), 3, attrs, 5, [.1, .1, .1, 1, 1], null,
    Math.floor(indices.length * Number(ratioArg) / 3) * 3, Number(errorArg), ['Permissive']);
  prim.setIndices(doc.createAccessor().setType('SCALAR').setArray(reduced).setBuffer(positions.getBuffer()));
  compactPrimitive(prim);
  rows.push({ before: indices.length / 3, after: reduced.length / 3, measuredError });
}
await doc.transform(prune({ keepAttributes: true, keepLeaves: true }));
await mkdir(dirname(output), { recursive: true });
await io.write(output, doc);
const hash = async p => createHash('sha256').update(await readFile(p)).digest('hex');
const receipt = { source, output, sourceSha256: await hash(source), sha256: await hash(output),
  tool: 'meshoptimizer1.3.0 simplifyWithAttributes', ratio: Number(ratioArg), error: Number(errorArg),
  attributeWeights: [.1, .1, .1, 1, 1], flags: ['Permissive'], rows, acceptance: 'NOT ACCEPTED: compare source and rig poses' };
await writeFile(output.replace(/\.glb$/, '.json'), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt));
