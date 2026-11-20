from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[2];base=root/'reports/cardrpg-big/a4/p4'
read=lambda p:json.loads(p.read_text())
artifact=root/'docs/cardrpg3/index.html';sha=hashlib.sha256(artifact.read_bytes()).hexdigest();size=artifact.stat().st_size
ui=[read(base/f'retry1/browser-{w}/checks.json') for w in [1280,1440,1024]]
assert all(d['sha256']==sha and not d['errors'] and len(d['captures'])==10 and all(c['overflow']==0 for c in d['captures']) for d in ui)
minimum=min(s['ratio'] for d in ui for c in d['contrasts'] for s in c['samples']);assert minimum>=4.5
sim=read(base/'sim/gacha.json');editions=read(base/'editions/checks.json');off=read(root/'reports/cardrpg-big/a4/p4-off/checks.json');gates=read(root/'reports/cardrpg-big/validation/a4-p4-final.json')
assert len(gates)==5 and all(g['exit']==0 for g in gates)
assert off['offBehavior']=='PASS' and len(editions['races'])==500 and len(editions['pairs'])==1500
for data in [sim,editions]:
 for p,h in data['source'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==h,p
assert all(s['accounts']==10000 for s in sim['summaries'])
summary={k:v for k,v in editions.items() if k not in ['source','pairs','races']};summary.update(races=len(editions['races']),pairedSeeds=len(editions['pairs']))
acceptance={'artifactSha256':sha,'bytes':size,'gacha':[{k:v for k,v in x.items() if k!='cdf'} for x in sim['summaries']],'editions':summary,'captures':30,'minimumContrast':minimum,'off':off,'earnedDays':'NOT VERIFIED; controlled9000stamp bankroll only; P5/P6 progression supplies censored earned-day distributions.','startupBytesGate':'MISS','coldCpu':'UNMEASURED'}
(base/'acceptance.json').write_text(json.dumps(acceptance,indent=2))
table='\n'.join(f"|{r['banner']}|{r['accounts']}|{r['firstLegendary']['median']} / {r['firstLegendary']['p90']} / {r['firstLegendary']['max']}|{r['maxDeviationPp']:.4f} pp|{r['gate']}|" for r in sim['summaries'])
(root/'reports/cardrpg-big/a4/P4-INVITATIONS.md').write_text(f'''# A4 P4 — earned choice and local edition supply
REFERENCE: GAMEPLAY-V4.md sections5/6/9; NFT-VALUE-SPEC.md. Draft checkpoint, not a live or on-chain launch.

Paid earned invitations grant one permanent selector mark; the free welcome grants none. Sixty marks choose a companion or eligible equipment without changing pity. ON basket draws use all128 templates; the odds drawer uses the same conditional pool. Reservations enforce effort receipts, expected revisions, per-account/day/season limits and monotonic production caps. Burns do not reopen supply; two owned Moon records from different seasons can become one cosmetic badge. THC11 preserves ledger/reveal receipts. Existing Fuji/Relic code remains untouched.

|Banner|Independent accounts|First Legendary median / p90 / max pulls|Largest conditional CDF deviation|≤1pp gate|
|---|---:|---:|---:|---|
{table}

All three cohorts use fixed seeds1–10000 and60 actual paid draws, followed by actual chosen-reward redemption. Selector median/p90/max is60 pulls, zero censored. A controlled9000-stamp balance isolates probabilities; a day rollover after30 draws tests the cap, **not** earned-day progression. Casual/heavy first/chosen day distributions remain NOT VERIFIED until the P5/P6 run-bot. Featured miss→guarantee checks and pity-conditioned rarity buckets are retained in `p4/sim/gacha.json`; no fixed-base1% comparison to pity-inflated totals.

500 deterministic orderings compete for the final3 lifetime/season slots: exactly3 accepted and5 capped every time, with revision retry and exact event replay.1,500 paired seeds across three chapters compare baseline, Moon, both editions and fused badge:6,000 encounters, identical stats/outcomes,0pp gain (≤3pp PASS). Unit cases cover burns, duplicate IDs, rollover, stale revision, effort reuse and malformed saves. This is a save-local authority preview, not global security across copied saves, identity enforcement or minted supply.

Validation: final typecheck/lint/build PASS;1,087rules (+2expected failures/11skips),1,735web and421E2E PASS. Thirty targeted captures across1280/1440/1024 and Classic/Look have zero page errors/overflow, minimum measured contrast{minimum:.3f}:1. Initial browser failed an ambiguous native-select label; explicit aria labels fixed it and disabled controls now retain readable opacity. Original failing receipt preserved; retry1 replaces it. Full204 pack remains P7-only.

OFF165cells/8,250routes exactly preserve{off['sha256']}; baseline-v1 and13historic simulation files remain exact. Source manifests are checked before report generation. No B-owned/protected changes or checkpoint adoption. P1/P3 battle presentation requests remain open; ceremony receipt fixture accompanies the checkpoint.

Artifact docs/cardrpg3/index.html: {size:,}bytes; SHA-256 {sha}. Startup artifact bytes increased{size-26200314:,}vsP3: MISS, within disclosed32MB exception. Cold CPU unmeasured. Detail `p4/acceptance.json`; raw five-gate receipts `validation/a4-p4-final.json`. P5–P7, full balance, earned-day invitation distributions and final demo/report remain.
''')
print(json.dumps(acceptance,indent=2))
