// Local, resumable production stages. Conversion is an explicit upstream input:
// this command never uploads, generates, purchases or retrieves credentials.
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { readFile, writeFile, mkdir, access, copyFile, rename, rmdir, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const {values:args}=parseArgs({options:{id:{type:'string'},source:{type:'string'},
  concept:{type:'string'},config:{type:'string'},out:{type:'string'},'install-preview':{type:'boolean',default:false}}});
if(!args.id||!args.source||!args.out||!/^[a-z][a-z0-9-]*$/.test(args.id))
  throw Error('Usage: prepare-unit.mjs --id UNIT --source SOURCE.glb --out NEW_DIR [--config CONFIG.json] [--concept MASTER.png] [--install-preview]');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const home=resolve(root,'tools/cardrpg-look/art-rebuild');
const source=resolve(args.source),out=resolve(args.out);
const config=resolve(args.config??`${home}/configs/${args.id}.json`);
const concept=resolve(args.concept??`${root}/assets/source/look-v3/concepts/${args.id}.png`);
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
const exists=p=>access(p).then(()=>true,()=>false);
const cfg=JSON.parse(await readFile(config));
if(cfg.id!==args.id||!cfg.role||!(cfg.height>0)||!(cfg.height<5))throw Error('Config must name the unit, clip role and measured height');
const sourceSha256=await hash(source),conceptSha256=await hash(concept);
if(cfg.sourceSha256&&cfg.sourceSha256!==sourceSha256)throw Error('Source does not match reviewed unit config');
const ratio=cfg.ratio??.22,error=cfg.error??.006,textureSize=cfg.textureSize??1024;
if(!(ratio>0&&ratio<=1&&error>0&&error<=.02&&[512,1024,2048].includes(textureSize)))throw Error('Invalid packing parameters');
const recipeHashes=Object.fromEntries(await Promise.all(['prepare-unit.mjs','simplify-textured.mjs','rig-unit.mjs','inspect-glb.py']
  .map(async name=>[name,await hash(`${home}/${name}`)])));
const identity={id:args.id,source,sourceSha256,concept,conceptSha256,config,configSha256:await hash(config),recipeHashes};
await mkdir(out,{recursive:true});
const lock=out+'/.running';
await mkdir(lock).catch(e=>{if(e.code==='EEXIST')throw Error('Output locked: verify owner before removing '+lock);throw e;});
const manifestPath=out+'/pipeline.json';
let manifest;
const save=async()=>{await writeFile(manifestPath+'.tmp',JSON.stringify(manifest,null,2)+'\n');await rename(manifestPath+'.tmp',manifestPath);};
const stop=async()=>{if(await exists(root+'/STOP-B'))throw Error('STOP-B requested');};
async function step(id,command,argv,outputs){
  await stop();
  const old=manifest.steps.find(s=>s.id===id);
  if(old){
    if(old.status!=='DONE')throw Error('Preserve interrupted/failed stage '+id+'; use a new directory');
    for(const [path,expected] of Object.entries(old.outputs))if(await hash(path)!==expected)throw Error('Output changed: '+path);
    console.log(JSON.stringify({stage:id,status:'REUSED'}));return;
  }
  for(const path of outputs)if(await exists(path))throw Error('Untracked stage output exists: '+path);
  const record={id,command,argv,status:'RUNNING',startedAt:new Date().toISOString()};
  manifest.steps.push(record);await save();
  const log=[];
  const exitCode=await new Promise(done=>{
    const child=spawn(command,argv,{cwd:root,stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',b=>log.push(b));child.stderr.on('data',b=>log.push(b));
    child.once('error',e=>{log.push(Buffer.from(String(e)));done(-1);});
    child.once('close',(code,signal)=>{if(signal)log.push(Buffer.from('Signal '+signal));done(code??-1);});
  });
  await writeFile(out+'/'+id+'.log',Buffer.concat(log));
  Object.assign(record,{exitCode,status:'FAILED',finishedAt:new Date().toISOString()});
  if(exitCode===0){record.outputs=Object.fromEntries(await Promise.all(outputs.map(async path=>[path,await hash(path)])));record.status='DONE';}
  await save();console.log(JSON.stringify({stage:id,status:record.status}));
  if(exitCode!==0)throw Error('Stage failed: '+id+'; inspect its log');
}
try{
  await writeFile(lock+'/owner.json',JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n');
  await stop();
  if(await exists(manifestPath)){
    const previous=JSON.parse(await readFile(manifestPath));
    if(JSON.stringify(previous.identity)!==JSON.stringify(identity))throw Error('Recipe/source changed; preserve old run and use a new directory');
    manifest=previous;
  }else manifest={identity,startedAt:new Date().toISOString(),steps:[],runtimeAccepted:false,
    qualityStatus:'REVIEW_REQUIRED',toolchain:{node:process.version,platform:process.platform,architecture:process.arch}};
  const python=process.env.ART_PYTHON??'/Users/bao/tools/cardrpg-look/venv/bin/python';
  await step('source',python,[home+'/inspect-glb.py',source,'--out',out+'/source.json'],[out+'/source.json']);
  const structure=JSON.parse(await readFile(out+'/source.json'));
  if(structure.externalFiles.length||!structure.triangles||structure.skins||structure.animations||structure.primitives.some(p=>p.mode!==4||!p.hasUV))
    throw Error('Source must be a standalone textured triangle GLB before rigging');
  await step('simplify',process.execPath,[home+'/simplify-textured.mjs',source,out+'/surface.glb',String(ratio),String(error)],[out+'/surface.glb',out+'/surface.json']);
  await step('rig',process.execPath,[home+'/rig-unit.mjs',out+'/surface.glb',out+'/rig.glb',config],[out+'/rig.glb',out+'/rig.json']);
  const model=out+'/'+args.id+'.glb';
  await step('pack',process.env.ART_GLTF_TRANSFORM??'/Users/bao/tools/cardrpg-look/npm/node_modules/.bin/gltf-transform',
    ['optimize',out+'/rig.glb',model,'--compress','meshopt','--flatten','false','--join','false','--instance','false',
      '--palette','false','--simplify','false','--prune','false','--texture-compress','webp','--texture-size',String(textureSize)],[model]);
  await step('inspect',python,[home+'/inspect-glb.py',model,'--out',out+'/packed.json'],[out+'/packed.json']);
  if(args['install-preview']){
    await stop();const preview=root+'/assets/cardrpg-look/v3-generated/'+args.id+'.glb';
    await mkdir(dirname(preview),{recursive:true});
    if(await exists(preview)&&await hash(preview)!==await hash(model))await copyFile(preview,out+'/previous-preview-'+await hash(preview)+'.glb');
    await copyFile(model,preview+'.tmp');await rename(preview+'.tmp',preview);
    manifest.preview={path:preview,sha256:await hash(model),installedAt:new Date().toISOString()};
  }
  manifest.status='LOCAL_STAGES_COMPLETE';manifest.finishedAt=new Date().toISOString();await save();
  console.log(JSON.stringify({id:args.id,status:manifest.status,qualityStatus:manifest.qualityStatus,runtimeAccepted:false,model}));
}catch(e){
  if(manifest){manifest.status='PARTIAL';manifest.error=String(e);await save();}
  throw e;
}finally{
  await unlink(lock+'/owner.json').catch(e=>{if(e.code!=='ENOENT')throw e;});await rmdir(lock);
}
