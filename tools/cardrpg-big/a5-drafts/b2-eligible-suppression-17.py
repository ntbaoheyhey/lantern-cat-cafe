"""Prospective interaction trial: eligible fixtures, corrected Hush, optional rescue rest."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

repo = Path.cwd()
out = repo / 'reports/cardrpg-big/a5/b2/eligible-suppression-17'
assert not out.exists(), 'Never overwrite a registered trial'
parent = json.loads((repo/'reports/cardrpg-big/a5/b2/utility-suppression-15/REGISTERED-METHOD.json').read_text())
kit = json.loads((repo/'reports/cardrpg-big/a5/b2/kit-fit-14/REGISTERED-METHOD.json').read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
matrix = (repo/'reports/cardrpg-big/a5/b2/kit-fit-14/matrix.mjs').read_text()
control = '''  if (setId) {
    const key = JSON.stringify({ kind:'sets', setId, scene });
    assert.equal(b.result === 'party' ? '1' : '0', originalRows.get(key).outcomes[seed-1], 'Unchanged homogeneous set control');
  }
'''
assert matrix.count(control) == 1
matrix = matrix.replace(control, '')
out.mkdir(parents=True)
for variant in ['eligible', 'eligible-rest']:
    folder = out / variant
    source = Path('/tmp/cardrpg-a5-eligible-suppression-17') / variant / 'source'
    assert not source.exists()
    hashes = {}
    for path, digest in parent['source'].items():
        data = (Path(parent['sourceRoot']) / path).read_bytes()
        assert sha(data) == digest, path
        if variant == 'eligible-rest' and path.endswith('/depth/battle.ts'):
            text = data.decode()
            needle = 'actor.cooldowns[skill.id]=skill.cooldown+1;'
            assert text.count(needle) == 1
            data = text.replace(needle, "actor.cooldowns[skill.id]=skill.cooldown+1+(b.v4&&skill.id==='cinnamon-2'?1:0);").encode()
        for base in [source, folder/'source-snapshot']:
            target = base/path
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
        hashes[path] = sha(data)
    method = dict(kit)
    method.update(registeredAt=datetime.now(timezone.utc).isoformat(), variant=variant,
        sourceRoot=str(source), sourceSnapshot=str((folder/'source-snapshot').relative_to(repo)), source=hashes,
        matrixSha256=sha(matrix.encode()),
        purpose='Measure kit-fit14 with corrected Hush; eligible-rest adds only previously registered Cinnamon one-turn rest.',
        control='Same original common04 cells/weights/budget; compare original, kit-fit14, suppression15 and both17 arms. Homogeneous sets now change from Hush/rest, not kit selection.',
        selection='No new gear assignments, enemies, difficulty calibration, numeric gate, AI, stats, extra rear reach or acceptance seeds.')
    (folder/'matrix.mjs').write_text(matrix)
    (folder/'REGISTERED-METHOD.json').write_text(json.dumps(method,indent=2))
    runner = (repo/'reports/cardrpg-big/a5/b2/utility-suppression-15/common/run.mjs').read_text()
    runner = runner.replace('utility-suppression-15/common','eligible-suppression-17/'+variant).replace('Hush utility suppression common','Eligible Hush '+variant)
    (folder/'run.mjs').write_text(runner)
(out/'REGISTERED-METHOD.md').write_text('''# Eligible Hush17 — register interaction before sampling

Kit-fit14 improves Soot44.16→54.03% and crew31→26.75pp without changing any skill. Suppression15 separately repairs the harmful utility fall-through and brings Inkcap54.47→56.35%. Cinnamon remains overpowered in both. Trial10's one-turn rescue rest lowers Cinnamon83.63→74.70% but worsens other role-kit cats. The interaction has not been measured.

Two arms share the exact semantic gear assignments already declared in14 and the same original starter power budget, eight scenes, enemy stats, AI and TRAIN1–50 seeds. Both include only the proven fatal-followup guard and candidate15 Hush correction. Eligible-rest additionally uses the exact previously registered one-turn Comfort cup cooldown; eligible does not. No extra rear reach, Scent valuation, raw-stat tune, anchored difficulty or new gear mapping. Each arm runs all1,840cells. Compare BOTH against common04, kit-fit14, suppression15 and each other; keep negative pairs. Homogeneous-set controls are allowed to change due to Hush; kit14's original exact3,200controls remain separately archived.

This measures a fixture/kit interaction, not an acceptance revision or automatic adoption. Report every cat/set/crew/diversity gate. Ineligible homogeneous starter sets still do not establish set niches. Unchanged-source hashes, first-seed full replay,110s shared leases and7s handoffs remain required. No fresh acceptance seeds or browser calls.
''')
runner=(repo/'reports/cardrpg-big/a5/b2/utility-suppression-15/run.mjs').read_text()
runner=runner.replace("['common', 'carriers']", "['eligible', 'eligible-rest']").replace('utility-suppression-15','eligible-suppression-17')
(out/'run.mjs').write_text(runner)
print(out)
