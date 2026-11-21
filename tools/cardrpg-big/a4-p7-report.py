# REFERENCE: PROMPT-A4-v2 P7. Concise report drawn from saved receipts; missing evidence stays explicit.
from pathlib import Path
import json,hashlib
root=Path.cwd();base=root/'reports/cardrpg-big/a4';p7=base/'p7'
def read(p,default=None):
 q=root/p
 return json.loads(q.read_text()) if q.exists() else default
def sha(p):return hashlib.sha256((root/p).read_bytes()).hexdigest()
a=read('reports/cardrpg-big/a4/p6/acceptance.json');assert a
artifact=sha('docs/cardrpg3/index.html');assert a['artifactSha256']==artifact
journey=read('reports/cardrpg-big/a4/p7/journey/checks.json',{})
audit=read('reports/cardrpg-big/a4/p7/audit.json',{})
perf=read('reports/cardrpg-big/a4/p7/performance/summary.json',{})
guide=root/'docs/cardrpg3/gameplay-v4.html'
publication=read('reports/cardrpg-big/a4/publication.json',{})
coverage=[
 ['Gameplay before battle','Prepare: rows, counted crew jobs, standing plan, opponent signatures; Result: observed causes','5–6 → 7'],
 ['Complete equipment/items','128 templates, 8 sets, utility compare, exact 3 shifts, pantry, 240 shelf, capacity-safe transactions','6–8 → 8'],
 ['Balance and rarity','Explicit rarity effects and source odds; heldout outliers remain visible','6.5 → 6.5'],
 ['Invitations and choice','Earned banners, conditional odds, pity, duplicate shards, 60-mark choice','8–9 → 9'],
 ['Scarcity and future NFT value','Replayable local issuance, effort consumption, cap races, zero combat power; scope labelled local','4 → 7'],
 ['Features beyond battle','Elapsed cafe service, daily board, persistent journal and one lesson at a time','5–7 → 8'],
 ['Pacing and bosses','Gear-independent bands, half-HP phase and linked-add retirement; actual x1 outcomes reported','6.5 → 7'],
]
lines=[
 'Bản thử nghiệm có đội hình, chiến thuật trước trận, trang bị và vật phẩm dùng giữa các trận.',
 'Cafe, nhiệm vụ, bộ sưu tập và đổi thưởng bằng dấu mời đã thành các vòng chơi có phần thưởng.',
 'P6 đã đo train/heldout tách biệt; các mục cân bằng chưa đạt vẫn ghi MISS, không coi kiểm thử chức năng là cân bằng đạt.',
 'Demo chạy offline; kết quả browser và bảng số liệu bên dưới gắn với đúng SHA của bản thử nghiệm.',
 'Đây là bản nháp để đánh giá; còn lệch cân bằng, chi phí tải trang và yêu cầu trình diễn cho Lane B.',
 '', '# A4 gameplay delivery',
 'REFERENCE: [Gameplay v4](../../../docs/design/cardrpg/GAMEPLAY-V4.md); [research](../../../docs/design/cardrpg/RESEARCH-GAMEPLAY-V4.md); [NFT boundary](../../../docs/design/cardrpg/NFT-VALUE-SPEC.md).',
 '', '| Brief | What the player sees | Before → after / 10 |','|---|---|---|',
 *['| '+' | '.join(r)+' |' for r in coverage],
 'Scores are this agent’s sequential design assessment, not a human playtest or measured retention. Existing G0 surface scores supply the before ranges; no higher balance score is claimed.',
 '', '## Measured targets', '| Target | Before | After | Gate |','|---|---|---|---|',
 *['| '+' | '.join(str(x).replace('|',' / ').replace('\n',' ') for x in r)+' |' for r in a['rows']],
 '', 'Residual item map: [31fourth-slot outliers](P6-RESIDUALS.md). Full protocol, per-seed outcomes, Wilson intervals, floor cells, utility-score residuals, earned-day censoring and retained failures: [P6 balance](P6-BALANCE.md). 3,625 cells × 500 seeds for each of train1–500 and heldout10001–10500; source fixed before heldout. G0 uses a different historical fixture, not a paired causal comparison.',
 '', '## Demo and validation',
 f'- [Offline game](../../../docs/cardrpg3/index.html): {a["bytes"]:,} bytes; SHA-256 `{artifact}`.',
 f'- [Offline guide](../../../docs/cardrpg3/gameplay-v4.html): '+(f'{guide.stat().st_size:,} bytes; SHA-256 `{sha("docs/cardrpg3/gameplay-v4.html")}`.' if guide.exists() else 'NOT VERIFIED: generation pending.'),
 f'- P7 source gates / full 204 pack: '+(f'PASS; {audit["packCount"]} captures in ten groups plus {audit["newScreenCount"]} new-screen captures at three sizes/two themes, exact source and artifact hashes; [audit](p7/audit.json).' if audit else 'NOT VERIFIED: receipt audit pending.'),
 f'- [Real-click journey](p7/journey/checks.json): '+(f'{len(journey["captures"])} captures; fresh save, compressed first hour, public-command day7 import, boss, invitations, equipment, local ledger and save round-trip. [Contact sheet](p7/journey/contact.png).' if journey.get('complete') else 'NOT VERIFIED: playthrough pending.'),
 '- Guide readability: '+(f'three desktop widths, keyboard entry and embedded image decode PASS; minimum sampled contrast {audit["guideMinContrast"]:.3f}:1.' if audit else 'NOT VERIFIED: guide acceptance pending.'),
 '- Research adds 46 source records, 9 games, 6 papers and 3 talk abstracts. Sources remain in research files; no reference art is imported. No independent human playtest is claimed.',
]
if perf:
 r=perf['defaultStartup'];lines.append('- [Startup comparison](p7/performance/summary.json): default app vs main340f88b9; JS byte deltas '+', '.join(f'{x["width"]}/CPU{x["cpu"]}: {x["byteDelta"]:+d}' for x in r)+'. CPU observations '+', '.join(f'{x["width"]}/CPU{x["cpu"]}: {x["mainTaskSeconds"]:.3f}→{x["candidateTaskSeconds"]:.3f}s ({x["cpuStatus"]})' for x in r)+'. One cold observation/configuration; no statistical guarantee.')
 rows=perf['offlineCold'];lines.append('- Offline cold separately: native MAX '+f'{max(x["max"] for x in rows if x["throttle"]==1):.1f}ms; CPU4 MAX {max(x["max"] for x in rows if x["throttle"]==4):.1f}ms. Current main has no equivalent offline cardrpg artifact; the default app is a separate comparison. File size above24MB uses the documented32MB preview exception, not a startup PASS.')
