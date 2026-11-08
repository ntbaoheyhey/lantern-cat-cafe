"""Register the single signature-attribution correction on the exact current16 fixtures."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

repo = Path.cwd()
parent = repo / 'reports/cardrpg-big/a5/b2/suppression-current-16'
out = repo / 'reports/cardrpg-big/a5/b2/hush-signature-20'
assert not out.exists(), 'Do not replace registered evidence'
sha = lambda data: hashlib.sha256(data).hexdigest()
probe = json.loads((repo / 'reports/cardrpg-big/a5/b2/hush-signature-19/REGISTERED-METHOD.json').read_text())
before = json.loads((repo / 'reports/cardrpg-big/a5/b2/hush-signature-19/before.json').read_text())
after = json.loads((repo / 'reports/cardrpg-big/a5/b2/hush-signature-19/after.json').read_text())
assert before['total'] == after['total'] == 60
assert before['pass'] == 55 and after['pass'] == 60
registration = json.loads((parent / 'REGISTERED-METHOD.json').read_text())
changed = [p for p in registration['source'] if registration['source'][p] != probe['source'][p]]
assert changed == ['packages/game-rules/src/cardrpg/depth/battle.ts']
for path, digest in probe['source'].items():
    assert sha((Path(probe['sourceRoot']) / path).read_bytes()) == digest, path
out.mkdir(parents=True)
old_path = str(parent.relative_to(repo))
new_path = str(out.relative_to(repo))
for name in ['matrix.mjs', 'cohort.mjs', 'run.mjs']:
    data = (parent / name).read_text().replace(old_path, new_path)
    if name == 'run.mjs':
        data = data.replace('A5 current Hush regression ', 'A5 Hush signature20 regression ')
    (out / name).write_text(data)
now = datetime.now(timezone.utc).isoformat()
registration.update(registeredAt=now, parent=old_path + '/REGISTERED-METHOD.json',
    sourceHead=subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(),
    sourceRoot=probe['sourceRoot'], source=probe['source'],
    combatSource={p: probe['source'][p] for p in registration['combatSource']},
    scripts={str((out / name).relative_to(repo)): sha((out / name).read_bytes()) for name in ['matrix.mjs', 'cohort.mjs']},
    method='Exact current16 source plus signature-gated Hush attribution and first Lantern heal. Same 1321 TRAIN1–50 cells and 90 old earned saves, no AI, kit, fixture, stats, numeric gate or acceptance change.',
    evidence={str(p.relative_to(repo)): sha(p.read_bytes()) for p in (repo / 'reports/cardrpg-big/a5/b2/hush-signature-19').glob('*.json')},
    decision='Only adopt after semantic expectations and paired effects are reviewed; this registration does not authorize balance claims.')
(out / 'REGISTERED-METHOD.json').write_text(json.dumps(registration, indent=2))
dayreg = json.loads((parent / 'day7-checks/REGISTERED-METHOD.json').read_text())
dayreg.update(registeredAt=now, source=registration['combatSource'],
    candidate='Current16 plus signature-gated Hush attribution only',
    hypothesis='A basic Hushed turn must not consume the first Lantern suppression heal. Paired saved-input regression; not a fresh earned cohort.',
    runnerSha256=sha((out / 'cohort.mjs').read_bytes()))
(out / 'day7-checks').mkdir()
(out / 'day7-checks/REGISTERED-METHOD.json').write_text(json.dumps(dayreg, indent=2))
(out / 'REGISTERED-METHOD.md').write_text('''# Hush signature20 — prospective composition check

The focused signature19 probe reproduces five false suppression events and five unearned eight-HP Lantern heals on basic turns. Requiring the committed signature removes these events while all 60 semantic fixtures pass. Both original failures and candidate results remain in signature19.

Before wider sampling, register the exact same current16 source, 1,321 TRAIN1–50 matrix cells and 90 previously earned day7 saves. Only the Hush event/once-only crew-heal condition changes. Preserve all paired improvements and worsenings. Reward progression is not re-earned here; no fresh 45-day cohort is claimed.

No candidate cooldown, gear fixture, reach, AI, numeric amount or acceptance seed is combined. Original current16 jobs continue unchanged; no resampling of completed cells. Use shared 110-second leases and seven-second handoffs. Source adoption waits for review, and this semantic repair does not close existing balance misses.
''')
print(out)
