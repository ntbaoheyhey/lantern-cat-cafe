// Actual current-A6 rules states with three/four living helpers, frozen for visual review.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(process.env.PUPPET_PREVIEW_ROOT),out=resolve(process.env.ART_OUT);
const require=createRequire(root+'/apps/web/package.json'),{chromium}=require('@playwright/test');
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const {createServer}=await import(require.resolve('vite'));
const saved=JSON.parse(await readFile('reports/cardrpg-look/art-rebuild/p15/boss-replay.json','utf8'));
await mkdir(out,{recursive:true});const result={method:'Rules-resolved phase3 states with three and four living Binding Threads; paused fixed-time renders, not natural playback/performance evidence.',errors:[],rows:[]},states=[];
const vite=await createServer({configFile:false,root:root+'/apps/web',envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
try{
 const R=await vite.ssrLoadModule('/@fs/'+root+'/packages/game-rules/src/cardrpg/depth/index.ts');
 for(const [id,chapter] of [['yarn-giant',1],['rain-spool',2],['pantry-crown',3]]){
  const found=new Map();
  for(const level of [6,10,15]){
   const account=structuredClone(saved.account);for(const card of account.account.cards)card.level=level;
   const setup={...saved.setup,chapter,enemies:[id],cats:R.battleCats(account)};const battle=R.createBattle(setup);
   for(let i=0;i<600&&!battle.result;i++){
    const count=battle.actors.filter(a=>a.catalogId==='binding-thread'&&a.hp>0).length;
    if((count===3||count===4)&&!found.has(count))found.set(count,{id,count,level,account:structuredClone(account),battle:structuredClone(battle)});
    if(found.size===2)break;
    const actor=R.currentActor(battle);if(!actor)break;
    if(actor.side==='enemy')R.enemyAct(battle);else R.act(battle,R.chooseAction(battle,'auto'));
   }
   if(found.size===2)break;
  }
  if(found.size!==2)throw Error('Missing actual three/four-thread phase3 state for '+id);states.push(found.get(4),found.get(3));
 }
}finally{await vite.close();}
await writeFile(out+'/phase3-states.json',JSON.stringify(states,null,2)+'\n');
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});const tiles=[];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});page.on('pageerror',e=>result.errors.push(String(e)));
 await page.goto('file://'+resolve(process.env.ART_ARTIFACT)+'?a6=1');await page.waitForFunction(()=>window.__depthReview,null,{timeout:120000});
 for(const [index,state] of states.entries())for(const [width,height] of [[1440,900],[1280,720]]){
  await page.setViewportSize({width,height});
  await page.evaluate(state=>{const m=window.__depthReview;if(state.count===4)window.__depthScene?.puppetBossAddLanes.clear();m.galleryBattle=null;m.tutorialBattle=null;m.state=state.account;m.replay=state.battle;m.screen='map';m.sceneStarted=true;m.watching=true;m.paused=true;m.plan=null;m.roundPlan=null;m.beforeImpact=null;m.afterImpact=null;m.impactApplied=true;m.camera='wide';m.notify(false);},state);
  await page.waitForFunction(({width,height})=>{const s=window.__depthScene,m=window.__depthReview;return s?.ready&&m.sceneReady&&s.width===width&&s.height===height-230&&m.battle.actors.filter(a=>a.hp>0).every(a=>s.puppets.get(a.id)?.asset===a.catalogId);},{width,height},{timeout:120000});
  const row=await page.evaluate(()=>{const s=window.__depthScene,m=window.__depthReview;s.render({...s.view(),fixedTime:18,paused:true},0);s.render({...s.view(),fixedTime:18,paused:true},0);s.dirty=false;
   const faces=m.battle.actors.filter(a=>a.hp>0&&a.catalogId==='binding-thread').map(a=>{const p=s.puppets.get(a.id),v=p.base.clone();p.head.getWorldPosition(v);v.y+=.2*p.root.scale.y;v.project(s.camera);return{id:a.id,base:p.base.toArray(),face:[(v.x*.5+.5)*s.width,(.5-v.y*.5)*s.height]};});
   const faceSeparation=Math.min(...faces.flatMap((a,i)=>faces.slice(i+1).map(b=>Math.hypot(a.face[0]-b.face[0],a.face[1]-b.face[1]))));
   return{round:m.battle.round,bossPhase:m.battle.actors.find(a=>a.side==='enemy'&&a.catalogId!=='binding-thread').phase,faces,faceSeparation,bounds:s.audit(),faceHp:s.labelAudit.overlaps,missing:s.labelAudit.missing};
  });result.rows.push({id:state.id,count:state.count,level:state.level,width,height,...row});
  const capture=await page.screenshot();await sharp(capture).webp({quality:83}).toFile(out+'/'+state.id+'-'+state.count+'-'+width+'.webp');
  if(width===1440){const left=index%2*720,top=Math.floor(index/2)*474;tiles.push({input:await sharp(capture).resize(720,450).toBuffer(),left,top:top+24});tiles.push({input:Buffer.from(`<svg width="720" height="24"><text x="10" y="18" fill="#fff0d2" font-size="15">${state.id} · actual phase3 · ${state.count} helpers</text></svg>`),left,top});}
 }
 await sharp({create:{width:1440,height:1422,channels:3,background:'#173039'}}).composite(tiles).webp({quality:84}).toFile(out+'/phase3-contact.webp');
}finally{await browser.close();await writeFile(out+'/phase3-review.json',JSON.stringify(result,null,2)+'\n');}
const failures=result.rows.filter(r=>r.faces.length!==r.count||new Set(r.faces.map(f=>f.base.join(','))).size!==r.count||r.faceSeparation<(r.width===1440?100:75)||r.bounds.outside.length||r.faceHp||r.missing.length||r.bounds.width!==r.width||r.bounds.height!==r.height-230).map(r=>({id:r.id,count:r.count,width:r.width,outside:r.bounds.outside,faceHp:r.faceHp,missing:r.missing,faceSeparation:r.faceSeparation}));
console.log(JSON.stringify({screens:result.rows.length,errors:result.errors,failures}));if(result.errors.length||failures.length)process.exitCode=1;