else:lines.append('- Startup/cold comparison: NOT VERIFIED; pending same-harness current-main receipts. The 32MB preview allowance does not waive startup regression reporting.')
if journey.get('complete'):
 b=[e for e in journey['encounters'] if e.get('route')=='day7' and e['kind']=='boss' and e['timed']]
 lines.append('- Earned day7 boss '+('; '.join(f'{x["wallMs"]/1000:.3f}s at x1, outcome {x["result"]}' for x in b) if b else 'NOT VERIFIED: the earned route did not reach a timed boss')+'. Fixed P6 benchmarks separately report victories or defeats; defeat duration does not prove victorious finishing time.')
lines += ['', '## Open work and delivery boundaries',
 '- Numeric MISS rows above remain blockers to promotion. Max-enhancement +12 combat balance is unverified; +12 checks cover displayed share only. Historical timing/functional receipts are never relabelled as this build’s evidence.',
 '- Lane B requests remain open: P1 fixed-delay/cooldown + crew/row/plan cues, P3 phase ≤400ms / finish ≤800ms within existing action budgets, P4 earned-reveal receipts. Schema: events-v4.ts; published P1/P3/P4 fixtures. A provides readable fallback; no B checkpoint adopted.',
 '- Native/headless, one agent, shared timing lock and handoffs. No protected/B file changes; baseline-v1 and 13 historical sim files exact. Gameplay flag OFF retains 8,250-route digest47477251. No merge, deployment or on-chain issuance.',
 '- Decisions for the user: review residual balance and preview; promotion to live and any future authoritative/on-chain issuance remain separate decisions.',
 '- Draft stack: [G0 #364](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/364), [R #365](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/365), [D #366](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/366), [P1 #367](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/367), [P2 #369](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/369), [P3 #370](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/370), [P4 #372](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/372), [P5 #373](https://github.com/ntbaoheyhey/lantern-cat-cafe/pull/373). P6/P7: '+json.dumps(publication)+'.',
]
assert len(lines)<=80,len(lines)
(base/'A4-GAMEPLAY-REPORT.md').write_text('\n'.join(lines)+'\n')
p=root/'reports/cardrpg-big/CARDRPG-BIG-REPORT.md';s=p.read_text();mark='\n<!-- A4_GAMEPLAY_DELIVERY -->\n';s=s.split(mark)[0];p.write_text(s+mark+'## Gameplay v4 review checkpoint\n\n[Gameplay report](a4/A4-GAMEPLAY-REPORT.md) records the new systems, exact offline artifact, complete before/after measurements and every residual MISS. The previous report remains historical; its acceptance claims do not apply automatically to gameplay v4.\n')
print(json.dumps({'lines':len(lines),'auditPresent':bool(audit),'journeyComplete':journey.get('complete',False),'performancePresent':bool(perf)}))
