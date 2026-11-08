# REFERENCE: Star plans46 closure then prospectively registered Home03. Does not launch a browser.
from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,shutil,subprocess
root=Path.cwd();out=root/'reports/cardrpg-big/a5/engagement/home-03';scratch=Path('/tmp/cardrpg-a5-engagement-home-03')
assert not out.exists() and not scratch.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
phase=root/'reports/cardrpg-big/a5/e2-star-plans';audit=json.loads((phase/'audit.json').read_text());assert audit['status'].startswith('PASS:')
buildpath=phase/'adopted-on/manifest.json';build=json.loads(buildpath.read_text())
for p,h in build['sourceHashes'].items():
 if p.startswith(('apps/','packages/','assets/')):assert sha(root/p)==h,p
artifact=phase/'prototype-on/index.html';assert sha(artifact)==build['sha256']
prior=json.loads((root/'reports/cardrpg-big/a5/engagement/home-02/REGISTERED-METHOD.json').read_text())
out.mkdir(parents=True);scratch.mkdir();source=scratch/'source';shutil.copytree(root/'packages/game-rules/src',source/'packages/game-rules/src')
sources={p:sha(source/p) for p in prior['source']}
p=root/'tools/cardrpg-big/a5-engagement-informed-session.mjs'
s=(root/'tools/cardrpg-big/a5-drafts/star-plans-46/engagement-home-03.mjs.txt').read_text().replace('// STAGED ONLY until source-bound phase closure and prospective registration.\n','');p.write_text(s)
reg={'registeredAt':datetime.now(timezone.utc).isoformat(),'runtimeSource':audit['source'],'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceRoot':str(source),'source':sources,'artifact':str(artifact.relative_to(root)),'artifactSha256':build['sha256'],'artifactBytes':build['bytes'],'buildManifest':str(buildpath.relative_to(root)),'buildManifestSha256':sha(buildpath),'phaseAudit':str((phase/'audit.json').relative_to(root)),'phaseAuditSha256':sha(phase/'audit.json'),'script':str(p.relative_to(root)),'scriptSha256':sha(p),'previousScript':prior['script'],'previousScriptSha256':prior['scriptSha256'],'durationActiveMinutes':60,'viewport':[1280,720],'acceptanceSeedsUsed':False,'policyChange':'Home02 plus: inspect and buy one affordable level for the lowest-level current teammate per interlude; follow the first available named Home crew option for the job star. Existing same3.5s reading allowance per new review. UI and policy changed together; no causal or human-retention inference.'}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Informed Home journey03 — registered before samples

One fresh save, one persistent headless browser,60active minutes at1280x720; report0–5,0–30,0–60. Real clicks,x1,no skip/imports/grants/clock acceleration. The exact source/script/artifact/manifest and phase audit are bound in the JSON registration. Fresh acceptance remains unused. This is a fixed-policy proxy, not human retention or a single-change causal estimate.

Keep Home02 first-spare equipment for Mochi, Home primary route, first available node/boon/affordable event, camp heal, shop saving, available cafe/board/star rewards,150stamp invitations, periodic journal,3.5s/5s reading allowances and same choices counterfactual seeds1/2/3. Two visible policy adaptations: choose the lowest-level current teammate with a legal public level command (team order breaks ties), review the visible price for3.5s, buy at most one level per interlude; if Home offers crew plans, open/read them, choose the first named option and read its result before starting the primary route. These are prospective choices, not an optimizer or post-hoc changes based on outcomes. No Result advice or clairvoyant gear choice.

Preserve actual positive currency/gear/cat deltas and visible invitation/discovery cards; stars alone are not silently relabelled as currency rewards. Original Home02 and Home01 failures stay unchanged. Same meaningful-offer definition: distinct result,HP or actioncount on seeds1/2/3, not distinct strategic ideas. Same noninteractive combat-walltime dead-time proxy, not all unspecified elapsed time. Keep original text-count limitations. No gate is relaxed.

Use10minute shared-lock leases with safe action-boundary endings below20minutes; freeze browser lifecycle between leases and hand off at least7seconds. Cafe still accrues real walltime. Do not reroll/restart a completed sample. Retain any failed partial attempt and explicitly register harness corrections before further execution. Capture opening/first12fights/every5active minutes, at most90captures. This is not the Z screenshot pack.
''')
print(json.dumps({'registered':str(out),'script':str(p),'sha256':sha(p),'durationActiveMinutes':60}))
