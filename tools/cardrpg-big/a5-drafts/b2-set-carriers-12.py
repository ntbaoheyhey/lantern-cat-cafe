# REFERENCE: PROMPT-A5 B1/B2. Prospective diagnostic; no numeric threshold replacement.
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil

root = Path.cwd()
out = root / 'reports/cardrpg-big/a5/b2/set-carriers-12'
assert not out.exists(), 'Do not overwrite a registered or observed trial'
original = json.loads((root / 'reports/cardrpg-big/a5/b2/common-fixture-04/REGISTERED-METHOD.json').read_text())
sha = lambda data: hashlib.sha256(data).hexdigest()
source = Path('/tmp/cardrpg-a5-set-carriers-12/source')
assert not source.exists()
for path, digest in original['source'].items():
    assert sha((Path(original['sourceRoot']) / path).read_bytes()) == digest, path
shutil.copytree(Path(original['sourceRoot']) / 'packages/game-rules/src', source / 'packages/game-rules/src')
p = source / 'packages/game-rules/src/cardrpg/depth/battle.ts'
s = p.read_text()
anchor = "if(b.v4)shield(b,actor,weakest(living(b,actor.side)),Math.min(18,power*6));"
assert s.count(anchor) == 1
s = s.replace(anchor, """if(b.v4) {
        // Reflection may defeat the last ally earlier in this same skill.
        const ally=weakest(living(b,actor.side));
        if(ally)shield(b,actor,ally,Math.min(18,power*6));
      }""")
p.write_text(s)
contexts = [
    ('front-shelter', 'hearthloom', 'mochi', ['mochi','soot','clover'], {'mochi':'front','soot':'rear','clover':'rear'}, 'finish', 0, 3, ['mochi-2']),
    ('marked-leader', 'moonwick', 'velvet', ['mochi','velvet','clover'], {'mochi':'front','velvet':'rear','clover':'rear'}, 'leader', 0, 7, ['velvet-1']),
    ('debuff-recovery', 'mossbrew', 'clover', ['mochi','soot','clover'], {'mochi':'front','soot':'rear','clover':'rear'}, 'finish', 3, 4, ['clover-2','clover-3']),
    ('rear-swap', 'rainlace', 'biscuit', ['biscuit','mallow','clover'], {'biscuit':'rear','mallow':'front','clover':'rear'}, 'finish', 7, 0, ['biscuit-2']),
    ('stored-damage', 'crumbweave', 'soot', ['mochi','soot','mallow'], {'mochi':'front','soot':'rear','mallow':'front'}, 'finish', 6, 5, ['soot-1','soot-3']),
    ('direct-counter', 'bellsteel', 'panko', ['panko','soot','clover'], {'panko':'front','soot':'rear','clover':'rear'}, 'finish', 4, 3, ['panko-2']),
    ('persistent-scald', 'emberfelt', 'mallow', ['mochi','mallow','clover'], {'mochi':'front','mallow':'front','clover':'rear'}, 'leader', 2, 5, ['mallow-1']),
    ('rear-suppression', 'velvetrim', 'inkcap', ['mochi','inkcap','clover'], {'mochi':'front','inkcap':'rear','clover':'rear'}, 'support', 5, 0, ['inkcap-2']),
]
contexts = [dict(id=id, intendedSet=set_id, carrier=carrier, team=team, rows=rows,
                 plan={'focus':focus,'care':'steady'}, primaryScene=primary, contrastScene=contrast, requiredSkills=skills)
            for id,set_id,carrier,team,rows,focus,primary,contrast,skills in contexts]
out.mkdir(parents=True)
source_hashes = {}
for p in sorted(source.rglob('*')):
    if not p.is_file(): continue
    relative = str(p.relative_to(source))
    source_hashes[relative] = sha(p.read_bytes())
    dest = out / 'source-snapshot' / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(p.read_bytes())
