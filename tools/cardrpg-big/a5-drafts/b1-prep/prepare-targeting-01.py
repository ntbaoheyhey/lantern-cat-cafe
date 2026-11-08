"""Register an isolated causal probe before reading any candidate outcomes."""
from pathlib import Path
import datetime, hashlib, json

root = Path('/Users/bao/taskbar-hero-cardrpg-a4')
base = root / 'tools/cardrpg-big/a5-drafts/b1-prep'
output = base / 'targeting-01'
report = root / 'reports/cardrpg-big/a5/b1/targeting-01'
assert not output.exists() and not report.exists(), 'Never replace a sampled attempt'
output.mkdir(); report.mkdir()
battle = 'packages/game-rules/src/cardrpg/depth/battle.ts'
contract = 'packages/game-rules/src/cardrpg/depth/contract.ts'
latched = (base / 'candidates-02/latched' / battle).read_text()
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
original = json.loads((root / 'reports/cardrpg-big/a5/b1/ablation/results.json').read_text())
keys = list(original['keys'])
for path in ['expanded-01/worst-trace/summary.json', 'expanded-02/worst-trace/summary.json']:
    meta = json.loads((root / 'reports/cardrpg-big/a5/b1' / path).read_text())['meta']
    key = json.dumps(meta, separators=(',', ':'))
    if key not in keys: keys.append(key)
variants = {}
for name, weight in [('latched-control', None), ('front-weight4', 4), ('front-weight2', 2)]:
    body = latched
    if weight:
        old = "const reachable=b.v4&&front.length?front:party;"
        assert body.count(old) == 1
        new = f"const reachable=b.v4&&spec.tier==='boss'&&!signature?party.flatMap(p=>Array.from({{length:p.row==='front'?{weight}:1}},()=>p)):b.v4&&front.length?front:party;"
        body = body.replace(old, new)
        old = "const reachable=b.v4&&front.length&&spec.mechanic!=='steal'?front:party;"
        assert body.count(old) == 1
        new = "const reachable=b.v4&&spec.tier==='boss'&&!intent.signature?party:b.v4&&front.length&&spec.mechanic!=='steal'?front:party;"
        body = body.replace(old, new)
    files = {battle: body, contract: (base / 'candidates-02/latched' / contract).read_text()}
    variants[name] = {}
    for path, source in files.items():
        target = output / name / path
        target.parent.mkdir(parents=True, exist_ok=True); target.write_text(source)
        variants[name][path] = sha(target)
method = '''# B1 targeting diagnostic 01

TRAIN 1–50 only; original31 residual cells plus both subsequently discovered worst cells (33 unique cases). Fifty matched pairs per case, equal weighting, all attempts and outcomes retained. No acceptance20001–20500 sampling, new seeds, source artwork or production change.

Evidence: expanded02 worst trace loses Mochi at238HP to316HP damage on round6, while the prior actor state has Soot558HP and Clover458HP. Main-only adds42pp, full piece56pp, set4 alone0pp. Smoothing health utility and adding response valuation did not remove the cliff (61/384 and30/384 fourth-slot misses). Initial target selection excludes the rear entirely when any front cat lives; one frontline cat's HP therefore carries a disproportionate survival burden. This is a new causal hypothesis, not a conclusion.

Control = original A4 automatic policy and boss stats with already-tested queued phase latching. Two variants change only non-signature boss targeting: each living front cat receives4 or2 tickets, each rear cat1. Use the existing single seeded target draw, and honour the selected living target at execution. Preserve signature targets/power, shelter,10%rear cover, all gear stats/sets, cat kits, AI, encounter stats and original RNG consumption. OFF retains exactly the original path. The target remains visible in the existing intent before any party action.

Record paired wins, action counts, death rounds and replay parity. A4 outcomes reuse the same first50 seeds/case from the original500-seed receipt. This diagnostic does not establish tiers, all-piece bounds, cats, crews, niche leadership or forecast accuracy; broader original fixtures are required before adoption. Any future player copy/schema work follows only a supported candidate. Native shared lock,110s CPU slices and120s handoffs while B is active.
'''
manifest = {'registeredAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'count': 50,
            'seedStart': 1, 'seedEnd': 50, 'keys': keys, 'source': original['source'], 'variants': variants}
for folder in [output, report]:
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2))
    (folder / 'REGISTERED-METHOD.md').write_text(method)
print(json.dumps({'registered': len(keys), 'variants': list(variants), 'sampled': False}))
