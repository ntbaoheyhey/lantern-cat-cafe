import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
const run=(cmd,args,env={})=>new Promise((resolve,reject)=>{const child=spawn(cmd,args,{stdio:'inherit',env:{...process.env,...env}});child.once('error',reject);child.once('close',code=>code===0?resolve():reject(Error(`${cmd}: ${code}`)))});
const ids=JSON.parse(await readFile('reports/cardrpg-big/effects/verified/uniqueness.json','utf8')).rows.map(r=>r.id);
await run(process.execPath,['tools/cardrpg-look/effect-series.mjs'],{BIG_ARTIFACT:'/tmp/cardrpg-look-l4-before.html',LOOK_EFFECT_OUT:'reports/cardrpg-look/rounds/effects/before',LOOK_EFFECT_IDS:ids.join(',')});
await run(process.execPath,['tools/cardrpg-look/render-flipbooks.mjs','smoke','steam','flame','sparkle','yarn-dust','ribbon']);
await run('/Users/bao/tools/cardrpg-look/venv/bin/python',['tools/cardrpg-look/pack-flipbooks.py','assets/cardrpg-look/flipbooks']);
