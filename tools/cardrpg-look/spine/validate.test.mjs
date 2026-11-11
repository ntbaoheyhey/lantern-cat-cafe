import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, mkdir, writeFile, cp, rm, symlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ROOT, CONFIG, Spine, readSlots, validateDelivery, validateSkeleton, pngSize } from './validate.mjs';
import { intake } from './intake.mjs';
const slots=await readSlots(),unit=slots.units.find(u=>u.id==='mochi'),fixtures=resolve(import.meta.dirname,'fixtures');
const input=async()=>({unit,source:JSON.parse(await readFile(resolve(fixtures,'pass/mochi.json'),'utf8')),atlasText:await readFile(resolve(fixtures,'pass/mochi.atlas'),'utf8'),pages:{'mochi.png':await readFile(resolve(fixtures,'pass/mochi.png'))}});
test('all 25 units retain exact tiers, sockets, skills, portable VFX folders and fallback paths',()=>{
 assert.equal(slots.units.length,25);assert.equal(new Set(slots.units.map(u=>u.id)).size,25);
 assert.equal(slots.units.filter(u=>u.tier==='cat').length,12);
 for(const u of slots.units){assert.deepEqual(u.requiredBones,CONFIG.requiredBones);assert.ok(u.targetHeight>=u.heightRange[0]&&u.targetHeight<=u.heightRange[1]);assert.ok(u.placeholder.skeleton.endsWith(`${u.id}.json`));assert.equal(u.sockets.feet,'root');for(const skill of u.skills){assert.ok(skill.id);assert.ok(!skill.designerVfx.includes(':'));assert.ok(u.animations.includes(skill.animation));}}
 assert.equal(slots.units.reduce((n,u)=>n+u.skills.length,0),74);
});
test('official parser accepts the complete fixture and measures its rendered setup bounds',async()=>{
 const report=await validateDelivery(resolve(fixtures,'pass'),unit);assert.equal(report.verdict,'PASS',JSON.stringify(report));assert.ok(Math.abs(report.metrics.height-512)<.01);assert.ok(Math.abs(report.metrics.width-256)<.01);assert.equal(Object.keys(report.animations).length,8);
});
test('PNG gate decodes pixels and rejects truncated data, corrupt IDAT and invalid CRC',async()=>{
 const original=await readFile(resolve(fixtures,'pass/mochi.png'));
 assert.deepEqual(pngSize(original),[64,128]);
 const corrupt=Buffer.from(original),idat=corrupt.indexOf(Buffer.from('IDAT'));assert.ok(idat>0);corrupt[idat+5]^=0x80;
 const badCrc=Buffer.from(original);badCrc[29]^=1;
 for(const bytes of [original.subarray(0,33),original.subarray(0,original.length-5),corrupt,badCrc])assert.throws(()=>pngSize(bytes));
});
for(const [fixture,codes] of [['fail-version',['version']],['fail-bones',['bone']],['fail-animation-height',['animation','height']]])test(`${fixture} is blocked with actionable FIX reasons`,async()=>{
 const result=await validateDelivery(resolve(fixtures,fixture),unit);assert.equal(result.accepted,false);for(const code of codes)assert.ok(result.issues.some(i=>i.severity==='FIX'&&i.code===code),JSON.stringify(result));
});
test('event timing and budgets warn without blocking; manifest scale fixes unit size without changing source',async()=>{
 const options=await input();delete options.source.animations.attack.events;for(let n=0;n<40;n++)options.source.bones.push({name:`extra-${n}`,parent:'root'});
 let result=validateSkeleton(options);assert.equal(result.verdict,'PASS_WITH_WARN');assert.ok(result.issues.some(i=>i.code==='event'));assert.ok(result.issues.some(i=>i.code==='budget'));
 options.source.skins[0].attachments.body.body.height=1024;options.source.skins[0].attachments.body.body.width=512;options.scale=.5;result=validateSkeleton(options);assert.equal(result.accepted,true);assert.ok(Math.abs(result.metrics.height-512)<.01);
});
test('parser rejects missing atlas regions, unsafe pages and non-finite transforms',async()=>{
 for(const mutate of [o=>o.source.skins[0].attachments.body.body.path='missing',o=>o.atlasText=o.atlasText.replace('mochi.png','../../outside.png'),o=>o.source.bones[1].x=Infinity]){const o=await input();mutate(o);assert.equal(validateSkeleton(o).accepted,false);}
});
test('unreachable sequence contact warns and reports the timed fallback without changing the delivery',async()=>{
 const temp=await mkdtemp('/tmp/cardrpg-c-event-sequence-test-');
 try{
  await cp(resolve(fixtures,'pass/mochi.png'),resolve(temp,'frame.png'));
  const animations=Object.fromEntries(unit.animations.map(name=>{const spec=CONFIG.animations[name],duration=(spec.seconds[0]+spec.seconds[1])/2;return[name,{fps:20,frames:Array(Math.round(duration*20)).fill('frame.png'),events:Object.entries(spec.events).map(([name,f])=>({name,time:f*duration}))}];}));
  const sequence={id:'mochi',facing:'right',height:512,width:256,sockets:Object.fromEntries(unit.requiredBones.map(n=>[n,[0,0]])),animations};
  for(const time of [-.1,3,null]){
   sequence.animations.skill.events.find(e=>e.name==='hit').time=time;
   const bytes=JSON.stringify(sequence);await writeFile(resolve(temp,'sequence.json'),bytes);
   const result=await validateDelivery(temp,unit);assert.equal(result.verdict,'PASS_WITH_WARN',JSON.stringify(result));
   assert.ok(result.issues.some(i=>i.code==='event-time'&&i.message.includes('ignored during playback')));
   assert.ok(result.issues.some(i=>i.code==='event'&&i.message.includes('skill: no usable hit; timed fallback')));
   assert.equal(await readFile(resolve(temp,'sequence.json'),'utf8'),bytes);
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('independent official AnimationStates share cached data without sharing pose or events',async()=>{
 const o=await input(),atlas=new Spine.TextureAtlas(o.atlasText);for(const p of atlas.pages)p.setTexture(new Spine.FakeTexture({width:64,height:128}));
 const data=new Spine.SkeletonJson(new Spine.AtlasAttachmentLoader(atlas)).readSkeletonData(o.source),s1=new Spine.Skeleton(data),s2=new Spine.Skeleton(data),a1=new Spine.AnimationState(new Spine.AnimationStateData(data)),a2=new Spine.AnimationState(new Spine.AnimationStateData(data));let hits=0;
 a1.addListener({event:(_entry,event)=>{if(event.data.name==='hit')hits++;}});a1.setAnimation(0,'attack',false);a2.setAnimation(0,'idle',true);a1.update(.6);a1.apply(s1);a2.update(.1);a2.apply(s2);assert.equal(hits,1);assert.equal(a2.getCurrent(0).animation.name,'idle');assert.notEqual(s1.bones[0],s2.bones[0]);
});
test('intake installs immutable accepted revision, preserves designer bytes and keeps it after a failed replacement',async()=>{
 const temp=await mkdtemp('/tmp/cardrpg-c-intake-test-');
 try{await mkdir(resolve(temp,'assets/cardrpg-look/spine'),{recursive:true});await writeFile(resolve(temp,'assets/cardrpg-look/spine/slots.json'),JSON.stringify(slots));const folder=resolve(temp,'designer');await cp(resolve(fixtures,'pass'),folder,{recursive:true});const before=await readFile(resolve(folder,'mochi.json'));
  const pass=await intake({id:'mochi',folder,root:temp,install:true});assert.equal(pass.installed,true);assert.deepEqual(await readFile(resolve(folder,'mochi.json')),before);const manifest=await readFile(resolve(temp,'assets/cardrpg-look/spine/slots.json'));
  const fail=await intake({id:'mochi',folder:resolve(fixtures,'fail-bones'),root:temp,install:true});assert.equal(fail.installed,false);assert.deepEqual(await readFile(resolve(temp,'assets/cardrpg-look/spine/slots.json')),manifest);
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('corrupt atlas and sequence replacements preserve the accepted revision and source bytes',async()=>{
 const temp=await mkdtemp('/tmp/cardrpg-c-png-intake-test-');
 try{
  await mkdir(resolve(temp,'assets/cardrpg-look/spine'),{recursive:true});await writeFile(resolve(temp,'assets/cardrpg-look/spine/slots.json'),JSON.stringify(slots));
  const folder=resolve(temp,'designer');await cp(resolve(fixtures,'pass'),folder,{recursive:true});
  const pass=await intake({id:'mochi',folder,root:temp,install:true});assert.equal(pass.installed,true);
  const before=await readFile(resolve(temp,'assets/cardrpg-look/spine/slots.json'));
  const broken=(await readFile(resolve(folder,'mochi.png'))).subarray(0,33);await writeFile(resolve(folder,'mochi.png'),broken);
  for(const format of ['atlas','sequence']){
   if(format==='sequence'){
    const animations=Object.fromEntries(unit.animations.map(name=>[name,{frames:Array(40).fill('mochi.png')}]));
    await writeFile(resolve(folder,'sequence.json'),JSON.stringify({id:'mochi',facing:'right',height:512,width:256,fps:20,sockets:Object.fromEntries(unit.requiredBones.map(name=>[name,[0,256]])),animations}));
   }
   const fail=await intake({id:'mochi',folder,root:temp,install:true});assert.equal(fail.accepted,false,format);assert.equal(fail.installed,false,format);
   assert.ok(fail.issues.some(i=>i.severity==='FIX'&&i.message.includes('PNG')));
   assert.deepEqual(await readFile(resolve(temp,'assets/cardrpg-look/spine/slots.json')),before);
   assert.deepEqual(await readFile(resolve(folder,'mochi.png')),broken);
  }
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('the latest installed format is active while earlier accepted revisions remain available',async()=>{
 const temp=await mkdtemp('/tmp/cardrpg-c-format-switch-test-');
 try{
  const manifest=resolve(temp,'assets/cardrpg-look/spine/slots.json');await mkdir(resolve(temp,'assets/cardrpg-look/spine'),{recursive:true});await writeFile(manifest,JSON.stringify(slots));
  const folder=resolve(temp,'designer');await cp(resolve(fixtures,'pass'),folder,{recursive:true});
  const original=await readFile(resolve(folder,'mochi.json'));
  const current=async()=>JSON.parse(await readFile(manifest,'utf8')).units.find(u=>u.id==='mochi');
  assert.equal((await intake({id:'mochi',folder,root:temp,install:true})).installed,true);
  const spine=await current();assert.equal(spine.activeSource,'designer');
  const animations=Object.fromEntries(unit.animations.map(name=>{const spec=CONFIG.animations[name],duration=(spec.seconds[0]+spec.seconds[1])/2;return[name,{fps:20,frames:Array(Math.round(duration*20)).fill('mochi.png'),events:Object.entries(spec.events).map(([name,f])=>({name,time:f*duration}))}];}));
  await writeFile(resolve(folder,'sequence.json'),JSON.stringify({id:'mochi',facing:'right',height:512,width:256,sockets:Object.fromEntries(unit.requiredBones.map(n=>[n,[0,0]])),animations}));
  const beforeDryRun=await readFile(manifest);await intake({id:'mochi',folder,root:temp});assert.deepEqual(await readFile(manifest),beforeDryRun);
  assert.equal((await intake({id:'mochi',folder,root:temp,install:true})).installed,true);
  const sequence=await current();assert.equal(sequence.activeSource,'sequence');assert.deepEqual(sequence.designer,spine.designer);
  const accepted=await readFile(manifest);await intake({id:'mochi',folder:resolve(fixtures,'fail-bones'),root:temp,install:true});assert.deepEqual(await readFile(manifest),accepted);
  assert.equal((await intake({id:'mochi',folder:resolve(fixtures,'pass'),root:temp,install:true})).installed,true);
  const restored=await current();assert.equal(restored.activeSource,'designer');assert.deepEqual(restored.sequence,sequence.sequence);
  assert.deepEqual(await readFile(resolve(folder,'mochi.json')),original);
 }finally{await rm(temp,{recursive:true,force:true});}
});
test('Cubism is identified and PNG sequence is validated; symlink escapes are blocked',async()=>{
 const temp=await mkdtemp('/tmp/cardrpg-c-sequence-test-');try{
 await writeFile(resolve(temp,'mochi.model3.json'),'{}');let result=await validateDelivery(temp,unit);assert.equal(result.format,'cubism');assert.equal(result.accepted,false);
 const png=await readFile(resolve(fixtures,'pass/mochi.png'));await writeFile(resolve(temp,'frame.png'),png);
 const animations=Object.fromEntries(unit.animations.map(name=>{const spec=CONFIG.animations[name],duration=(spec.seconds[0]+spec.seconds[1])/2;return[name,{fps:20,frames:Array(Math.round(duration*20)).fill('frame.png'),events:Object.entries(spec.events).map(([name,f])=>({name,time:f*duration}))}];}));
 const sequence={id:'mochi',facing:'right',height:512,width:256,sockets:Object.fromEntries(unit.requiredBones.map(n=>[n,[0,0]])),animations};await writeFile(resolve(temp,'sequence.json'),JSON.stringify(sequence));result=await validateDelivery(temp,unit);assert.equal(result.accepted,true,JSON.stringify(result));assert.equal(result.cubism,true);
 await rm(resolve(temp,'frame.png'));await symlink(resolve(fixtures,'pass/mochi.png'),resolve(temp,'frame.png'));result=await validateDelivery(temp,unit);assert.equal(result.accepted,false);assert.ok(result.issues.some(i=>i.message.includes('escapes')));
 }finally{await rm(temp,{recursive:true,force:true});}
});
