/** Render the completed, fixed-cohort economy projection without hiding misses. */
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root} from './runtime.mjs';
const arg = (key, fallback) => process.argv.find(a=>a.startsWith(`--${key}=`))?.slice(key.length+3) ?? fallback;
const dir=arg('dir'); if(!dir)throw Error('Use --dir=<completed 600-account projection>');
const s=JSON.parse(await readFile(resolve(dir,'summary.json'),'utf8'));
const ids=['casual','regular','heavy'];
for(const id of ids)if(s.profiles[id]?.seeds!==200||s.profiles[id]?.days!==30)throw Error('All three 200-account, 30-day cohorts are required');
const n=(x,d=3)=>x===null?'censored':Number(x).toFixed(d);
const out=resolve(arg('out',resolve(root,'docs/cardrpg-c2')));await mkdir(out,{recursive:true});
const atomic=async(path,text)=>{await writeFile(path+'.tmp',text);await rename(path+'.tmp',path);};
const colors={casual:'#256e67',regular:'#ad6525',heavy:'#7954a0'};
const calendar=s.source.calendar??{firstDay:'2026-11-12',startSpanDays:1};
const span=calendar.startSpanDays??1;
const calendarNote=span===1?`Shared calendar start: ${calendar.firstDay}. Daily-route results are correlated across accounts.`:`${span} stratified start dates from ${calendar.firstDay}; accounts sharing a date also share daily-route seeds.`;
const calendarExplanation=span===1?`Every profile starts on ${calendar.firstDay} and shares each daily-route seed. The account seeds do not measure between-date uncertainty.`:`Account seeds cycle evenly through ${span} consecutive start dates from ${calendar.firstDay}; matching casual/regular/heavy accounts share a start date. Daily-route seeds are still shared by calendar date, so 600 accounts are not 600 independent calendar samples. This cohort measures variation across the declared start-date window.`;
const firstSeed=s.source.cohort?.firstSeed??90001,lastSeed=firstSeed+199;

