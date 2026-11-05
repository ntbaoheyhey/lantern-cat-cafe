// Original baked portrait renders from this repository's GLBs. No external art inputs.
import {chromium} from '../../apps/web/node_modules/@playwright/test/index.mjs';import fs from 'node:fs/promises';import {createHash} from 'node:crypto';
const browser=await chromium.launch({headless:true,channel:'chromium',args:['--use-angle=metal']}),page=await browser.newPage({viewport:{width:320,height:440},deviceScaleFactor:1});const records=[];
await fs.mkdir('apps/web/public/art/turn3d/portraits',{recursive:true});
for(const role of ['guardian','witch','alchemist']){
 await page.goto(`http://127.0.0.1:5512/turn3d-model-probe.html?role=${role}&angle=.15&clip=ready`);await page.addStyleTag({content:'#label{display:none}#stage{width:320px;height:440px}'});await page.waitForFunction(()=>window.probe?.stats.loaded===1);await page.waitForTimeout(120);await page.evaluate(()=>{window.probeView.fixedTime=1;window.probe.render(window.probeView)});
 const path=`apps/web/public/art/turn3d/portraits/${role}.png`,data=await page.screenshot({path});records.push({id:role+'-portrait',output:path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),source:['tools/turn3d/polish-portraits.mjs',`apps/web/public/art/turn3d/${role}.glb`],tool:'Playwright 1.64.1 / Chromium / Three.js 0.180.0',parameters:{viewport:[320,440],clip:'ready',angle:.15,fixedTime:1},author:'OpenAI Codex primary polish session',date:'2026-11-05',license:'CC0-1.0',externalReferences:[]});
}
await fs.writeFile('reports/turn3d-polish/portrait-renders.json',JSON.stringify(records,null,2));await browser.close();console.log(JSON.stringify(records.map(r=>({id:r.id,bytes:r.bytes}))));
