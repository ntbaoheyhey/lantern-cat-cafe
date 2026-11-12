/** Compare prospective UI and simulator runs; no fitted combat/timing results.
 * Missing losses are right-censored at the session horizon, never counted as 0.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {normalWin,summarize} from './runtime.mjs';

const quantile=(values,p)=>{const xs=[...values].sort((a,b)=>a-b);return xs.length?xs[Math.min(xs.length-1,Math.floor(xs.length*p))]:null;};
const error=(actual,expected)=>actual===null||expected===null?actual===expected?0:Infinity:Math.abs(actual-expected)/Math.max(Math.abs(actual),1e-9);
const actionValue=({at,delayMs,...action})=>action;
const key=e=>`${e.tutorial?'tutorial':e.runId??''}:${e.seed}:${e.node??''}`;
export function compareRuns(bot,sim,tolerance=.15){
 const issues=[],metrics=[],add=(name,actual,expected)=>{
  const relativeError=error(actual,expected),pass=relativeError<=tolerance;
  metrics.push({name,actual,simulated:expected,relativeError:Number.isFinite(relativeError)?relativeError:null,pass});
  if(!pass)issues.push(`${name}: outside ${tolerance*100}%`);
 };
 if(bot.seed!==sim.seed)issues.push('Different account seeds');
 if(Math.abs((bot.secondsRequested??bot.activeSeconds)-sim.summary.activeSeconds)>1)issues.push('Different session horizons');
 if(bot.completed!==true)issues.push('Real session did not complete');
 if(bot.errors?.length)issues.push('Real session has browser/driver errors');
 const observed=bot.encounters??[],predicted=sim.encounters??[];
 const commonEncounters=Math.min(observed.length,predicted.length);
 for(let i=0;i<commonEncounters;i++){
  if(key(observed[i])!==key(predicted[i])){issues.push(`Encounter order diverged at ${i}`);break;}
 }
 for(const [label,encounters] of [['Real',observed],['Simulated',predicted]]){
  if(new Set(encounters.map(key)).size!==encounters.length)issues.push(`${label} encounter keys are duplicated`);
  if(encounters.some(e=>!e.skipped&&(!Number.isFinite(e.playbackSeconds)||e.playbackSeconds<=0)))issues.push(`${label} encounter timing is missing`);
 }
 const matches=[],byKey=new Map(predicted.map(e=>[key(e),e]));
 for(const a of observed){
  const s=byKey.get(key(a));
  if(!s)continue;
  const equalSetup=isDeepStrictEqual(a.initial,s.initial),equalChoices=isDeepStrictEqual(a.choices,s.choices);
  const equalOutcome=a.result===s.result&&Math.abs(a.hpRemaining-s.hpRemaining)<1e-9;
  const playbackError=a.skipped||s.skipped?null:error(a.playbackSeconds,s.playbackSeconds);
  matches.push({key:key(a),equalSetup,equalChoices,equalOutcome,playbackError,realSeconds:a.playbackSeconds,simSeconds:s.playbackSeconds});
  if(!equalSetup||!equalChoices||!equalOutcome)issues.push(`Combat mismatch: ${key(a)}`);
  if(playbackError!==null&&playbackError>tolerance)issues.push(`Playback mismatch: ${key(a)}`);
 }
 if(!matches.length)issues.push('No common encounters');
 const actionCount=Math.min(bot.actions.length,sim.actions.length);let actionPrefix=0;
 if(!actionCount)issues.push('No common actions');
 for(;actionPrefix<actionCount;actionPrefix++)if(!isDeepStrictEqual(actionValue(bot.actions[actionPrefix]),actionValue(sim.actions[actionPrefix])))break;
 if(actionPrefix<actionCount)issues.push(`Decision policy diverged at action ${actionPrefix}`);
 const curves=Math.min(bot.curve.length,sim.curve.length);let curvePrefix=0,maxCurrencyError=0,maxXpError=0;
 if(!curves)issues.push('No common progression curve');
 // Skips have no progression curve point in either implementation.
 for(;curvePrefix<curves;curvePrefix++){
  const a=bot.curve[curvePrefix],s=sim.curve[curvePrefix];
  if(a.nextRunId!==s.nextRunId||!isDeepStrictEqual(a.team,s.team)||!isDeepStrictEqual(a.cards,s.cards)||a.gear!==s.gear)break;
  for(const currency of new Set([...Object.keys(a.currencies),...Object.keys(s.currencies)]))maxCurrencyError=Math.max(maxCurrencyError,error(a.currencies[currency]??0,s.currencies[currency]??0));
  maxXpError=Math.max(maxXpError,error(a.xp,s.xp));
 }
 if(curvePrefix<curves)issues.push(`Progression diverged at curve point ${curvePrefix}`);
 if(maxCurrencyError>tolerance||maxXpError>tolerance)issues.push('Gold/XP curve outside tolerance');
 // Recompute from the immutable encounter traces, including older runs whose
 // summary included skipped fights in the ordinary-win HP statistic.
 const a=summarize(observed,bot.secondsRequested??bot.activeSeconds),s=summarize(predicted,sim.summary.activeSeconds);
 add('encounters',a.encounters,s.encounters);
 add('wins',a.wins,s.wins);add('losses',a.losses,s.losses);
 add('firstLossSeconds',a.firstLossSeconds,s.firstLossSeconds);
 add('normalWinHpMedian',a.normalWinHpMedian,s.normalWinHpMedian);
 // A fixed wall-clock horizon can censor one last boss in only one run. With
 // few bosses, adding that encounter can move the median between different
 // enemies even when every shared encounter has identical playback timing.
 // Compare timing on identical encounters; keep full-horizon balance intact.
 const matchedKeys=new Set(matches.map(m=>m.key));
 const pairedReal=summarize(observed.filter(e=>matchedKeys.has(key(e))),a.activeSeconds);
 const pairedSim=summarize(predicted.filter(e=>matchedKeys.has(key(e))),s.activeSeconds);
 const bossTiming={paired:{real:pairedReal.boss,simulated:pairedSim.boss},
  fullHorizon:{real:a.boss,simulated:s.boss},censoredTails:[]};
 for(const [completedSide,encounters,other] of [['real',observed,sim],['simulated',predicted,bot]]){
  for(const e of encounters.filter(e=>e.boss&&!e.skipped&&!matchedKeys.has(key(e)))){
   const live=other.live,horizon=other.secondsRequested??other.summary.activeSeconds;
   if(!live||key(live)!==key(e)||!live.boss||live.skipped||!isDeepStrictEqual(live.initial,e.initial)||
    !Number.isFinite(live.readyAt)||live.readyAt<0||live.readyAt>horizon){
    issues.push(`Unmatched boss without an identical live horizon trace: ${key(e)}`);continue;
   }
   const elapsed=horizon-live.readyAt;
   const minimumPlaybackError=elapsed<=e.playbackSeconds?0:completedSide==='simulated'
    ?error(elapsed,e.playbackSeconds):error(e.playbackSeconds,elapsed);
   if(minimumPlaybackError>tolerance)issues.push(`Censored boss already exceeds playback tolerance: ${key(e)}`);
   bossTiming.censoredTails.push({key:key(e),completedSide,completedSeconds:e.playbackSeconds,
    liveStartedAt:live.readyAt,horizon,liveElapsedSeconds:elapsed,minimumPlaybackError});
  }
 }
 add('pairedBossMedianSeconds',pairedReal.boss.medianSeconds,pairedSim.boss.medianSeconds);
 add('pairedBossP90Seconds',pairedReal.boss.p90Seconds,pairedSim.boss.p90Seconds);
 return {seed:bot.seed,pass:issues.length===0,tolerance,issues,metrics,matchedEncounters:matches.length,
  observedEncounters:observed.length,predictedEncounters:predicted.length,actionPrefix,commonActions:actionCount,
  curvePrefix,commonCurves:curves,maxCurrencyError,maxXpError,firstLossCensored:a.firstLossSeconds===null&&s.firstLossSeconds===null,
  playbackMedianError:quantile(matches.map(x=>x.playbackError).filter(x=>x!==null),.5),bossTiming,matches};
}

export function cohort(reports){
 const completed=reports.filter(r=>r.completed===true||(!('completed' in r)&&!!r.final&&Array.isArray(r.actions))),encounters=completed.flatMap(r=>r.encounters.filter(e=>!e.tutorial));
 const losses=completed.map(r=>r.summary.firstLossSeconds),observed=losses.filter(x=>x!==null);
 const censored=losses.length-observed.length;
 const bosses=encounters.filter(e=>e.boss&&!e.skipped),normal=encounters.filter(normalWin);
 // With a common horizon the median is estimable only when > half have lost.
 const firstLossMedian=quantile(losses.map(x=>x??Infinity),.5);
 return {seeds:reports.length,completeSeeds:completed.length,censoredSeeds:censored,
  minimumHorizonSeconds:completed.length?Math.min(...completed.map(r=>r.secondsRequested??r.summary.activeSeconds)):null,
  firstLossMedianSeconds:Number.isFinite(firstLossMedian)?firstLossMedian:null,
  earliestLossSeconds:observed.length?Math.min(...observed):null,
  earlyLossSeeds:observed.filter(x=>x<480).length,
  bossCount:bosses.length,bossMedianSeconds:quantile(bosses.map(e=>e.playbackSeconds),.5),bossP90Seconds:quantile(bosses.map(e=>e.playbackSeconds),.9),
  normalWinCount:normal.length,normalWinHpMean:normal.length?normal.reduce((sum,e)=>sum+e.hpRemaining,0)/normal.length:null,normalWinHpMedian:quantile(normal.map(e=>e.hpRemaining),.5)};
}

/** Balance is a separate gate from simulation parity. Censored losses never
 * satisfy a target merely because both models agree that no loss was observed. */
