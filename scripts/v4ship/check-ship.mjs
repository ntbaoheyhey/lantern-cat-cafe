/** Fail closed: missing runtime evidence is never a passing gate. */
import {readFileSync,readdirSync,existsSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=resolve(import.meta.dirname,'../..');
const median=xs=>{if(!xs.length)return null;const a=[...xs].sort((a,b)=>a-b),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
export function funnelGate(runs){
 const sizes=[1280,1440].map(width=>{
  const rows=runs.filter(r=>r.viewport?.width===width&&r.viewport?.height===(width===1280?720:900));
  const complete=rows.filter(r=>r.cleanProfile===true&&r.realClicks===true&&r.steps?.length===7&&new Set(r.steps.map(s=>s.number)).size===7&&r.steps.every(s=>s.status==='pass')).length;
  const measured=key=>rows.every(r=>Number.isFinite(r[key])&&r[key]>=0)?rows.map(r=>r[key]):[];
  const battleMedianMs=median(measured('firstBattleMs')),battleMedianClicks=median(measured('firstBattleClicks'));
  const receiptTimes=measured('firstReceiptMs'),receiptMedianMs=median(receiptTimes),receiptMaxMs=receiptTimes.length?Math.max(...receiptTimes):null;
  const errors=rows.reduce((n,r)=>n+(r.errors?.length??1)+(r.networkFailures?.length??1)+(r.httpFailures?.length??1),0),popups=rows.reduce((n,r)=>n+(r.popups?.length??1),0);
  const uniqueProfiles=new Set(rows.map(r=>r.id)).size===rows.length;
  const pass=rows.length===10&&complete===10&&uniqueProfiles&&battleMedianMs!==null&&battleMedianMs<=30000&&battleMedianClicks!==null&&battleMedianClicks<=3&&receiptMedianMs!==null&&receiptMedianMs<=180000&&receiptMaxMs<=240000&&errors===0&&popups===0;
  return {width,runs:rows.length,complete,battleMedianMs,battleMedianClicks,receiptMedianMs,receiptMaxMs,errors,popups,pass};
 });
 return {pass:sizes.every(s=>s.pass),sizes};
}
export function learnGate(item){
 const note=resolve(root,'reports/v4-ship/LEARN',`${item}.md`),catalog=JSON.parse(readFileSync(resolve(root,'reports/v4-ship/LEARN/sources.json'),'utf8'));
 const rows=catalog.filter(s=>s.id.startsWith(`${item}-`));
 const formal=rows.filter(s=>['formal-document','paper'].includes(s.type)).length,web=rows.filter(s=>s.type==='internet-doc').length;
 const experiments=rows.filter(s=>s.type==='own-experiment'&&existsSync(resolve(root,s.url_or_path))).length;
 return {pass:existsSync(note)&&rows.length>=6&&formal>=1&&web>=3&&experiments>=1,sources:rows.length,formal,web,experiments,note:`LEARN/${item}.md`};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const item=process.env.V4_ITEM??'S2',dir=resolve(root,'reports/v4-ship/RUNS',item);
 const runs=existsSync(dir)?readdirSync(dir).filter(f=>/^run-\d+-\d+\.json$/.test(f)).map(f=>JSON.parse(readFileSync(resolve(dir,f),'utf8'))):[];
 const gates={'G-LEARN':learnGate(item),'G-FUNNEL':funnelGate(runs)};
 for(const name of ['G-PROOF','G-AUDIO','G-UI','G-REPO','G-REHEARSAL','G-SUBMIT','G-CLASS','G-REG'])gates[name]={pass:false,status:'unmeasured',reason:'No complete gate-specific checker evidence attached yet'};
 for(const [name,result] of Object.entries(gates))console.log(`${result.pass?'PASS':'FAIL'} ${name} ${JSON.stringify(result)}`);
 if(process.argv.includes('--write'))writeFileSync(resolve(root,'reports/v4-ship',item,'checks.json'),JSON.stringify({at:new Date().toISOString(),item,gates},null,2)+'\n');
 if(Object.values(gates).some(g=>!g.pass))process.exitCode=1;
}
