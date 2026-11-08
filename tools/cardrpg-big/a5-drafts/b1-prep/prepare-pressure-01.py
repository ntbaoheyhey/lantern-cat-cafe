"""Pre-register temporal pressure redistribution; production remains unchanged."""
from pathlib import Path
import json, hashlib, datetime
root=Path('/Users/bao/taskbar-hero-cardrpg-a4')
base=root/'tools/cardrpg-big/a5-drafts/b1-prep'
out=base/'pressure-01'; report=root/'reports/cardrpg-big/a5/b1/pressure-01'
assert not out.exists() and not report.exists()
out.mkdir();report.mkdir()
old=json.loads((base/'targeting-01/manifest.json').read_text())
battle='packages/game-rules/src/cardrpg/depth/battle.ts';contract='packages/game-rules/src/cardrpg/depth/contract.ts'
variants={}
for name,weight,signature,opening,closing in [
    ('weight2-sig125',2,125,125,175),('weight2-sig100',2,100,137.5,212.5),('weight4-sig125',4,125,125,175)]:
    source=(base/f'targeting-01/front-weight{weight}'/battle).read_text()
    needle='power:signature?175:100';assert source.count(needle)==1
    source=source.replace(needle,f"power:b.v4&&spec.tier==='boss'?(signature?{signature}:a.phase===2?{closing}:{opening}):signature?175:100")
    needle='damage(b,actor,t,signature?intent.power:100,0,!!b.v4&&!wide&&spec.mechanic!==\'steal\');';assert source.count(needle)==1
    source=source.replace(needle,"damage(b,actor,t,signature||b.v4&&spec.tier==='boss'?intent.power:100,0,!!b.v4&&!wide&&spec.mechanic!=='steal');")
    files={battle:source,contract:(base/f'targeting-01/front-weight{weight}'/contract).read_text()}
    variants[name]={}
    for path,body in files.items():
        p=out/name/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body)
        variants[name][path]=hashlib.sha256(p.read_bytes()).hexdigest()
method='''# B1 temporal pressure diagnostic 01

TRAIN1–50 only, same33 registered targeting01 cases/weights/fixtures, same original RNG draws. Preserve all attempts. Original targeting01 is complete and rejected: front weights4/2 worst32/40pp,22/7 misses; no automatic adoption. The two newly observed worst cells remain included. Fresh20001–20500 unused.

Hypothesis: distributing basic targets uses rear HP but leaves the synchronized third-round wide signature cliff. Isolate a redistribution of existing boss direct damage over the three-round cycle, keeping base enemy stats, gear stats/sets, original A4automatic policy and all utility effects unchanged. Keep latched phase and the selected living intent target from targeting01.

For the registered reference with1front/2rear, the original opening cycle delivers100+100+175=375 power; closing cycle100+100+3×175=725 power before mitigation. Candidate sig125 uses basics125 in opening,175 in closing: same375/725 cycle power. Sig100 uses137.5/212.5 basics: again same375/725. No claim of exact damage equality after armor, cover, shield, control, deaths, different row counts or a mid-cycle phase transition; all those can affect the measured outcome. Signature utility/control behaviour remains unchanged. This tests temporal concentration, not a blanket difficulty decrease.

Three variants: frontweight2/sig125; frontweight2/sig100; frontweight4/sig125. Basic pressure is stored on the existing visible intent and used on execution; impaired attacks retain40 power. OFF retains the original175/100 path exactly. No new battle-state fields beyond the already-tested optional latched phase.

Record all paired wins/action counts/death rounds and deterministic replay parity. Compare with every prior attempt; this33cell pilot does not close the384fourthslot,2304bare,tier,band,cat,set,crew,progression or fresh acceptance gates. Native shared lock110s CPU slices/120s handoff. Source/fixtures are hashed before sampling.
'''
manifest={**old,'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'variants':variants}
for folder in [out,report]:
    (folder/'manifest.json').write_text(json.dumps(manifest,indent=2));(folder/'REGISTERED-METHOD.md').write_text(method)
script=(base/'targeting-01.mjs').read_text().replace('targeting-01','pressure-01')
(base/'pressure-01.mjs').write_text(script)
runner=(base/'run-targeting-01.mjs').read_text().replace('targeting-01','pressure-01').replace('targeting01','pressure01')
(base/'run-pressure-01.mjs').write_text(runner)
print('Registered pressure01; no sampling yet.')
