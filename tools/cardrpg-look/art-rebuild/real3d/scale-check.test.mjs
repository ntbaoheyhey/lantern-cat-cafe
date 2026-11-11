import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {manifest,io,measure,checkRoster} from './scale-check.mjs';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json');
const {Document}=require('@gltf-transform/core');
const unit=manifest.units.find(u=>u.id==='mochi');
function fixture({height=1,depth=.3,skin=true,prop=true}={}){
 const d=new Document(),b=d.createBuffer(),scene=d.createScene();
 const positions=new Float32Array([-.2,0,-depth/2,.2,0,depth/2,0,height,0]);
 const accessor=d.createAccessor().setType('VEC3').setArray(positions).setBuffer(b);
 const primitive=d.createPrimitive().setAttribute('POSITION',accessor);
 const mesh=d.createMesh().addPrimitive(primitive),body=d.createNode('body').setMesh(mesh);scene.addChild(body);
 const joint=d.createNode('root');scene.addChild(joint);
 if(skin){body.setSkin(d.createSkin().addJoint(joint));primitive.setAttribute('JOINTS_0',d.createAccessor().setType('VEC4').setArray(new Uint16Array(12)).setBuffer(b));primitive.setAttribute('WEIGHTS_0',d.createAccessor().setType('VEC4').setArray(new Float32Array([1,0,0,0,1,0,0,0,1,0,0,0])).setBuffer(b));}
 for(const name of Object.values(unit.sockets))joint.addChild(d.createNode(name));
 if(prop)scene.addChild(d.createNode('raised_prop').setMesh(mesh).setTranslation([0,5,0]));
 const input=d.createAccessor().setType('SCALAR').setArray(new Float32Array([0,1])).setBuffer(b),output=d.createAccessor().setType('VEC3').setArray(new Float32Array(6)).setBuffer(b);
 for(const name of manifest.clips){const sampler=d.createAnimationSampler().setInput(input).setOutput(output);d.createAnimation(name).addSampler(sampler).addChannel(d.createAnimationChannel().setTargetNode(joint).setTargetPath('translation').setSampler(sampler));}
 return d;
}
test('decodes actual GLB body bounds, excluding a raised prop',async()=>{const loader=await io();const decoded=await loader.readBinary(await loader.writeBinary(fixture()));assert.equal(measure(decoded,unit).height,1);});
test('rejects oversize, flat and unskinned actual GLBs',async()=>{const loader=await io();for(const [opts,error] of [[{height:1.2},/height/],[{depth:.001},/volume/],[{skin:false},/skin/]]){const decoded=await loader.readBinary(await loader.writeBinary(fixture(opts)));assert.throws(()=>measure(decoded,unit),error);}});
test('applies world transforms and rejects absent body nodes',()=>{const d=fixture();d.getRoot().listNodes().find(n=>n.getName()==='body').setScale([1,1.2,1]);assert.throws(()=>measure(d,unit),/height/);assert.throws(()=>measure(fixture(),{...unit,bodyNodes:['missing']}),/absent/);});
test('strict delivery cannot pass while a unit is pending',async()=>{const result=await checkRoster();assert.equal(result.accepted+result.pending.length,25);if(result.pending.length)await assert.rejects(checkRoster({strict:true}),/Unaccepted/);});
