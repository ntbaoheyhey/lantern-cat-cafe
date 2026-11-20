/**
 * Records the judge path at 1x (muted): café, Collection, street wave, the three
 * ultimates, the Yarn Giant, victory, receipt fixture and the live Fuji Collection.
 * Writes demo.mp4 (CDP screencast frames encoded with the system ffmpeg) plus
 * numbered screenshots to DEMO_OUTPUT.
 *
 *   node tools/v5int/run-chain-mode.mjs --fixture   # serves the judge build on 6301
 *   DEMO_OUTPUT=work/demo node tools/v5int/v9-demo-record.mjs
 *
 * DEMO_ANGLE picks Chromium's GL backend (metal on macOS, swiftshader in a headless VM).
 */
import {createRequire} from 'node:module';
import {mkdir,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
const require=createRequire(new URL('../../apps/web/package.json',import.meta.url));
const {chromium}=require('@playwright/test');
const origin=process.env.DEMO_ORIGIN??'http://127.0.0.1:6301';
const out=resolve(process.env.DEMO_OUTPUT??'work/v9/demo-record');
const angle=process.env.DEMO_ANGLE??'metal';
await mkdir(out,{recursive:true});
const size={width:1280,height:720};
const browser=await chromium.launch({headless:true,args:[`--use-angle=${angle}`,'--mute-audio']});
const context=await browser.newContext({viewport:size});
const page=await context.newPage();
// Screencast frames keep their capture time, so the encoded video plays at real speed.
const framesDir=resolve(out,'frames');await rm(framesDir,{recursive:true,force:true});await mkdir(framesDir);
const cdp=await context.newCDPSession(page),frames=[],writes=[];
cdp.on('Page.screencastFrame',async({data,metadata,sessionId})=>{
 const file=resolve(framesDir,`${String(frames.length).padStart(5,'0')}.jpg`);
 frames.push({file,t:metadata.timestamp});writes.push(writeFile(file,Buffer.from(data,'base64')));
 cdp.send('Page.screencastFrameAck',{sessionId}).catch(()=>{});
});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:size.width,maxHeight:size.height,everyNthFrame:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let n=0;const shots=[];
const shot=async(name,caption)=>{const file=`${String(++n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:resolve(out,file)});shots.push({file,caption});console.log('shot',file);};
const pause=ms=>page.waitForTimeout(ms);
const button=name=>page.getByRole('button',{name,exact:true});
try{
 await page.goto(`${origin}/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`);
 const play=button('Play free');
 await play.or(button('Guard the café')).waitFor({timeout:60000});
 if(await play.isVisible())await play.click();
 await button('Guard the café').waitFor({timeout:60000});
 await pause(2500);await shot('cafe','Lantern Cat Café: Mochi (melee), Clover (healer) and Soot (ranged).');
 await button('Collection').click();await pause(2500);
 await shot('collection','Collection: the twelve Relics that can be minted on Avalanche Fuji.');
 await button('Back to café').click();await pause(800);
 await button('Guard the café').click();
 await page.waitForFunction(()=>window.__depthReview?.sceneReady===true,{},{timeout:60000});
 await pause(1500);await shot('wave','Street wave: designer idles for all three cats against Needle Moth, Teacup Healer and Button Guard.');
 await pause(4000);await shot('wave-skills','Skills and hit effects during the wave.');
 await button('Face the Yarn Giant').waitFor({timeout:120000});
 await pause(1500);await shot('wave-clear','Wave cleared.');
 await page.evaluate(()=>{
  window.__demoSeen=[];window.__demoLastPlan=null;
  window.__demoObserver=setInterval(()=>{
   const p=window.__depthReview?.plan;
   if(p&&p!==window.__demoLastPlan){window.__demoLastPlan=p;if(p.ultimate&&['mochi','clover','soot'].includes(p.actorId))window.__demoSeen.push(p.skillId);}
  },10);
 });
 await button('Face the Yarn Giant').click();
 await page.waitForFunction(()=>window.__depthReview?.sceneReady===true,{},{timeout:60000});
 await pause(2000);await shot('boss','The Yarn Giant.');
 const names={'mochi-4':'Mochi ultimate','clover-4':'Clover ultimate','soot-4':'Soot ultimate'};
 for(let i=1;i<=3;i++){
  await page.waitForFunction(k=>window.__demoSeen.length>=k,i,{timeout:90000});
  const id=await page.evaluate(k=>window.__demoSeen[k-1],i);
  await pause(450);await shot(`ultimate-${id}-a`,`${names[id]??id}: wind-up.`);
  await pause(650);await shot(`ultimate-${id}-b`,`${names[id]??id}: impact.`);
 }
 await page.getByRole('heading',{name:'The last lantern stays lit',exact:true}).waitFor({timeout:90000});
 await pause(2500);await shot('victory','Victory: the last lantern stays lit.');
 const receipt=button('Preview receipt fixture');
 if(await receipt.isVisible()){
  await receipt.click();await pause(2500);
  await shot('receipt-fixture','Reward receipt (labelled fixture, no transaction).');
  await button('Dismiss receipt').click();await pause(800);
 }
 await button('Collection').click();
 await page.getByLabel('Wallet address',{exact:true}).fill('0x0000000000000000000000000000000000000001');
 await button('Read Fuji Relics').click();
 const owned=page.getByText('Owned on Avalanche Fuji',{exact:true});
 await owned.waitFor({timeout:90000});await owned.scrollIntoViewIfNeeded();
 await pause(2000);await shot('fuji-collection','Collection reading a wallet live from the Avalanche Fuji RPC.');
}finally{
 await cdp.send('Page.stopScreencast').catch(()=>{});
 await context.close();await browser.close();
}
await Promise.all(writes);
if(frames.length>1){
 const list=frames.map((f,i)=>`file '${f.file}'\nduration ${Math.max(0.001,((frames[i+1]?.t??f.t+0.04)-f.t)).toFixed(3)}`).join('\n');
 await writeFile(resolve(framesDir,'list.txt'),`${list}\nfile '${frames.at(-1).file}'\n`);
 execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',resolve(framesDir,'list.txt'),'-vf','fps=30,scale=1280:720:flags=lanczos,format=yuv420p','-c:v','libx264','-crf','23','-preset','medium','-movflags','+faststart',resolve(out,'demo.mp4')]);
 await rm(framesDir,{recursive:true,force:true});
}
console.log(JSON.stringify({shots,errors},null,1));
