from pathlib import Path
import json,hashlib,datetime

root=Path('/Users/bao/taskbar-hero-cardrpg-a4')
prep=Path('/tmp/cardrpg-a5-b2-prep')
path='packages/game-rules/src/cardrpg/depth/battle.ts'
source=(root/path).read_text()
old="""    const shared = Math.floor(hpDamage * (b.v4 && hasEffect(protector,'defend-link') ? .15 : .3));
    hpDamage -= shared;
    loseHp(b, source, protector, shared, 'shared');"""
new="""    const shared = Math.floor(hpDamage * (b.v4 && hasEffect(protector,'defend-link') ? .15 : .3));
    hpDamage -= shared;
    const covered = b.v4 ? Math.min(protector.shield, shared) : 0;
    protector.shield -= covered;
    if (covered) record(b,source,protector,'absorbed',covered,'Shield absorbed linked damage');
    loseHp(b, source, protector, shared - covered, 'shared');"""
assert source.count(old)==1
candidate=prep/'linked-shield-battle.ts'
candidate.write_text(source.replace(old,new))
probe=json.loads((root/'reports/cardrpg-big/a5/b2/link-probe/results.json').read_text())
sha=lambda value:hashlib.sha256(value).hexdigest()
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seeds':[1,50],'teams':probe['manifest']['teams'],'chapters':[1,2,3],'source':{path:sha((root/path).read_bytes())},'candidateSha256':sha(candidate.read_bytes()),'fixtureSha256':sha((prep/'team-fixtures.mjs').read_bytes()),'trainSha256':probe['manifest']['trainSha256']}
out=root/'reports/cardrpg-big/a5/b2/link-candidate-01'
out.mkdir(parents=True,exist_ok=True)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'REGISTERED-METHOD.md').write_text('''# B2 linked-shield candidate01, TRAIN only

Registered before counterfactual sampling. Same four predeclared Brioche triples and three bosses as the completed read-only probe, TRAIN1–50, original normalized gear/stats and seeded outcomes. Each baseline must reproduce its original A4 TRAIN row. Every paired code and reversal stays visible; neither favorable seeds nor teams are selected afterward.

The probe observed shield bypass on every one of12cells and4locally lethal shared hits with shield remaining. A local avoidable-HP estimate is not a win-rate effect. Test the actual counterfactual now: V4 redirected direct damage consumes the protector's existing shield before HP, once; it does not recurse through links, trigger another damage roll, or duplicate mitigation. The original recipient still loses the same unshared HP. OFF keeps exact historical shared HP behavior.

Purpose: Brioche's stated shielding/link kit should let an existing apron shield protect shared damage. This is a kit interaction fix, not a raw-stat increase or a claimed cure for all cat balance. Full cat/crew/elite calibration remains required after selected B1 rules. Current pilot does not modify production, cat numbers, item effects, reference power, acceptance seeds or gates.

Report paired win difference and all seed outcomes, replay determinism, effective linked absorption, and mutation parity. Shared lock110s slices/120s handoffs. Production adoption needs unit conservation, zero-shield, lethal, no-chain and OFF tests, plus truthful typed contribution receipts.
''')
print('Registered link candidate; not sampled or adopted.')
