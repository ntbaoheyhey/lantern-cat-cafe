# REFERENCE: A5 B1 current24/fatal32/reply34/pressure39. Register before sampling.
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, shutil, subprocess

root = Path.cwd()
out = root / 'reports/cardrpg-big/a5/b1/reply-duration-52'
scratch = Path('/tmp/cardrpg-a5-reply-duration-52')
assert not out.exists() and not scratch.exists(), 'Preserve every original attempt.'
out.mkdir(parents=True)
scratch.mkdir()
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
policy = 'packages/game-rules/src/cardrpg/depth/policies.ts'
battle = 'packages/game-rules/src/cardrpg/depth/battle.ts'
prior = root / 'reports/cardrpg-big/a5/b1/queued-reply-34'
parent = json.loads((prior / 'REGISTERED-METHOD.json').read_text())
full = (prior / 'source-snapshot' / policy).read_text()
assert sha(prior / 'source-snapshot' / policy) == parent['source'][policy]
current = json.loads((root / 'reports/cardrpg-big/a5/engagement/home-03/REGISTERED-METHOD.json').read_text())
for p, h in current['source'].items():
    assert sha(root / p) == h, p
arms = [('hp125', 1.25), ('hp150', 1.5), ('hp200', 2)]
for name, multiplier in arms:
    arm = out / name
    arm.mkdir()
    source = scratch / name / 'source'
    shutil.copytree(root / 'packages/game-rules/src', source / 'packages/game-rules/src')
    (source / policy).write_text(full)
    code = (root / battle).read_text()
    marker = '    b.maxEnergy=0;'
    assert code.count(marker) == 1
    code = code.replace(marker, marker + f"\n    // Isolated diagnostic52: duration, never higher hit pressure.\n    if(!setup.tutorial)for(const a of actors)if(a.side==='enemy'&&ENEMY_BY_ID[a.catalogId]?.tier==='boss')a.hp=a.maxHp=Math.round(a.maxHp*{multiplier});")
    (source / battle).write_text(code)
    for p in [policy, battle]:
        target = arm / 'source-snapshot' / p
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / p, target)
    hashes = {p: sha(source / p) for p in current['source']}
    assert {p for p, h in hashes.items() if h != current['source'][p]} == {policy, battle}
    combat = {p: h for p, h in hashes.items() if p.endswith('.ts') and not p.endswith('.test.ts')
              and (p.startswith('packages/game-rules/src/cardrpg/') or p == 'packages/game-rules/src/rng.ts')}
    matrix = (root / 'reports/cardrpg-big/a5/b1/threat-beats-47/boss/matrix.mjs').read_text()
    matrix = matrix.replace('reports/cardrpg-big/a5/b1/threat-beats-47/boss', str(arm.relative_to(root)))
    marker = "row.shareSum+=result.share??0;"
    assert matrix.count(marker) == 1
    matrix = matrix.replace(marker, marker + "if(result.b){row.roundCounts??={};row.roundCounts[result.b.round]=(row.roundCounts[result.b.round]??0)+1;row.roundLimitLosses=(row.roundLimitLosses??0)+(result.b.round>50?1:0);}")
    (arm / 'matrix.mjs').write_text(matrix)
    observer = scratch / name / 'observer'
    shutil.copytree(source, observer)
    marker = "  while(!reply.result&&currentActor(reply)?.side==='enemy')enemyAct(reply);"
    assert full.count(marker) == 1
    observed = full.replace(marker, marker + "\n  if(reply.round!==round)throw Error('Projected replies advanced a round');\n  (globalThis as any).__a5ReplyDuration.replies++;")
    (observer / policy).write_text(observed)
    (arm / 'observed-policies.ts.txt').write_text(observed)
    observed_hashes = {p: sha(observer / p) for p in hashes}
    (arm / 'OBSERVER.json').write_text(json.dumps(dict(sourceRoot=str(observer), source=observed_hashes), indent=2) + '\n')
    scripts = ['tools/cardrpg-big/a5-reply-duration-probe.mjs', 'tools/cardrpg-big/a5-reply-duration-run.mjs',
               'tools/cardrpg-big/a5-drafts/prepare-reply-duration-52.py', 'tools/cardrpg-big/a4-load.mjs',
               str((arm / 'matrix.mjs').relative_to(root))]
    controls = ['reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json',
                'reports/cardrpg-big/a5/b1/queued-reply-34/balance/equipped/results.json']
    registration = dict(registeredAt=datetime.now(timezone.utc).isoformat(), name=name, multiplier=multiplier,
        sourceHead=subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
        runtimeSource=current['runtimeSource'], sourceRoot=str(source), source=hashes, combatSource=combat,
        changedPaths=[policy, battle], scripts={p: sha(root / p) for p in scripts},
        controls={p: sha(root / p) for p in controls}, count=50, seedOffset=0, cases=384,
        acceptanceSeedsUsed=False, parent=str((prior / 'REGISTERED-METHOD.json').relative_to(root)))
    (arm / 'REGISTERED-METHOD.json').write_text(json.dumps(registration, indent=2) + '\n')
