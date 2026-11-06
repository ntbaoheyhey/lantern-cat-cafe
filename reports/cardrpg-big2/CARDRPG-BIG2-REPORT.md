# Taskbar Hero · Lane B review
REFERENCE: memory/PROMPT.md; docs/cardrpg3b/index.html; tools/cardrpg-big2/build.mjs

Đã giữ nguyên cách chơi: sưu tầm thẻ mèo, chuẩn bị đội rồi xem trận tự động.  
Chín mèo còn lại đã có động tác, đạo cụ và hiệu ứng riêng, kèm ảnh kiểm chứng.  
Mười quái thường và ba trùm đã có phần trình diễn riêng; bằng chứng hình ảnh đang được kiểm tra.  
Màn tải có tiến độ thật và chuẩn bị tài nguyên theo từng khung hình.  
Chưa đạt toàn bộ mục tiêu hết giật: phép đo B1 đã ghi nhận khung mở trang 300 ms.  
Ba cơ chế thử nghiệm đều mặc định tắt, không sửa tài khoản hay phần thưởng của trò chơi chính.  
Đã chạy 18.000 trận biến thể; kết quả khi tắt cơ chế khớp chính xác với luật cũ.  
Demo có thư viện kỹ năng, so sánh hình ảnh, bảng thời gian khung hình và Mechanics lab.  
Chưa gộp nhánh, triển khai hay thay đổi kinh tế, ví hoặc hợp đồng.  
Đây là báo cáo đang hoàn thiện bằng chứng; các mục chờ đo không được tính là đạt.

## Verdict and review route
REFERENCE: tools/cardrpg-big2/{ReviewStudio,MechanicsLab,offline}.tsx; apps/web/src/game/cardrpg/depth/Battle.tsx

Implementation checkpoint, browser validation in progress. Open `docs/cardrpg3b/index.html` directly; no server or external requests are required by the offline design. Exact delivered-byte offline verification is pending.

| Complaint | Where to look | Current evidence / limit |
|---|---|---|
| Repeated motions and crude effects | Home → Review studio → Skill gallery → unit/action; play, scrub, Effect only | 25 units / 86 previews authored; all 12 cats and first six opponents rendered; later opponents pending |
| Blurry images | Review studio → Before / after → Sharpness | 2/10 cumulative targets pass; eight misses and crop limitations retained |
| Large bodies / face angles | Gallery camera A portrait / B balanced / C stage | 405 samples: zero clipping/HUD overlap; all A/B/C body bands miss 24–30% |
| Chaotic turns / stutter | Watch a battle now; Pause, speed and Frame meter | B1 720 casts checked; whole-page 150/300 ms miss |
| Sparse stage / flat shadows | Chapters 1–3; home companion feet | 12 before/after captures; rug contacts corrected, ambient freeze verified; tabletop remains visually flat |
| Skills lack sound identity | Battle Sound on and volume | 79 unique PCM buffers; four control/playback cases pass, but first sound window hits133.5ms; trace isolates133.6ms first AudioContext constructor; native-rate change rejected in six fresh browsers; silent-output comparison also rejected (130.4–132.4ms constructor) |
| Automatic fights lack preparation choices | Home → Mechanics lab | Tea cloud, Front relay, Intent lens start off; isolated fights grant no rewards |

## Measurements and gates
REFERENCE: performance/B1-CHECKPOINT.md; performance/b1-skills/summary.json; validation; delivery/scope.json

The seven-case cold run and the exhaustive fresh-page matrix are separate samples. The larger matrix supersedes a reassuring cold maximum; it does not erase its raw data. All browser work holds the shared machine lock. Captures use phase-pinned HTML and source hashes.

