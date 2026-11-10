// Local GLB inbox: no browser, model inference, network, or runtime install.
import {readdir,readFile,writeFile,mkdir,stat,access,rename,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {setTimeout as delay} from 'node:timers/promises';
const {values:args}=parseArgs({options:{inbox:{type:'string'},out:{type:'string'},watch:{type:'boolean',default:false}}});
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..');
const inbox=resolve(args.inbox??`${homedir()}/art/look-v3/inbox`);
const out=resolve(args.out??`${homedir()}/art/look-v3/local-intake`);
const exists=p=>access(p).then(()=>true,()=>false);
const sha=b=>createHash('sha256').update(b).digest('hex');
const ids=new Set((await readdir(`${root}/assets/source/look-v3/concepts`)).filter(p=>p.endsWith('.png')).map(p=>p.slice(0,-4)));
await mkdir(inbox,{recursive:true});await mkdir(out,{recursive:true});
const lock=`${out}/.running`;await mkdir(lock).catch(e=>{if(e.code==='EEXIST')throw Error('Local intake already running; inspect '+lock);throw e;});
await writeFile(lock+'/owner.json',JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()})+'\n');
let stopped=false;for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stopped=true;});
const emit=row=>console.log(JSON.stringify(row));
async function scan(){
 for(const name of (await readdir(inbox)).filter(n=>n.endsWith('.glb')).sort()){
  if(stopped||await exists(root+'/STOP-B'))return;
  const id=name.slice(0,-4),source=`${inbox}/${name}`,before=await stat(source);
  if(!before.isFile()||Date.now()-before.mtimeMs<5000)continue; // Do not read an active copy/download.
  if(!ids.has(id)){emit({file:name,status:'NEEDS_UNIT_NAME'});continue;}
  if(before.size>128*1024*1024){emit({id,status:'TOO_LARGE',bytes:before.size});continue;}
  const bytes=await readFile(source),after=await stat(source);
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs)continue;
  const hash=sha(bytes),dir=`${out}/${id}/${hash}`;
  if(await exists(dir+'/receipt.json'))continue;
  await mkdir(dir,{recursive:true});
  const receipt={id,status:'REVIEW_REQUIRED',source,sourceSha256:hash,bytes:bytes.length,receivedAt:new Date().toISOString(),network:false,runtimeAccepted:false};
  try{
   if(bytes.length<20||bytes.readUInt32LE(0)!==0x46546c67||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length||bytes.readUInt32LE(16)!==0x4e4f534a)throw Error('Not a complete GLB2 file');
   const end=20+bytes.readUInt32LE(12);if(end>bytes.length)throw Error('Truncated JSON chunk');
   const doc=JSON.parse(bytes.subarray(20,end).toString('utf8'));
   if(doc.asset?.version!=='2.0'||!doc.meshes?.length)throw Error('Missing glTF2 mesh');
   const external=[...(doc.buffers??[]),...(doc.images??[])].filter(v=>v.uri&&!v.uri.startsWith('data:'));
   if(external.length)throw Error('Export a standalone GLB with embedded textures');
   if(!(doc.images??[]).length)throw Error('Missing embedded texture images');
   receipt.structure={meshes:doc.meshes.length,images:doc.images.length,skins:doc.skins?.length??0,animations:doc.animations?.length??0};
   const archived=`${dir}/${id}-source.glb`;
   if(await exists(archived)){if(sha(await readFile(archived))!==hash)throw Error('Existing archive differs');}
   else await writeFile(archived,bytes,{flag:'wx'});
   receipt.archived=archived;
   receipt.concept=`assets/source/look-v3/concepts/${id}.png`;
   receipt.conceptSha256=sha(await readFile(`${root}/${receipt.concept}`));
   const config=`${root}/tools/cardrpg-look/art-rebuild/configs/${id}.json`;
   receipt.next=await exists(config)?'Inspect source and reviewed config, then prepare-unit.mjs; visual review required':'Inspect source; author unit rig config; run prepare-unit.mjs; visual review required';
   if(id==='mochi'||id==='soot')receipt.next='Existing successful conversion is preserved; do not replace or reprocess automatically';
  }catch(e){receipt.status='INVALID_SOURCE';receipt.error=String(e.message??e);}
  await writeFile(dir+'/receipt.json.tmp',JSON.stringify(receipt,null,2)+'\n');await rename(dir+'/receipt.json.tmp',dir+'/receipt.json');
  emit({id,status:receipt.status,receipt:dir+'/receipt.json',error:receipt.error});
 }
}
try{
 emit({status:'LISTENING',inbox,out,pid:process.pid});
 do{await scan();if(!args.watch||stopped||await exists(root+'/STOP-B'))break;await delay(10000);}while(!stopped);
}finally{await rm(lock,{recursive:true});}
