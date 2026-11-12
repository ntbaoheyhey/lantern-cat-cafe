/** Split the approved-to-review original sheets; never synthesize replacement art. */
import {readFileSync,writeFileSync,mkdirSync,statSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const root=process.cwd(),require=createRequire(resolve(root,'package.json')),{PNG}=require('pngjs');
const source=process.env.VFX_SOURCE??'/Users/bao/art/vfx-2026-11-12',out=resolve(root,'assets/cardrpg-look/vfx-layered');
mkdirSync(out,{recursive:true});
const names=['charge-glow','core-shape','trail-smear','impact-burst','sparks','ground-decal','screen-flash','residue'];
const pilots=[{id:'mochi-1',owner:'mochi',name:'Door knock',duration:1173,impact:741},
 {id:'mochi-4',owner:'mochi',name:'Warm shelter',duration:1677,impact:900,friendly:true},
 {id:'enemy:yarn-giant',owner:'yarn-giant',name:'Yarn crash',duration:1164,impact:746}];
const magick=(args)=>execFileSync('magick',args,{stdio:'pipe',maxBuffer:20_000_000});
const key=(t,alpha=1,sx=1,sy=sx,x=0,y=0,rotate=0)=>({t,x,y,sx,sy,rotate,alpha});
function timeline(p){
 const {duration:d,impact:h,friendly:f}=p,charge=f?210:300,release=f?650:600;
 const layer=(index,anchor,socket,blend,start,end,size,keys,extra={})=>({name:names[index],region:[index%4*256,Math.floor(index/4)*256,256,256],anchor,socket,blend,start,end,size,ease:'out',keys,...extra});
 const layers=[
  layer(5,'target','feet','normal',h-40,d,1.4,[key(h-40,0,.35),key(h+65,.55,1,1),key(d,0,1.2,1.2)]),
  layer(0,'caster','mainHand','screen',charge,h,1.05,[key(charge,0,.25),key(release,.65,.7),key(h,0,1.15)]),
  layer(2,f?'target':'flight','vfxOrigin','normal',release,h+150,1.3,[key(release,0,.5,.5,-.1,.04,-.18),key(h-35,.8,1),key(h+150,0,1.25,1.1,.08,-.04,.12)]),
  layer(1,f?'target':'flight','vfxOrigin','normal',f?h-180:release,f?d-80:h+200,f?1.85:1.45,f?
   [key(h-180,0,.6,.65,0,-.02),key(h+30,.96,1,1,0,-.02),key(d-240,.9,1,1,0,-.04),key(d-80,0,1.06,1.1,0,-.1)]:
   [key(release,0,.55,.55,-.12,.1,-.4),key(h-16,1,1,1,0,0,0),key(h+75,.95,1.12,1,.08,.03,.28),key(h+200,0,1.2,.8,.14,.13,.55)]),
  layer(3,'target','vfxOrigin','normal',h,h+240,f?1.45:1.12,[key(h,0,.4),key(h+35,f?.45:1,1),key(h+240,0,1.18,1.1,.05,.03)]),
  layer(6,'target','vfxOrigin','screen',h,h+70,.9,[key(h,0,.5),key(h+16,.65,1),key(h+70,0,1.1)],{flash:true}),
  layer(4,'target','vfxOrigin','normal',h+20,d-40,1.25,[key(h+20,0,.45),key(h+65,.9,.8),key(d-40,0,1.1,1.1,.05,-.12,.3)]),
  layer(7,'target','vfxOrigin','normal',h+100,d,1.2,[key(h+100,0,.7),key(h+180,.55,1),key(d,0,1.15,1.15,.08,-.18,.2)]),
 ];
 return {version:1,id:p.id,name:p.name,owner:p.owner,duration:d,impact:h,friendly:!!f,phases:[{name:'anticipation',start:0,end:release},{name:'release',start:release,end:h},{name:'impact',start:h,end:h+100},{name:'dissipate',start:h+100,end:d}],layers};
}
const report=[];
for(const p of pilots){
 const slug=p.id.replaceAll(':','-'),dir=resolve(source,slug),input=resolve(dir,'layers-clean.png'),bytes=readFileSync(input),sheet=PNG.sync.read(bytes);
 mkdirSync(resolve(dir,'layers'),{recursive:true});mkdirSync(resolve(dir,'psd-layers'),{recursive:true});
 const layerFiles=[],atlas=new PNG({width:1024,height:512}),alpha=[];
 for(let i=0;i<8;i++){
  const left=Math.round(i%4*sheet.width/4),right=Math.round((i%4+1)*sheet.width/4),top=Math.round(Math.floor(i/4)*sheet.height/2),bottom=Math.round((Math.floor(i/4)+1)*sheet.height/2);
  const crop=new PNG({width:right-left,height:bottom-top});PNG.bitblt(sheet,crop,left,top,crop.width,crop.height,0,0);
  const file=resolve(dir,'layers',names[i]+'.png');writeFileSync(file,PNG.sync.write(crop));
  // Explicit transparent border prevents atlas bleed and preserves complete cutouts.
  magick([file,'-resize','416x416','-background','none','-gravity','center','-extent','512x512','PNG32:'+file]);
  const png=PNG.sync.read(readFileSync(file));let edge=0,opaque=0;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const a=png.data[(y*512+x)*4+3];if(x<40||x>=472||y<40||y>=472)edge=Math.max(edge,a);if(a>200)opaque++;}
  if(edge)throw Error(`${slug}/${names[i]} has contaminated gutter: ${edge}`);
  alpha.push({name:names[i],gutterAlpha:edge,opaquePixels:opaque});layerFiles.push(file);
  const small=PNG.sync.read(magick([file,'-resize','256x256','PNG32:-']));PNG.bitblt(small,atlas,0,0,256,256,i%4*256,Math.floor(i/4)*256);
 }
 const atlasPath=resolve(dir,'atlas.png');writeFileSync(atlasPath,PNG.sync.write(atlas));
 magick([atlasPath,'-quality','82','-define','webp:alpha-quality=100',resolve(out,slug+'.webp')]);
 const t=timeline(p);writeFileSync(resolve(out,slug+'.json'),JSON.stringify(t,null,2)+'\n');
 magick([resolve(dir,existsSync(resolve(dir,'key-clean.png'))?'key-clean.png':'key-original.png'),'-resize','1638x1638','-background','none','-gravity','center','-extent','2048x2048','PNG32:'+resolve(dir,'key-2048.png')]);
 // The editable PSD is a registration document, not a misleading exploded flat image.
 const psd=[];
 for(const l of t.layers){const index=names.indexOf(l.name),k=l.keys.find(k=>k.alpha>=.5)??l.keys[1];
  const size=Math.round(l.size*950),x=Math.round(1024+(k?.x??0)*950-size/2),y=Math.round((l.socket==='feet'?1520:1050)+(k?.y??0)*950-size/2),file=resolve(dir,'psd-layers',l.name+'.png');
  magick(['-size','2048x2048','xc:none','(',layerFiles[index],'-resize',`${size}x${size}`,')','-geometry',`+${x}+${y}`,'-compose','over','-composite','PNG32:'+file]);psd.push({file,name:l.name});
 }
 const composite=resolve(dir,'registered-composite.png');magick([...psd.map(l=>l.file),'-background','none','-flatten','PNG32:'+composite]);
 magick([composite,...psd.flatMap(l=>['(',l.file,'-set','label',l.name,')']),'-define','psd:write-additional-info=true',resolve(dir,slug+'.psd')]);
 const psdInfo=execFileSync('magick',['identify','-format','%n %l\n',resolve(dir,slug+'.psd')],{encoding:'utf8'});
 if(!psdInfo.includes('core-shape')||!psdInfo.startsWith('9 '))throw Error('PSD layers did not round-trip: '+psdInfo);
 report.push({id:p.id,source:input,sha256:createHash('sha256').update(bytes).digest('hex'),native:[sheet.width,sheet.height],keyExport:[2048,2048],runtimeBytes:statSync(resolve(out,slug+'.webp')).size+statSync(resolve(out,slug+'.json')).size,alpha,psd:resolve(dir,slug+'.psd'),psdInfo});
 console.log(slug,report.at(-1).runtimeBytes,'bytes; eight clean PNG layers; nine-image PSD verified');
}
writeFileSync(resolve(source,'export-audit.json'),JSON.stringify(report,null,2)+'\n');
if(report.reduce((n,p)=>n+p.runtimeBytes,0)>6_000_000)throw Error('VFX exceeds six MB download budget');