const escape=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const curves=ids.flatMap(id=>['epic','legendary'].flatMap(r=>s.profiles[id][r].cdf.map(p=>({profile:id,rarity:r,...p}))));
await atomic(resolve(out,'economy-rarity.csv'),'profile,rarity,day,cumulative_fraction\n'+curves.map(p=>`${p.profile},${p.rarity},${p.day},${p.fraction}`).join('\n')+'\n');
const charts=['epic','legendary'].map((rarity,index)=>{
 const left=68+index*550,top=105,width=470,height=230;
 const x=day=>left+day/30*width,y=share=>top+height-share*height;
 const axes=[0,.25,.5,.75,1].map(v=>`<line x1="${left}" y1="${y(v)}" x2="${left+width}" y2="${y(v)}" stroke="#dfd7cd"/><text x="${left-10}" y="${y(v)+4}" text-anchor="end">${v*100}%</text>`).join('')+[0,5,10,15,20,25,30].map(v=>`<text x="${x(v)}" y="${top+height+24}" text-anchor="middle">${v}</text>`).join('');
 const lines=ids.map(id=>{
  let d=`M ${x(0)} ${y(0)}`;
  for(const p of s.profiles[id][rarity].cdf)d+=` H ${x(p.day)} V ${y(p.fraction)}`;
  return `<path d="${d}" stroke="${colors[id]}" stroke-width="${id==='heavy'?2:3}" stroke-dasharray="${id==='heavy'?'7 4':'none'}" fill="none"/>`;
 }).join('');
 return `<text x="${left}" y="${top-20}" class="subtitle">First ${rarity==='epic'?'Epic':'Legendary'} gear</text>${axes}${lines}<text x="${left+width/2}" y="${top+height+49}" text-anchor="middle">Day since account start</text>`;
}).join('');
const legend=ids.map((id,i)=>`<line x1="${250+i*230}" x2="${280+i*230}" y1="420" y2="420" stroke="${colors[id]}" stroke-width="3" stroke-dasharray="${id==='heavy'?'7 4':'none'}"/><text x="${290+i*230}" y="425">${id} · ${s.profiles[id].minutesPerDay} min/day</text>`).join('');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="485" viewBox="0 0 1160 485"><title>First-gear cumulative distribution, 200 accounts per profile</title><desc>${escape(calendarNote)}</desc><style>text{font:14px Helvetica,Arial,sans-serif;fill:#423b35}.title{font-size:24px;font-weight:bold}.subtitle{font-size:18px;font-weight:bold}.note{font-size:13px}</style><rect width="1160" height="485" fill="#fbf8f1"/><text x="38" y="38" class="title">First-gear timing · 600 fixed-cohort accounts</text><text x="38" y="62">Cumulative share of accounts · 30 days · 200 seeds per profile</text>${charts}${legend}<text x="38" y="464" class="note">${escape(calendarNote)}</text></svg>`;
await atomic(resolve(out,'economy-rarity.svg'),svg);
const summaryRows=ids.map(id=>{const p=s.profiles[id];return `| ${id} | ${p.minutesPerDay} | ${p.epic.medianDay} / ${p.epic.p90Day} | ${p.legendary.medianDay} / ${p.legendary.p90Day} | ${p.legendary.censored} | ${p.bag.medianFinal} / ${p.bag.p90Final} / ${p.bag.maximum} |`;}).join('\n');
const currencyRows=ids.flatMap(id=>Object.entries(s.profiles[id].currencies).map(([c,v])=>`| ${id} | ${c} | ${n(v.meanInitial,2)} | ${n(v.meanIncome,2)} | ${n(v.meanSpent,2)} | ${n(v.meanFinal,2)} | ${n(v.sinkRatio)} | ${v.sinkRatio>=.8&&v.sinkRatio<=1.1?'PASS':'MISS'} |`)).join('\n');
const hourRows=Object.entries(s.heavyToCasualPerHour).map(([k,v])=>`| ${k} | ${n(v)}× | ${v<=3?'PASS':'MISS'} |`).join('\n');
const report=`# B4b — final 30-day economy projection\n\nAll 600 accounts completed: three declared player policies × 200 seeds (${firstSeed}–${lastSeed}) × 30 days. Rules runtime SHA256: \`${s.source.runtimeSha256}\`. Source commit: \`${s.source.head}\`; run metadata: ${s.source.date}. Raw daily accounts and the immutable runtime remain outside Git in \`${dir}\`. Compact reproducible results: [ECONOMY.json](ECONOMY.json).\n\nThis is a modeled player policy using public transactions and the battle playback clock. The five real 30-minute UI sessions are reported separately in [BALANCE.md](BALANCE.md). ${calendarExplanation}\n\n![Cumulative first-gear timing](../../docs/cardrpg-c2/economy-rarity.svg)\n\n| Profile | Minutes/day | First Epic median / p90 day | First Legendary median / p90 day | Legendary censored at day30 | Bag final median / p90 / max seen |\n|---|---:|---:|---:|---:|---:|\n${summaryRows}\n\nThe casual first-Epic target is day 1–2; the first-Legendary target is day 10–16. Bag size reflects the declared policy that salvages spare low-rarity pieces above 48, while preserving equipment and counting gross creation before salvage; the game's shelf limit is 240. The maximum can temporarily exceed 48 after a transaction. [CDF data](../../docs/cardrpg-c2/economy-rarity.csv) preserve all 30 days and any censoring.\n\n| Profile | Currency | Mean starting balance | Mean earned | Mean spent | Mean ending balance | Out/in | 0.8–1.1 target |\n|---|---|---:|---:|---:|---:|---:|---|\n${currencyRows}\n\nOut/in uses actual earned income, with starting balances shown separately. A ratio above one can consume starting funds. No idle balances were deleted to improve this ratio. Purchases use legal public transactions and prospective mean-roll Power; the policy cannot inspect a future random roll.\n\n| Heavy / casual progress per active hour | Ratio | ≤3× target |\n|---|---:|---|\n${hourRows}\n\nThese are explicit XP, gross gear and mastery-material proxies. Daily caps flatten extra play; they do not imply that every subjective definition of progress has been bounded.\n\nPer-item weekly gross creation and eligible template supply are published in [WEEKLY-SUPPLY.json](WEEKLY-SUPPLY.json) and [OUTBOX.md](OUTBOX.md), using CHAIN's exact READY catalog. Eligible templates are not authoritative mint receipts. Ordinary browser-save campaign issuance remains zero pending trusted player, earning and consumed/sealed records. Star Thread is a separate one-time CHAIN judge entitlement, never recurring campaign supply.\n\nItem-impact evidence and runtime-matched acceptance stay separate in [DROP-TABLE.md](DROP-TABLE.md). An economy result does not establish a universal item-effect bound; original screens and independent holdouts retain their own sample labels.\n`;
await atomic(resolve(arg('report',resolve(root,'reports/cardrpg-c2/ECONOMY.md'))),report);
console.log(JSON.stringify({profiles:ids.map(id=>({id,seeds:s.profiles[id].seeds})),chart:resolve(out,'economy-rarity.svg'),bytes:Buffer.byteLength(svg)}));
