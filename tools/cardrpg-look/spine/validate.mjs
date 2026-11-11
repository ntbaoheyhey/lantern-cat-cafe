/** Read-only structural gate using the same official parser as the battle renderer. */
import { readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';

export const ROOT = resolve(import.meta.dirname, '../../..');
const require = createRequire(resolve(ROOT,'apps/web/package.json'));
export const Spine = await import(require.resolve('@esotericsoftware/spine-core'));
export const CONFIG = JSON.parse(await readFile(resolve(ROOT,'assets/cardrpg-look/spine/config.json'),'utf8'));
export const readSlots = async () => JSON.parse(await readFile(resolve(ROOT,'assets/cardrpg-look/spine/slots.json'),'utf8'));
const safeName = name => typeof name === 'string' && /^[a-z0-9][a-z0-9._/-]*$/i.test(name) && !name.split('/').includes('..') && !isAbsolute(name);
const issue = (result,severity,code,message) => result.issues.push({severity,code,message});
const finish = result => ({...result,accepted:!result.issues.some(i=>i.severity==='FIX'),verdict:result.issues.some(i=>i.severity==='FIX')?'FIX':result.issues.length?'PASS_WITH_WARN':'PASS'});
export async function safeRead(folder,name) {
  if (!safeName(name)) throw Error(`Unsafe asset filename: ${name}`);
  const base = await realpath(folder), path = await realpath(resolve(base,name)), rel = relative(base,path);
  if (rel.startsWith('..') || isAbsolute(rel)) throw Error(`Asset escapes delivery folder: ${name}`);
  return readFile(path);
}
export function pngSize(bytes,name='image') {
  if (bytes.length<33 || !bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) || bytes.toString('ascii',12,16)!=='IHDR') throw Error(`Invalid PNG header: ${name}`);
  const size=[bytes.readUInt32BE(16),bytes.readUInt32BE(20)];
  if (size.some(n=>n<1||n>CONFIG.atlasMax)) throw Error(`PNG ${name}: ${size.join('×')} exceeds ${CONFIG.atlasMax} or is empty`);
  // A valid header alone also exists in truncated/corrupt deliveries. Decode
  // bounded pixels and verify chunk CRCs before an immutable revision is accepted.
  try { PNG.sync.read(bytes,{checkCRC:true}); }
  catch(error) { throw Error(`Invalid PNG image data (${name}): ${error.message??error}`); }
  return size;
}
function heightGate(result,unit,height,width) {
  const tolerance=unit.tier==='cat'?2:0.5;
  if (!Number.isFinite(height)||height<unit.heightRange[0]-tolerance||height>unit.heightRange[1]+tolerance)
    issue(result,'FIX','height',`Measured height ${height}; required ${unit.heightRange.join('–')}. Supply intake.json scale; source art stays unchanged.`);
  if (unit.maxWidth && (!Number.isFinite(width)||width>unit.maxWidth+.5)) issue(result,'FIX','width',`Boss width ${width} exceeds ${unit.maxWidth}.`);
}
function animationGate(result,unit,animations) {
  for (const name of unit.animations) {
    const clip=animations[name], spec=CONFIG.animations[name];
    if (!clip) {issue(result,'FIX','animation',`Missing ${name}`);continue;}
    if (!Number.isFinite(clip.duration)||clip.duration<=0) {issue(result,'FIX','animation',`${name} is empty or non-finite`);continue;}
    if (clip.duration<spec.seconds[0]-.001||clip.duration>spec.seconds[1]+.001) issue(result,'WARN','duration',`${name} duration ${clip.duration}; expected ${spec.seconds.join('–')} seconds.`);
    for (const event of Object.keys(spec.events)) {
      if (!clip.events.some(e=>e.name===event)) issue(result,'WARN','event',`${name}: missing ${event}; timed fallback at ${spec.events[event]}.`);
    }
    for (const event of clip.events) if (!Number.isFinite(event.time)||event.time<0||event.time>clip.duration) issue(result,'WARN','event-time',`${name}: ${event.name} outside clip.`);
    if (name==='ult') {
      const start=clip.events.find(e=>e.name==='ult-start'), hit=clip.events.find(e=>e.name==='hit'), end=clip.events.find(e=>e.name==='ult-end');
      if (start&&hit&&end&&!(start.time<hit.time&&hit.time<end.time)) issue(result,'WARN','event-order','ult-start must precede hit and ult-end.');
    }
  }
}
export function validateSkeleton({unit,source,atlasText,pages,scale=1,format='json'}) {
  const result={id:unit.id,format,scale,issues:[],metrics:{},animations:{}};
  try {
    if (!Number.isFinite(scale)||scale<=0||scale>100) throw Error('intake scale must be finite, positive and <=100');
    const atlas=new Spine.TextureAtlas(atlasText);
    if (!atlas.pages.length) throw Error('Empty atlas');
    for (const page of atlas.pages) {
      if (!safeName(page.name)||!page.name.endsWith('.png')) throw Error(`Invalid PNG page name: ${page.name}`);
      const bytes=pages[page.name]; if (!bytes) throw Error(`Missing PNG ${page.name}`);
      const [width,height]=pngSize(bytes,page.name);
      if (width!==page.width||height!==page.height) throw Error(`Atlas/PNG size mismatch: ${page.name}`);
      page.setTexture(new Spine.FakeTexture({width,height}));
      if (!page.pma) issue(result,'WARN','alpha',`${page.name} uses straight alpha; loader will premultiply on upload.`);
    }
    const reader=format==='binary'?new Spine.SkeletonBinary(new Spine.AtlasAttachmentLoader(atlas)):new Spine.SkeletonJson(new Spine.AtlasAttachmentLoader(atlas));
    reader.scale=scale;
    const data=reader.readSkeletonData(source);
    if (data.version?.split('.').slice(0,2).join('.')!==CONFIG.runtimeVersion) issue(result,'FIX','version',`Export ${data.version}; runtime ${CONFIG.runtimeVersion}.`);
    const names=new Set();
    for (const bone of data.bones) {
      if (!/^[a-z][a-z0-9-]*$/.test(bone.name)||names.has(bone.name)) issue(result,'FIX','name',`Invalid or duplicate bone ${bone.name}`);
      names.add(bone.name);
      if (![bone.x,bone.y,bone.scaleX,bone.scaleY,bone.rotation].every(Number.isFinite)) throw Error(`Non-finite bone ${bone.name}`);
    }
    for (const name of unit.requiredBones) if (!names.has(name)) issue(result,'FIX','bone',`Missing bone ${name}`);
    if (data.bones[0]?.name!=='root'||data.bones[0]?.parent) issue(result,'FIX','root','First bone must be root without a parent.');
    for (const animation of data.animations) {
      result.animations[animation.name]={duration:animation.duration,events:animation.timelines.filter(t=>t instanceof Spine.EventTimeline).flatMap(t=>t.events.map(e=>({name:e.data.name,time:e.time})))};
    }
    animationGate(result,unit,result.animations);
    const skeleton=new Spine.Skeleton(data);skeleton.setToSetupPose();skeleton.updateWorldTransform(Spine.Physics.update);
    const bounds=skeleton.getBoundsRect();
    heightGate(result,unit,bounds.height,bounds.width);
    let meshVertices=0,clipping=0;
    for (const skin of data.skins) for (const entry of skin.getAttachments()) {
      if (entry.attachment instanceof Spine.MeshAttachment) meshVertices+=entry.attachment.worldVerticesLength/2;
      if (entry.attachment instanceof Spine.ClippingAttachment) clipping++;
    }
    for (const [key,value] of Object.entries({bones:data.bones.length,meshVertices,clipping})) if (value>unit.budgets[key]) issue(result,'WARN','budget',`${key}: ${value} > ${unit.budgets[key]}`);
    result.metrics={...bounds,bones:data.bones.length,meshVertices,clipping,pages:atlas.pages.length,bytes:Object.values(pages).reduce((n,b)=>n+b.length,0)};
    result.files=atlas.pages.map(p=>p.name);
  } catch (error) {issue(result,'FIX','parse',String(error.message??error));}
  return finish(result);
}
export async function validateSequence(folder,unit) {
  const result={id:unit.id,format:'sequence',issues:[],metrics:{},animations:{},files:['sequence.json']};
  try {
    const manifest=JSON.parse(await safeRead(folder,'sequence.json'));
    if (manifest.id!==unit.id||manifest.facing!=='right') issue(result,'FIX','name','Sequence id must match the unit and facing must be right.');
    const scale=manifest.scale??1;result.scale=scale;
    if (!Number.isFinite(scale)||scale<=0) throw Error('Invalid sequence scale');
    const unique=new Set();let dimensions,bytes=0;
    for (const [name,clip] of Object.entries(manifest.animations??{})) {
      const fps=clip.fps??manifest.fps;
      if (!Array.isArray(clip.frames)||!clip.frames.length||!Number.isFinite(fps)||fps<1||fps>60) throw Error(`Invalid frames/fps for ${name}`);
      result.animations[name]={duration:clip.frames.length/fps,events:clip.events??[]};
      for (const frame of clip.frames) if (!unique.has(frame)) {
        if (!frame.endsWith('.png')) throw Error('Sequence frames must be PNG');
        const png=await safeRead(folder,frame), size=pngSize(png,frame);
        if (dimensions&&size.some((n,i)=>n!==dimensions[i])) throw Error('Sequence frames require one shared canvas size');
        dimensions=size;unique.add(frame);bytes+=png.length;
      }
    }
    animationGate(result,unit,result.animations);
    for (const name of unit.requiredBones) if (!Array.isArray(manifest.sockets?.[name])||manifest.sockets[name].length!==2||!manifest.sockets[name].every(Number.isFinite)) issue(result,'FIX','bone',`Sequence needs ${name} socket in Spine units.`);
    heightGate(result,unit,manifest.height*scale,manifest.width*scale);
    if (bytes>12*1024*1024) issue(result,'WARN','budget',`Sequence ${bytes} bytes; prefer a compact sheet.`);
    result.files.push(...unique);result.metrics={height:manifest.height*scale,width:manifest.width*scale,frames:unique.size,bytes};
  } catch (error) {issue(result,'FIX','parse',String(error.message??error));}
  return finish(result);
}
export async function validateDelivery(folder,unit,{scale}={}) {
  const names=await readdir(folder).catch(()=>[]);
  const cubism=names.some(n=>/\.(moc3|model3\.json|motion3\.json)$/.test(n));
  if (names.includes('sequence.json')) return {...await validateSequence(folder,unit),cubism};
  const result={id:unit.id,format:cubism?'cubism':'unknown',issues:[],metrics:{},animations:{},cubism};
  if (cubism) {issue(result,'FIX','tool','Live2D Cubism is not Spine. Export PNG sequence; confirm tool/version with Bao.');return finish(result);}
  const file=names.includes(unit.files.json)?unit.files.json:names.includes(unit.files.binary)?unit.files.binary:null;
  if (!file) {issue(result,'FIX','name',`Expected ${unit.files.json} or ${unit.files.binary}`);return finish(result);}
  try {
    const settings=names.includes('intake.json')?JSON.parse(await safeRead(folder,'intake.json')):{};
    const atlasText=(await safeRead(folder,unit.files.atlas)).toString('utf8');
    const atlas=new Spine.TextureAtlas(atlasText),pages={};
    for (const page of atlas.pages) pages[page.name]=await safeRead(folder,page.name);
    const bytes=await safeRead(folder,file), format=file.endsWith('.skel')?'binary':'json';
    const source=format==='binary'?new Uint8Array(bytes):JSON.parse(bytes);
    const checked=validateSkeleton({unit,source,atlasText,pages,scale:scale??settings.scale??1,format});
    return {...checked,skeletonFile:file,atlasFile:unit.files.atlas,files:[file,unit.files.atlas,...(checked.files??[])]};
  } catch (error) {issue(result,'FIX','parse',String(error.message??error));return finish(result);}
}
if (process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  const [id,folder]=process.argv.slice(2),unit=(await readSlots()).units.find(u=>u.id===id);
  if (!unit||!folder) {console.error('Usage: node tools/cardrpg-look/spine/validate.mjs <id> <export-folder>');process.exitCode=2;}
  else {const result=await validateDelivery(resolve(folder),unit);console.log(JSON.stringify(result,null,2));process.exitCode=result.accepted?0:1;}
}
