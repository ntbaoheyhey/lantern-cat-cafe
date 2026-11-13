import {mkdir,writeFile} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {root,evidenceMeta} from './check-gates.mjs';
const card=process.argv[2];if(!/^[A-Z][A-Z0-9]*$/.test(card??''))throw Error('Usage: run-suite.mjs CARD');
const out=resolve(root,'reports/v3-battle/a2',card);await mkdir(out,{recursive:true});
const commands={typecheck:['pnpm',['-r','typecheck']],unit:['pnpm',['test']],e2e:['pnpm',['--filter','@taskbar-hero/web','exec','playwright','test','--config','../../tools/cinematic-compositor/playwright.config.ts']],parity:['pnpm',['--filter','@taskbar-hero/web','exec','vitest','run','src/game/cardrpg/battle-v3/controls.test.ts']]};
const run=([name,[bin,args]])=>new Promise((res,rej)=>{
  const log=createWriteStream(resolve(out,`suite-${name}.log`));log.write(`COMMAND: ${bin} ${args.join(' ')}\n`);
  const child=spawn(bin,args,{cwd:root,stdio:['ignore','pipe','pipe']});child.stdout.pipe(log);child.stderr.pipe(log);
  child.on('error',rej);child.on('close',code=>{log.end();console.log(`${card} ${name}: exit ${code}`);res([name+'Exit',code]);});
});
// Typecheck and parity are cheap; keep resource-heavy unit and browser runs separate.
const quick=await Promise.allSettled(Object.entries(commands).filter(([n])=>n==='typecheck'||n==='parity').map(run));
const results=quick.map(r=>{if(r.status==='rejected')throw r.reason;return r.value;});
results.push(await run(['unit',commands.unit]));results.push(await run(['e2e',commands.e2e]));
const report={_meta:evidenceMeta(),...Object.fromEntries(results)};
await writeFile(resolve(out,'suite.json'),JSON.stringify(report,null,2)+'\n');
process.exitCode=results.every(([,code])=>code===0)?0:1;
