import {chromium} from '../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const out=process.env.V5_OUT||'reports/cardrpg-look/skills-v5',raw=process.env.V5_RAW||'/tmp/cardrpg-v5look-off';await mkdir(raw,{recursive:true});
const fixture=JSON.parse(await readFile('reports/cardrpg-look/skills-v5/fixtures.json'));
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
const receipt={method:'Same fixed-time fixture, lookV2 OFF, battle surface normalized to1440x900. Raw canvas pixels exclude the differing standalone-demo chrome; party HUD uses rendered DOM pixels.',guide:[],off:[],errors:[]};
try{
 for(const [side,file]of [['before',process.env.V5_BEFORE||'/tmp/cardrpg-v5look-before.html'],['after','docs/cardrpg-look/v5-v0.html']]){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>receipt.errors.push(String(e)));
  await page.goto('file://'+resolve(file));await page.waitForFunction(()=>window.__depthReview);
  await page.evaluate(f=>{window.__LOOK_V2__=false;document.documentElement.dataset.lookV2='false';window.dispatchEvent(new CustomEvent('lantern-look-v2',{detail:false}));const m=window.__depthReview;m.watchNow();m.paused=true;m.galleryBattle=structuredClone(f.base);for(const a of m.galleryBattle.actors)a.statuses=[{id:'scald',stacks:2,remaining:2,source:a.id,appliedRound:1}];m.camera='wide';m.plan=null;m.notify(false)},fixture);
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.evaluate(()=>{Object.assign(document.querySelector('.dp-battle').style,{position:'fixed',left:'0px',top:'0px',width:'1440px',height:'900px',zIndex:'1000'});});
  await page.evaluate(()=>{document.querySelector('.dp-canvas').style.overflow='hidden';});
  await page.waitForTimeout(250);
  await page.evaluate(()=>{const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false});
  await page.waitForTimeout(100);
  const images=[];
  for(const selector of ['.dp-canvas canvas','.dp-party']){
   const buffer=selector.includes('canvas')?Buffer.from((await page.evaluate(()=>window.__depthScene.renderer.domElement.toDataURL('image/png'))).split(',')[1],'base64'):await page.locator(selector).screenshot();await writeFile(`${raw}/${side}-${images.length}.png`,buffer);
   const data=await sharp(buffer).raw().toBuffer({resolveWithObject:true});images.push({selector,info:data.info,sha256:createHash('sha256').update(data.data).digest('hex')});
  }
  receipt.off.push({side,artifactSha256:createHash('sha256').update(await readFile(file)).digest('hex'),images,badges:await page.locator('.dp-status-badge').count(),words:await page.locator('.dp-combo-callout').count()});await page.close();
 }
 receipt.offPixelExact=JSON.stringify(receipt.off[0].images)===JSON.stringify(receipt.off[1].images);
 assert.equal(receipt.offPixelExact,true,'OFF arena and HUD pixels must match');
 for(const [width,height]of [[1440,900],[1280,720],[1024,600]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  await page.goto('file://'+resolve('docs/cardrpg-look/v5-v0.html'));await page.getByRole('button',{name:'Status guide',exact:true}).click();
  assert.equal(await page.locator('.v5-guide-grid button').count(),16);
  await page.locator('.v5-guide-grid button').filter({hasText:'Burn Scald'}).click();
  await page.waitForFunction(()=>window.__depthScene?.ready,null,{timeout:120000});
  await page.locator('.v5-preview select').selectOption('scent');
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Pause',exact:true}).count(),1);
  await page.getByRole('button',{name:'Back to guide',exact:true}).click();
  await page.getByRole('button',{name:'Close guide',exact:true}).click();
  receipt.guide.push({width,options:16,previewMouseControls:true,playbackMouseReachable:true});await page.close();
 }
}finally{await browser.close();await writeFile(`${out}/delivery.json`,JSON.stringify(receipt,null,2))}
console.log(JSON.stringify(receipt));
