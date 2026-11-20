import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {loadRules as isolated} from '/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a5-drafts/b1-prep/a5-candidate-load.mjs';
export async function loadRules(){
 const manifest=JSON.parse(await readFile('/Users/bao/taskbar-hero-cardrpg-a4/tools/cardrpg-big/a5-drafts/b1-prep/graded-01/manifest.json','utf8'));
 assert.equal(createHash('sha256').update(await readFile(manifest.fixtureSource)).digest('hex'),manifest.fixtureSourceSha256);
 const variant=manifest.variants[process.env.A5_VARIANT];assert(variant);
 const transforms={};for(const [path,row] of Object.entries(variant)){assert.equal(createHash('sha256').update(await readFile(row.file)).digest('hex'),row.sha256);transforms[path]=row.file;}
 const bundle=await isolated({transforms});
 const names={'packages/game-rules/src/cardrpg/depth/index.ts':'depth','packages/game-rules/src/cardrpg/depth/run-bot.ts':'bot','packages/game-rules/src/rng.ts':'rng'};
 return {rules:bundle.legacy,vite:{close:bundle.close},load:async path=>{assert(names[path],path);return bundle[names[path]];}};
}
