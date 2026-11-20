import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const manifest=JSON.parse(await fs.readFile('docs/turn3d/ASSET-MANIFEST.json','utf8')),out='reports/turn3d-polish';await fs.mkdir(out+'/shots/models',{recursive:true});
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:480,height:440},deviceScaleFactor:1}),records=[],errors=[];page.on('pageerror',e=>errors.push(String(e)));
for(const a of manifest.assets){
 await page.goto(`http://127.0.0.1:5512/turn3d-model-probe.html?role=${a.id}`);await page.addStyleTag({content:'#stage{width:480px;height:440px}'});await page.waitForFunction(()=>window.probe?.stats.loaded===1);await page.waitForTimeout(100);
 const shots=[...['front','three-quarter','side','back'].map((id,i)=>({id,angle:[0,.65,Math.PI/2,Math.PI][i],clip:'idle',progress:.35}))];
 for(const clip of a.clips)for(const progress of [.15,.45,.8])shots.push({id:`${clip}-${progress}`,clip,angle:.3,progress});
 if(['guardian','witch','alchemist'].includes(a.id))for(const gear of ['off','starter','high'])shots.push({id:`gear-${gear}`,clip:'ready',angle:.3,progress:.45,gear});
 for(const shot of shots){await page.evaluate(async shot=>{const v=window.probeView;v.model.angle=shot.angle;v.model.clip=shot.clip;v.modelProgress=shot.progress;if(shot.gear){const {initialLoadout,applyEquipment}=await import('/@fs/Users/bao/taskbar-hero-turn3d-polish/packages/game-rules/src/squad/gear/equipment.ts');v.actors[0].equipment=initialLoadout(v.model.role,shot.gear);applyEquipment(v.actors[0],'hearthkeepers')}window.probe.render(v)},shot);await page.waitForTimeout(20);const file=`${out}/shots/models/${a.id}-${shot.id}.png`,data=await page.screenshot({path:file});records.push({role:a.id,...shot,file,sha256:createHash('sha256').update(data).digest('hex'),stats:await page.evaluate(()=>window.probe.stats)})}
 console.log(a.id);
}
await fs.writeFile(out+'/model-captures.jsonl',records.map(r=>JSON.stringify(r)).join('\n')+'\n');await fs.writeFile(out+'/model-captures.json',JSON.stringify({date:new Date().toISOString(),errors,frames:records.length,models:manifest.assets.length,clips:manifest.assets[0].clips,records:'model-captures.jsonl'},null,2));await browser.close();
