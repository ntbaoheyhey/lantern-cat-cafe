import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {open,apply} from './harness.mjs';
const artifact=resolve(process.env.V5_ARTIFACT),out=process.env.V5_OUT;await mkdir(out,{recursive:true});
const rows=JSON.parse(await readFile('/tmp/cardrpg-v5full-m1/cases.json'));const receipt=[];
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});await open(page,artifact);
 for(const row of rows){await apply(page,row);const data=await page.evaluate(()=>{const s=window.__depthScene,e=s.cardEffects;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;const real=s.renderer.domElement.toDataURL('image/png');e.root.visible=false;e.setLightsEnabled(false);s.post.render(s.scene,s.camera,0,0,'#ffe6d2',true);const without=s.renderer.domElement.toDataURL('image/png');e.root.visible=true;e.setLightsEnabled(true);return{real,without,masks:e.protectedFaces.slice(0,e.material.uniforms.protectedCount.value).map(v=>v.toArray()),headTops:Array.from(e.protectedHeadTops),stats:{...s.stats}}});
 for(const key of ['real','without']){const file=out+'/'+row.id+'-'+key+'.png';await writeFile(file,Buffer.from(data[key].split(',')[1],'base64'));data[key]=file;}receipt.push({id:row.id,...data});
 }}finally{await browser.close();await writeFile(out+'/face-frames.json',JSON.stringify(receipt))}
