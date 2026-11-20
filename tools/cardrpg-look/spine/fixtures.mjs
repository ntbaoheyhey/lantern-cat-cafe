/** Original geometric parser fixture, not character art. Regenerate deterministically. */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { CONFIG } from './validate.mjs';
const root=resolve(import.meta.dirname,'fixtures');
function crc32(bytes) {let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
const chunk=(name,data)=>{const type=Buffer.from(name),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc32(Buffer.concat([type,data])));return Buffer.concat([head,type,data,tail]);};
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(64,0);ihdr.writeUInt32BE(128,4);ihdr[8]=8;ihdr[9]=6;
const scan=Buffer.alloc((64*4+1)*128);for(let y=0;y<128;y++)for(let x=0;x<64;x++){const o=y*(64*4+1)+1+x*4;scan.set([190,149,93,255],o);}
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(scan)),chunk('IEND',Buffer.alloc(0))]);
const atlas='mochi.png\nsize: 64,128\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\npma: true\nbody\nbounds: 0,0,64,128\n';
const skeleton={skeleton:{spine:CONFIG.runtimeVersion+'.00',width:256,height:512},bones:[{name:'root'},{name:'hip',parent:'root',y:256},{name:'head',parent:'hip',y:160},{name:'hp-anchor',parent:'head',y:128},{name:'vfx-origin',parent:'hip'},{name:'main-hand',parent:'hip',x:128},{name:'off-hand',parent:'hip',x:-128}],slots:[{name:'body',bone:'hip',attachment:'body'}],skins:[{name:'default',attachments:{body:{body:{width:256,height:512}}}}],events:{hit:{},cast:{},'ult-start':{},'ult-end':{}},animations:{}};
for(const [name,spec] of Object.entries(CONFIG.animations).filter(([,s])=>!s.bossOnly)){
 const duration=(spec.seconds[0]+spec.seconds[1])/2;
 skeleton.animations[name]={bones:{hip:{translate:[{time:0},{time:duration}]}}};
 if(Object.keys(spec.events).length)skeleton.animations[name].events=Object.entries(spec.events).map(([name,fraction])=>({name,time:fraction*duration}));
}
for(const kind of ['pass','fail-version','fail-bones','fail-animation-height']){
 const s=structuredClone(skeleton);
 if(kind==='fail-version')s.skeleton.spine='3.8.99';
 if(kind==='fail-bones')s.bones=s.bones.filter(b=>b.name!=='off-hand');
 if(kind==='fail-animation-height'){delete s.animations.ko;s.skins[0].attachments.body.body.height=850;}
 const dir=resolve(root,kind);await mkdir(dir,{recursive:true});
 await writeFile(resolve(dir,'mochi.json'),JSON.stringify(s,null,2)+'\n');await writeFile(resolve(dir,'mochi.atlas'),atlas);await writeFile(resolve(dir,'mochi.png'),png);
}
console.log('Wrote one passing / three failing original geometric Spine fixtures.');
