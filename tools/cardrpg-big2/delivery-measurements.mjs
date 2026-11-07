// REFERENCE: tools/cardrpg-big2/{studio-check,feature-measurements}.mjs. Run under shared lock.
import{spawn}from'node:child_process';
async function run(script,env={}){const code=await new Promise((done,reject)=>{const child=spawn(process.execPath,[script],{env:{...process.env,BIG_ARTIFACT:'/tmp/cardrpg-big2-delivery-index.html',...env},stdio:'inherit'});child.once('error',reject);child.once('close',done)});if(code!==0)throw Error(`${script} exited ${code}`);}
await run('tools/cardrpg-big2/studio-check.mjs');
await run('tools/cardrpg-big2/mechanics-check.mjs',{BIG_LAB_OUT:'reports/cardrpg-big2/delivery/mechanics'});
await run('tools/cardrpg-big2/feature-measurements.mjs',{BIG_PHASE:'delivery'});
await run('tools/cardrpg-big2/lifecycle.mjs',{BIG_LIFECYCLE_OUT:'reports/cardrpg-big2/delivery/lifecycle'});
