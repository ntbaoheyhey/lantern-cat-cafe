// Register the once-only delivery screenshot pack on the completed build bytes.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root='reports/cardrpg-big/skills-v5/s6',sha=b=>createHash('sha256').update(b).digest('hex');
const delivery=JSON.parse(await readFile(root+'/delivery.json','utf8')),artifact='docs/cardrpg3/skills-v5.html';
assert.equal(sha(await readFile(artifact)),delivery.sha256);
const earnedSave='reports/cardrpg-big/skills-v5/s5/selected/economy/day45.save',script='tools/cardrpg-big/skills-v5/z-pack.mjs';
await mkdir(root+'/z',{recursive:true});
await writeFile(root+'/z/REGISTERED-METHOD.json',JSON.stringify({registeredAt:new Date().toISOString(),artifact,artifactSha256:delivery.sha256,earnedSave,earnedSaveSha256:sha(await readFile(earnedSave)),script,scriptSha256:sha(await readFile(script)),cases:[1280,1440,1024].flatMap(width=>['off','on'].map(look=>({width,look}))),screensPerCase:21,gates:{overflow:0,contrast:4.5},method:'One capture group per width/look, all21declared A-owned screens retained. Populated screens use predeclared earned casual account0 day45; combo/battle/result use natural selected S5 Rupture fixture. Battle is sampled for appearance then skipped; no elapsed timing claim. Old A4 index remains byte-identical. Original harness failures are preserved; no completed group rerolled.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({registered:true,groups:6,captures:126,artifactSha256:delivery.sha256}));
