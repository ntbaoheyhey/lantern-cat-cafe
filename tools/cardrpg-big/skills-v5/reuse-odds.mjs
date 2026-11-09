// Preserve the existing invitation distribution only after checking unchanged odds inputs.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5',sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const regPath='reports/cardrpg-big/a5/b3/invitations-01/REGISTERED-METHOD.json',reg=await json(regPath);
const base=(await json(root+'/s0/baseline.json')).runtime;
const paths=['packages/game-rules/src/cardrpg/depth/gacha-v4.ts','packages/game-rules/src/cardrpg/depth/meta-v4.ts','packages/game-rules/src/cardrpg/depth/gameplay-v4.ts','packages/game-rules/src/cardrpg/gacha.ts','packages/game-rules/src/cardrpg/catalog.ts','packages/game-rules/src/cardrpg/config.ts','packages/game-rules/src/rng.ts'];
const files={};for(const p of paths){const bytes=await readFile(p);assert(bytes.equals(execFileSync('git',['show',base+':'+p])),p);files[p]=sha(bytes);}
const odds='packages/game-rules/src/cardrpg/depth/gacha-v4.ts';assert.equal(files[odds],reg.source.transforms[odds].sha256);
const dataPath='reports/cardrpg-big/a5/b3/invitations-01/gacha.json',data=await json(dataPath);
await mkdir(root+'/s6',{recursive:true});
const result={status:'PASS: inherited odds evidence',baselineRuntime:base,files,registration:{path:regPath,sha256:sha(await readFile(regPath))},results:{path:dataPath,sha256:sha(await readFile(dataPath))},sourceStatus:'Invitation odds, selector, meta rewards, legacy catalog/config and RNG bytes match the A5 runtime; gacha-v4 also matches the original registered candidate hash.',limitations:'Earlier 3×10,000 fixed-bankroll distribution is reused. Not a new 20001–20500 sample, earned-progression measurement, or proof that every state/save implementation byte is unchanged.'};
assert(data&&typeof data==='object');await writeFile(root+'/s6/odds-reuse.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,files:paths.length}));