export function balanceTargets(summary,expectedSeeds){
 const between=(value,min,max)=>Number.isFinite(value)&&value>=min&&value<=max;
 const rows=[
  {metric:'completedSeeds',value:summary.completeSeeds,min:expectedSeeds,max:expectedSeeds},
  {metric:'minimumHorizonSeconds',value:summary.minimumHorizonSeconds,min:1800,max:Infinity},
  {metric:'firstLossMedianSeconds',value:summary.firstLossMedianSeconds,min:720,max:1200},
  {metric:'earlyLossSeeds',value:summary.earlyLossSeeds,min:0,max:0},
  {metric:'bossMedianSeconds',value:summary.bossMedianSeconds,min:60,max:90},
  {metric:'bossP90Seconds',value:summary.bossP90Seconds,min:0,max:110},
  {metric:'normalWinHpMean',value:summary.normalWinHpMean,min:.55,max:.8},
  {metric:'normalWinHpMedian',value:summary.normalWinHpMedian,min:.55,max:.8},
 ].map(row=>({...row,pass:between(row.value,row.min,row.max)}));
 return {pass:rows.every(row=>row.pass),rows};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const arg=(name,fallback)=>process.argv.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3)??fallback;
 const bot=arg('bot'),sim=arg('sim'),out=arg('out');
 if(!bot||!sim)throw Error('Use --bot=<directory> --sim=<directory> [--out=<json>]');
 const index=JSON.parse(await readFile(resolve(bot,'summary.json'),'utf8'));
 const pairs=await Promise.all(index.seeds.map(async seed=>({bot:JSON.parse(await readFile(resolve(bot,`${seed}.json`),'utf8')),sim:JSON.parse(await readFile(resolve(sim,`${seed}.json`),'utf8'))})));
 const reports=pairs.map(p=>compareRuns(p.bot,p.sim)),result={pass:reports.every(r=>r.pass),real:cohort(pairs.map(p=>p.bot)),sim:cohort(pairs.map(p=>p.sim)),reports};
 if(out){await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));}
 console.table(reports.map(({seed,pass,matchedEncounters,actionPrefix,playbackMedianError,maxCurrencyError,issues})=>({seed,pass,matchedEncounters,actionPrefix,playbackErrorPercent:100*playbackMedianError,currencyErrorPercent:100*maxCurrencyError,issues:issues.join('; ')})));
 console.log(JSON.stringify({pass:result.pass,real:result.real,sim:result.sim}));
 if(!result.pass)process.exitCode=1;
}
