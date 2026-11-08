# REFERENCE: PROMPT-A5 B2. Prospectively register isolated support-kit trials.
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil

root = Path.cwd()
out = root / 'reports/cardrpg-big/a5/b2/support-kits-10'
assert not out.exists(), 'Never overwrite a registered or observed trial'
base = json.loads((root / 'reports/cardrpg-big/a5/b2/soot-reach-09/reach/REGISTERED-METHOD.json').read_text())
original = json.loads((root / 'reports/cardrpg-big/a5/b2/common-fixture-04/REGISTERED-METHOD.json').read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
out.mkdir(parents=True)
changes = {
    'rescue-rest': (
        'actor.cooldowns[skill.id]=skill.cooldown+1;',
        "actor.cooldowns[skill.id]=skill.cooldown+1+(b.v4&&skill.id==='cinnamon-2'?1:0);",
        'Cinnamon Comfort cup rests one intervening own turn; all healing/status amounts unchanged.'),
    'quiet-reach': (
        "if (skill.target==='foe'&&!hasEffect(actor,'pierce-row')) {",
        "if (skill.target==='foe'&&!hasEffect(actor,'pierce-row')&&!(b.v4&&skill.id==='inkcap-2')) {",
        'Inkcap Quiet spores can suppress any living foe, including a covered rear utility target; all effects/resistance unchanged.'),
}
for variant, (anchor, replacement, description) in changes.items():
    folder = out / variant
    source = Path('/tmp/cardrpg-a5-support-kits-10') / variant / 'source'
    assert not source.exists()
    # Use the original common-fixture runtime, then only the already-tested guard.
    source_base = Path(original['sourceRoot'])
    for path, digest in original['source'].items():
        data = (source_base / path).read_bytes()
        assert sha(data) == digest, path
    shutil.copytree(source_base / 'packages/game-rules/src', source / 'packages/game-rules/src')
    path = 'packages/game-rules/src/cardrpg/depth/battle.ts'
    battle = (source / path).read_text()
    old = "if(b.v4)shield(b,actor,weakest(living(b,actor.side)),Math.min(18,power*6));"
    guarded = """if(b.v4) {
        // Reflection may defeat the last ally earlier in this same skill.
        const ally=weakest(living(b,actor.side));
        if(ally)shield(b,actor,ally,Math.min(18,power*6));
      }"""
    assert battle.count(old) == 1
    battle = battle.replace(old, guarded)
    assert battle.count(anchor) == 1, anchor
    battle = battle.replace(anchor, replacement)
    (source / path).write_text(battle)
    folder.mkdir()
    for path in original['source']:
        destination = folder / 'source-snapshot' / path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes((source / path).read_bytes())
    method = dict(base)
    method.update(registeredAt=datetime.now(timezone.utc).isoformat(), variant=variant,
        sourceRoot=str(source), source={p: sha((source / p).read_bytes()) for p in original['source']},
        purpose=description, control='common-fixture04 plus independently verified missing-recipient guard',
        policy='Original automatic policy unchanged; no Scent or Soot reach candidate.',
        selection='Same original 1840 cells, TRAIN1–50, fixed original scenes/enemyStats/weights/budgets; no recalibration.')
    matrix = (root / 'reports/cardrpg-big/a5/b2/soot-reach-09/reach/matrix.mjs').read_text()
    # Retain the same matrix, including Soot counts as descriptive observations.
    (folder / 'matrix.mjs').write_text(matrix)
    method['matrixSha256'] = sha(matrix.encode())
    (folder / 'REGISTERED-METHOD.json').write_text(json.dumps(method, indent=2))
    runner = (root / 'reports/cardrpg-big/a5/b2/soot-reach-09/reach/run.mjs').read_text()
    runner = runner.replace('soot-reach-09/reach', 'support-kits-10/' + variant)
    runner = runner.replace('Soot reach TRAIN candidate', 'Support ' + variant + ' TRAIN candidate')
    (folder / 'run.mjs').write_text(runner)
(out / 'REGISTERED-METHOD.md').write_text('''# Support kits10 — prospective TRAIN trials

Registered before any sample. Read-only probe08 reproduces all54,400 original common-fixture outcomes. Cinnamon uses Comfort cup286,445/403,323actions and wins83.63%; Inkcap uses Quiet spores11,392/301,843actions and wins54.47%. Counts are descriptive, not causal evidence.

Two independent trials: rescue-rest adds one intervening own-turn cooldown only to V4 Comfort cup; quiet-reach allows V4 Quiet spores to reach covered rear foes. Original AI, raw stats, effects, gear, crews and every other skill stay unchanged. Preserve the independent missing-recipient crash guard. No Soot candidate or anchored progression is combined. OFF branches remain unchanged. No production adoption.

Both execute all original1840cells ×TRAIN1–50 on exactly the same eight scenes, fixed enemyStats, weights and utility budgets. Preserve all negative paired outcomes; report every cat/set/crew gate, not just the changed cat. First-seed full replay parity, source hashes, bounded110s shared-lock slices and7s handoffs are required. Rescue-rest may reduce Cinnamon without improving the crew gate; quiet-reach may remain unused. Neither a reduced action count nor increased skill use is a success criterion. Any adoption needs original B1/full500, earned day7, unit/source/browser and OFF checks. Fresh20001–20500 remains UNUSED.
''')
runner = (root / 'reports/cardrpg-big/a5/b2/soot-reach-09/run.mjs').read_text()
runner = runner.replace("['reach', 'reach-seed']", "['rescue-rest', 'quiet-reach']").replace('soot-reach-09', 'support-kits-10')
(out / 'run.mjs').write_text(runner)
print(json.dumps({'registered': str(out), 'variants': list(changes), 'productionChanged': False}))
