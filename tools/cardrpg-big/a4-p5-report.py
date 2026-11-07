from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];base=root/'reports/cardrpg-big/a4/p5'
read=lambda p:json.loads(p.read_text())
artifact=root/'docs/cardrpg3/index.html';sha=hashlib.sha256(artifact.read_bytes()).hexdigest();size=artifact.stat().st_size
ui=[read(base/f'retry2/browser-{w}/checks.json') for w in [1280,1440,1024]]
assert all(d['sha256']==sha and not d['errors'] and len(d['captures'])==12 and all(c['overflow']==0 for c in d['captures']) for d in ui)
minimum=min(s['ratio'] for d in ui for c in d['contrasts'] for s in c['samples']);assert minimum>=4.5
sim=read(base/'sim/progression.json');off=read(root/'reports/cardrpg-big/a4/p5-off/checks.json');gates=read(root/'reports/cardrpg-big/validation/a4-p5-final.json')
assert len(gates)==5 and all(g['exit']==0 for g in gates)
assert off['offBehavior']=='PASS' and len(sim['accounts'])==9 and all(len(a['days'])==30 for a in sim['accounts'])
for p,h in sim['source'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
totals=sim['totals'];table='\n'.join(f"|{r['style']}|{r['accounts']}|{r['paidPulls']:.2f}|{r['legendaryCensored']} / {r['chosenCensored']}|" for r in totals)
summary={'artifactSha256':sha,'bytes':size,'captures':36,'minimumContrast':minimum,'progression':{'accounts':9,'days':30,'totals':totals,'ratios':sim['ratios']},'off':off,'startupBytesGate':'MISS' if size>26208954 else 'UNVERIFIED_MAIN_COMPARISON','coldCpu':'UNMEASURED'}
(base/'acceptance.json').write_text(json.dumps(summary,indent=2))
(root/'reports/cardrpg-big/a4/P5-CAFE-LOOP.md').write_text(f'''# A4 P5 — a working cafe between routes
REFERENCE: GAMEPLAY-V4.md section7. Local Gameplay v4 preview; live defaults unchanged.

The Hub offers a next action, elapsed cafe service, the existing daily/weekly quest board and one ordered lesson at a time. Its two-service allowance uses the public idle calculation with a monotonic clock floor, including calendar advances before a claim. Rollback and duplicate claims pay nothing; skipped dates do not grant every absent day's rewards. Returning day7 stops tutorial repetition.

The collection journal keeps first ownership after salvage, completed sets and rewarded routes. Five once-only milestones show the available capped reward before claiming. A full allowance preserves a pending claim; partial awards are explicit. Existing board rewards use the same caps and do not create a second quest source. THC12 migrates earlier saves and retains journal, lessons and clock state. OFF saves remain THC7.

|Style|Accounts through day30|Mean earned paid pulls|First Legendary / chosen reward censored at day30|
|---|---:|---:|---:|
{table}

The deterministic bot starts with a new account and uses actual service, route, quest, milestone, invitation, level, equipment, preset and recipe commands. No levels, unlocks, currencies or rewards are injected. Synthetic increasing time is not a real-time user study. Per-day progress, first-reward days, failed claims and each state digest are in `p5/sim/progression.json`. This9-account functional check is **not** the required P6 30accounts/style×45day economy acceptance; missing rewards remain censored rather than inferred.

Five gates: see `validation/a4-p5-final.json` for exact counts and original logs. Thirty-six captures across1280/1440/1024 and Classic/Look have zero page errors/overflow and minimum sampled contrast{minimum:.3f}:1. Actual fresh-save UI clicks exercise elapsed time, service→quest reward, next lesson and journal. Original1280 and retry1 exposed competing Look CSS specificity and failed contrast. Two scoped fixes produced the verified retry2 captures; all earlier failure logs are retained. Imported full-cap fixtures test deferred once-only claims; they are not represented as earned progression. Full204 pack remains P7-only.

OFF165cells/8,250routes retain{off['sha256']}. Original baseline and13 historic sim files remain unchanged. No B-owned or protected changes. Battle presentation requests stay open; no B checkpoint adopted.

Artifact{size:,}bytes; SHA-256{sha}. Cold CPU remains unmeasured; final startup comparison belongs to P7. Full balance and economy P6, final demo/playtest/report P7 remain pending.
''')
print(json.dumps(summary,indent=2))
