"""Register a semantic Hush-event probe before sampling; do not mutate runtime."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

repo = Path.cwd()
out = repo/'reports/cardrpg-big/a5/b2/hush-signature-19'
source = Path('/tmp/cardrpg-a5-hush-signature-19/source')
assert not out.exists() and not source.exists()
parent_path = 'reports/cardrpg-big/a5/b2/suppression-current-16/REGISTERED-METHOD.json'
parent = json.loads((repo/parent_path).read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
out.mkdir(parents=True)
hashes = {}
for path, expected in parent['source'].items():
    data = (Path(parent['sourceRoot'])/path).read_bytes()
    assert sha(data) == expected, path
    if path.endswith('/depth/battle.ts'):
        text = data.decode()
        needle = "impaired || quiet&&['heal','shield','summon','bind','banquet'].includes(spec.mechanic)"
        assert text.count(needle) == 1
        data = text.replace(needle, "impaired || signature&&quiet&&['heal','shield','summon','bind','banquet'].includes(spec.mechanic)").encode()
    for base in [source, out/'source-snapshot']:
        dest = base/path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(data)
    hashes[path] = sha(data)
method = {
    'registeredAt': datetime.now(timezone.utc).isoformat(), 'parent': parent_path,
    'sourceRoot': str(source), 'source': hashes,
    'hypothesis': 'Current Hush logs suppression and grants first Lantern heal on a utility enemy basic turn, even though its ordinary attack is unchanged.',
    'candidate': 'Only Hush suppression reporting/first crew heal require the committed signature; Drowsy softening still reports on basic and signature turns.',
    'probe': 'Teacup Healer, Button Guard, Pollen Scout, Yarn Giant, Pantry Crown; same three Lantern contributors, damage all parties identically; basic/signature and Hush/Drowsy/control arms. No gear/stat/AI or unrelated timing change.',
    'scope': 'Focused semantic reproduction on seed5, TRAIN only; does not establish win-rate balance or authorize adoption.',
    'compatibility': 'OFF untouched, no new saved field or dependency. Preserve both original and candidate results, and exact before/after fixture replay setup.',
    'next': 'Only if semantic expectation is confirmed: register current16 balance/day7 comparison before wider sampling and source adoption.',
}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(method, indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# Hush signature19 — prospective semantic probe

The existing Hush repair preserves ordinary attacks between utility signatures. Source review finds that its separate suppression event and once-only Lantern heal still run on a Hushed basic turn. That can award a crew effect for an action which was not actually suppressed. The AI status valuation already checks the committed signature for its extra utility value.

The candidate adds only the missing signature condition to Hush event/crew-heal handling. Drowsy still softens basic and signature turns and reports that real control effect. OFF and heal/shield/summon resolver branches are unchanged; no new state, numeric amount, cooldown, kit, AI or acceptance seed.

Before any wider matrix or adoption, use identical seed5 setups for all five utility/summon mechanics, basic/signature and Hush/Drowsy/control. Record original failures and candidate observations, verify actual hits and blocked utility separately from event counts. A focused pass is not a balance or progression claim. Wider sampling needs a separate prospective extension.
''')
print(out)
