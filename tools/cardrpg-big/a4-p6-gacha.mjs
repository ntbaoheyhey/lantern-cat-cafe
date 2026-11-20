// REFERENCE: GAMEPLAY-V4 sections5/6/9; NFT-VALUE-SPEC. Conditional odds, fixed seeds, resumable real commands.
import {loadRules} from './a4-load.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out='reports/cardrpg-big/a4/p6/gacha';await mkdir(out,{recursive:true});
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const paths=execFileSync('git',['ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg'],{encoding:'utf8'}).trim().split('\n');
const source=Object.fromEntries(await Promise.all([...new Set(paths)].filter(p=>p.endsWith('.ts')&&!p.endsWith('.test.ts')).sort().map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const cp=JSON.parse(await readFile(`${out}/partial.json`,'utf8').catch(()=>'{}'));if(cp.source)assert.deepEqual(cp.source,source,'Source changed during invitation acceptance');
const {load,vite}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),C=await load('packages/game-rules/src/cardrpg/index.ts'),rng=await load('packages/game-rules/src/rng.ts');
const rows=cp.rows??[],start=Date.now(),pause=new Error('Checkpoint'),take=r=>{assert(r.ok,JSON.stringify(r.error));return r.state;};
try{
 for(const banner of C.BANNERS){
  let row=rows.find(r=>r.banner===banner.id);if(!row){row={banner:banner.id,accounts:[],buckets:{},featuredGuaranteedChecks:0,gearTemplates:[]};rows.push(row);}
  for(let seed=row.accounts.length+1;seed<=10000;seed++){
   let s=R.setGameplayV4(R.createDepthAccount(seed),true);s.account.currencies.stamps=9000;
   let first=null,firstId=null,guaranteed=false;const results=[];
   for(let batch=0;batch<6;batch++){
    if(batch===3)s=take(R.metaCommand(s,{type:'advanceLocalDay'}));
    const before=s;s=take(R.metaCommand(s,{type:'pull',bannerId:banner.id,seed:rng.deriveSeed(seed,batch+1700),count:10}));
    if(seed<=10)assert.deepEqual(R.metaCommand(before,{type:'pull',bannerId:banner.id,seed:rng.deriveSeed(seed,batch+1700),count:10}).state,s);
    for(const r of s.account.history.slice(-10)){
     results.push(r);const bucket=row.buckets[r.pityBefore]??={n:0,rarities:{common:0,rare:0,epic:0,legendary:0},expected:{common:0,rare:0,epic:0,legendary:0}};
     bucket.n++;bucket.rarities[r.rarity]++;for(const rarity of C.RARITY_ORDER)bucket.expected[rarity]+=r.oddsBp[rarity]/10000;
     if(r.rarity==='legendary'){
      if(first===null){first=r.index;firstId=r.cardId??r.itemId;}
      if(banner.featuredCardId){if(guaranteed){assert.equal(r.cardId,banner.featuredCardId);row.featuredGuaranteedChecks++;}guaranteed=r.cardId!==banner.featuredCardId;}
     }
     if(r.itemId&&!row.gearTemplates.includes(r.itemId))row.gearTemplates.push(r.itemId);
    }
   }
   assert(first!==null&&first<=60);assert.equal(R.selectorMarksV4(s),60);assert.equal(s.account.currencies.stamps,0);
   if(seed===1)await writeFile(`${out}/ceremony-${banner.id}.json`,JSON.stringify({method:'Controlled acceptance account, seed1, actual committed paid draw receipts; not earned progression.',events:s.v4.reveals},null,2));
   const pity=JSON.stringify(s.account.pity),choice=C.CARDS.find(c=>!s.account.cards.some(o=>o.cardId===c.id))??C.CARDS[0];
   s=take(R.chooseSelectorV4(s,'cat',choice.id));assert.equal(R.selectorMarksV4(s),0);assert.equal(JSON.stringify(s.account.pity),pity);
   if(seed<=25)assert.deepEqual(R.importSave(R.exportSave(s)),s);
   row.accounts.push({seed,first,firstId,chosenAt:60,digest:hash(results)});
   if(Date.now()-start>110000){await writeFile(`${out}/partial.json`,JSON.stringify({source,rows}));process.exitCode=75;throw pause;}
  }
  await writeFile(`${out}/partial.json`,JSON.stringify({source,rows}));
 }
 const summaries=rows.map(row=>{
  let survival=1;const cdf=[];for(let draw=1;draw<=60;draw++){survival*=1-C.getBannerOdds(row.banner,{sinceLegendary:draw-1,totalPulls:draw-1,featuredGuaranteed:false}).legendary/10000;const observed=row.accounts.filter(a=>a.first<=draw).length/row.accounts.length;cdf.push({draw,expected:1-survival,observed,errorPp:100*Math.abs(observed-(1-survival))});}
  const sorted=row.accounts.map(a=>a.first).sort((a,b)=>a-b),q=p=>sorted[Math.ceil(p*sorted.length)-1];
  const maxDeviationPp=Math.max(...cdf.map(c=>c.errorPp));
  return {banner:row.banner,accounts:row.accounts.length,draws:row.accounts.length*60,firstLegendary:{median:q(.5),p90:q(.9),max:q(1),censored:0},chosenReward:{median:60,p90:60,max:60,censored:0},maxDeviationPp,gate:maxDeviationPp<=1?'PASS':'MISS',cdf,featuredGuaranteedChecks:row.featuredGuaranteedChecks,gearTemplateCount:row.gearTemplates.length};
 });
 await writeFile(`${out}/gacha.json`,JSON.stringify({method:'10,000 independent seeds 1–10000 per banner, six real ten-draw batches. Controlled 9000-stamp bankroll isolates odds; day rollover after 30 draws, actual selector redemption. This is not an earned-progression day estimate. First-Legendary CDF compares exact conditional survival at each draw; pity buckets retain conditional observed/expected frequencies. Fixed seeds, no reroll.',source,summaries,rows},null,2));
 console.log(JSON.stringify(summaries.map(({cdf,...s})=>s)));
} catch(e){if(e!==pause)throw e;}finally{await vite.close();}
