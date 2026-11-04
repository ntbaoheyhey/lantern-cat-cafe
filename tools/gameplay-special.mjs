// Matched phase stills and actual high-bonus craft, selected with the real seeded reducer.
// All constructed state is an explicitly separate screenshot fixture, never a pacing run.
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,web,requireWeb,chromium,fixtureData,openView} from './visual-support.mjs';
const phase=process.argv[2]??'after',base=process.argv[3]??'http://127.0.0.1:5391',out=resolve(root,'docs/gameplay/img');
const {createServer}=await import(requireWeb.resolve('vite'));
const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
let data=await fixtureData(),great,recipe;
try{
 const {v2,deriveSeed}=await vite.ssrLoadModule('/../../packages/game-rules/src/index.ts');
 const {bonusRollQuality}=await vite.ssrLoadModule('/../../packages/game-rules/src/gameplay.ts');
 recipe=v2.RECIPES.find(r=>r.rarity==='rare');
 const save=structuredClone(data.saves.forgeRich);save.state.bestStage=15;save.state.stacks={...save.state.stacks,...recipe.materials,fish:recipe.fish};
 for(let counter=0;counter<1000;counter++){
  const roll=v2.applyCraft(save.state,recipe.id,'weapon',deriveSeed(1,counter),0);
  if(roll.ok&&bonusRollQuality(roll.item.rarity,roll.item.bonusLines).great){save.counter=counter;great={counter,quality:bonusRollQuality(roll.item.rarity,roll.item.bonusLines),item:roll.item};break;}
 }
 if(!great)throw Error('No deterministic high roll found');
 data.saves.forgeRich=save;
 // Enough HP to display heavy windup/recovery, without replacing the real timeline.
 data.saves.bossReadyWeak.state.level=10;
}finally{await vite.close();}
const browser=await chromium.launch(),receipts=[];
try{
 for(const [width,height] of [[1280,720],[1920,1080]]){
  const {page:p,evidence}=await openView(browser,data,{base,screen:'boss',width,height,motion:'no-preference'});
  for(const [name,delta] of [['quick',500],['heavy',4100],['recovery',1100]]){
   await p.clock.runFor(delta);
   await p.screenshot({path:resolve(out,`${phase}-boss-${name}-${width}.png`),animations:'disabled'});
   receipts.push({...evidence,name,phaseText:await p.locator('.arena-phase').count()?await p.locator('.arena-phase').textContent():null});
  }
  await p.close();
  const {page:f,evidence:fe}=await openView(browser,data,{base,screen:'forge',width,height,motion:'no-preference'});
  await f.getByTestId('rarity-rare').click();await f.getByTestId('craft-btn').click();await f.getByTestId('craft-confirm-btn').click();
  await f.getByTestId('craft-result').waitFor();await f.clock.runFor(1100);
  await f.screenshot({path:resolve(out,`${phase}-forge-great-${width}.png`),animations:'disabled'});
  receipts.push({...fe,name:'great',great,text:await f.getByTestId('craft-result').innerText()});await f.close();
 }
}finally{await browser.close();}
writeFileSync(resolve(root,`reports/gameplay/${phase}-special.json`),JSON.stringify(receipts,null,2)+'\n');
console.log(JSON.stringify(receipts.map(r=>({screen:r.screen,width:r.width,name:r.name,phase:r.phaseText,quality:r.great?.quality,errors:r.errors}))));
if(receipts.some(r=>r.errors.length||r.writes.length))process.exitCode=1;
