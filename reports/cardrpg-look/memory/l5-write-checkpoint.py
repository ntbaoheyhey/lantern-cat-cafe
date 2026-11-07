"""Write the L5 report only from completed, independently audited evidence."""
import json,re
from pathlib import Path

base=Path('reports/cardrpg-look')
load=lambda p:json.loads((base/p).read_text())
audit=load('validation/l5/audit.json')
selection=load('validation/l5/selection.json')
inventory=load('validation/l5/evidence-inventory.json')
size=load('validation/l5/size-justification.json')
perf=audit['performance']
unitlog=(base/'validation/l5/unit-resume.log').read_text()
webtests=re.search(r'apps/web test:\s+Tests\s+(\d+) passed',unitlog).group(1)
e2elog=(base/'validation/l5/e2e-resume.log').read_text()
e2etests=re.findall(r'(\d+) passed',e2elog)[-1]
e2egate=next(row for row in audit['gates'] if row['name']=='e2e')
e2eresult=(f'{e2etests} passed in one suite' if e2egate.get('singleRunPass',True) else '420 passed initially;1 unchanged-source focused retry passed. Not one clean421-case run')
ms=lambda n:f'{n:,.1f}'
native=[];cpu=[]
for batch in [1,2]:
    for row in load(f'validation/l5/cold-batch-{batch}/summary.json')['rows']:
        (cpu if row['throttle']==4 else native).append(row)
span=lambda rows,key:f'{min(r[key] for r in rows):.1f}–{max(r[key] for r in rows):.1f}'
rig={r['cat']:r for r in load('validation/l5/phase-rig-raw.json')}
unitrows=['|Mochi / Soot / Clover|look-slice|L1;3+ rounds;unchanged in L5|']
for row in selection['rows']:
    unitrows.append(f"|{row['owner']}|{row['tier']}|{rig[row['owner']]['triangles']}tri;{24 if row['kind']=='cat' else 12} fresh poses;48-frame turntable|")
