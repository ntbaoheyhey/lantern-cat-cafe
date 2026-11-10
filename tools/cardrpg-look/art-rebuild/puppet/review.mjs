// Actual game renderer; labelled diagnostic poses are separate from battle shots.
import {chromium} from '../../../../apps/web/node_modules/@playwright/test/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {open,apply,audit} from '../../skills-v5/full/harness.mjs';
const sharp=createRequire('/Users/bao/tools/cardrpg-look/npm/package.json')('sharp');
const artifact=resolve(process.env.ART_ARTIFACT),out=resolve(process.env.ART_OUT);
const units=(process.env.ART_UNITS||'mochi').split(',');
await mkdir(out,{recursive:true});
const result={method:'Actual battle at x1 plus isolated labelled motion poses; no native-model acceptance.',errors:[],units:[]};
const browser=await chromium.launch({channel:'chromium',args:['--use-angle=metal']});
try{
 for(const unit of units){
  const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  page.on('pageerror',e=>result.errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text());});
  await open(page,artifact);await apply(page,{gallery:unit.includes('-')?'enemy:'+unit:unit+'-1',progress:-1});
  await page.evaluate(async()=>{const m=window.__depthReview;m.plan=null;m.notify(false);await new Promise(requestAnimationFrame);const s=window.__depthScene;s.render({...s.view(),fixedTime:3.2,paused:true},0);s.render({...s.view(),fixedTime:3.2,paused:true},0);s.dirty=false;});
  const state=await page.evaluate(unit=>{const s=window.__depthScene,p=[...s.puppets.values()].find(p=>p.asset===unit);if(!p?.model.userData.lookPuppet)throw Error('Expected illustrated puppet '+unit);return{asset:p.asset,role:p.role,stats:s.stats,parts:p.model.children[0].children.filter(n=>n.name.startsWith('puppet_')).map(n=>n.name)};},unit);
  const battle=await sharp(await page.screenshot()).webp({quality:89}).toBuffer();await writeFile(out+'/'+unit+'-battle.webp',battle);
  const concept=await sharp('assets/source/look-v3/concepts/'+unit+'.png').resize(360,820,{fit:'contain',background:'#19353c'}).png().toBuffer();
  await sharp({create:{width:1800,height:900,channels:3,background:'#19353c'}}).composite([{input:battle,left:0,top:0},{input:concept,left:1440,top:40}]).webp({quality:88}).toFile(out+'/'+unit+'-comparison.webp');
  const ui=await page.evaluate(audit);
  await page.evaluate(unit=>{const s=window.__depthScene;window.__puppetReview={...s.view(),frame:null,cardStatuses:{},cardPresentation:undefined,actors:s.view().actors.filter(a=>s.puppets.get(a.id)?.asset===unit),currentId:null,targetIds:[],legalIds:[],galleryPreview:false,fixedTime:10,model:{role:[...s.puppets.values()].find(p=>p.asset===unit).role,clip:'idle',angle:0},modelProgress:0,paused:true};s.view=()=>window.__puppetReview;},unit);
  const tiles=[],poses=[];
  for(const [i,[label,clip,t]] of [['idle','idle',0],['anticipation',unit+'-1',.22],['impact',unit+'-1',.52],['cast',unit+'-2',.30],['ultimate hold',unit+'-4',.34],['hurt','heavy-hit',.45],['victory','victory',.5],['defeat','KO',1]].entries()){
   const pose=await page.evaluate(({clip,t})=>{const s=window.__depthScene,v=window.__puppetReview;v.model.clip=clip;v.modelProgress=t;s.render(v,0);s.render(v,0);s.dirty=false;const p=[...s.puppets.values()][0];return{rect:s.renderer.domElement.getBoundingClientRect().toJSON(),angles:p.model.children[0].children.filter(n=>n.name.startsWith('puppet_')).map(n=>[n.name,n.rotation.z])};},{clip,t});
   const r=pose.rect;
   const tile=await sharp(await page.screenshot({clip:{x:r.x,y:r.y,width:r.width,height:r.height}})).resize(400,330,{fit:'cover'}).toBuffer();
   tiles.push({input:tile,left:i%4*400,top:Math.floor(i/4)*360+30});
   tiles.push({input:Buffer.from(`<svg width="400" height="30"><text x="12" y="22" fill="#fff0d2" font-size="17">${label}</text></svg>`),left:i%4*400,top:Math.floor(i/4)*360});
   poses.push({label,clip,progress:t,angles:pose.angles});
  }
  await sharp({create:{width:1600,height:720,channels:3,background:'#19353c'}}).composite(tiles).webp({quality:89}).toFile(out+'/'+unit+'-motion.webp');
  result.units.push({unit,...state,ui,poses});await page.close();
 }
}finally{await browser.close();await writeFile(out+'/review.json',JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify({units:result.units.length,errors:result.errors,overlaps:result.units.flatMap(u=>u.ui.overlaps).length}));
if(result.errors.length)process.exitCode=1;
