"""Register owned-cat advice on current runtime, independent of rejected combat candidates."""
from pathlib import Path
from datetime import datetime,timezone
import shutil,json,hashlib,subprocess
repo=Path.cwd();out=repo/'reports/cardrpg-big/a5/e1/crew-advice-28';temp=Path('/tmp/cardrpg-a5-crew-advice-28');source=temp/'source'
assert not out.exists() and not temp.exists();out.mkdir(parents=True)
base=json.loads((repo/'reports/cardrpg-big/a5/b1/current-cliffs-24/REGISTERED-METHOD.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for p,h in base['source'].items():assert sha((repo/p).read_bytes())==h,p
shutil.copytree(repo/'packages/game-rules/src',source/'packages/game-rules/src')
p='packages/game-rules/src/cardrpg/depth/recommendation-v4.ts';s=(source/p).read_text()
a="export type BuildChangeV4 =\n";b=a+"  | { kind: 'cat'; catId: string; replacementId: string }\n";assert s.count(a)==1;s=s.replace(a,b)
a="  if (change.kind === 'row') {"
b="""  if (change.kind === 'cat') {
    if (!state.team.includes(change.catId) || state.team.includes(change.replacementId)
      || !state.account.cards.some(card => card.cardId === change.replacementId))
      return { ok: false, state, error: 'Choose a collected cat outside your current crew.' };
    // The incoming cat takes the same slot; equipped items stay with their owners.
    return configureTeam(state, state.team.map(id => id === change.catId ? change.replacementId : id),
      { ...state.rows, [change.replacementId]: state.rows[change.catId]! }, state.skills);
  }
"""+a;assert s.count(a)==1;s=s.replace(a,b)
a="  const before = sample(setupFor(state, encounter)), expectedBuild = adviceBuildKeyV4(state);"
b="""  // At most 27 owned-cat alternatives for a three-cat crew and the twelve-cat roster.
  const reserves = state.account.cards.map(card => card.cardId).filter(id => !state.team.includes(id)).sort();
  for (const catId of state.team) for (const replacementId of reserves) {
    const row = state.rows[catId] === 'front' ? 'Front' : 'Back';
    changes.push({ change: { kind: 'cat', catId, replacementId },
      label: `Replace ${CAT_BY_ID[catId]!.name} with ${CAT_BY_ID[replacementId]!.name} in ${row}` });
  }
"""+a;assert s.count(a)==1;s=s.replace(a,b);(source/p).write_text(s)
oldroot='reports/cardrpg-big/a5/b2/hush-eligibility-22';newroot=str(out.relative_to(repo));reg=json.loads((repo/oldroot/'REGISTERED-METHOD.json').read_text())
script=(repo/oldroot/'cohort.mjs').read_text().replace(oldroot,newroot);(out/'cohort.mjs').write_text(script)
now=datetime.now(timezone.utc).isoformat();reg.update(registeredAt=now,sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),sourceRoot=str(source),
 source={p:sha((source/p).read_bytes()) for p in base['source']},combatSource={p:sha((source/p).read_bytes()) for p in reg['combatSource']},
 changed={p:sha((source/p).read_bytes())},scripts={newroot+'/cohort.mjs':sha(script.encode())},
 method='Only add owned reserve-cat substitutions to the existing ten-seed advice search, one replacement in the same row. No combat/stat/AI/forecast seeds/eligibility cutoff changes. Reuse same90earned day7 inputs and route policy; compare allfirst encounters, advice, costs and paired second attempts to current22.',
 decision='Do not adopt if current progression gates fail. A recommendation is a forecast, not a guaranteed route win. Retain all negative paired retries. Validate ownership, active-route guard, gear preservation, exact once settlement, deterministic search and immutability; then source/OFF/browser checks before draft publication.')
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
f=out/'source-snapshot'/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(s)
day=json.loads((repo/oldroot/'day7-checks/REGISTERED-METHOD.json').read_text());day.update(registeredAt=now,source=reg['combatSource'],candidate='Current runtime plus owned reserve-cat advice',runnerSha256=sha(script.encode()));(out/'day7-checks').mkdir();(out/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(day,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Owned reserve-cat advice28 — independent prospective improvement

E1/B3 allow a concrete cat change after a loss. Current advice searches rows, levels, one spare item per slot and standing plans, but never owned reserve cats. It can return no advice while the player owns another usable kit. This omission is confirmed in code, not inferred from a desired win rate.

On current runtimea30757265 only, add every legal single-cat replacement from the owned reserve roster (at most27). The incoming cat occupies the outgoing row, uses its earned level/kit and own equipment; items stay with their owners. No inventory grant, spending, automatic team mutation during evaluation, multi-change combo or in-fight command. Same10TRAIN forecast seeds1–10, current candidate ranking and material-survival-margin cutoff. Labels name both cats and the row. OFF remains unsupported as before.

Before sampling, register the same90earned day7 saves and unchanged route/advice application policy. Every first encounter must remain exact, since combat rules are unchanged; retain all advice, costs, improved/worsened retries. Existing day7 gates must pass before adoption. These saved inputs are not a fresh45-day cohort. No pressure-transfer27 or phase26 change is combined.

Unit checks cover ownership, duplicates, active route, preserving front/slot/gear, stale and repeated apply, deterministic/immutable search and an actually selected reserve. Browser verification must show the named suggestion and apply it through the existing result/worker flow. Source gates/OFF8250 and compatibility checks follow supported adoption. No new saved field or dependency, protected/B edits, model requests or acceptance seeds. Native shared-lock110s slices/7s handoffs.
''')
print(out)