classes='; '.join(f"{key} {value['embeddedBytes']:,}" for key,value in size['assetClasses'].items())
misses='\n'.join('- '+item for item in audit['misses'])
report=f'''# Báo cáo LOOK — checkpoint L5, còn L7
Đã dựng lại 9 mèo còn lại, 10 đối thủ thường và 3 boss bằng Blender; tổng 25 mô hình Look đã có trong demo.
Đã làm mới 9 chân dung từ chính mô hình đã chọn; bộ 12 chân dung, 48 icon và 4 khung giữ nguyên giao diện dữ liệu.
Đã xem 372 tư thế mới và 6 góc của mỗi mô hình trong 22 turntable; mẫu chụp không chứng minh toàn bộ chuyển động hết va chạm.
22 mô hình mới ở mức “đã cải thiện”; viền mắt, quần áo cứng, chân đơn giản và hơi nước đặc vẫn còn hạn chế.
Typecheck/lint/unit/build qua; E2E có 420 ca qua lượt đầu và 1 ca qua chạy lại, không phải 421 ca qua một lượt.
Demo {audit['bytes']:,} byte, vượt 24 MB nhưng dưới 32 MB; còn {size['headroomBytes']:,} byte dự phòng.
24 lượt thi triển đầu/lặp đạt đỉnh {ms(perf['castMaxMs'])} ms; tải lạnh được báo cáo riêng.
Chân dung chạy trong Collection/Team; icon và khung có gallery riêng để lane A tích hợp.
Chưa chạy ma trận cuối, 20 trận kiểm tra bộ nhớ hoặc CPU×4 Balanced/Low trên bản L7.

REFERENCE: docs/cardrpg-look/index.html; reports/cardrpg-look/validation/l5/audit.json; reports/cardrpg-look/validation/l5/selection.json; L5-BATCH1-CHECKPOINT.md; L5-BATCH2-CHECKPOINT.md; L5-BATCH3-CHECKPOINT.md; L5-OPPONENTS-CHECKPOINT.md

L5 source `{audit['source'][:8]}`, artifact `{audit['artifact']}`, {audit['bytes']:,}bytes/{audit['sourceInputs']} hashed inputs. Stacked on [L6 draft371](https://github.com/ntbaoheyhey/taskbar-hero/pull/371), accepted A3`daba7d7c`. L5 publication reference is recorded in memory/STATE.md after the remote tip is verified. Historical L1–L6 readings retain their original artifacts.

| User complaint | Before → current | Self-grade/10 | Evidence / limit |
|---|---|---:|---|
|Cat quality|Blocky roster →12 original sculpted cats;13 rebuilt opponents|7|[Panko](rounds/roster/panko/round-3/comparison.png),[Yarn](rounds/opponents/yarn-giant/round-4/comparison.png);3 look-slice/22 improved|
|Lighting/depth|Flat fill →key/rim/ramp/contact shading|6.5|L3 face checks;dark coat separation remains weak|
|Stage richness|Sparse tabletop →cafe textiles/ceramics/plants/night window|6.8|L2 four Blender/three runtime rounds;uniform shelves/shades remain|
|Colour/UI harmony|Muddy field →teal/honey palette and12 matching portraits|7|[Refreshed portraits](rounds/art/portraits/packed-round-5/portraits-dark.png);A owns icon/frame wiring|
|Effects quality|Thin effects →6 original atlases/ribbons/impact lights|6|L4 distance minimum.6030→.6530;1162 strict pair decreases remain|
|Sharpness|Flat maps →baked detail and1x/2x art|6.8|L1hero1024/L5colour512/detail256;fine grain softens after reviewed compression|
|Post look|Incomplete stack →bloom/grade/focus/vignette/grain/SMAA tiers|7|Compact AO;not full shadow maps/GTAO/TAA|

Self-grades are personal judgments, not acceptance metrics. All22 selected models have2+ viewed authoring rounds; hero slice had3+. Per-round five-flaw reviews and correction evidence are retained. [Cat poses](validation/l5/phase-cat-poses/REVIEW.md),[opponent poses](validation/l5/phase-opponent-poses/REVIEW.md),[fresh-eyes art review](validation/l5/ART-REVIEW.md) document limitations.

| Validation | L5 measured result |
|---|---|
|Source|Type/lint/unit/build exit0;{webtests}web/1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skip inherited|
|E2E|{e2eresult};original logs in[receipt](validation/l5/source-gates.json)|
|Rigs|22 raw+22 packed exact pivot audits;all within triangle limits;9cat36clip/198trajectory comparisons;not collision proof|
|Visual coverage|66 stills/3desktop sizes;216cat+156opponent poses;1056 turntable frames audited/132 angles personally reviewed|
|Art/UI|72 images×3gallery sizes;6actualUI configs/180 decodes/24 account-preserving toggles;0errors/remote|
|First/repeat|24 High/DPR1 windows;MAX{ms(perf['castMaxMs'])}ms;minimum{perf['castWithin20Min']*100:.2f}%frames≤20ms;0errors|
|Cold7|NativeMAX{ms(max(r['max'] for r in native))}ms;CPU4MAX{ms(max(r['max'] for r in cpu))}ms|
|Flag-off startup|{audit['startup']['bytes']:,}bytes;0Three/model modules;exact parity delta{audit['startup']['byteDelta']:+}bytes|
|Size|{audit['bytes']:,}bytes;24MB miss;≤32MB allowance supported by[size evidence](validation/l5/size-justification.json)|
|Final-only|860 valid action/config cases across25owners/86actions/10configs;20battle lifecycle;CPU4Balanced/Low remain UNRUN|

Load-to-Hub native{span(native,'loadToInteractiveMs')}ms/CPU4 {span(cpu,'loadToInteractiveMs')}ms; battle-ready native{span(native,'battleReadyMs')}ms/CPU4 {span(cpu,'battleReadyMs')}ms. Cold page maxima include opening; active-cast windows measure a different interval. No causal attribution from these small samples.

L5 adds{size['deltaFromL6Bytes']:,}HTML bytes versusL6. Embedded asset bytes: {classes}. Three-model matched compression saved1,256,540HTML bytes with6runtime pairs SSIM≥.978488 and0CSSpx bounds delta;22-model counterfactual size was not measured. Fine texture grain is softer. Full-resolution raw sources remain available for portraits; L1hero resolution unchanged.

| Unit | Tier | Evidence scope |
|---|---|---|
{chr(10).join(unitrows)}

Measured gate misses:

{misses}
- Historical L4 strict effect uniqueness:1162/2211 pair distances decrease,worst−.122392341;absolute threshold checks pass. This remains unresolved.
- Final L7 matrix/lifecycle20/CPU4Balanced+Low are unrun. L4 peak107calls/118752tri is historical and does not prove current full-roster peak cost.

Visual limits: raised eye rims, rigid cloth/props, angular feet/tails, weak Rain Spool eyes, solid Teacup steam, coarse Yarn strands and overly friendly bosses. The L5 separate art-gallery footer still has obsoleteL6 text claiming nine inherited models; current manifest/images are correct. Copy correction is staged forL7, preserving immutableL5 evidence.

Portable L5 evidence: {inventory['portableFiles']}files/{inventory['portableBytes']:,}bytes; local-only originals: {inventory['localOnlyFiles']}files/{inventory['localOnlyBytes']:,}bytes, individually hashed in evidence-inventory.json. Portable set includes all author rounds, turntables,66phase stills,all motion sheets and each action at36%. Intermediate GLBs/pilotHTML/raw poses and4.8GB historicalL4frames stay local; no full-raw publication claim.

Lane A can consume the unchanged portrait/skill icon/frame keys; all12 portraits now come from original selected models. A4P1/P3/P4 optional presentation requests remain open and unadopted; A owns meta UI, icon/frame wiring and merged delivery report. L7 adds viewer/gallery/video/final measurements next. No shared/protected/rules edits, merge/deploy/main push, subagents or generative calls; native macOS, no B Docker jobs.
'''
assert len(report.splitlines())<=150
(base/'CARDRPG-LOOK-REPORT.md').write_text(report)
checkpoint=f'''# L5 — reviewed roster and opponents

Source `{audit['source']}`; artifact `{audit['artifact']}`;{audit['bytes']:,}bytes. Independent audit binds{audit['sourceInputs']}source inputs,22models,22turntables,66stills,372poses and six portraitUI configurations. Type/lint/unit/build passed. E2E: {e2eresult}. Publication is tracked in memory/STATE.md.

The9cats/10opponents/3bosses are improved tier;3L1heroes retain look-slice. All22 have2+ authoring rounds and48-frame turntables, with6angles personally viewed. Nine portraits were refreshed from the selected raw models. Meshopt/WebP packing was compared at exact studio angles; rig audits pass. Actual poses and known limitations are documented in validation/l5/phase-cat-poses/REVIEW.md and phase-opponent-poses/REVIEW.md.

24first/repeat casts max{ms(perf['castMaxMs'])}ms; cold7 max{ms(perf['coldMaxMs'])}ms. Startup delta{audit['startup']['byteDelta']:+}bytes. Original24MB target missed;32MB visual justification and per-class sizes retained. FinalL7matrix/lifecycle20/CPU4BalancedLow unrun.

{misses}

See CARDRPG-LOOK-REPORT.md for every measured/historical miss, all25unit tiers, self-grades, before/after links and pending laneA requests. No continuous collision-free or premium-finish claim. The obsolete separate gallery footer is documented and queued forL7 correction.
'''
(base/'L5-CHECKPOINT.md').write_text(checkpoint)
print(f'Wrote report {len(report.splitlines())}lines and L5 checkpoint from audit')

for name in ['L5-BATCH1-CHECKPOINT.md','L5-BATCH2-CHECKPOINT.md','L5-BATCH3-CHECKPOINT.md','L5-OPPONENTS-CHECKPOINT.md']:
    path=base/name
    text=path.read_text()
    marker='## Completed L5 phase validation'
    assert marker not in text, 'Do not duplicate the final batch follow-up'
    text += f"\n{marker}\n\nThe earlier pending notes above describe the retained pilot stage. Source `{audit['source'][:8]}` / artifact `{audit['artifact'][:8]}` now passed the independent L5 evidence audit. Typecheck/lint/unit/build passed; E2E: {e2eresult}. All 22 units have fresh phase poses, stills, exact rig audits and reviewed turntables. The 24 slice cast windows peaked at {ms(perf['castMaxMs'])} ms; cold-open maximum was {ms(perf['coldMaxMs'])} ms. Startup parity delta is {audit['startup']['byteDelta']:+} bytes, and HTML is {audit['bytes']:,} bytes (24 MB miss, documented 32 MB allowance). See [L5 checkpoint](L5-CHECKPOINT.md) and [report](CARDRPG-LOOK-REPORT.md) for measured misses and remaining L7 work.\n"
    path.write_text(text)
