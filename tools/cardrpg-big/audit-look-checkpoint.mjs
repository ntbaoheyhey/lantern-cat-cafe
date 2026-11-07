// REFERENCE: reports/cardrpg-big/memory/PROMPT.md ADDENDUM LOOK3; exact-hash saved evidence.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root = process.env.LOOK_CHECKPOINT_ROOT || 'reports/cardrpg-big/look-ui';
const artifact = process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html';
const functionalRoot = process.env.LOOK_FUNCTIONAL_ROOT || `${root}/functional-l0-reviewfix`;
const uiRoot = process.env.LOOK_UI_ROOT || `${root}/l0-reviewfix`;
const flagRoot = process.env.LOOK_FLAG_ROOT || `${root}/flagoff-reviewfix`;
const gatePath = process.env.LOOK_GATE_PATH || 'reports/cardrpg-big/validation/look-l0-reviewfix.json';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const artifactBytes = await readFile(artifact), artifactSha256 = sha(artifactBytes);
const build = await json('docs/cardrpg3/build.json');
assert.equal(build.sha256, artifactSha256); assert.equal(build.runtimeDirty, false);
for (const [path, expected] of Object.entries(build.sourceHashes)) assert.equal(sha(await readFile(path)), expected, path);
assert.equal(build.evidence.rows, 93); assert.equal(build.evidence.files.length, 160);
const gates = await json(gatePath);
assert.deepEqual(gates.map(g => g.name), ['typecheck','lint','tests','build','e2e']);
for (const g of gates) { assert.equal(g.exit, 0, g.name); assert.equal(sha(await readFile(g.log)), g.sha256, g.log); }
const functional = await json(`${functionalRoot}/functional.json`);
assert.equal(functional.sha256, artifactSha256); assert.equal(functional.rows.length, 10);
assert(functional.rows.every(r => r.exit === 0));
function errors(value, path) {
 if (!value || typeof value !== 'object') return;
 for (const [key, child] of Object.entries(value)) {
  if (['errors','requests','remoteRequests','overflowElements','rightOverflow'].includes(key)) assert.deepEqual(child,[],`${path}.${key}`);
  if (['overflow','pageOverflow','panelOverflow','bodyOverflow'].includes(key)) assert(child === 0 || child === false, `${path}.${key}`);
  if (['passed','accountUnchanged','accountRestored','local'].includes(key)) assert.equal(child,true,`${path}.${key}`);
  errors(child,`${path}.${key}`);
 }
}
const groups = [], screenshots = [];
for (const [name,count] of Object.entries({studio:3,gallery:3,comparisons:93,lab:3,meta:3,reveal:8,invitations:4,designs:3,path:3,mechanics:4})) {
 const path = `${functionalRoot}/${name}/checks.json`, bytes = await readFile(path), data = JSON.parse(bytes);
 assert.equal(data.sha256,artifactSha256,path); assert.equal(data.rows.length,count,path); errors(data,name);
 const images=[];
 for (const file of (await readdir(`${functionalRoot}/${name}`)).filter(f=>/\.(png|webp)$/.test(f)).sort()) {
  const path=`${functionalRoot}/${name}/${file}`, bytes=await readFile(path);
  images.push({path,bytes:bytes.length,sha256:sha(bytes)});
 }
 screenshots.push(...images);groups.push({name,path,sha256:sha(bytes),rows:count,screenshots:images});
}
const ui=[];
for (const width of [1024,1280,1440]) {
 const path=`${uiRoot}/${width}/checks.json`, data=await json(path), contrast=await json(`${uiRoot}/${width}/contrast.json`);
 assert.equal(data.artifactSha256,artifactSha256,path); assert.equal(data.toggles.length,10);assert(data.toggles.every(t=>t.preservedState));
 assert.equal(data.rows.length,10);assert.equal(contrast.activeFailures,0);errors(data,path);
 for(const r of data.rows){assert.equal(sha(await readFile(r.screenshot)),r.sha256,r.screenshot);if(r.background)assert.equal(sha(await readFile(r.background)),r.backgroundSha256,r.background);}
 assert(contrast.rows.every(r=>r.artifactSha256===artifactSha256));
 ui.push({width,path,toggles:data.toggles.length,screenshots:data.rows.length,textRectangles:contrast.measured,activeFailures:contrast.activeFailures,inactiveFailures:contrast.inactiveFailures,minimumActiveContrast:Math.min(...contrast.rows.filter(r=>!r.disabled).map(r=>r.minimum))});
}
const flagoff=await json(`${flagRoot}/comparison.json`);
for(const key of ['addedModules','removedModules','prohibitedModules','modelRequests','errors'])assert.deepEqual(flagoff[key],[],key);
assert.equal(flagoff.newScripts,flagoff.baselineScripts);assert.equal(flagoff.newBytes,flagoff.baselineBytes);
const baseline='a106dfcac755d42f91b2467adf6d888ca0b41a9c';
const changed=execFileSync('git',['diff','--name-only',baseline,'HEAD','--','apps/web/src','packages/game-rules/src','packages/chain','supabase','contracts'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const protectedChanges=changed.filter(p=>p.startsWith('packages/')||p.startsWith('supabase/')||p.startsWith('contracts/')||/\/(wallet|forge|market|Relic)\//i.test(p));
assert.deepEqual(protectedChanges,[]);
assert.equal(sha(await readFile('docs/cardrpg3/baseline-v1.html')),'9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3');
const out={at:new Date().toISOString(),artifact,artifactSha256,artifactBytes:artifactBytes.length,sourceHead:build.head,verifiedSourceInputs:Object.keys(build.sourceHashes).length,method:'Independent saved-receipt and byte audit. Does not rerun browsers or confer art/performance acceptance.',gates,groups,screenshotCount:screenshots.length,ui,flagoff,scope:{baseline,changed,protectedChanges},limits:['24 MB default size gate missed; artifact-specific LOOK exception in lab receipt','B L1-L7 visual assets/rubrics and final matrix pending','Baseline quality/performance/balance misses are unchanged']};
await writeFile(`${root}/l0-checkpoint-audit.json`,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({artifactSha256,groups:groups.length,screenshots:screenshots.length,uiCaptures:ui.reduce((n,r)=>n+r.screenshots,0),activeContrastFailures:0}));