| Gate / measurement | Before | B1 observed | Status |
|---|---:|---:|---|
| Whole-page MAX ≤100 ms | Own cold CPU4 216.6 ms | Cold 100.1 ms; exhaustive 150 ms native / 300 ms CPU4 | MISS; 720 cases complete |
| CPU4 p95 ≤33 ms | 16.8 ms cold | 16.8 ms cold; worst matrix case 33.3 ms | MISS strict 33 ms by 0.3 ms |
| After first hub interaction MAX ≤100 ms | Not separated | 83.4 ms in seven-case cold sample | Sample PASS; explicit matrix window pending |
| Cast MAX ≤50 ms | Inherited first 33.4 / repeat 16.8 ms | First 33.4 / repeat 16.8 ms | B1 PASS, 720 cases |
| 99% cast frames ≤20 ms, DPR1/2 | Inherited receipts | ≥99.9814% per configuration; worst single cast98.7654% | B1 PASS; per-case values retained |
| ≤250 draws / ≤150k triangles | Inherited 207 / 93,802 | B1 207 / 93,802; final roster pending | B1 PASS |
| 20 natural replays: flat heap/GPU | Not measured here | +1,088,932 retained bytes; geometry/texture/program growth 0/0/0 | B1 PASS at 2 MiB heap tolerance |
| Load to interaction / battle ready | Raw baseline | Hub 924–936 ms native, 1716–1724 ms CPU4; battle ready 6540–6572 / 8332–8353 ms | Reported, not hidden in cast time |
| Desktop 1280×720, 1440×900, 1024×600 | Inherited | B1 three sizes: zero overflow/manual controls | B1 PASS; final studio pending |
| Sharpness +40%, ten native crop pairs | Inherited 2/10 | B3 2/10; face crops +10.71%/+8.27% versus B2c | MISS: eight targets; composition caveats |
| Flag-off startup excludes three/models | Static graph checked | Production browser request inventory queued | PENDING |

Raw arrays: [B1 cold](performance/b1-cold/summary.json), [B1 matrix](performance/b1-skills/summary.json), [baseline trace](performance/baseline-cpu4-profile/HITCHES.md), [20 replays](performance/lifecycle/summary.json), [navigation](performance/navigation/checks.json). [B3 stage/camera/sharpness](stage/CHECKPOINT.md): 405 camera samples, 20 replays, 20 navigation cycles; opening 116.6 ms MISS, post-interactive 100 ms in cold7, retained heap +1,093,980 bytes/GPU growth 0. Final-build lifecycle and full matrix remain pending.

## Unit coverage
REFERENCE: apps/web/src/game/squad/turn3d/card-*-motion.ts; card-*-effects.ts; cats; enemies

All nine nonstarter cats have rendered batch evidence and remain “improved”: the art still has small/dark rear characters and crowded group effects. The first six opponents have rendered batch evidence; the remainder awaits acceptance. Different recipes or rig trajectories alone do not establish slice quality. Starter slice status is inherited; regressions are checked in the same motion/effect captures.

| Unit | Tier | Distinct authored feature |
|---|---|---|
| Mochi | slice, inherited | Starter guardian performance |
| Soot | slice, inherited | Starter witch performance |
| Clover | slice, inherited | Starter alchemist performance |
| Panko | improved | Four authored action clips and utensil compositions |
| Mallow | improved | Four authored action clips and soft dessert compositions |
| Sorrel | improved | Four authored action clips and garden compositions |
| Biscuit | improved | Four authored action clips and original prop |
| Inkcap | improved | Four authored action clips and original prop |
| Cinnamon | improved | Four authored action clips and original prop |
| Brioche | improved | Four authored action clips and original prop |
| Velvet | improved | Four authored action clips and original prop |
| Marigold | improved | Four authored action clips and original prop |
| Button Guard | improved | Button lapel, distinct basic/signature clips |
| Sock Skipper | improved | Pocket clasp, distinct basic/signature clips |
| Spool Ram | improved | Bobbin crank, distinct basic/signature clips |
| Needle Moth | improved | Pinch-release stitch and target tell |
| Teacup Healer | improved | Careful pour and target tell |
| Kettle Knight | improved | Kettle salute and target tell |
| Binding Thread | improved | Weaving knot and target tell |
| Practice Cushion | improved | Soft bounce and target tell |
| Pollen Scout | improved | Seed planting and target tell |
| Crumb Sentinel | improved | Separate sugar pinch and burst |
| Yarn Giant | improved | Loom attacks, 1.14 s intro, 300 ms phase pose |
| Rain Spool | improved | Rain attacks, 1.14 s intro, 300 ms phase pose |
| Pantry Crown | improved | Pantry attacks, 1.14 s intro, 300 ms phase pose |

