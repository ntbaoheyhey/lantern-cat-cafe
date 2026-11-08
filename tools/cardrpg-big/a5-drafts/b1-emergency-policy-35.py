# REFERENCE: PROMPT-A5 B1. Prospective, isolated TRAIN-only emergency policy.
import datetime
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

root = Path.cwd()
out = root / 'reports/cardrpg-big/a5/b1/emergency-policy-35'
scratch = Path('/tmp/cardrpg-a5-emergency-policy-35')
assert not out.exists() and not scratch.exists(), 'Never replace a registered attempt'
out.mkdir(parents=True)
scratch.mkdir()
sha = lambda data: hashlib.sha256(data).hexdigest()
prior_dir = root / 'reports/cardrpg-big/a5/b1/queued-reply-34'
prior = json.loads((prior_dir / 'REGISTERED-METHOD.json').read_text())
source = scratch / 'source'
shutil.copytree(root / 'packages/game-rules/src', source / 'packages/game-rules/src')
policy_path = 'packages/game-rules/src/cardrpg/depth/policies.ts'
base = (root / policy_path).read_text()
full = (prior_dir / 'source-snapshot' / policy_path).read_text()
helper = full[full.index('/** Forecast only queued enemy replies;'):full.index('/** Bounded own action plus')]
marker = '/** One-action lookahead keeps playback cheap and makes every decision reproducible. */'
assert base.count(marker) == 1
candidate = base.replace(marker, helper + marker)
assert candidate.count('return { choice, score };') == 1
candidate = candidate.replace('return { choice, score };', 'return { choice, score, preview };')
old = '  return scored[0]!.choice;\n}\nfunction ordinary'
new = '''  const preferred=scored[0]!;
  if(!b.v4)return preferred.choice;
  const livingParty=b.actors.filter(a=>a.side==='party'&&a.hp>0).map(a=>a.id);
  const casualties=(preview:Battle)=>{
    const reply=queuedReply(preview,b.round);
    return livingParty.filter(id=>!reply.actors.some(a=>a.id===id&&a.hp>0)).length;
  };
  const preferredLoss=casualties(preferred.preview);
  // Healthy turns keep the original plan and immediate-action ranking exactly.
  if(preferredLoss===0)return preferred.choice;
  let best=preferred,bestLoss=preferredLoss;
  for(const option of scored.slice(1)){
    const loss=casualties(option.preview);
    // Preserve the original ranking among equally safe choices.
    if(loss<bestLoss){best=option;bestLoss=loss;}
  }
  return best.choice;
}
function ordinary'''
assert candidate.count(old) == 1
candidate = candidate.replace(old, new)
(source / policy_path).write_text(candidate)
archive = out / 'source-snapshot' / policy_path
archive.parent.mkdir(parents=True)
archive.write_text(candidate)
changed = [p for p in prior['source'] if sha((source/p).read_bytes()) != sha((root/p).read_bytes())]
assert changed == [policy_path], changed

# The observational copy asserts bounded replies and records why a choice changed.
observed = scratch / 'observed'
shutil.copytree(source, observed)
instrumented = candidate.replace('  return reply;\n}', '''  if(reply.round!==round)throw Error('Emergency preview advanced a round');
  (globalThis as any).__a5EmergencyStats.replies++;
  return reply;
}''')
instrumented = instrumented.replace('if(preferredLoss===0)return preferred.choice;', '''if(preferredLoss===0){
    (globalThis as any).__a5EmergencyStats.healthy++;
    return preferred.choice;
  }''')
instrumented = instrumented.replace('  return best.choice;\n}', '''  const stats=(globalThis as any).__a5EmergencyStats;
  stats.threatened++;
  if(best!==preferred){
    if(!(bestLoss<preferredLoss))throw Error('Changed action without fewer casualties');
    stats.changed++;
    stats.prevented+=preferredLoss-bestLoss;
  }else stats.unchangedThreat++;
  return best.choice;
}''')
assert instrumented != candidate
(observed / policy_path).write_text(instrumented)

