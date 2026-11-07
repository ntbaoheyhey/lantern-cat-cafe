// REFERENCE: PROMPT-A4 G0; report only completed fresh measurements, retain original receipts.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='reports/cardrpg-big/a4/g0';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const train=await read('reports/cardrpg-big/sim/gear-a4-g0-train.json');
const held=await read('reports/cardrpg-big/sim/gear-a4-g0-heldout.json');
const saturation=await read(`${root}/saturation.json`);
const economy=await read(`${root}/economy.json`);
const browser=await read(`${root}/browser/audit.json`);
const cold=await read(`${root}/cold/summary.json`);
const startup=await read(`${root}/startup/checks.json`);
const rate=r=>r.wins/r.count;
const tiers=['none','common','rare','epic','legendary'];
const steps=[];
for(const [sample,data] of Object.entries({train,held}))for(const level of [1,6])for(const chapter of [1,2,3])for(let i=1;i<tiers.length;i++){
 const before=data.rows.find(r=>r.level===level&&r.chapter===chapter&&r.rarity===tiers[i-1]);
 const after=data.rows.find(r=>r.level===level&&r.chapter===chapter&&r.rarity===tiers[i]);
 steps.push({sample,level,chapter,from:tiers[i-1],to:tiers[i],deltaPp:100*(rate(after)-rate(before))});
}
const single=data=>data.singleItems.flatMap(item=>item.outcomes.map(o=>({templateId:item.templateId,cardId:item.cardId,level:o.level,chapter:o.chapter,
 count:o.count,deltaPp:100*(o.afterWins-o.beforeWins)/o.count,displayFraction:item.contributionFraction}))).sort((a,b)=>b.deltaPp-a.deltaPp)[0];
const range=rows=>[Math.min(...rows.map(rate))*100,Math.max(...rows.map(rate))*100];
const setSpreads = [1,6].flatMap(level => [1,2,3].map(chapter => ({level,chapter,
  rangePp:range(held.sets.filter(row=>row.level===level&&row.chapter===chapter))})));
const displayedPowerBounds = Object.fromEntries(Object.entries({train,held}).map(([label,data])=>[label,
  data.powerBounds.reduce((best,row)=>!best||row.contributionFraction>best.contributionFraction?row:best,null)]));
const completed=browser.rows.map(r=>({fixture:r.fixture,errors:r.errors,captures:r.captures.length,overflow:r.captures.some(c=>c.overflow!==0),
 encounters:r.encounters.filter(e=>e.timed).map(e=>({kind:e.kind,result:e.result,seconds:e.wallMs/1000,bossDeathSeconds:e.bossDeathMs===null?null:e.bossDeathMs/1000,
 cleanupSeconds:e.bossDeathMs===null?null:(e.wallMs-e.bossDeathMs)/1000,round:e.round,choices:e.choices}))}));
const files=['reports/cardrpg-big/sim/gear-a4-g0-train.json','reports/cardrpg-big/sim/gear-a4-g0-heldout.json',`${root}/saturation.json`,`${root}/economy.json`,`${root}/off-behavior.json`,`${root}/browser/audit.json`];
const hashes=Object.fromEntries(await Promise.all(files.map(async p=>[p,createHash('sha256').update(await readFile(p)).digest('hex')])));
const receipt={method:'Fresh unchanged A3 rules; train/heldout separated; all values derive from raw outcomes. Scores are not playtester ratings.',
 steps,tiers:{positive:steps.filter(s=>s.deltaPp>=2-1e-9).length,ties:steps.filter(s=>s.deltaPp===0).length,reversals:steps.filter(s=>s.deltaPp<0).length,total:steps.length},
 saturation,single:{train:single(train),held:single(held)},displayedPowerBounds,
 sets:{allCells:range(held.sets),chapter3Level1:range(held.sets.filter(row=>row.level===1&&row.chapter===3)),byBand:setSpreads},cats:range(held.cats),economy,
 browser:completed,cold:cold.rows.map(r=>({width:r.width,height:r.height,cpu:r.throttle,max:r.max,p95:r.p95,errors:r.errors})),
 startup:{jsBytes:startup.chunks.reduce((n,c)=>n+c.bytes,0),jsChunks:startup.chunks.length,errors:startup.errors},hashes};
