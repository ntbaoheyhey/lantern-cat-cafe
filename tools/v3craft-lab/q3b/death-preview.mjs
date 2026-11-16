// Production author preview. Existing fixed-time scene path, no recorder changes.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
const results=[];
try{
 for(const [width,height]of [[1280,720],[1440,900]]){
  const out=`tools/v3craft-lab/q3b/raw/death-author-${width}`;mkdirSync(out,{recursive:true});
  const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
  const rows=[];
  for(const ms of [0,66.667,133.333,200,266.667,333.333,400,466.667,533.333,600]){
   rows.push(await page.evaluate(ms=>{
    const s=window.__depthScene,e=s.actors.get('soot'),v=s.view();e.koAt=10;
    s.render({...v,frame:null,model:undefined,actors:v.actors.map(a=>a.id==='soot'?{...a,hp:0}:a),fixedTime:10+ms/1000,paused:true},0);
    return {ms,box:s.bounds(e),face:s.faceBounds(e),rootVisible:e.actor.root.visible,fragmentsVisible:e.craftDeath.fragments.visible,source:structuredClone(e.craftLight.audit)};
   },ms));
   await page.locator('canvas[data-look-spine]').screenshot({path:`${out}/${ms}.png`});
  }
  results.push({width,height,errors,rows});console.log(JSON.stringify({width,errors,rows:rows.length}));await page.close();
 }
 writeFileSync('tools/v3craft-lab/q3b/raw/death-author.json',JSON.stringify({at:new Date().toISOString(),results},null,2)+'\n');
}finally{await browser.close();}