method = dict(registeredAt=datetime.now(timezone.utc).isoformat(), sourceRoot=str(source), source=source_hashes,
    seedOffset=0, count=50, modes=['matched-utility','fixed-core'], contexts=contexts,
    scenarios=original['scenarios'], weights=[.125]*8,
    purpose='Eligible single-carrier set comparisons; same allies and enemies in every paired context. Diagnostic only.',
    baseline='Original common04 runtime plus verified missing-recipient guard; no anchored pacing or kit/policy trial combined.',
    selection='All eight named carriers face all eight frozen scenes with every set; primary/contrast scenes declared from mechanics before sampling.',
    normalization='Only carrier HP/attack/defense scale to its own role-kit total for matched-utility. Fixed-core holds these three stats to its role-kit values; it is not matched utility. Allies are exact in both arms.',
    scripts={p:sha((root/p).read_bytes()) for p in ['tools/cardrpg-big/a5-set-carriers.mjs','tools/cardrpg-big/a4-load.mjs']},
    oldReceipt={'path':'reports/cardrpg-big/a5/b2/common-fixture-04/results.json','sha256':sha((root/'reports/cardrpg-big/a5/b2/common-fixture-04/results.json').read_bytes())},
    cases=8*8*8*2, battles=8*8*8*2*50,
    limitations=['No production change or acceptance replacement. Original 35–75% gate remains visible.',
                'Different carriers/crews have different difficulty. Do not interpret cross-context means as calibrated acceptance.',
                'Secondary fixed-core arm distinguishes utility normalization but changes total displayed power; report separately.',
                'Enemy cleanse is absent from the common catalog fixture; Emberfelt contrast5 is rear healing/reflection, not a verified cleanse weakness.',
                'Static skill eligibility is necessary but not proof that auto uses it. Record actions, Scald and explicit gear events.'])
(out / 'REGISTERED-METHOD.json').write_text(json.dumps(method,indent=2))
(out / 'REGISTERED-METHOD.md').write_text('''# Set carriers12 — registered before sampling

Diagnostic only: the original starter trio has zero Scald skills or applications in3,200exact-parity battles. A homogeneous-kit fixture cannot measure Emberfelt's identity. No threshold, acceptance definition, skill or production rule changes here.

Eight named contexts in the JSON declare one carrier, two allies, rows, a standing plan and a primary/contrast scene from documented mechanics. Every context faces ALL eight common04scenes with ALL eight epic sets. Only the carrier's gear changes. Both allies' entire battle builds must remain byte-for-byte equal across sets. Level6, stars1, enhancements0, original automatic AI and fixed enemyStats are preserved. Scald carrier is Mallow, not Soot. Record static eligibility and actual skill uses separately.

Two separately reported arms: matched-utility scales only carrier HP/attack/defense to its own role-kit budget (±2%); fixed-core holds those three stats to role-kit values and therefore is NOT a matched-total comparison. Affixes/set effects stay active in both. This separates a set's behavior from an inaccurate utility penalty without treating either as acceptance. All1,024cells ×TRAIN1–50 are retained, including unfavorable contexts; no sample selection or new calibration after outcomes.

Source is original common04plus the independently tested fatal-reflection guard, not current anchored pacing, Scent or any support trial. Every source file is hashed and archived; first-seed full replay and exact committed plan required. Shared-lock110s slices/7s handoff, no model calls/browser. Preserve all original homogeneous-kit results and numerical misses. Fresh20001–20500 unused. Enemy cleanse is not represented; do not claim to have measured that Emberfelt weakness.
''')
runner = (root/'reports/cardrpg-big/a5/b2/soot-reach-09/reach/run.mjs').read_text()
runner = runner.replace('soot-reach-09/reach','set-carriers-12').replace('Soot reach TRAIN candidate','Eligible set carrier TRAIN diagnostic')
runner = runner.replace("assert.equal(createHash('sha256').update(await readFile(out+'/matrix.mjs')).digest('hex'),reg.matrixSha256);", "")
runner = runner.replace("out+'/matrix.mjs'", "'tools/cardrpg-big/a5-set-carriers.mjs'").replace('A5_COMMON_OUT:out','A5_CARRIERS_OUT:out')
(out/'run.mjs').write_text(runner)
print(json.dumps({'registered':str(out),'cells':method['cases'],'battles':method['battles'],'sourceFiles':len(source_hashes)}))
