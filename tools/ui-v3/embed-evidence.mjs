// REFERENCE: reports/cardrpg-big2/**/filmstrips; full resolution originals remain in reports.
import {existsSync,readFileSync,mkdirSync,writeFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
export function evidencePayload(root){
 const rows=[],checks=[],files=new Map(),cache='/tmp/ui-v3-evidence-cache';mkdirSync(cache,{recursive:true});
 const add=(path,native=false)=>{if(!existsSync(resolve(root,path)))return undefined;if(files.has(path))return files.get(path).id;const hash=createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex');const item={id:`b2-evidence-${files.size}`,path:resolve(root,path),out:native?resolve(root,path):`${cache}/${hash}-480-q48.webp`,sha256:hash,native};files.set(path,item);return item.id;};
 const groups=[['reports/cardrpg-big/filmstrips',null,['mochi','soot','clover']],...[['panko','mallow','sorrel'],['biscuit','inkcap','cinnamon'],['brioche','velvet','marigold']].map((owners,i)=>[`reports/cardrpg-big2/cats/batch${i+1}/filmstrips`,`reports/cardrpg-big2/cats/batch${i+1}/before`,owners]),...['e1','e2','e3','e4','boss'].map(p=>[`reports/cardrpg-big2/enemies/${p}/filmstrips`,`reports/cardrpg-big2/enemies/${p}/before`,null])];
 for(const [after,before,owners]of groups){if(!existsSync(resolve(root,after)))continue;for(const name of readdirSync(resolve(root,after)).filter(n=>n.endsWith('.webp')).sort()){
  if(owners&&!owners.some(o=>name.startsWith(o+'-')))continue;
  const slug=name.slice(0,-5),owner=slug.startsWith('enemy-')?slug.slice(6).replace(/-basic$/,''):slug.replace(/-[1-4]$/,'');
  rows.push({owner,name:slug.replaceAll('-',' '),before:before?add(`${before}/${name}`):undefined,after:add(`${after}/${name}`),source:`${before?before+' ↔ ':''}${after}/${name}`,note:'Eight measured samples. Embedded at 480×270; the full 1280×720 capture and its checks remain at the referenced report path.'});
 }}
 const boss='reports/cardrpg-big2/enemies/boss/lifecycle';if(existsSync(resolve(root,boss)))for(const name of readdirSync(resolve(root,boss)).filter(n=>n.endsWith('.webp')).sort())rows.push({owner:name.replace(/-(intro|phase)\.webp$/,''),name:name.replace('.webp','').replaceAll('-',' '),after:add(`${boss}/${name}`),source:`${boss}/checks.json`,note:'Deterministic presentation fixture, eight samples. This does not measure natural phase timing.'});
 const metrics='reports/cardrpg-big2/stage/sharpness-metrics.json';
 if(existsSync(resolve(root,metrics))){
  const measured=JSON.parse(readFileSync(resolve(root,metrics),'utf8'));
  for(const pair of measured.baselineRows??[]){
   rows.push({owner:'sharpness',name:`Sharpness · ${pair.crop}`,before:add(pair.before.path,true),after:add(pair.after.path,true),beforeLabel:'Original baseline',afterLabel:'Lane B stage',source:metrics,
    note:`Native crop pixels, without thumbnail compression. Edge variance ${pair.before.laplacianVariance.toFixed(2)} → ${pair.after.laplacianVariance.toFixed(2)} (${pair.changePercent>=0?'+':''}${pair.changePercent.toFixed(1)}%). +40% target ${pair.targetPass?'met':'missed'}. Scale, lighting and antialiasing also affect this metric.`});
  }
 }
 for(const [preset,label]of [['close','A · portrait'],['wide','B · balanced'],['far','C · stage']]){
  const path=`reports/cardrpg-big2/stage/layout/1280-${preset}-mochi-1.png`;
  if(existsSync(resolve(root,path)))rows.push({owner:'cameras',name:`Camera ${label}`,after:add(path),afterLabel:label,source:'reports/cardrpg-big2/stage/layout/measurements.json',note:'Same 1280×720 viewport and starting pose. Use the live gallery camera selector to compare the full stage at your window size.'});
 }
 const phases=[...[1,2,3].map(i=>[`Cat batch ${i}`,`reports/cardrpg-big2/cats/batch${i}`]),...['e1','e2','e3','e4','boss'].map(p=>[`Opponent ${p}`,`reports/cardrpg-big2/enemies/${p}`])];
 for(const [label,folder]of phases)for(const [kind,file]of [['Motion','motion/variety.json'],['Effects','effects/uniqueness.json']]){
  const path=`${folder}/${file}`;if(!existsSync(resolve(root,path)))continue;
  const data=JSON.parse(readFileSync(resolve(root,path),'utf8'));
  checks.push({label,kind,actions:data.rows.length,pairs:data.pairs.filter(p=>kind==='Effects'||p.required).length,offenders:data.offenders.length,faceOffenders:data.faceOffenders?.length??0,errors:data.errors?.length??0,source:path});
 }
 const list=[...files.values()].filter(f=>!existsSync(f.out));
 if(list.length){const manifest=`${cache}/pending.json`;writeFileSync(manifest,JSON.stringify(list));execFileSync(process.env.BIG_PYTHON||'/tmp/ui-v3-python/bin/python',['-c',"import json,sys; from PIL import Image\nfor f in json.load(open(sys.argv[1])):\n im=Image.open(f['path']).convert('RGB'); im.thumbnail((480,270),Image.Resampling.LANCZOS); im.save(f['out'],'WEBP',quality=48,method=6)",manifest]);}
 const tags=[...files.values()].map(f=>`<script type="application/octet-stream" id="${f.id}">data:image/${f.native?'png':'webp'};base64,${readFileSync(f.out).toString('base64')}</script>`).join('\n');
 return{rows,tags,files:[...files.entries()].map(([path,f])=>({path,sha256:f.sha256,thumbnailBytes:readFileSync(f.out).length})),script:`window.__b2Evidence=${JSON.stringify(rows).replace(/</g,'\\u003c')};window.__b2Checks=${JSON.stringify(checks).replace(/</g,'\\u003c')};`};
}
