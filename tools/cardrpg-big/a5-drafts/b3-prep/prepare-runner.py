from pathlib import Path
root=Path('/Users/bao/taskbar-hero-cardrpg-a4');prep=Path('/tmp/cardrpg-a5-b3-prep')
s=(root/'tools/cardrpg-big/a4-p5-sim.mjs').read_text()
s=s.replace("import {loadRules} from './a4-load.mjs';", "import {loadRules} from '/tmp/cardrpg-a5-b1-prep/a5-candidate-load.mjs';")
s=s.replace("process.env.BIG_META_OUT||'reports/cardrpg-big/a4/p5/sim'", "process.env.BIG_META_OUT||'reports/cardrpg-big/a5/b3/reward-pilot-01'")
s=s.replace('BIG_META_ACCOUNTS||3','BIG_META_ACCOUNTS||5').replace('BIG_META_DAYS||30','BIG_META_DAYS||45')
old="const {load,vite,rules:C}=await loadRules(),R=await load('packages/game-rules/src/cardrpg/depth/index.ts'),{playRun}=await load('packages/game-rules/src/cardrpg/depth/run-bot.ts'),{firstInvitation}=await load('packages/game-rules/src/cardrpg/depth/onboarding.ts');"
new="""const candidateDirectory='/tmp/cardrpg-a5-b3-prep/reward-pilot-01';
const manifest=JSON.parse(await readFile(candidateDirectory+'/manifest.json','utf8'));
const transforms={};
for(const [path,expected]of Object.entries(manifest.files)){
 assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'),expected.before);
 const candidate=candidateDirectory+'/'+path;
 assert.equal(createHash('sha256').update(await readFile(candidate)).digest('hex'),expected.candidate);
 transforms[path]=candidate;source[path]=expected.candidate;
}
if(checkpoint.source)assert.deepEqual(checkpoint.source,source);
const suite=await loadRules({transforms}),R=suite.depth,C=suite.legacy,{playRun}=suite.bot,{firstInvitation}=suite.onboarding,vite={close:suite.close};"""
assert old in s;s=s.replace(old,new)
# Validate the effective source hash after overlay hashes replace base entries.
s=s.replace('assert.deepEqual(checkpoint.source,source);assert.equal(checkpoint.count,count);','assert.equal(checkpoint.count,count);')
s=s.replace('R.selectorMarksV4(s)>=60','R.selectorMarksV4(s)>=R.SELECTOR_COST_V4').replace('Object.entries(R.DEPTH_CAPS)','Object.entries(R.depthCaps(s))')
(prep/'reward-pilot-runner.mjs').write_text(s)
print('Staged runner; not executed')
