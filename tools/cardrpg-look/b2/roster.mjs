import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {withTimingLock} from '../lock.mjs';
import {coverage} from './coverage.mjs';
const require=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json'),sharp=require('sharp');
const artifact=resolve(process.env.B2_ARTIFACT||'/tmp/cardrpg-b2-v2.html'),out=process.env.B2_OUT||'reports/cardrpg-look/b2/v2/roster';await mkdir(out,{recursive:true});
const ids=['button-guard','sock-skipper','teacup-healer','spool-ram','binding-thread','practice-cushion','pollen-scout','crumb-sentinel','needle-moth','rain-spool','yarn-giant','kettle-knight','pantry-crown'];
const rows=[],errors=[],tiles=[];
await withTimingLock('B2 thirteen original opponents',async()=>{
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(String(e)));await page.goto('file://'+artifact+'?dev=1');await page.waitForFunction(()=>window.__depthReview);
 for(const [i,id] of ids.entries()){
  await page.evaluate(id=>{const m=window.__depthReview;m.camera='wide';m.inspect('enemy:'+id,-1);},id);
  await page.waitForFunction(()=>window.__depthScene?.ready&&window.__depthReview.battle.actors.every(a=>window.__depthScene.puppets.get(a.id)?.asset===a.catalogId),null,{timeout:120000});
  await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false});
  const detail=await page.evaluate(coverage),unit=detail.units.find(u=>u.asset===id);
  const box=unit.box,c=detail.canvas;const left=Math.max(0,Math.floor(c.x+box[0]*c.width-12)),top=Math.max(0,Math.floor(c.y+box[1]*c.height-15));
  const width=Math.min(1280-left,Math.ceil((box[2]-box[0])*c.width+24)),height=Math.min(720-top,Math.ceil((box[3]-box[1])*c.height+30));
  const raw=await page.screenshot({clip:{x:left,y:top,width,height}}),image=await sharp(raw).resize({width:240,height:210,fit:'contain',background:'#172e36'}).png().toBuffer();
  const label=Buffer.from(`<svg width="240" height="24"><text x="8" y="17" fill="#fff1d7" font-family="sans-serif" font-size="12">${id}</text></svg>`);
  tiles.push({input:image,left:(i%4)*240,top:Math.floor(i/4)*240+24},{input:label,left:(i%4)*240,top:Math.floor(i/4)*240});
  rows.push({id,unit,stats:detail.stats,labels:detail.labels,overflow:detail.overflow});
 }
}finally{await browser.close()}
});
await sharp({create:{width:960,height:960,channels:3,background:'#172e36'}}).composite(tiles).png().toFile(`${out}/sheet.png`);
await writeFile(`${out}/checks.json`,JSON.stringify({sha256:createHash('sha256').update(await readFile(artifact)).digest('hex'),rows,errors},null,2));
