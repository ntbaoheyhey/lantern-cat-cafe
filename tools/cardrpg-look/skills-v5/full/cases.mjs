import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {web,requireWeb} from '../../../visual-support.mjs';
const {createServer}=await import(requireWeb.resolve('vite'));
export async function cases(){
 const old=JSON.parse(gunzipSync(await readFile('reports/cardrpg-look/skills-v5/fixtures.json.gz')));
 const vite=await createServer({configFile:false,root:web,envDir:false,server:{middlewareMode:true,hmr:false,ws:false,watch:null},appType:'custom'});
 try{
 const M=await vite.ssrLoadModule('/@fs/'+process.cwd()+'/tools/cardrpg-look/skills-v5/v3-playback.ts');
 const boss=M.fixtureSource.fixtures.find(r=>r.id==='boss');
 const phase=boss.events.find(e=>e.kind==='boss-phase');
 const bossFrame=M.fixtureFrame(boss,boss.actions.find(a=>a.actionId===phase.actionId));
 bossFrame.at=bossFrame.plan.beats[2].start+150;
 const marks=ids=>{const battle=structuredClone(old.base);for(const a of battle.actors)a.statuses=['mochi','button-guard'].includes(a.catalogId)?old.statuses.filter(s=>ids.includes(s.id)).map(s=>({id:s.id,stacks:s.cap,remaining:s.duration,source:a.id,appliedRound:1})):[];return{battle,plan:null,at:0};};
 return [
 {id:'P1',name:'burn',frame:marks(['scald'])},{id:'P2',name:'mark-daze',frame:marks(['scent','drowsy'])},
 {id:'P3',name:'regen-warm',frame:marks(['steep','cozy'])},{id:'P4',name:'overflow',frame:marks(old.statuses.map(s=>s.id))},
 {id:'P5',name:'row',frame:old.multi},{id:'P6',name:'crumb-burst-three',frame:old.burst},
 ...M.caseNames.filter(n=>n!=='crumb-burst').map((name,i)=>({id:`P${i+7}`,name,frame:M.selectedFixture(name)})),
 {id:'P15',name:'yarn-phase',frame:bossFrame,bossTransition:phase},
 {id:'P16',name:'mochi-ultimate',gallery:'mochi-4',progress:.56},
 {id:'P17',name:'clover-greenhouse',gallery:'clover-4',progress:.62}];
 }finally{await vite.close()}
}
if(process.argv[1].endsWith('/cases.mjs')){
 const rows=await cases();await mkdir('reports/cardrpg-look/skills-v5/full',{recursive:true});
 await writeFile('reports/cardrpg-look/skills-v5/full/SHOTS.json',JSON.stringify({camera:'B/wide',fixedTime:3.2,dpr:1,source:'V0 rule-resolved presentation fixtures + published A S4 fixture; gallery poses labelled',cases:rows.map(({frame,...r})=>({...r,seed:frame?.battle?.seed,fixtureId:frame?.fixtureId,actionId:frame?.actionId,at:frame?.at,frameSha256:frame?createHash('sha256').update(JSON.stringify(frame)).digest('hex'):undefined}))},null,2));
 await writeFile('/tmp/cardrpg-v5full-m1/cases.json',JSON.stringify(rows));console.log(rows.map(r=>r.id+':'+r.name).join(' '));
}
