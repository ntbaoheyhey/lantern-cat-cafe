// Authoring preview in the real Q2 scene. Not an acceptance recorder.
// LEARN/Q3.B.md, X01: clear target and explicit group orders.
import {chromium,config,openFixture} from '../../../scripts/v3feel/browser-fixture.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='tools/v3craft-lab/q3b/raw/author';mkdirSync(out,{recursive:true});
const width=Number(process.argv[2]??1280),height=Number(process.argv[3]??720);
const browser=await chromium.launch({headless:true,args:['--use-angle=metal']});
try{
 const {page,errors}=await openFixture(browser,config.fixtures.find(f=>f.id==='wave3'),{width,height});
 const result=await page.evaluate(async()=>{
  const s=window.__depthScene,{LanternRequiem}=await import('/src/game/cardrpg/vfx-craft/lantern-requiem.ts');
  const v={...s.view(),model:{clip:'idle'},modelProgress:0,fixedTime:10,paused:true};s.render(v,0);
  const audit=s.sizeAudit(),soot=audit.units.find(u=>u.asset==='soot'),targets=audit.units.filter(u=>u.side==='enemy');
  const p=await new LanternRequiem();await p.ready;s.scene.add(p.ground,p.rear,p.front);s.effects.canvas.style.visibility='hidden';
  const source=s.socket(soot.id,'mainHand')??{x:soot.box.x+soot.box.width,y:soot.box.y+soot.box.height*.5};
  const input={width:s.width,height:s.height,worldWidth:s.worldWidth,worldHeight:1950,source,layoutSource:{...source},
   targets:targets.map(u=>({x:u.box.x+u.box.width*.5,y:u.box.y+u.box.height*.67})),
   feet:targets.map(u=>({x:u.box.x+u.box.width*.5,y:u.box.y+u.box.height})),
   faces:audit.units.map(u=>u.faceBox),rearOrder:Math.min(...audit.units.map(u=>s.actors.get(u.id).actor.root.renderOrder))-.5,
   frontOrder:Math.max(...audit.units.map(u=>s.actors.get(u.id).actor.root.renderOrder))+1,reducedMotion:false};
  window.__craftAuthor={p,input,draw(ms){s.render(v,0);p.render({...input,elapsed:ms});s.renderer.setRenderTarget(null);s.renderer.clear(true,true,true);s.renderer.render(s.scene,s.camera);}};
  return{input,audit};
 });
 for(const ms of [0,300,600,633.333,700,800,900,1000,1100,1200,1400,1600,1800,2000,2200]){
  await page.evaluate(ms=>window.__craftAuthor.draw(ms),ms);
  await page.locator('canvas[data-look-spine]').screenshot({path:`${out}/${width}-${ms}.png`});
 }
 writeFileSync(`${out}/${width}-preview.json`,JSON.stringify({at:new Date().toISOString(),errors,...result},null,2)+'\n');
 console.log(JSON.stringify({width,height,errors,source:result.input.source,targets:result.input.targets.length}));
}finally{await browser.close();}
