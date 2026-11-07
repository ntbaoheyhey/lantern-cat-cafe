// Offline visual checkpoint from captured game pixels and actual-model Blender renders.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json'),sharp=require('sharp');
const folder=process.env.LOOK_CAPTURE_DIR||'reports/cardrpg-look/validation/l1/after';
const beforeFolder=process.env.LOOK_BEFORE_DIR||'reports/cardrpg-look/validation/l1/before-neutral';
const before=JSON.parse(await readFile(`${beforeFolder}/captures.json`,'utf8'));
const after=JSON.parse(await readFile(`${folder}/captures.json`,'utf8'));
const uri=(bytes,mime)=>`data:${mime};base64,${bytes.toString('base64')}`;
const cats=[];
for(const cat of ['mochi','soot','clover']){
 const file=`1280x720-unit-${cat}.png`,old=before.rows.find(r=>r.file===file),next=after.rows.find(r=>r.file===file);
 if(!old||!next)throw Error(`Missing matched camera capture: ${cat}`);
 const boxes=[old,next].flatMap(r=>r.crops.filter(c=>c.asset===cat).map(c=>c.box));
 const c=next.canvas;
 const left=Math.floor(Math.max(c.x,Math.min(...boxes.map(b=>b[0]))-7)*2),top=Math.floor(Math.max(c.y,Math.min(...boxes.map(b=>b[1]))-7)*2);
 const right=Math.ceil(Math.min(c.x+c.width,Math.max(...boxes.map(b=>b[2]))+7)*2),bottom=Math.ceil(Math.min(c.y+c.height,Math.max(...boxes.map(b=>b[3]))+7)*2);
 const pair=[];
 for(const path of [`${beforeFolder}/${file}`,`${folder}/${file}`])pair.push(uri(await sharp(path).extract({left,top,width:right-left,height:bottom-top}).webp({quality:94}).toBuffer(),'image/webp'));
 const portrait=await readFile(`assets/cardrpg-look/portraits/${cat}-2x.webp`);
 const video=await readFile(`reports/cardrpg-look/turntables/${cat}/turntable.mp4`);
 const metrics=JSON.parse(await readFile(`assets/cardrpg-look/${cat}-author.json`,'utf8'));
 cats.push({cat,pair,portrait:uri(portrait,'image/webp'),video:uri(video,'video/mp4'),metrics});
}
const cards=cats.map(({cat,pair,portrait,video,metrics})=>`<article><h2>${cat[0].toUpperCase()+cat.slice(1)}</h2><div class="images"><div class="wipe"><img src="${pair[0]}" alt="${cat} classic game capture"><img class="after" src="${pair[1]}" alt="${cat} atelier game capture"><span>Classic / Atelier</span></div><img class="portrait" src="${portrait}" alt="${cat} portrait from the exported game model"></div><label>Move the comparison <input type="range" min="0" max="100" value="50" oninput="this.closest('article').style.setProperty('--wipe',this.value+'%')"></label><video controls loop muted playsinline preload="none" poster="${portrait}" src="${video}"></video><p>${metrics.triangles.toLocaleString()} triangles · ${metrics.drawMeshes} animated meshes · 1024px baked atlas</p></article>`).join('');
const html=`<!doctype html>
<!-- REFERENCE: tools/cardrpg-look/blender/{author,render}.py | reports/cardrpg-look/validation/l1 | docs/design/cardrpg/LOOK-BIBLE.md -->
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data:;media-src data:;style-src 'unsafe-inline';script-src 'unsafe-inline'"><title>The Lantern — hero atelier</title><style>*{box-sizing:border-box}body{margin:0;background:#102129;color:#fff0d2;font:16px/1.55 system-ui}header,main,footer{max-width:1400px;margin:auto;padding:28px}header p{color:#b3c0ba;max-width:72ch}h1{font:48px/1.1 Georgia;margin:12px 0}h2{font:30px Georgia;margin:0 0 18px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}article{--wipe:50%;background:#233e46;padding:22px;border:1px solid #516364;border-radius:20px;min-width:0}a{color:#f3bb61}.images{display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:8px}.wipe{position:relative}.wipe img{display:block;width:100%}.wipe .after{position:absolute;inset:0;clip-path:inset(0 0 0 var(--wipe))}.wipe span{position:absolute;bottom:0;left:0;right:0;font-size:11px;background:#102129dd;padding:5px}.portrait{width:100%;max-height:290px;object-fit:contain}label{display:block;font-size:13px;margin:18px 0}input{display:block;width:100%;accent-color:#f3bb61}video{width:100%;height:230px;background:#172d36;border-radius:12px}article p,footer{font-size:12px;color:#b3c0ba}@media(max-width:900px){main{grid-template-columns:1fr}video{height:320px}}</style><header><p>THE LANTERN · ORIGINAL HERO ATELIER</p><h1>Three familiar faces, sculpted anew.</h1><p>Drag each comparison to inspect the same in-game camera. Portraits and turntables use the exported game models. This is the hero checkpoint; the inherited stage and effects are still awaiting their own visual passes.</p><a href="index.html">Open the offline game →</a></header><main>${cards}</main><footer>Self-review evidence: CHECKPOINT.md · Source artifact ${after.sha256} · Before ${before.sha256}. No external art or generated imagery.</footer></html>`;
await writeFile('docs/cardrpg-look/slice.html',html);
await writeFile('reports/cardrpg-look/validation/l1/slice-build.json',JSON.stringify({bytes:Buffer.byteLength(html),sha256:createHash('sha256').update(html).digest('hex'),capture:after.sha256,baseline:before.sha256},null,2)+'\n');
console.log(JSON.stringify({bytes:Buffer.byteLength(html)}));