for name in ['matrix.mjs', 'cohort.mjs', 'run.mjs']:
    code = (prior_dir/name).read_text().replace('queued-reply-34', 'emergency-policy-35').replace('A5 queued reply34', 'A5 emergency policy35')
    (out/name).write_text(code)
files = {p: sha((source/p).read_bytes()) for p in prior['source']}
combat = {p: files[p] for p in prior['combatSource']}
now = datetime.datetime.now(datetime.timezone.utc).isoformat()
day = json.loads((prior_dir/'day7-checks/REGISTERED-METHOD.json').read_text())
day.update(registeredAt=now, source=combat, candidate='Emergency-only queued reply35; same bands and old earned inputs')
(out/'day7-checks').mkdir()
(out/'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(day, indent=2)+'\n')
reg = {**prior, 'registeredAt': now,
       'sourceHead': subprocess.check_output(['git','rev-parse','HEAD'], text=True).strip(),
       'sourceRoot': str(source), 'source': files, 'combatSource': combat,
       'scripts': {str(p.relative_to(root)): sha(p.read_bytes()) for p in [out/'matrix.mjs', out/'cohort.mjs', root/'tools/cardrpg-big/a4-load.mjs']},
       'changed': {policy_path: files[policy_path]},
       'parent': str((prior_dir/'REGISTERED-METHOD.json').relative_to(root)),
       'evidence': {str((prior_dir/'audit.json').relative_to(root)): sha((prior_dir/'audit.json').read_bytes())},
       'method': 'Retain original immediate-action score and tie order. Only if the preferred action loses a currently living party member in the bounded queued-enemy reply, choose the highest-original-score action with the fewest casualties. No change if no strictly safer action exists. Same all-survivor private queue guard as34. No other rule/stat/fixture/weight change.',
       'timing': 'Source-bound full6 replay/18prefix/45OFF probe, observational no-round-transition and only-fewer-casualties assertions before matrices. Then same1321TRAIN1-50 cells and90same-band old earned saves,110s lock slices/7s handoff.',
       'decision': 'Diagnostic only. Retain all negative pairs and saturation, original/new results, and every failure. No adoption until all balance/progression/compatibility/runtime checks pass on a supported candidate. Fresh acceptance20001-20500 remains unused.'}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg, indent=2)+'\n')
obs = {'sourceRoot': str(observed), 'source': {**files, policy_path: sha(instrumented.encode())},
       'claim': 'Observes counters and asserts bounded round/strictly fewer casualties; no game-state mutation.'}
(out/'OBSERVER.json').write_text(json.dumps(obs, indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Emergency-only policy35: prospective TRAIN diagnostic

Full-value policies33/34 make364/384 before builds nearly certain wins and all384 after builds nearly certain wins. Corrected34 still makes heavy day7 first wins30/30 and leaves one loss without advice. Both are rejected; neither is production.

This arm holds the corrected34 bounded reply horizon constant and changes only when it can affect action selection. Preserve the original immediate-action ranking, including plan preference, kill credit and healing credit. If its preferred action predicts no new party casualty, return it unchanged. Otherwise select the first action in the original ranking among those with the minimum new casualties; do not switch for a tie. No future ally actions are assumed. Every living party ID guards the private enemy queue, preventing a surviving party from advancing the round.

Semantic checks must preserve immutable/legal/deterministic choices and full replay,45 OFF hashes, all six complete current-cliff examples and18 saved decision prefixes. An observer asserts no round transition and that every changed selection strictly reduces projected casualties. Observed and unobserved complete battle JSON must match. Then the exact original1,321 TRAIN1–50 cells and90 same-band earned saves are measured with unchanged fixtures/gates. Original22 matrix and corrected29 day7 control receipts are reused and labelled;34 is a separate comparison, not the control.

All source/script/save hashes are registered in JSON before sampling. Every negative pair, miss, saturation and failed run is retained. This is neither fresh acceptance nor a human playtest. No production adoption or further tuning is automatic.
''')
print(json.dumps({'registered': str(out), 'changed': changed, 'sourceFiles': len(files)}))
