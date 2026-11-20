from pathlib import Path
from datetime import datetime, timezone
import hashlib,json,shutil,subprocess
root=Path.cwd();out=root/'reports/cardrpg-big/a5/engagement/home-02';scratch=Path('/tmp/cardrpg-a5-engagement-home-02')
assert not out.exists() and not scratch.exists()
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
buildpath=root/'reports/cardrpg-big/a5/c1-growth-preview/build-on/manifest.json';build=json.loads(buildpath.read_text())
for p,h in build['sourceHashes'].items():
 if p.startswith(('apps/','packages/','assets/')):assert sha(root/p)==h,p
artifact=root/'reports/cardrpg-big/a5/c1-growth-preview/artifact/index.html';assert sha(artifact)==build['sha256']
out.mkdir(parents=True);scratch.mkdir();source=scratch/'source';shutil.copytree(root/'packages/game-rules/src',source/'packages/game-rules/src')
prior=json.loads((root/'reports/cardrpg-big/a5/engagement/current-01/REGISTERED-METHOD.json').read_text());sources={p:sha(source/p) for p in prior['source']}
p=root/'tools/cardrpg-big/a5-engagement-home-session.mjs';s=(root/'tools/cardrpg-big/a5-engagement-session.mjs').read_text().replace('engagement/current-01','engagement/home-02').replace('30*60000','60*60000').replace('30 active elapsed minutes','60 active elapsed minutes').replace('cardrpg-a5-engagement-${process.pid}','cardrpg-a5-engagement-home-${process.pid}').replace('A5 current engagement01 lease','A5 Home engagement02 lease').replace('Engagement01 lease failed','Home engagement02 lease failed')
s=s.replace("resolve('reports/cardrpg-big/a5/engagement/home-02/artifact/index.html')", "resolve(registration.artifact)")
old="await click(page.getByRole('button',{name:/Tangled Cafe/}).first(),'start Tangled Cafe');return;"
new="const primary=page.getByRole('region',{name:'Tonight at home',exact:true}).locator('button.cr-primary');const label=await primary.innerText();record('home-route-policy',{label,cleared:m.state.cleared,levels:m.state.account.cards.filter(c=>m.state.team.includes(c.cardId)).map(c=>({id:c.cardId,level:c.level}))});await click(primary,label);return;"
assert s.count(old)==1;s=s.replace(old,new);p.write_text(s)
reg={'registeredAt':datetime.now(timezone.utc).isoformat(),'runtimeSource':build['head'],'head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'sourceRoot':str(source),'source':sources,'artifact':str(artifact.relative_to(root)),'artifactSha256':build['sha256'],'artifactBytes':build['bytes'],'buildManifest':str(buildpath.relative_to(root)),'buildManifestSha256':sha(buildpath),'script':str(p.relative_to(root)),'scriptSha256':sha(p),'previousScript':prior['script'],'previousScriptSha256':prior['scriptSha256'],'durationActiveMinutes':60,'viewport':[1280,720],'acceptanceSeedsUsed':False,'policyChange':'Only route launch follows the visible Home primary instead of explicitly repeating Chapter1. Same selected-cat upgrade, equipment, advice, route-node, reward and reading policy as original01. Current artifact also includes Home/Settings/growth UI fixes; not a single-change causal comparison.'}
(out/'REGISTERED-METHOD.json').write_text(json.dumps(reg,indent=2)+'\n')
(out/'REGISTERED-METHOD.md').write_text('''# Home-led elapsed journey02 — registered before running

One persistent browser measures 60 active elapsed minutes on the exact growth-preview artifact6c09ce3c/source994d84056. Report windows0–5,0–30,0–60. One fresh save at1280×720; real clicks, x1, no skips, imports, grants or clock acceleration. Acceptance seeds remain unused. This is a behavior proxy, not a human playtest.

The sole policy change from original01 is route launch: click the visible Home primary rather than forcing Chapter1. Keep the selected-companion one-level-per-interlude rule, first spare item for Mochi, first route/boon/affordable event, camp heal, shop saving, periodic journal, available150stamp invitations, and3.5s/5s reading allowances. Do not apply Result advice or rebalance team levels opportunistically. The current artifact also includes the already-reviewed Home, Settings and growth-preview UI changes. Do not call this an isolated causal estimate of Home navigation or replace the original failing fixed-Chapter1 result.

Preserve original01 offer definition (distinct result, HP or actions on seeds1/2/3), actual reward deltas, visible invitation/discovery celebrations, corrected closed-details word counting, and noninteractive combat-walltime proxy. Report all misses and all screen/errors. Capture opening/first12encounters/every5active minutes. This is not the Z screenshot pack.

Use10minute shared-lock leases, ending at a safe action boundary below20minutes, with frozen browser lifecycle and at least7seconds handoff. Cafe service still accrues real walltime. Source, script, artifact and manifest hashes are registered before samples. Failed partial attempts remain, and any necessary correction must be documented rather than silently rerolling a completed journey.
''')
print(json.dumps({'registered':str(out),'script':str(p),'sha':sha(p),'duration':60}))
