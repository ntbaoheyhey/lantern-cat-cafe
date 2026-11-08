import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const root='/Users/bao/taskbar-hero-cardrpg-a4',prep='/tmp/cardrpg-a5-c1-prep';
const inputs=JSON.parse(await readFile(prep+'/inputs.json','utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const [file,expected] of Object.entries(inputs)){
 const content=await readFile(resolve(root,file)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
 assert.equal(content?hash(content):null,expected,'Draft base changed '+file);
}
const overlay=Object.fromEntries(await Promise.all(Object.keys(inputs).map(async file=>[resolve(root,file),{path:resolve(prep,'source',file),sha256:hash(await readFile(resolve(prep,'source',file)))}])));
let source=await readFile(root+'/tools/cardrpg-big/build.mjs','utf8');
source=source.replace("'../visual-support.mjs'",JSON.stringify(root+'/tools/visual-support.mjs')).replace("'../cardrpg-big2/embed-evidence.mjs'",JSON.stringify(root+'/tools/cardrpg-big2/embed-evidence.mjs'));
const plugin=`{
 name:'a5-c1-isolated-overlay',enforce:'pre',
 resolveId(source,importer){if(!source.startsWith('.')||!importer)return;const base=resolve(importer.slice(0,importer.lastIndexOf('/')),source);for(const path of [base,base+'.ts',base+'.tsx'])if(overlay[path])return path;},
 load(id){const row=overlay[id];if(row)return readFileSync(row.path,'utf8');}
}`;
source=source.replace('const embeddedAssets = new Map();',`const overlay=${JSON.stringify(overlay)};\nconst embeddedAssets = new Map();`).replace('plugins: [{',`plugins: [${plugin}, {`);
await writeFile(prep+'/sandbox-builder.mjs',source);
await writeFile(prep+'/overlay-receipt.json',JSON.stringify({method:'Unadopted C1 overlay only; original source and H0 artifact remain unchanged.',inputs,overlay},null,2));
const child=spawn(process.execPath,[prep+'/sandbox-builder.mjs'],{cwd:root,env:{...process.env,BIG_GAMEPLAY_V4:'1',BIG_OUTPUT_DIR:prep+'/artifact'},stdio:'inherit'});
process.exitCode=await new Promise((done,reject)=>{child.on('error',reject);child.on('close',done);});