await writeFile(`${root}/before.json`,JSON.stringify(receipt,null,2));
const percent=n=>n.toFixed(2)+'%', pp=n=>n.toFixed(2)+' pp';
const lines=[
 '| Measure | Fresh G0 BEFORE | Requested v4 gate |',
 '|---|---|---|',
 `| Adjacent tier steps | ${receipt.tiers.positive}/48 improve by at least 2 pp; ${receipt.tiers.ties} ties; ${receipt.tiers.reversals} reversals | ≥44/48; zero reversals |`,
 `| Paired single-piece utility | Train ${pp(receipt.single.train.deltaPp)}; heldout ${pp(receipt.single.held.deltaPp)} | Heldout ≤12 pp |`,
 `| Largest raw-score item share | ${percent(displayedPowerBounds.held.contributionFraction*100)} at +${displayedPowerBounds.held.enhancement} | ≤10%, plus utility in display |`,
 `| Sets, chapter 3 / level 1 | ${receipt.sets.chapter3Level1.map(percent).join('–')} | 35–75% at matched power |`,
 `| Sets, all original cells | ${receipt.sets.allCells.map(percent).join('–')} | Distinguish saturation from matched-power set balance |`,
 `| Cat participation | ${receipt.cats.map(percent).join('–')} | 55–75% at matched power |`,
 `| 45-day heavy/casual earned | ${Object.entries(economy.heavyCasual45).map(([key,value])=>`${key} ${value.toFixed(4)}×`).join('; ')} | Every measure ≤3× |`,
 `| Startup JavaScript | ${receipt.startup.jsBytes.toLocaleString('en-US')} bytes / ${receipt.startup.jsChunks} chunks | No growth against current main |`,
 '',
 'Tier train seeds 1–50, heldout 10001–10050; cat team seeds 50001–50020 / 60001–60020. Fifty paired outcomes mean one win is 2 pp. G0 set/cat fixtures retain historical unnormalized team power for comparison; these are not claimed to satisfy the future matched-power protocol.',
 '',
 '| Sample | Level | Chapter | Bare | Common | Rare | Epic | Legendary |',
 '|---|---:|---:|---:|---:|---:|---:|---:|',
];
for(const [label,data] of Object.entries({train,held}))for(const level of [1,6])for(const chapter of [1,2,3])lines.push(
 `| ${label} | ${level} | ${chapter} | ${tiers.map(rarity=>{const r=data.rows.find(row=>row.level===level&&row.chapter===chapter&&row.rarity===rarity);return `${r.wins}/${r.count}`;}).join(' | ')} |`);
lines.push('', '| Level | Chapter 1 bare → best | Chapter 2 bare → best | Chapter 3 bare → best |', '|---:|---:|---:|---:|');
for(const level of [1,2,3,4,5,6,7,8,9,10,50])lines.push(`| ${level} | ${[1,2,3].map(chapter=>['none','legendary'].map(rarity=>{const r=saturation.find(row=>row.level===level&&row.chapter===chapter&&row.rarity===rarity);return percent(rate(r)*100);}).join(' → ')).join(' | ')} |`);
const auditPath='reports/cardrpg-big/a4/G0-AUDIT.md';
const audit=await readFile(auditPath,'utf8');
await writeFile(auditPath,audit.replace(/<!-- A4_BEFORE_START -->[\s\S]*?<!-- A4_BEFORE_END -->/,
 `<!-- A4_BEFORE_START -->\n${lines.join('\n')}\n<!-- A4_BEFORE_END -->`)
 .replace('fresh behavioral OFF digest is pending.',`fresh behavioral OFF digest is ${((await read(`${root}/off-behavior.json`)).sha256)}.`));
console.log(JSON.stringify({...receipt,saturation:undefined,steps:undefined,economy:undefined},null,2));
