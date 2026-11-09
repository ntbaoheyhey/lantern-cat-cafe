// REFERENCE: A5 B1. TRAIN-only diagnostic of a shared linear display; never changes combat or fixture budgets.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './load.mjs';
const out=process.env.V5_DISPLAY_OUT;assert(out);
const registration=JSON.parse(await readFile(out+'/REGISTERED-METHOD.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(sha(await readFile(import.meta.filename)),registration.scriptSha256);
assert.equal(process.env.BIG_RULES_ROOT,registration.sourceRoot);
for(const [p,h] of Object.entries(registration.source))assert.equal(sha(await readFile(registration.sourceRoot+'/'+p)),h,p);
const bytes=await readFile(registration.control);assert.equal(sha(bytes),registration.controlSha256);
const control=JSON.parse(bytes);assert.equal(control.offset,0);assert.equal(control.count,500);
const {load,rules:C,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts');
const starter=['mochi','soot','clover'],themes={guardian:'hearthloom',witch:'moonwick',alchemist:'mossbrew'};
const fixture=seed=>{
 const s=R.setSkillsV5(R.createDepthAccount(seed),true);
 s.account.cards=starter.map(id=>({id,cardId:id,level:6,stars:1,shards:0,soulbound:true}));s.team=[...starter];s.gear=[];s.equipment={};s.cleared=[1,2,3];
 for(const id of starter){s.rows[id]=R.CAT_BY_ID[id].row;s.skills[id]=R.defaultSkills(s,id);
  for(const slot of C.EQUIPMENT_SLOTS){const g=R.makeGear(s,`${themes[C.CARD_BY_ID[id].role]}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);(s.equipment[id]??={})[slot]=g.id;}}
 return s;
};
const vector=s=>{
 const cats=R.battleCats(s),v=['hp','attack','defense'].map(k=>cats.reduce((n,c)=>n+c.stats[k],0));
 v.push(s.team.reduce((n,id)=>n+R.powerV4(s,id).utility,0));
 assert(Math.abs(v[0]/5+v[1]*2+v[2]*1.5+v[3]-R.teamPowerV4(s))<1e-8);
 return v;
};
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),oldWeights=[.2,2,1.5,1];
const cache=new Map(),rows=[];
try{
 for(const row of control.summaries){
  const item=R.GEAR_BY_ID[row.templateId],points=[];
  for(let seed=1;seed<=control.count;seed++){
   const key=item.id+'/'+seed;
   if(!cache.has(key)){
    const s=fixture(seed),id=row.cardId;s.equipment[id]={};
    for(const slot of C.EQUIPMENT_SLOTS)if(slot!==item.slot){const g=R.makeGear(s,`${item.setId}-${slot}-epic`,seed+C.EQUIPMENT_SLOTS.indexOf(slot)*7919);s.gear.push(g);s.equipment[id][slot]=g.id;}
    const before=vector(s),g=R.makeGear(s,item.id,seed);s.gear.push(g);s.equipment[id][item.slot]=g.id;
    const after=vector(s);g.enhancement=12;const enhanced=vector(s);
    cache.set(key,{seed,before,after,enhanced});
   }
   points.push(cache.get(key));
  }
  const share=p=>(dot(p.after,oldWeights)-dot(p.before,oldWeights))/dot(p.after,oldWeights);
  assert(Math.abs(points.reduce((n,p)=>n+share(p),0)/control.count-row.meanShare)<1e-10,row.key);
  rows.push({key:row.key,templateId:row.templateId,chapter:row.chapter,cardId:row.cardId,gainPp:row.gainPp,oldMeanShare:row.meanShare,points});
 }
}finally{await vite.close();}
const mean=a=>a.reduce((n,x)=>n+x,0)/a.length;
function ranks(xs){const sorted=xs.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value),r=[];
 for(let a=0;a<sorted.length;){let b=a+1;while(b<sorted.length&&sorted[b].value===sorted[a].value)b++;for(let i=a;i<b;i++)r[sorted[i].index]=(a+b-1)/2;a=b;}return r;}
function rho(xs,ys){const a=ranks(xs),b=ranks(ys),am=mean(a),bm=mean(b),d=Math.sqrt(a.reduce((n,x)=>n+(x-am)**2,0)*b.reduce((n,x)=>n+(x-bm)**2,0));return d?a.reduce((n,x,i)=>n+(x-am)*(b[i]-bm),0)/d:null;}
const grid=[];
for(const hp of registration.grid.hp)for(const attack of registration.grid.attack)for(const defense of registration.grid.defense)for(const utility of registration.grid.utility){
 const weights=[hp,attack,defense,utility],shares=new Map();let maximum=0;
 for(const [key,p] of cache){const after=dot(p.after,weights),enhanced=dot(p.enhanced,weights),before=dot(p.before,weights);const share=(after-before)/after;shares.set(key,share);maximum=Math.max(maximum,share,(enhanced-before)/enhanced);}
 const correlations=[1,2,3].map(chapter=>{const group=rows.filter(r=>r.chapter===chapter);return rho(group.map(r=>mean(r.points.map(p=>shares.get(r.templateId+'/'+p.seed)))),group.map(r=>r.gainPp));});
 grid.push({weights,correlations,minimum:Math.min(...correlations),maximumShare:maximum});
}
grid.sort((a,b)=>b.minimum-a.minimum||a.maximumShare-b.maximumShare||a.weights.join().localeCompare(b.weights.join()));
const original=grid.find(r=>r.weights.every((v,i)=>v===oldWeights[i]));assert(original);
const best=grid.find(r=>r.maximumShare<=.1);assert(best);
const result={registration,original,best,passing:grid.filter(r=>r.maximumShare<=.1&&r.minimum>=.6),grid,
 cases:rows.map(({points,...r})=>r),features:[...cache].map(([key,v])=>({key,...v})),
 scope:'TRAIN1-500 V5 existing receipts only; zero new combat samples. Shared positive linear HP/attack/defense/utility display grid, not proof about every possible score.',
 adoption:'None. Changing rawPowerV4 would also change actual gear main stats. A display-only change must remain separate from that budget and needs full TRAIN500 plus untouched acceptance.'};
await writeFile(out+'/results.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({cells:rows.length,features:cache.size,original,best,passing:result.passing.length,combatSamples:0}));
