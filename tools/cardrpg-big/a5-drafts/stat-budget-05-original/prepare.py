from pathlib import Path
import json,hashlib,shutil,datetime
root=Path('/Users/bao/taskbar-hero-cardrpg-a4'); prep=root/'tools/cardrpg-big/a5-drafts/b1-prep'; out=Path('/tmp/cardrpg-a5-stat-budget-05'); logical='packages/game-rules/src/cardrpg/depth/'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
snapshot=out/'source'; shutil.copytree(root/'packages/game-rules/src',snapshot/'packages/game-rules/src',dirs_exist_ok=True)
variants={}
for name,fraction in [('relative035',.035),('relative050',.05)]:
 paths={}
 for f in ['battle.ts','contract.ts']:
  p=out/name/logical/f;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(prep/'pressure-500/weight2-sig100'/logical/f,p);paths[logical+f]={'file':str(p),'sha256':sha(p)}
 source=(root/logical/'equipment-v4.ts').read_text();a=source.index(' const t=GEAR_BY_ID[item.templateId]!,core=',source.index('export function gearMainV4'));b=source.index('\n}',a)
 source=source[:a]+f''' const t=GEAR_BY_ID[item.templateId]!,base=nakedStatsV4(state,cardId)[t.main];
 // Relative stat budget: a defense piece cannot spend the cat's entire attack budget as defense.
 return Math.max(1,Math.floor(base*Math.min(.12,{fraction}*RARITY_MULTIPLIERS_V4[t.rarity]*(1+.06*item.enhancement))));'''+source[b:]
 p=out/name/logical/'equipment-v4.ts';p.write_text(source);paths[logical+'equipment-v4.ts']={'file':str(p),'sha256':sha(p)};variants[name]=paths
matrix=(prep/'policy-smooth-04/matrix.mjs').read_text().replace(str(prep/'policy-smooth-04'),str(out));(out/'matrix.mjs').write_text(matrix)
loader=(prep/'policy-smooth-04/loader.mjs').read_text().replace(str(prep/'policy-smooth-04'),str(out));(out/'loader.mjs').write_text(loader)
runner=(prep/'run-policy-smooth-04.mjs').read_text().replace('policy-smooth-04','stat-budget-05').replace("['smooth-a4','smooth-budget']","['relative035','relative050']").replace(str(prep/'stat-budget-05/matrix.mjs'),str(out/'matrix.mjs')).replace('...process.env,A5_VARIANT:',f"...process.env,BIG_RULES_ROOT:'{snapshot}',A5_VARIANT:")
(out/'run.mjs').write_text(runner)
manifest={'registeredAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'fixtureSource':str(out/'matrix.mjs'),'fixtureSourceSha256':sha(out/'matrix.mjs'),'variants':variants,'count':50,'seeds':[1,50],'sourceRoot':str(snapshot),'sourceHashes':{str(p.relative_to(snapshot)):sha(p) for p in snapshot.rglob('*.ts') if not p.name.endswith('.test.ts')}}
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
method='''# Relative-stat budget diagnostic05 (TRAIN only)

Registered before sampling. Two variants retain the exact pressure500 weight2/sig100 boss source, queued phase and three-round pressure budget. No set/unique/affix effect, cat skill, AI or fixture gate changes. Every piece's main contribution uses its own naked stat rather than the aggregate raw-power score: common3.5% or5%, existing rarity multipliers1/1.25/1.5/1.75, existing enhancement factor, ceiling12% of that stat, minimum1 point. This is a global equipment budget hypothesis, not template-specific shaving.

Reason: original main-only ablations explain most survival cliffs while isolated set4 is zero in the large chapter3 residuals. The old raw-core formula lets attack and HP buy a large fraction of a small defense stat. Earlier pressure experiments retain this asymmetry. These variants test whether a relative main-stat budget reduces that sensitivity while keeping tier distinctions; they do not assume it succeeds. Require all prior tiers/bands/saturation and display gates; retain failed/lower tier outcomes. No gate movement, outcome lookup, new randomness or acceptance sampling.

Same full384fourth-slot/210tier-band-farm/64set/663team-crew cases, TRAIN1–50 with original weights, paired differences and Wilson intervals. Existing pressure500 first50 control receipts remain the baseline; no unlabelled control rerun. Report raw main-stat relative changes from actual sampled cats before interpreting wins. Subsequent TRAIN500, bare pieces, new elite diversity, day7 and score calibration remain required before adoption/acceptance. Source snapshot contains exact current B3 rewards plus unchanged A4 combat inputs; transforms and matrix hashes bound in manifest. Native110second shared-lock slices,7second handoffs; no production mutation.
'''
(out/'REGISTERED-METHOD.md').write_text(method)
evidence=root/'reports/cardrpg-big/a5/b1/stat-budget-05';evidence.mkdir(parents=True,exist_ok=True)
for f in ['manifest.json','REGISTERED-METHOD.md']:shutil.copyfile(out/f,evidence/f)
print(json.dumps({'variants':list(variants),'matrix':sha(out/'matrix.mjs'),'snapshotFiles':len(manifest['sourceHashes'])}))
