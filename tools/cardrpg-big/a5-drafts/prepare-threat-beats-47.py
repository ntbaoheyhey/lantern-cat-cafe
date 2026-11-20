# REFERENCE: A5 B1. Prospective finite TRAIN diagnostic; no runtime adoption.
from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,shutil,subprocess
root=Path.cwd();out=root/'reports/cardrpg-big/a5/b1/threat-beats-47';scratch=Path('/tmp/cardrpg-a5-threat-beats-47')
assert not out.exists() and not scratch.exists()
out.mkdir(parents=True);scratch.mkdir()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
source_paths=json.loads((root/'reports/cardrpg-big/a5/engagement/home-03/REGISTERED-METHOD.json').read_text())['source']
for p,h in source_paths.items():assert sha(root/p)==h,p
combat_paths=subprocess.check_output(['git','ls-files','-co','--exclude-standard','packages/game-rules/src/cardrpg','packages/game-rules/src/rng.ts'],text=True).splitlines()
combat_paths=sorted({p for p in combat_paths if p.endswith('.ts') and not p.endswith('.test.ts')})
helper='''// Isolated A5 diagnostic: the tell is committed by setIntents before any action.
export function signatureBeatV4(seed: number, actorId: string, round: number): boolean {
  let salt = 47001;
  for (const character of actorId) salt = Math.imul(salt, 31) + character.charCodeAt(0) | 0;
  const rng = new Rng(deriveSeed(seed, salt));
  let shift = rng.int(-1, 1);
  for (let beat = 1; beat * 3 - 1 <= round; beat++) {
    if (beat * 3 + shift === round) return true;
    const pick = rng.int(0, 2);
    shift = shift === 0 ? pick - 1 : shift < 0 ? (pick === 2 ? 0 : -1) : (pick === 0 ? 0 : 1);
  }
  return false;
}
'''
old='    const signature = b.round % 3 === 0;'
original=(root/'packages/game-rules/src/cardrpg/depth/battle.ts').read_text();assert original.count(old)==1
matrix_old='reports/cardrpg-big/a5/b1/reply-pressure-39/pressure130'
for name in ['control','boss','all']:
 d=out/name;d.mkdir();source=scratch/name/'source';shutil.copytree(root/'packages/game-rules/src',source/'packages/game-rules/src')
 if name!='control':
  eligible="b.v4 && !b.initial.tutorial"+(" && spec.tier === 'boss'" if name=='boss' else '')
  changed=original.replace('function setIntents(b: Battle) {',helper+'function setIntents(b: Battle) {').replace(old,'    const signature = '+eligible+' ? signatureBeatV4(b.seed, a.id, b.round) : b.round % 3 === 0;')
  (source/'packages/game-rules/src/cardrpg/depth/battle.ts').write_text(changed)
  (d/'battle.ts.snapshot.txt').write_text(changed)
  (d/'matrix.mjs').write_text((root/matrix_old/'matrix.mjs').read_text().replace(matrix_old,str(d.relative_to(root))))
 sources={p:sha(source/p) for p in source_paths}
 changed_paths=[p for p,h in sources.items() if h!=source_paths[p]]
 assert changed_paths==([] if name=='control' else ['packages/game-rules/src/cardrpg/depth/battle.ts'])
 scripts=['tools/cardrpg-big/a5-threat-beats-probe.mjs','tools/cardrpg-big/a5-threat-beats-run.mjs','tools/cardrpg-big/a4-load.mjs','tools/cardrpg-big/a5-drafts/prepare-threat-beats-47.py']
 if name!='control':scripts.append(str((d/'matrix.mjs').relative_to(root)))
 reg=dict(registeredAt=datetime.now(timezone.utc).isoformat(),name=name,sourceHead=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),runtimeSource='27f192301ba0774beeabda86bea5c5af7beb3039',sourceRoot=str(source),source=sources,combatSource={p:sha(source/p) for p in combat_paths},scripts={p:sha(root/p) for p in scripts},changedPaths=changed_paths,seedOffset=0,count=50,cases=384,acceptanceSeedsUsed=False,control='reports/cardrpg-big/a5/b2/hush-eligibility-22/balance/equipped/results.json')
 reg['controlSha256']=sha(root/reg['control'])
 (d/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Bounded threat-beat diagnostic47 — before samples

Current24 paired traces show a main-stat survival margin at round6 opens an entire extra guardian turn. All enemy signatures currently occur at round multiples of3. Earlier scalar caps, pressure increases and future-reply policies failed or saturated their registered screens. This trial tests temporal alignment independently of stats, skill strength, targeting, live-phase semantics and action policy. It does not assume randomness is fairness.

Two isolated arms start from exact current rules: boss-only and all-enemy scheduling. Each nominal signature3k lands at3k plus a seeded shift in{-1,0,1}. The shift Markov matrix is symmetric: from0 pick any of-1/0/1 equally; from-1 stay with2/3 or go0; from+1 stay with2/3 or go0. The initial shift is uniform. Gaps are always2–4rounds, the first signature is2–4, and every nominal beat stays within one round. No consecutive signatures or unbounded frequency drift; expected beat timing remains3k. Each actor has an independent seed-derived stream; no combat RNG is consumed by scheduling. Existing intent creation commits the tell before player-team automatic actions. OFF/tutorial and boss-arm nonboss behavior stay original. There are no new saved fields.

Semantic checks precede numeric runs: all2,000seed/actor schedules through49rounds must have16beats, bounded gaps and drift;18full automatic replays per arm include6current diagnostic inputs inON/OFF/tutorial variants; all initial battle hashes match control, OFF/tutorial replay hashes remain exact,45historical OFF streams remain exact, and private action selection cannot mutate the live state. Committed signature flags/powers are checked each round. Original control probe is run once; original current22 numeric outcomes are reused, not rerun. Source/script hashes are fixed in each registration.

Then screen every384original fourth-slot paired cell atTRAIN1–50 with unchanged gear rolls, cases, fixtures and utility score. Retain every negative pair, Wilson intervals and before/after saturation. Same prospective screen as39: maximum paired gain≤18pp, mean before35–75%, before≥95%win cells≤84, after≤105. This is only a precision-follow-up screen; the actual acceptance gate remains≤12pp everywhere. Any surviving arm requires separately registered exact-prefix500TRAIN and full tiers/bands/sets/cats/crews/day7 checks, not automatic adoption. No tuning after seeing these outcomes inside this registration.

One native coordinator uses110second matrix leases and7second handoffs. Preserve all failed attempts. Do not resample completed cells. No production change, fixture/gate change, fresh acceptance, model helper, renderer claim or human playtest. Fresh20001–20500 remains unused. Archive the exact changed battle source; unchanged source is recoverable from the registered runtime commit with every file digest asserted.
''')
print(json.dumps({'registered':str(out),'arms':['boss','all'],'cases':384,'trainSeeds':[1,50],'runtimeUnchanged':True}))
