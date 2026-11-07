// Portable L6 handoff preview. A owns the game's collection/invitation screens.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const manifestPath='apps/web/src/game/cardrpg/look-assets.json';
const manifestBytes=await readFile(manifestPath),manifest=JSON.parse(manifestBytes);
if(!manifest.complete||!['L6','L5'].includes(manifest.phase))throw Error('Requires a reviewed complete art manifest');
const hash=data=>createHash('sha256').update(data).digest('hex');
const embedded=new Map();
async function data(path){
 if(!embedded.has(path)){
  const bytes=await readFile(path),mime=path.endsWith('.webp')?'image/webp':'image/png';
  embedded.set(path,{url:`data:${mime};base64,${bytes.toString('base64')}`,sha256:hash(bytes),bytes:bytes.length});
 }
 return embedded.get(path).url;
}
const rarityNames=['common','rare','epic','legendary'];
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cards=[];
for(const [index,[id,row]] of Object.entries(manifest.portraits).entries()){
 const rarity=rarityNames[index%4],frame=manifest.frames[rarity];
 const portrait=await data(row.portrait['2x']);
 const skills=[];
 for(let number=1;number<=4;number++){
  const key=`${id}-${number}`,skill=manifest.skills[key];
  skills.push(`<img class="skill" width="64" height="64" alt="${escape(key)}" data-pixels="128,128" data-after="${await data(skill.icon2x)}" data-before="${await data(`reports/cardrpg-look/rounds/art/before/${key}.png`)}" src="${await data(skill.icon2x)}">`);
 }
 cards.push(`<article><h2>${escape(id[0].toUpperCase()+id.slice(1))}</h2><div class="portrait"><img class="cat" width="256" height="320" alt="${escape(id)} portrait" data-pixels="512,640" data-after="${portrait}" data-before="${await data(`reports/cardrpg-look/rounds/art/before/${id}.webp`)}" src="${portrait}"><img class="plate" width="256" height="320" alt="${rarity} lighting plate" data-pixels="512,640" src="${await data(frame.plate2x)}"></div><div class="skills">${skills.join('')}</div><p>${escape(rarity)} · ${row.tier==='look-slice-model'?'Sculpted atelier model':'Original roster model'}</p></article>`);
}
const html=`<!doctype html>
<!-- REFERENCE: tools/cardrpg-look/art-gallery.mjs | ${manifestPath} | reports/cardrpg-look/rounds/art -->
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none';img-src data:;style-src 'unsafe-inline';script-src 'unsafe-inline';connect-src data:"><title>The Lantern · Atelier card art</title>
<style>*{box-sizing:border-box}body{margin:0;background:#102129;color:#fff0d2;font:15px system-ui;--panel:#233e46;--line:#476269}body.light{background:#e8d7b8;color:#233e46;--panel:#f5ebdc;--line:#b3c0ba}header{max-width:1180px;margin:0 auto;padding:28px 24px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px}h1{font-size:26px;margin:0 0 8px}header p{margin:0;opacity:.8}nav{display:flex;gap:8px;flex-shrink:0}button{font:inherit;color:inherit;background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:10px 14px;cursor:pointer}button:focus-visible{outline:3px solid #f3bb61;outline-offset:3px}main{display:grid;grid-template-columns:repeat(4,256px);gap:26px;justify-content:center;padding:12px 24px 32px}article{width:256px;background:var(--panel);border-radius:18px;overflow:hidden}h2{font-size:18px;margin:15px 16px 6px}.portrait{position:relative;width:256px;height:320px;background:radial-gradient(ellipse at 50% 42%,#54707855,transparent 70%)}.portrait img{position:absolute;inset:0;width:256px;height:320px;object-fit:contain}.portrait .cat{padding:16px}.plate{pointer-events:none}.skills{display:flex;width:256px;padding-top:8px}.skill{width:64px;height:64px;object-fit:contain}article p{font-size:11px;text-transform:uppercase;letter-spacing:.06em;margin:12px 12px 16px;opacity:.75}footer{max-width:1130px;margin:0 auto;padding:0 24px 32px;line-height:1.6;opacity:.75}.before .plate{visibility:hidden}@media(max-width:1175px){main{grid-template-columns:repeat(3,256px)}}@media(max-width:865px){main{grid-template-columns:repeat(2,256px)}header{align-items:flex-start;flex-direction:column}}@media(max-width:575px){main{grid-template-columns:256px}}</style>
<header><div><h1>The Lantern · Atelier card art</h1><p>Twelve companions, their crafted keepsakes, and four enamel finishes.</p></div><nav aria-label="Art comparison"><button id="theme" aria-pressed="false">Light backdrop</button><button id="compare" aria-pressed="false">Show before</button></nav></header><main>${cards.join('')}</main><footer>Rarity plates are shown in a repeating order for comparison. Nine portraits still use the existing roster models; sculpture updates follow separately. This preview supplies art for the game’s card screens.</footer>
<script>window.__artManifestSha=${JSON.stringify(hash(manifestBytes))};document.querySelector('#theme').onclick=function(){const on=document.body.classList.toggle('light');this.setAttribute('aria-pressed',String(on));this.textContent=on?'Dark backdrop':'Light backdrop'};document.querySelector('#compare').onclick=function(){const on=document.body.classList.toggle('before');this.setAttribute('aria-pressed',String(on));this.textContent=on?'Show atelier':'Show before';for(const img of document.querySelectorAll('[data-after]'))img.src=on?img.dataset.before:img.dataset.after};window.__artReady=Promise.all([...document.images].map(image=>image.decode()));</script></html>`;
await mkdir('docs/cardrpg-look',{recursive:true});
await writeFile('docs/cardrpg-look/art.html',html);
await writeFile('reports/cardrpg-look/rounds/art/gallery-build.json',JSON.stringify({manifestSha256:hash(manifestBytes),sha256:hash(html),bytes:Buffer.byteLength(html),files:Object.fromEntries([...embedded].map(([path,{sha256,bytes}])=>[path,{sha256,bytes}]))},null,2)+'\n');
console.log(JSON.stringify({cards:cards.length,bytes:Buffer.byteLength(html),sha256:hash(html)}));
