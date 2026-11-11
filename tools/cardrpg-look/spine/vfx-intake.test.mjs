import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,cp,symlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {validateVfx,intakeVfx} from './vfx-intake.mjs';
const fixture=resolve(import.meta.dirname,'fixtures/pass');
async function setup(run){const dir=await mkdtemp('/tmp/cardrpg-c-vfx-');try{await cp(fixture,dir,{recursive:true});await run(dir);}finally{await rm(dir,{recursive:true,force:true});}}
const sequence={id:'mochi-1',format:'sequence',socket:'mainHand',cue:'hit',width:256,height:512,scale:.5,fps:24,frames:Array(12).fill('mochi.png')};
test('PNG designer effect installs without touching source; invalid replacement preserves accepted manifest',()=>setup(async dir=>{
 await writeFile(resolve(dir,'effect.json'),JSON.stringify(sequence));const before=await readFile(resolve(dir,'effect.json'));
 const root=resolve(dir,'repository');await mkdir(resolve(root,'assets/cardrpg-look/vfx-designer'),{recursive:true});const manifest=resolve(root,'assets/cardrpg-look/vfx-designer/registry.json');await writeFile(manifest,'{"version":1,"effects":{}}');
 assert.equal((await intakeVfx({id:'mochi-1',folder:dir,root,install:true})).installed,true);assert.deepEqual(await readFile(resolve(dir,'effect.json')),before);const accepted=await readFile(manifest);
 await writeFile(resolve(dir,'effect.json'),JSON.stringify({...sequence,frames:['missing.png']}));assert.equal((await intakeVfx({id:'mochi-1',folder:dir,root,install:true})).accepted,false);assert.deepEqual(await readFile(manifest),accepted);
 await writeFile(resolve(dir,'effect.json'),before);
 const broken=(await readFile(resolve(dir,'mochi.png'))).subarray(0,33);await writeFile(resolve(dir,'mochi.png'),broken);
 const corrupt=await intakeVfx({id:'mochi-1',folder:dir,root,install:true});assert.equal(corrupt.installed,false);assert.equal(corrupt.accepted,false);
 assert.ok(corrupt.issues.some(i=>i.severity==='FIX'&&i.message.includes('PNG')));
 assert.deepEqual(await readFile(manifest),accepted);assert.deepEqual(await readFile(resolve(dir,'mochi.png')),broken);
}));
test('official Spine effect parser accepts centered export and rejects version, crop and nonfinite bones',()=>setup(async dir=>{
 const source=JSON.parse(await readFile(resolve(dir,'mochi.json')));source.bones[0].y=-256;source.animations.effect=source.animations.attack;
 const spec={id:'mochi-1',format:'spine',socket:'vfxOrigin',cue:'cast',width:256,height:512,scale:1,skeleton:'mochi.json',atlas:'mochi.atlas',animation:'effect'};
 await writeFile(resolve(dir,'effect.json'),JSON.stringify(spec));await writeFile(resolve(dir,'mochi.json'),JSON.stringify(source));assert.equal((await validateVfx(dir,'mochi-1')).accepted,true);
 for(const patch of [{width:100},{height:100},{scale:0}]){await writeFile(resolve(dir,'effect.json'),JSON.stringify({...spec,...patch}));assert.equal((await validateVfx(dir,'mochi-1')).accepted,false);}
 await writeFile(resolve(dir,'effect.json'),JSON.stringify(spec));source.skeleton.spine='4.1.00';await writeFile(resolve(dir,'mochi.json'),JSON.stringify(source));assert.equal((await validateVfx(dir,'mochi-1')).accepted,false);
}));
test('malformed frames, timing, IDs and escaping paths are blocked',()=>setup(async dir=>{
 for(const patch of [{frames:[]},{fps:0},{height:100},{id:'other'},{cue:'nothing'},{frames:['../outside.png']}]){await writeFile(resolve(dir,'effect.json'),JSON.stringify({...sequence,...patch}));assert.equal((await validateVfx(dir,'mochi-1')).accepted,false);}
 await symlink(resolve(fixture,'mochi.png'),resolve(dir,'escape.png'));await writeFile(resolve(dir,'effect.json'),JSON.stringify({...sequence,frames:['escape.png']}));assert.equal((await validateVfx(dir,'mochi-1')).accepted,false);
}));
