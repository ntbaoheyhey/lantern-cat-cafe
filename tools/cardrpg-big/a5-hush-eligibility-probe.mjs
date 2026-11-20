// REFERENCE: A5 B2 eligibility21. Actual suppressed utility, not nominal enemy category.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadRules } from './a4-load.mjs';
const variant = process.argv[2];
const root = 'reports/cardrpg-big/a5/b2/hush-eligibility-21';
const method = JSON.parse(await readFile(root+'/REGISTERED-METHOD.json'));
const paths = { current16: method.parent,
  signature19: 'reports/cardrpg-big/a5/b2/hush-signature-19/REGISTERED-METHOD.json',
  eligibility21: root+'/REGISTERED-METHOD.json' };
assert(paths[variant]);
const registration = JSON.parse(await readFile(paths[variant]));
const sha = data => createHash('sha256').update(data).digest('hex');
assert.equal(process.env.BIG_RULES_ROOT, registration.sourceRoot);
for (const [path, hash] of Object.entries(registration.source))
  assert.equal(sha(await readFile(registration.sourceRoot+'/'+path)), hash, path);
const { rules: C, load, vite } = await loadRules();
const R = await load('packages/game-rules/src/cardrpg/depth/index.ts');
const rows = [];
const contexts = [
  ...['teacup-healer','button-guard','pollen-scout','yarn-giant','pantry-crown'].map(enemyId=>({enemyId, setup:'normal'})),
  {enemyId:'pantry-crown', setup:'phase1'},
  ...['pollen-scout','yarn-giant','pantry-crown'].flatMap(enemyId=>['cap','fatal'].map(setup=>({enemyId,setup}))),
];
try {
  for (const {enemyId,setup} of contexts) for (const gameplayV4 of [false,true])
    for (const signature of [false,true]) for (const control of ['none','hush','drowsy']) {
      const b = R.createBattle({seed:5,chapter:1,gameplayV4,
        cats:['inkcap','sorrel','brioche'].map(id=>({id,stats:{...C.CARD_BY_ID[id].baseStats,hp:10000},
          row:R.CAT_BY_ID[id].row,skills:R.CAT_BY_ID[id].skills.slice(0,3).map(skill=>skill.id)})),
        enemies:setup==='cap'?[enemyId,'binding-thread','binding-thread']:[enemyId]});
      while (R.currentActor(b)?.side==='party') assert(R.act(b,R.legalChoices(b).find(choice=>choice.skillId==='defend')));
      const enemy=R.currentActor(b),controller=b.actors.find(actor=>actor.id==='inkcap');
      assert.equal(enemy.catalogId,enemyId);
      b.intents.find(intent=>intent.actorId===enemy.id).signature=signature;
      enemy.hp=setup==='fatal'?1:enemy.hp-100;enemy.shield=0;enemy.phase=setup==='phase1'?1:2;
      controller.hp-=50;
      if(setup==='fatal') for(const actor of b.actors.filter(actor=>actor.side==='party'))
        actor.statuses.push({id:'riposte',stacks:1,remaining:3,source:actor.id,appliedRound:b.round});
      if(control!=='none') enemy.statuses.push({id:control,stacks:1,remaining:2,source:controller.id,appliedRound:b.round});
      const inputSha256=sha(JSON.stringify(b)),offset=b.log.length;
      assert(R.enemyAct(b));
      if(setup==='fatal') assert.equal(enemy.hp,0,'Retaliation must actually defeat the summoner');
      const events=b.log.slice(offset),suppressed=events.filter(event=>event.kind==='suppressed').length;
      const crewHeals=events.filter(event=>event.kind==='heal'&&event.actorId===controller.id&&event.targetId===controller.id)
        .reduce((total,event)=>total+event.amount,0);
      const suppression=gameplayV4&&(control==='drowsy'||control==='hush'&&signature&&setup==='normal');
      const hits=events.filter(event=>event.actorId===enemy.id&&['damage','absorbed'].includes(event.kind));
      const utility=['teacup-healer','button-guard'].includes(enemyId);
      const shouldAttack=gameplayV4&&signature&&control==='hush'&&utility?false:
        control!=='none'||!utility||gameplayV4&&!signature;
      const canSummon=!utility&&signature&&control==='none'&&setup!=='cap'&&setup!=='phase1'&&(!gameplayV4||enemy.hp>0);
      const checks={event:suppressed===Number(suppression),heal:crewHeals===(suppression?8:0),
        attack:(hits.length>0)===shouldAttack,summon:events.some(event=>event.kind==='summon')===canSummon};
      rows.push({enemyId,setup,gameplayV4,signature,control,inputSha256,suppressed,crewHeals,
        enemyHp:enemy.hp,hits,checks,events});
    }
} finally {await vite.close();}
assert.equal(rows.length,144);
const failures=rows.filter(row=>!Object.values(row.checks).every(Boolean));
const report={variant,source:registration.source,methodSha256:sha(JSON.stringify(method)),
  total:rows.length,pass:rows.length-failures.length,failures:failures.map(({enemyId,setup,gameplayV4,signature,control,checks})=>
    ({enemyId,setup,gameplayV4,signature,control,checks})),rows};
await writeFile(`${root}/${variant}.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({variant,total:report.total,pass:report.pass,failures:report.failures}));
process.exitCode=failures.length?1:0;
