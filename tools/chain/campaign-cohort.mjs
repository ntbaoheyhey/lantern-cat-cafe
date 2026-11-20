// Source evidence only. A simulated account is neither a person nor demand.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const types=['casual','regular','farmer','bot'];
const zero=()=>({wins:0,epic:0,legendary:0,starts:0,commands:0});
const count=n=>assert(Number.isSafeInteger(n)&&n>=0,'Invalid campaign source count');

export function reconcileCampaignEvidence(data){
  assert.equal(data.version,2,'Campaign daily export breakdown required');
  assert.equal(data.days,14,'Review changed campaign measurement horizon');
  assert.equal(new Date(data.epoch).getUTCDay(),1,'Reward weeks must start Monday');
  assert.equal(data.epoch%86400000,0,'Reward weeks must start at UTC midnight');
  assert(/^[a-f0-9]{64}$/.test(data.rulesHash)&&/^[a-f0-9]{64}$/.test(data.modelHash),'Campaign fingerprints required');
  assert.equal(data.accounts,data.rows.length);
  const keys=new Set(),traces=[];
  for(const row of data.rows){
    assert(['starter-only','equip-earned'].includes(row.policy)&&['casual','regular','heavy'].includes(row.profile));
    assert(Number.isSafeInteger(row.seed)&&data.seeds.includes(row.seed),'Unknown campaign seed');
    const key=`${row.policy}/${row.profile}/${row.seed}`;
    assert(!keys.has(key),'Duplicate campaign account');keys.add(key);
    const weeks=[zero(),zero()],seen=new Set();
    let grossEpic=0,grossLegendary=0;
    for(const d of row.daily){
      assert(Number.isSafeInteger(d.day)&&d.day>=1&&d.day<=14&&!seen.has(d.day),'Invalid campaign day');seen.add(d.day);
      for(const field of ['starts','wins','epic','legendary','exports','exportEpic','exportLegendary','commands'])count(d[field]);
      assert(d.wins<=d.starts&&d.starts<=6&&d.exports<=3,'Campaign quotas violated');
      assert.equal(d.exports,d.exportEpic+d.exportLegendary,'Export kinds disagree');
      const w=weeks[Math.floor((d.day-1)/7)];
      w.wins+=d.wins;w.starts+=d.starts;w.epic+=d.exportEpic;w.legendary+=d.exportLegendary;w.commands+=d.commands;
      grossEpic+=d.epic;grossLegendary+=d.legendary;
    }
    assert.equal(weeks.reduce((n,w)=>n+w.wins,0),row.wins,'Boss wins disagree');
    assert.equal(weeks.reduce((n,w)=>n+w.starts,0),row.starts,'Starts disagree');
    assert.equal(weeks.reduce((n,w)=>n+w.epic,0),row.exportEpic,'Epic surplus disagrees');
    assert.equal(weeks.reduce((n,w)=>n+w.legendary,0),row.exportLegendary,'Legendary surplus disagrees');
    assert.equal(row.exported,row.exportEpic+row.exportLegendary);
    assert.equal(grossEpic,row.epic);assert.equal(grossLegendary,row.legendary);
    assert(row.exportEpic<=row.epic&&row.exportLegendary<=row.legendary,'Exports exceed created supply');
    traces.push({key,policy:row.policy,profile:row.profile,seed:row.seed,weeks});
  }
  for(const policy of ['starter-only','equip-earned'])for(const profile of ['casual','regular','heavy'])
    assert.equal(traces.filter(t=>t.policy===policy&&t.profile===profile).length,data.seeds.length,'Missing campaign cohort');
  return {rulesHash:data.rulesHash,modelHash:data.modelHash,days:data.days,accounts:traces.length,traces};
}

export function loadCampaignEvidence(){
  const bytes=readFileSync(resolve(root,'docs/chain/campaign-study.json')),data=JSON.parse(bytes);
  const manifest=readFileSync(resolve(root,'supabase/functions/_shared/chain-campaign-manifest.ts'),'utf8');
  assert(manifest.includes(`'${data.rulesHash}'`),'Campaign rules changed; rerun source study');
  const modelHash=createHash('sha256').update(data.rulesHash).update(readFileSync(resolve(root,'tools/chain/campaign-study.mjs'))).digest('hex');
  assert.equal(modelHash,data.modelHash,'Campaign driver changed; rerun source study');
  return {...reconcileCampaignEvidence(data),evidenceHash:createHash('sha256').update(bytes).digest('hex')};
}

export function campaignCohort(evidence,{policy='equip-earned',tail='repeat-two-weeks',botProfile='heavy'}={}){
  assert(['starter-only','equip-earned'].includes(policy));
  assert(['repeat-two-weeks','stop-source'].includes(tail),'Explicit extrapolation required');
  assert(['casual','heavy'].includes(botProfile),'Explicit bot source bound required');
  const profiles={casual:'casual',regular:'regular',farmer:'heavy',bot:botProfile};
  const result={policy,tail,botProfile,evidenceHash:evidence.evidenceHash,byType:Object.fromEntries(types.map(type=>[
    type,evidence.traces.filter(t=>t.policy===policy&&t.profile===profiles[type]).map(t=>({key:t.key,weeks:t.weeks}))]))};
  validateCampaignCohort(result);return result;
}

export function validateCampaignCohort(cohort){
  assert(cohort&&['repeat-two-weeks','stop-source'].includes(cohort.tail),'Invalid campaign tail');
  assert(/^[a-f0-9]{64}$/.test(cohort.evidenceHash),'Campaign evidence hash required');
  for(const type of types){
    const samples=cohort.byType[type];assert(Array.isArray(samples)&&samples.length>0,'Campaign samples required');
    for(const sample of samples){
      assert(typeof sample.key==='string'&&sample.key&&sample.weeks.length===2,'Two paired weeks required');
      for(const week of sample.weeks){
        for(const field of ['wins','epic','legendary','starts','commands'])count(week[field]);
        assert(week.wins<=week.starts&&week.starts<=42&&week.epic+week.legendary<=21,'Campaign limits');
      }
    }
  }
  return cohort;
}

export function campaignWeek(cohort,sample,week){
  assert(Number.isSafeInteger(week)&&week>=1);
  return week>2&&cohort.tail==='stop-source'?zero():sample.weeks[(week-1)%2];
}
