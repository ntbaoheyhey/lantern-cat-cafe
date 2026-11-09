"""Document completed L6 receipts without modifying frozen runtime inputs."""
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[3]
def read(path):
    return json.loads((root / path).read_text())

out = 'reports/cardrpg-look/validation/l6'
audit = read(out + '/audit.json')
perf = audit['performance']
build = read('docs/cardrpg-look/build.json')
ready = read(out + '/preview-ready/checks.json')
e2e = read(out + '/e2e-acceptance.json')
assert ready['passed'] and not ready['errors'] and not ready['remote']
assert ready['artifact'] == audit['artifact'] == e2e['artifact'] == build['sha256']
assert e2e['code'] == 0 and sum(a['passed'] for a in e2e['attempts']) == 421
assert perf['coldRuns'] == 7 and perf['castWindows'] == 24 and not perf['errors']
assert hashlib.sha256((root/'docs/cardrpg-look/index.html').read_bytes()).hexdigest() == audit['artifact']
for path, expected in build['sourceHashes'].items():
    assert hashlib.sha256((root/path).read_bytes()).hexdigest() == expected, path
cold = read(out + '/cold-batch-1/summary.json')['rows'] + read(out + '/cold-batch-2/summary.json')['rows']
native = cold[:4] + cold[6:]
cpu = cold[4:6]
ms = lambda x: f'{x:.1f}'
interval = lambda rows, key: f"{ms(min(r[key] for r in rows))}–{ms(max(r[key] for r in rows))}"
classes = '; '.join(f"{k} {v['embeddedBytes']:,}" for k, v in build['assetClasses'].items())
now = datetime.now(timezone.utc).isoformat()
misses = '\n'.join('- ' + m for m in audit['misses'])
checkpoint = f'''# L6 card-art checkpoint

REFERENCE: docs/cardrpg-look/art.html; docs/cardrpg-look/index.html; apps/web/src/game/cardrpg/look-assets.json
REFERENCE: reports/cardrpg-look/validation/l6/audit.json; reports/cardrpg-look/validation/l6/REVIEW.md

Original Blender renders deliver 12 actual-model portraits, 48 skill miniatures and four static rarity lighting plates at 1x/2x, plus icon/plate atlases. Three hero portraits use the L1 sculpture; nine portraits explicitly use inherited models pending L5. No claim of nine newly sculpted cats or dynamic foil. Lane A still owns icon/plate integration into its card screens.

Runtime source `{audit['source']}`; HTML `{audit['artifact']}`, {audit['bytes']:,} bytes, {audit['sourceInputs']} hashed inputs. Art manifest `100a69780d9b9e3562058b1e87dfc921b523c18935d8aace106c818d9f96222f`; individual delivered images {audit['individualArtBytes']:,} bytes. Offline gallery `{audit['browserArtifact']}`. Stacked on published L4 #368; accepted A3 base remains `daba7d7c`, with no A4 rules adoption.

## Visual evidence and review

![Before](rounds/art/before/portraits-dark.png)
![Delivered gallery](validation/l6/art-browser/1280-dark.png)

All original art rounds remain under rounds/art: two rounds for all assets and a third hero/icon refinement. The selected rounds are bound by selection.json/delivery.json. Both backgrounds and the actual 1x twelve-card crop were personally reviewed. Delivered hero height coverage is81.25–84.38% (Soot is slightly smaller than the stored before); rounded cups, paper, bells, cloth and leaves replace generic glyphs. Metrics include alpha borders, bounds, luminance/value fractions, saturation, Laplacian variance and SSIM; changed framing means SSIM is descriptive, not a quality score.

Remaining visual defects: pale whiskers/ear tips lose contrast on light backgrounds; tiny secondary icon details remain weak at 64px; plate structure is repetitive; inherited hats/ears/costumes remain angular. Self-grades: hero portraits7.5/10, inherited portraits6, miniatures7, plates6.5. Four-role review and specific region notes: validation/l6/REVIEW.md.

## Measured checks

| Check | Result |
|---|---|
| Source gates | Typecheck/lint/unit/build pass;1751web tests. E2E420 pass +1 unchanged-source focused retry; **not**421 passing in one run |
| Gallery |72 images at1024/1280/1440; before/after toggle and restored state pass;0overflow/errors/remote requests |
| Actual Collection/Team |3sizes×DPR1/2;180 decoded portraits and24 state-preserving toggles;0errors/remote requests |
| Preview loading |Hub→Collection while warming,4 selected models and2 real Look toggles; allready,0errors/remote |
| First/repeat casts |24 windows MAX{ms(perf['castMaxMs'])}ms, p95MAX{ms(perf['castP95MaxMs'])}ms, minimum{100*perf['castWithin20Min']:.2f}%≤20ms |
| Cold7 |NativeMAX{ms(max(r['max'] for r in native))}ms;CPU4MAX{ms(max(r['max'] for r in cpu))}ms;0errors |
| Load-to-Hub |Native{interval(native,'loadToInteractiveMs')}ms;CPU4{interval(cpu,'loadToInteractiveMs')}ms |
| Battle-ready |Native{interval(native,'battleReadyMs')}ms;CPU4{interval(cpu,'battleReadyMs')}ms |
| Flag-off |{audit['startup']['scripts']}JS/{audit['startup']['bytes']:,}bytes;0Three/model modules or requests;byte delta{audit['startup']['byteDelta']:+} |
| Size |{audit['bytes']:,}bytes;{audit['bytes']-23995962:,} aboveL4;within32MB with explicit visual justification |

The original Squad timer timeout at0.1s and the failed offline CSP/navigation attempt are preserved. Navigation now resolves against the originating actor's scene snapshot; two regression tests cover named/role loading and cancellation. No test timeout increase or failure-log removal.

Embedded gzip/base64 bytes by class: {classes}. The main artifact contains portraits; the separate6.52MB gallery demonstrates all delivered icons/plates. Size justification records the full-size portrait gain and the previous23,995,962-byte artifact. No claim that new icons already ship in A's UI.

## Misses and remaining scope

{misses}
- Inherited L4 strict uniqueness:1162/2211 numeric pair regressions remain open; no new VFX claim from L6.
- Nine cats and13 opponents still need L5 sculpture. Tiny icon details/light-backdrop contrast need refinement.
- Final25×86×10matrix,20battle lifecycle and CPU4Balanced/Low timings remain unrun until L7.
- A4 event schema and fixtures have been read; optional Battle presentation remains open, preserving legacy OFF behavior and action duration.

Portable inventory includes all art originals/reviews and L6 validation receipts/captures. Failed HTML binaries remain local unchanged and explicitly inventoried; unrelated4.8GB L4 raw frames are not selected. No merge/deploy/shared/protected/rules changes, subagents or generative calls. Native macOS; Docker is not used by this lane.
'''
(root/'reports/cardrpg-look/L6-CHECKPOINT.md').write_text(checkpoint)
report = f'''# Báo cáo LOOK — checkpoint L6, còn L5/L7
Đã giao12 chân dung từ mô hình thật,48 icon kỹ năng và4 khung hiếm, đủ bản1x/2x.
Ba mèo Mochi/Soot/Clover được dựng lại; chín mèo còn lại vẫn dùng mô hình cũ và được ghi nhãn rõ.
Chân dung đã chạy trong Collection/Team; icon và khung có gallery riêng để lane A tích hợp.
Đã sửa lỗi tải mô hình khi chuyển màn xem trước; kiểm tra lại không có lỗi trình duyệt.
Typecheck/lint/unit/build qua; E2E420 ca qua lượt đầu và1 ca qua chạy lại, không phải421 ca qua một lượt.
Demo{audit['bytes']:,}byte, vượt24MB nhưng dưới32MB; báo cáo có ảnh và bảng dung lượng giải thích mức tăng.
24 lượt thi triển đầu/lặp đạt đỉnh{ms(perf['castMaxMs'])}ms; tải lạnh CPU×4 đỉnh{ms(max(r['max'] for r in cpu))}ms còn vượt50ms.
Điểm bên dưới là tự đánh giá; chi tiết nhỏ của icon và độ tương phản trên nền sáng vẫn còn yếu.
Chưa xongL5/L7, ma trận cuối,20 trận kiểm tra bộ nhớ và CPU×4 ở Balanced/Low.

REFERENCE: docs/cardrpg-look/index.html; docs/cardrpg-look/art.html; reports/cardrpg-look/L6-CHECKPOINT.md; reports/cardrpg-look/validation/l6/audit.json

L6 source `{audit['source'][:8]}`, HTML `{audit['artifact']}`, {audit['bytes']:,}bytes/{audit['sourceInputs']}hashed inputs. Stacked on [L4 #368](https://github.com/ntbaoheyhey/taskbar-hero/pull/368), accepted A3`daba7d7c`. Publication details are appended after remote verification. Historical L4 evidence remains bound to`fb56cd44`/23,995,962bytes; it is not a new measurement of L6.

| User complaint | Before → current | Self-grade/10 | Evidence/limitation |
|---|---|---:|---|
| Cat quality |Blocky bodies →3 Blender cats/rigs/material maps;12 rendered portraits|7.5|3look-slice;9inherited pendingL5;hero<12ktri |
| Lighting/depth |Flat fill →key/rim/ramp/contact shading and studio portraits|6.5|L3face checks pass;Soot separation proxy.0506 below.18 |
| Stage richness |Sparse tabletop →cafe textiles/ceramics/plants/night window|6.8|L2four Blender/three runtime rounds;uniform shelves/shades remain |
| Colour/UI harmony |Muddy field →teal/honey battle and12 coherent portraits|7|L6six actualUI configurations pass;A owns new icon/frame wiring |
| Effects quality |Thin effects →6original atlases/ribbons/surfaces/impact lights|6|L4minimum distance.6030→.6530;1162strict pair decreases remain |
| Sharpness |Flat maps →1024hero/2048stage textures and1x/2x art|7|Eyes protected;light-background whiskers/tiny icon details weak |
| Post look |No complete stack →bloom/grade/focus/vignette/grain/SMAA tiers|7|Compact AO;not full shadow maps/GTAO/TAA |

Art-specific self-grades: hero portraits7.5; inherited portraits6;48miniatures7;rarity plates6.5. Personally reviewed selected dark/light sheets and actual1x crops. Static lighting plates are not animated foil. Locked card grayscale/question badges are existing A screen behavior. Full review: validation/l6/REVIEW.md.

| Validation | L6 receipt |
|---|---|
| Source |Type/lint/unit/build pass;1751web;1020rules/581Supabase/32chain/24auth/16contract;2expectedfail/11skip |
| E2E |420pass/1legacytimer timeout;exact failed case passes focused retry unchanged. Aggregate421coverage;original failure retained |
| Gallery |12portraits/48skills/4plates;72image decodes×3sizes;0overflow/errors/remote |
| ActualUI |3sizes×2DPR;180portrait decodes/24state-preserving toggles;preview navigation reaches4models ready |
| First/repeat |24windowsMAX{ms(perf['castMaxMs'])}ms;{100*perf['castWithin20Min']:.2f}%≤20ms;0errors;High DPR1slice |
| Cold7 |NativeMAX{ms(max(r['max'] for r in native))}ms;CPU4MAX{ms(max(r['max'] for r in cpu))}ms **MISS** |
| Flag-off startup |{audit['startup']['scripts']}JS/{audit['startup']['bytes']:,}bytes;0Three/model;exact parity **MISS {audit['startup']['byteDelta']:+}bytes** |
| Offline size |{audit['bytes']:,}bytes;original24MB target exceeded;authorized≤32MB justified in size-justification.json |
| Final-only |25×86×10matrix/20battle lifetime/CPU4Balanced+Low **UNRUN** |

Load-to-Hub native{interval(native,'loadToInteractiveMs')}ms/CPU4{interval(cpu,'loadToInteractiveMs')}ms; battle-ready native{interval(native,'battleReadyMs')}ms/CPU4{interval(cpu,'battleReadyMs')}ms. Cold page maxima include initial opening; small cast windows do not erase that miss. Inspect retained cold traces before attributing a causal improvement/regression.

Embedded bytes: {classes}. Delivered individual art{audit['individualArtBytes']:,}bytes; separate gallery6,522,535bytes. Main demo gains{audit['bytes']-23995962:,}bytes overL4, chiefly full-resolution portrait variants; icons/plates remain separate for A. No runtime resolution reduction used to pass size.

| Unit group | Delivered tier |
|---|---|
|Mochi/Soot/Clover|look-slice;3+model rounds;third portrait refinement |
|Remaining9cats|inherited models;new2-round studio portraits;L5sculpture pending |
|10enemies/3bosses|inherited models;L4effect improvement only;L5pending |

Inherited L4 measurements:67recipes/2211pairs;0threshold/face/overdraw/error offenders;107calls/118752tri peak;1162strict pair decreases/worst−.122392341 **MISS**. SixGPU/sixcancellations release370resources exactly once with0new programs. Historical coldCPU4183.4ms and startup+93bytes remain recorded. Pale roofs/cans, layered lanterns and sparse steam remain art limitations.

All art originals and L6 capture/log/metric/trace receipts are portable in evidence-inventory.json. Failed HTML binaries and~4.8GB L4 rawframes remain local unchanged, explicitly inventoried. No full raw archive claim. Navigation source fix uses the actor's original scene snapshot; no shared UI/rules edits.

A can consume version2 portraits plus skills[id].icon1x/icon2x and static rarity plates. A4events-v4 schema/P1 andP3 boss fixtures have been read; presentation request remains open, preserving OFF behavior/duration. A owns Hub opening and icon/frame integration. NextL5→L7; inherited art/identity/performance misses remain open. No merge/deploy/main push, subagents or generative calls; native Mac, no B Docker use.
'''
(root/'reports/cardrpg-look/CARDRPG-LOOK-REPORT.md').write_text(report)
state_path = root/'reports/cardrpg-look/memory/STATE.md'
state = state_path.read_text()
tail = state[state.index('\n## DONE'):]
state_path.write_text(f'''# LOOK state
## NOW
L6 audited immutable{audit['source'][:8]}/{audit['artifact'][:8]}/{audit['bytes']}bytes/{audit['sourceInputs']}inputs.12portraits/48icons/4plates delivered;all art/sixUI configs reviewed. Type/lint/unit1751web/build pass;E2E420+1focusedretry (not single421pass),attempts retained. Previewready4models/2toggles/0errors. Cold7MAX{ms(perf['coldMaxMs'])};24castsMAX{ms(perf['castMaxMs'])};startup{audit['startup']['byteDelta']:+}bytes. Audit lists misses;L6 publication/ledger/sync pending.
## NEXT
Inventory/stage onlyL6art+receipts, publish draft stacked368 afterremotecheck, mirrorreport/STATE and notifyA. ThenL5ninecats+13opponents→L7. L4strict1162pairMISS remains;L6size>24MB justified≤32MB;CPU4cold/startupparity misses. Finalmatrix/lifecycle20/CPU4BalancedLow unrun. A4schema/fixtures read,optionalpresentationrequestopen;acceptedbaseA3daba7d7c.
{tail}
- {now} L6 audit completed; seeL6-CHECKPOINT andvalidation/l6/audit.json. NativeMac;noDocker/subagents/generativecalls. Source immutable; all original failures preserved.
''')
with (root/'reports/cardrpg-look/PROGRESS.md').open('a') as f:
    f.write(f'\n## {now} L6 audited\n\n12portraits/48icons/4plates;actualUI6configs and previewready pass. E2E420+1retry, not one clean421run. HTML{audit["bytes"]}bytes;24castsMAX{ms(perf["castMaxMs"])}ms;7coldMAX{ms(perf["coldMaxMs"])}ms;startup{audit["startup"]["byteDelta"]:+}bytes. Publication pending. L5/L7 and inheritedL4misses remain. SeeL6-CHECKPOINT.md.\n')
print(json.dumps({'written': ['L6-CHECKPOINT.md', 'CARDRPG-LOOK-REPORT.md', 'memory/STATE.md', 'PROGRESS.md'], 'source': audit['source'], 'misses': audit['misses']}))
