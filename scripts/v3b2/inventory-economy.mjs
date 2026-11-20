import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
const root=resolve(import.meta.dirname,'../..'),ts=createRequire(resolve(root,'apps/web/package.json'))('typescript');
const inputs=[
  ['packages/game-rules/src/cardrpg/economy-v3.ts','ECONOMY_V3',null],
  ['packages/game-rules/src/cardrpg/config.ts','CARD_RPG_CONFIG',['rarity','odds','gearOdds','pity','recipes','quests','drawCost','maxBatch','maxDrawsPerDay','starterBalances','dailyCaps','battle','service','enhance','reforge','level','shardExchange','dailyXpCap','accountXpStep','accountLevelCap','scarcity']],
  ['packages/game-rules/src/cardrpg/depth/economy-c2.ts','ECONOMY_C2',['dropsPerDay','drops','equipmentInvitation','tailoring','legendary']],
];
const rows=[];
for(const [path,name,groups] of inputs){
  const src=ts.createSourceFile(path,readFileSync(resolve(root,path),'utf8'),ts.ScriptTarget.Latest,true);
  const unwrap=n=>(ts.isAsExpression(n)||ts.isSatisfiesExpression(n)||ts.isParenthesizedExpression(n))?unwrap(n.expression):n;
  function walk(node,keys=[]){
    node=unwrap(node);
    if(ts.isObjectLiteralExpression(node)){
      for(const property of node.properties){
        if(!ts.isPropertyAssignment(property))continue;
        const key=property.name.getText(src).replace(/^['"]|['"]$/g,'');
        if(!keys.length&&groups&&!groups.includes(key))continue;
        walk(property.initializer,[...keys,key]);
      }
    }else rows.push({key:[name,...keys].join('.'),path,line:src.getLineAndCharacterOfPosition(node.getStart(src)).line+1,valueExpression:node.getText(src),scope:name==='ECONOMY_V3'?'v3 shared policy':'inherited progression; selected by flags'});
  }
  function visit(node){if(ts.isVariableDeclaration(node)&&node.name.getText(src)===name&&node.initializer)walk(node.initializer);ts.forEachChild(node,visit);}
  visit(src);
}
const implementation=[
 ['packages/game-rules/src/cardrpg/economy-v3.ts','dropMultiplierBp','V3 daily diminishing drops repeat hardcoded 6/18/5000; E1 must route through config.'],
 ['packages/game-rules/src/cardrpg/economy-v3.ts','enhancementQuote','Enhancement level validation is hardcoded at 10; random Fish enhancement needs a Bells-only audit.'],
 ['packages/game-rules/src/cardrpg/depth/gacha-v4.ts','invitationBannerV4','Invitation prices and v3 pity selection; Bell uses the legacy stamps save key.'],
 ['packages/game-rules/src/cardrpg/depth/gacha-v4.ts','selectorCostV4','Bound selector cost and C2/v3 precedence.'],
 ['packages/game-rules/src/cardrpg/depth/fusion-v3.ts','fuseBoundV3','Deterministic lower-tier recipes and quality downgrade.'],
 ['supabase/functions/_shared/economy-v3.ts','weeklySpool','Server weekly wins/Star Thread/Boss Seal reward credit.'],
 ['supabase/functions/_shared/economy-v3.ts','chapterSpool','One-time chapter credit.'],
 ['supabase/functions/_shared/economy-v3.ts','seasonRankMax','Server rank reward allocation.'],
 ['supabase/functions/_shared/economy-v3.ts',"case 'quest'",'Demo Judge pack is a separate faucet; do not assume it in ordinary cohorts.'],
 ['supabase/functions/_shared/economy-v3.ts',"case 'withdraw'",'Deed, age, cooldown, pool and controller cap gates; retained fee is not burn.'],
 ['supabase/functions/_shared/economy-v3.ts',"case 'seal'",'Daily seal limit, Boss Seal cost, reference-price burn and quality ID.'],
 ['supabase/functions/_shared/economy-v3.ts',"case 'fusion'",'Server fusion still hardcodes three Epics/two Stars; E1 config wiring must remove copies.'],
 ['supabase/functions/_shared/economy-v3.ts',"case 'spend'",'Existing one-time five-Spool style; not an on-chain burn.'],
 ['supabase/functions/_shared/economy-v3-chain.ts','currentRoutineBudget','Immutable deployed controller allowance is read, never raised by the sim.'],
 ['tools/chain/economy-v3-sim.mjs','const policies','Legacy behavioural demand, hours, withdrawals and static inventory assumptions.'],
 ['tools/chain/economy-v3-sim.mjs','YARN conservation','Legacy claims include all initial capital; burn/claims cannot exceed one while balances/treasury remain.'],
 ['tools/cardrpg-c2/loot-sim.mjs','const profiles','Separate C2 player time budgets; unify calibration without editing battle rules.'],
];
for(const [path,needle,note] of implementation){const lines=readFileSync(resolve(root,path),'utf8').split('\n'),line=lines.findIndex(l=>l.includes(needle))+1;if(!line)throw Error('Missing lever site '+needle);rows.push({key:needle,path,line,note,scope:'implementation or behavioural assumption'});}
writeFileSync(resolve(root,'reports/v3-shell/b2/ECONOMY-LEVER-INVENTORY.json'),JSON.stringify({rows},null,2)+'\n');
console.log(`Inventoried ${rows.length} policy leaves and implementation/behaviour sites.`);
