// A fresh localhost chain/database per spec preserves real IP/day quotas and
// prevents one judge scenario consuming another scenario's three-drip limit.
// Discover every spec; no retries, exclusions, spoofed IPs or raised limits.
import {readdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const specs=readdirSync(resolve(root,'apps/web/e2e/chain')).filter(s=>s.endsWith('.spec.ts')).sort();
if(!specs.length)throw new Error('No chain browser specs discovered');
let failed=0;
for(const spec of specs){
 const code=await new Promise((resolve,reject)=>{
  const child=spawn('pnpm',['--filter','@taskbar-hero/web','exec','playwright','test','--config','playwright.chain.config.ts',`e2e/chain/${spec}`],{cwd:root,stdio:'inherit'});
  child.on('error',reject);child.on('close',code=>resolve(code));
 });
 if(code!==0)failed++;
 console.log(`Isolated chain spec ${spec}: ${code===0?'PASS':'FAIL'}`);
}
console.log(`Fresh chain browser scenarios: ${specs.length-failed}/${specs.length}; retries0.`);
process.exitCode=failed?1:0;