(out / 'arms.json').write_text(json.dumps([name for name, _ in arms]) + '\n')
(out / 'REGISTERED-METHOD.md').write_text('''# Reply-aware boss duration52 — prospective TRAIN diagnostic

Current24 isolates a death/extra-turn boundary, and fatal32 finds legal defensive alternatives in some examples. Corrected policy34 evaluates the already queued enemy response without advancing a round, closing piece gains by making almost every fixture win. Raising attack in39 restored some difficulty but restored large equipment cliffs. This trial tests the independent HP/duration dimension: enough extra enemy turns may restore pressure without increasing the lethal size of any hit. It can also create stalls or overly long fights; those are explicit rejection risks, not assumed improvements.

Three fixed arms combine the exact34 policy with V4 non-tutorial boss maximum/current HP multipliers1.25,1.5,2 at actor creation. Attack, defense, initial ratio, phase threshold ratio, gear, allies, fixtures, RNG and seeds are unchanged. Nonboss and tutorial *stats* stay exact; the34 policy still applies to V4 nonboss/tutorial actions, so their behavior is not claimed unchanged. No production file is edited and no save schema is added. Phase expansion semantics remain unchanged from current production.

Before each matrix: six complete deterministic/legal/immutable choice replays,45historical OFF replays,24initial-stat cases across ON/OFF/tutorial/nonboss, and an independent read-only queue observer whose complete replay JSON must equal the unobserved arm. Original current22 and34 numeric controls are reused, never resampled. Every source and runner digest is registered here before execution.

All384original fourth-slot cases retain TRAIN1–50, original gear rolls and opponents. Record paired wins, Wilson intervals, improved/worsened seeds, saturation, after-arm action counts and round histograms including round-limit defeats. Previous controls did not retain histograms, so do not invent comparable historical round distributions. This is not a wall-time playback measurement.

Same precision-follow-up screen as39: worst paired gain≤18pp, mean before35–75%, before≥95%-win cells≤84, after≤105. Also require no round-limit defeat across any after-arm sample; a stalled build is not an acceptable way to restore difficulty. These are prospective screening limits, not replacements for the actual≤12pp gear gate. All arms run to completion regardless of early results. No retuning within this registration.

Only an eligible arm may receive a separately registered exact-prefix500TRAIN extension and tiers/bands/cats/sets/crews/earned-day7 checks. UI forecast CPU, x1 boss45–90s, first-fight25s and full progression must be checked before adoption. No automatic adoption, numeric-gate relaxation, acceptance claim or human-playtest claim follows. Fresh20001–20500 remains unused. Native coordinator uses110second shared leases and7second handoffs; original Home03 is preserved. Failed harness runs and every negative outcome remain visible.
''')
print(json.dumps(dict(registered=str(out), arms=[name for name, _ in arms], samplesRun=0)))