Enemy checkpoints: [E1 #352](https://github.com/ntbaoheyhey/taskbar-hero/pull/352), [E2 #353](https://github.com/ntbaoheyhey/taskbar-hero/pull/353). Both have six clips/15required motion pairs and421E2E; E1/E2 CPU4 page MAX116.7/133.3ms, post-interactive100ms. Scoped cast matrices remain queued.

Cat checkpoints: [B2a #343](https://github.com/ntbaoheyhey/taskbar-hero/pull/343), [B2b #346](https://github.com/ntbaoheyhey/taskbar-hero/pull/346), [B2c #347](https://github.com/ntbaoheyhey/taskbar-hero/pull/347). Each passes typecheck/lint/build, 1,684 web / 903 rules tests (+2 expected failures, 11 skips) and 421 archived-source E2E tests. Their ten-configuration scoped cast matrices remain queued.

| Cumulative cat checkpoint | Motion clips / required pairs | Effects / grayscale pairs | Cold page / post-interactive MAX ms |
|---|---:|---:|---:|
| [Batch 1](cats/batch1/CHECKPOINT.md) | 24 / 96 | 46 / 1,035 | 116.6 / 83.4 |
| [Batch 2](cats/batch2/CHECKPOINT.md) | 36 / 198 | 61 / 1,830 | 116.7 / 99.9 |
| [Batch 3](cats/batch3/CHECKPOINT.md) | 48 / 336 | 76 / 2,850 | 133.3 / 83.3 |

All declared required pairs pass; no face-mask/overdraw/runtime errors. These seven-case cold values are samples, not exhaustive limits. Raw arrays and native before/after strips are linked in each checkpoint.

## Mechanics experiments
REFERENCE: docs/design/cardrpg/MECHANICS-LAB.md; packages/game-rules/src/cardrpg/depth/auto-extras; mechanics/SUMMARY.md

18,000 variant fights = 36 level/team/chapter/encounter cells × 5 variants × 50 seeds × train/held-out. Another 3,600 original fights form the paired reference. Training seeds 4001–4050; held-out 50001–50050. No tuning after held-out. Full states are archived; all 3,600 original/disabled JSON pairs were independently compared byte for byte, and all 7,200 disabled/lens hash comparisons match.

| Extra | Viewer / preparation decision | Train wins /1800 | Held-out wins /1800 |
|---|---|---:|---:|
| Off | Existing automatic controller | 1731 | 1730 |
| Tea cloud | Scald then tide/garden hit → lowest-health ally shield; pair compatible cats | 1734 | 1734 |
| Front relay | Rear support heals/shields front → +6 charge; choose rows | 1731 | 1730 |
| Intent lens | Existing target/phase/weakness hint made visible; choose roles/flavours | 1731 | 1730 |
| All | Combined, each proc capped once per team/round | 1734 | 1734 |

Tea cloud flips three training and four held-out losses; relay flips none. Each split has 29/36 baseline cells at 50/50 wins, including all level-6 cells. These saturated cells cannot establish balance. Lane A must run updated encounter/gear/45-day economy comparisons; promotion remains the user's decision. Existing rules, live config, saves, contracts and wallet paths are unchanged.

## Remaining work and self-grades
REFERENCE: memory/STATE.md; validation; coord/cardrpg-big/B-OUTBOX.md

[B4 audio checkpoint #351](https://github.com/ntbaoheyhey/taskbar-hero/pull/351) retains the first sound-enable133.5ms hitch; no audio-startup pass is claimed. Opponent captures, full final matrix, perceptual audio review and final demo verification are pending. B3 sharpness passes only 2/10; all camera presets miss the 24–30% band, and A also misses 8% horizontal margin. Per-crop causes and numeric caveats are in [the image review](stage/SHARPNESS-REVIEW.md). B1 whole-page opening already misses 100 ms. Existing encounter duration/balance and card screens belong to Lane A. Rendered failures will be retained with fixes and reruns, never relabelled as passes.

| Complaint | Self-grade /10 |
|---|---|
| Effects / identity | Pending rendered review |
| Sharpness | 5: native targets correct, 8/10 metric targets still miss |
| Layout / scale / faces | 6: no clipping/face occlusion; size band still misses |
| Turn clarity + smoothness | Pending full matrix; opening miss known |
| Overall feel | Pending complete demo review |
| Sparse stage | 6: richer props/ambient motion; shared flat tabletop remains |
| Auto-only battles | 9 provisional: B1 controls verified, final lab check pending |
| Mechanics lab | 7 provisional: four browser cases and sims pass; polish/integrated balance pending |

Integration hook details: [INTEGRATION-HOOKS.md](INTEGRATION-HOOKS.md). Requests left for Lane A: finish ON/OFF gear/economy sims using the supplied runner; integrate the remaining published B chain and offline wrapper, then announce the checkpoint for rebase/revalidation; retain encounter-balance ownership. The invitation `playEntrance(catId)` hook is now integrated by A, with eight viewport cases reported passing in A-OUTBOX. No request to promote `autoExtras` or merge/deploy.
