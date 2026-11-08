from pathlib import Path
import json, hashlib, datetime

root = Path('/Users/bao/taskbar-hero-cardrpg-a4')
prep = Path('/tmp/cardrpg-a5-b1-prep')
out = prep / 'candidates-05'
out.mkdir(exist_ok=True)
battle = 'packages/game-rules/src/cardrpg/depth/battle.ts'
policy = 'packages/game-rules/src/cardrpg/depth/policies.ts'
pacing = 'packages/game-rules/src/cardrpg/depth/pacing-v4.ts'
contract = 'packages/game-rules/src/cardrpg/depth/contract.ts'
original = (root / battle).read_text()
latched = (prep / 'candidates-02/latched' / battle).read_text()
needle = "damage(b,actor,t,signature?intent.power:100,0,!!b.v4&&!wide&&spec.mechanic!=='steal');"
assert latched.count(needle) == 1
distributed = latched.replace(needle, "const power=b.v4&&spec.tier==='boss' ? (signature?135:120) : signature?intent.power:100;\n      damage(b,actor,t,power,0,!!b.v4&&!wide&&spec.mechanic!=='steal');")
variants = {'baseline': {}}
for name, reply, pressure in [('aware-distributed', 'reply-030', 1), ('aware-distributed-110', 'reply-030', 1.10), ('aware-distributed-115', 'reply-half-pressure115', 1.15)]:
    files = {battle: distributed, policy: (prep / 'candidates-04' / reply / policy).read_text(), contract: (prep / 'candidates-02/latched' / contract).read_text()}
    if pressure != 1:
        text = (root / pacing).read_text()
        old = 'e.attack*growth*pressure'
        assert text.count(old) == 1
        files[pacing] = text.replace(old, f'e.attack*growth*pressure*(e.tier===\'boss\'?{pressure}:1)')
    variants[name] = files
sha = lambda value: hashlib.sha256(value).hexdigest()
manifest = {'registeredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'count': 50, 'seedStart': 1, 'seedEnd': 50, 'source': {path: sha((root / path).read_bytes()) for path in [battle, policy, pacing, contract]}, 'variants': {}}
for name, files in variants.items():
    manifest['variants'][name] = {}
    for path, body in files.items():
        target = out / name / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(body)
        manifest['variants'][name][path] = sha(target.read_bytes())
(out / 'manifest.json').write_text(json.dumps(manifest, indent=2))
method = '''# B1 TRAIN pilot05: response-aware sustained pressure

Registered before sampling. Same31 residual cells, TRAIN1–50. Reuse exact pilot01 baseline. Retain all four prior pilots; fresh20001–20500 untouched.

Evidence: pilot01 showed that distributing basic/signature power120/135 without response-aware automatic protection did not fix the cliff. Pilot04 response0.30 gave chapter1 before rates52–64% with gains0–8pp, while most chapter3 arms saturated. Increasing boss pressure with response0.50 reintroduced four Hearthloom charm cliffs14–22pp. Thus lowering spikes and responding to visible threats have not yet been tested together. This interaction is the hypothesis; no successful outcome is assumed.

All variants use previously registered phase latching and120/135 basic/signature direct power for bosses, preserving the375 three-action single-target power sum before pressure scaling. They resolve the queued phase, not a phase reached after the intent was announced. Current unchanged Drowsy handling stays at40power. Wider targets and status interactions mean total party damage is not conserved.

aware-distributed combines response0.30 and sustained pressure. aware-distributed-110 adds boss attack×1.10. aware-distributed-115 uses response0.50 and boss attack×1.15. These are explicit isolated gameplay variants, not fixture or gate changes. No item reductions, cat changes or new randomness. Intent copy remains diagnostic only until production adoption.

Report every paired outcome, death round, action count, saturation and negative gain. Universal wins are rejected. A promising residual candidate must expand to all fourth-slot, tier/band, cat/set/crew and earned progression cases, plus policy CPU measurements. This small TRAIN diagnostic cannot pass acceptance. Shared lock110second slices/120second handoffs. No production mutation.
'''
(out / 'REGISTERED-CANDIDATES.md').write_text(method)
report = root / 'reports/cardrpg-big/a5/b1/candidates-05'
report.mkdir(parents=True, exist_ok=True)
for name in ['manifest.json', 'REGISTERED-CANDIDATES.md']:
    (report / name).write_bytes((out / name).read_bytes())
old = json.loads((root / 'reports/cardrpg-big/a5/b1/candidates-01/results.json').read_text())
(report / 'partial.json').write_text(json.dumps({'manifest': manifest, 'source': old['source'], 'rows': [v for v in old['rows'] if v['variant'] == 'baseline'], 'baselineReuse': 'pilot01 exact rows; no new samples'}))
(prep / 'a5-candidate-pilot-05.mjs').write_text((prep / 'a5-candidate-pilot-04.mjs').read_text().replace('candidates-04', 'candidates-05'))
(prep / 'run-candidates-05.mjs').write_text((prep / 'run-candidates-04.mjs').read_text().replace('candidates-04', 'candidates-05').replace('pilot 04', 'pilot 05').replace('pilot-04', 'pilot-05'))
print('Registered pilot05; production and acceptance unchanged.')
