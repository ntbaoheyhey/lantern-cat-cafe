# Taskbar Hero · Lane B review
REFERENCE: memory/PROMPT.md; docs/cardrpg3b/index.html; tools/cardrpg-big2/build.mjs

Đã giữ nguyên cách chơi: sưu tầm thẻ mèo, chuẩn bị đội rồi xem trận tự động.  
Chín mèo còn lại đã có động tác, đạo cụ và hiệu ứng riêng, kèm ảnh kiểm chứng.  
Mười quái thường và ba trùm đã có phần trình diễn riêng và ảnh kiểm chứng.  
Màn tải có tiến độ thật và chuẩn bị tài nguyên theo từng khung hình.  
Chưa đạt toàn bộ mục tiêu hết giật: phép đo B1 đã ghi nhận khung mở trang 300 ms.  
Ba cơ chế thử nghiệm đều mặc định tắt, không sửa tài khoản hay phần thưởng của trò chơi chính.  
Đã chạy 18.000 trận biến thể; kết quả khi tắt cơ chế khớp chính xác với luật cũ.  
Demo có thư viện kỹ năng, so sánh hình ảnh, bảng thời gian khung hình và Mechanics lab.  
Chưa gộp nhánh, triển khai hay thay đổi kinh tế, ví hoặc hợp đồng.  
Đã tiếp tục từ handoff; đang đo bản tích hợp, các mục chưa đo vẫn ghi rõ là chờ.

## Verdict and review route
REFERENCE: tools/cardrpg-big2/{ReviewStudio,MechanicsLab,offline}.tsx; apps/web/src/game/cardrpg/depth/Battle.tsx

[Published source handoff #357](https://github.com/ntbaoheyhey/taskbar-hero/pull/357); all 18 required standalone functional steps now pass, with [hash-verified acceptance](review/functional-acceptance.json). Performance thresholds remain separate. Open `docs/cardrpg3b/index.html` directly; no server or external requests are required by the offline design. The 22,446,426-byte candidate embeds 93 evidence items; source gates, 258 gallery selections and all 160 embedded comparison images pass offline checks. The current 20-replay lifecycle and 20 navigation checks pass; exhaustive timing remains pending. Three-size Focusstage screenshots now verify settled renderer dimensions and nonempty pixels.

| Complaint | Where to look | Current evidence / limit |
|---|---|---|
| Repeated motions and crude effects | Home → Review studio → Skill gallery → unit/action; play, scrub, Effect only | 25 units /86 previews rendered, with258 selections/scrubs checked across three desktop sizes |
| Blurry images | Review studio → Before / after → Sharpness | 2/10 cumulative targets pass; eight misses and crop limitations retained |
| Large bodies / face angles | Gallery camera A portrait / B balanced / C stage | 405 samples: zero clipping/HUD overlap; all A/B/C body bands miss 24–30% |
| Chaotic turns / stutter | Watch a battle now; Pause, speed and Frame meter | B1 720 cases / 1,440 casts checked; whole-page 150/300 ms miss |
| Sparse stage / flat shadows | Chapters 1–3; home companion feet | 12 before/after captures; rug contacts corrected, ambient freeze verified; tabletop remains visually flat |
| Skills lack sound identity | Battle Sound on and volume | 89 unique PCM buffers in the current artifact (79 in the earlier audio checkpoint). Original startup133.5ms, corrected shipped-source sixfreshbrowser runs MAX16.8ms native/CPU4. Current six-run click-to-enabled 215.0–351.7 ms; all current sound/playback frames ≤16.8 ms. Listening quality remains unverified |
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
| Desktop 1280×720, 1440×900, 1024×600 | Inherited | B1 three sizes: zero overflow/manual controls | B1 PASS. Focus/gallery three-size checks pass on the current candidate |
| Sharpness +40%, ten native crop pairs | Inherited 2/10 | B3 2/10; face crops +10.71%/+8.27% versus B2c | MISS: eight targets; composition caveats |
| Flag-off startup excludes three/models | Static graph checked | Standalone and integrated production: 11 JS chunks / 3,522,500 bytes, hashes verified, 0 Three.js/model loads/errors | PASS for measured default entry |

Raw arrays: [B1 cold](performance/b1-cold/summary.json), [B1 matrix](performance/b1-skills/summary.json), [baseline trace](performance/baseline-cpu4-profile/HITCHES.md), [20 replays](performance/lifecycle/summary.json), [navigation](performance/navigation/checks.json). [B3 stage/camera/sharpness](stage/CHECKPOINT.md): 405 camera samples, 20 replays, 20 navigation cycles; opening 116.6 ms MISS, post-interactive 100 ms in cold7, retained heap +1,093,980 bytes/GPU growth 0. The current HTML 734d301c has a separate [seven-case cold checkpoint](review/cold/CHECKPOINT.md): native MAX 33.4 ms, CPU4 MAX 150 ms, post-interactive MAX 150 ms (both 100 ms gates MISS), CPU4 p95 16.8 ms and post-ready MAX 16.8 ms. Its worst-frame trace identifies renderer setup/resize and texture upload. Current [20 replays](review/lifecycle/CHECKPOINT.md) pass at +1,109,208 heap bytes and zero geometry/texture/program growth; 20 navigation/disposal cases pass. A separate [five-case flow sample](review/flow/CHECKPOINT.md) reaches 183.4 ms whole-page MAX (MISS), with all 42 action budgets and 6.1–53.3 ms control responses passing. The accepted integrated main HTML 9a5f6ebb is pinned separately with all five source-gate logs hash-verified; its [cold7 audit](integration/cold/CHECKPOINT.md) recomputes13,125frames: nativeMAX33.3/CPU4MAX116.7ms, post-interactive116.7msMISS, CPU4p9516.8ms and post-ready16.8ms. Hub interaction878.2–914.3ms native/2294.7–2305.1msCPU4; battle ready7055.9–7162.4/10304–10321.5ms. Integrated [20-replay lifecycle](integration/lifecycle/CHECKPOINT.md) passes at+1,858,320heapbytes within2MiB tolerance and0/0/0GPU growth. Integrated [audio startup](integration/audio-startup/CHECKPOINT.md) independently audits 5,286 frames over six fresh browser runs: MAX33.3ms, zero frames above50ms, enable226.5–316.7ms. Both [default startup inventories](integration/flag-off/CHECKPOINT.md) pass after a real onboarding dismissal; original heading and premature-inventory hash failures remain archived. The 860-case matrix waits for A’s exact-artifact video completion; these short samples do not supersede exhaustive results.

## Unit coverage
REFERENCE: apps/web/src/game/squad/turn3d/card-*-motion.ts; card-*-effects.ts; cats; enemies

All nine nonstarter cats have rendered batch evidence and remain “improved”: the art still has small/dark rear characters and crowded group effects. All ten ordinary opponents and three bosses now have rendered batch evidence. Boss introductions and phase clips have six additional strips and three reduced-motion checks. Different recipes or rig trajectories alone do not establish slice quality. Starter slice status is inherited; regressions are checked in the same motion/effect captures.

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

Enemy checkpoints: [E1 #352](https://github.com/ntbaoheyhey/taskbar-hero/pull/352), [E2 #353](https://github.com/ntbaoheyhey/taskbar-hero/pull/353). Later drafts: [E3 #354](https://github.com/ntbaoheyhey/taskbar-hero/pull/354), [E4 #355](https://github.com/ntbaoheyhey/taskbar-hero/pull/355), [bosses #356](https://github.com/ntbaoheyhey/taskbar-hero/pull/356). Each checkpoint retains its rendered clips, uniqueness comparisons, source gates and 421 E2E cases. E3/E4/boss cold whole-page MAX is 116.6/133.3/133.3 ms; post-interactive MAX is 100.1/100/133.3 ms. Historical scoped matrices were not completed; current full-roster coverage will be reported from the accepted integrated 860-case matrix.

Cat checkpoints: [B2a #343](https://github.com/ntbaoheyhey/taskbar-hero/pull/343), [B2b #346](https://github.com/ntbaoheyhey/taskbar-hero/pull/346), [B2c #347](https://github.com/ntbaoheyhey/taskbar-hero/pull/347). Each passes typecheck/lint/build, 1,684 web / 903 rules tests (+2 expected failures, 11 skips) and 421 archived-source E2E tests. Their original cold/filmstrip checkpoints remain; current ten-configuration cast coverage is measured in the accepted integrated 860-case matrix.

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

Tea cloud flips three training and four held-out losses; relay flips none. Each split has 29/36 baseline cells at 50/50 wins, including all level-6 cells. These saturated cells cannot establish balance. Lane A completed the integrated 50-seed gear and 90-account/45-day economy comparisons: all six OFF/native gear groups and six economy groups match; positive tier steps26/48→27/48, with no lost gains/new reversals. Heavy/casual MAX2.194775696×→2.189801700×. ON held-out cats51.15–85.52%,sets8–92%,single-item uplift+24pp (OFF+34pp). Broader balance gaps remain; extras stay default OFF. See [integrated evidence](mechanics/INTEGRATION-COMPARISON.md); promotion remains the user's decision. Lane B confines rules edits to auto-extras; live config, saves, contracts and wallet paths remain untouched. Lane A owns integrated encounter and balance changes.

## Remaining work and self-grades
REFERENCE: review/FOUR-LENS-REVIEW.md; memory/STATE.md; validation; coord/cardrpg-big/B-OUTBOX.md

[B4 audio checkpoint #351](https://github.com/ntbaoheyhey/taskbar-hero/pull/351) retains the original sound-enable133.5ms hitch. The later shipped-source fix passes sixfreshbrowser runs at16.8ms MAX. The [current impact probe](review/hitstop/REVIEW.md) covers 444 real mixer samples over 74 actions: 70 retain their authored hold at 20 ms, four deliberately have zero hold, and all reduced-motion variants advance without shake. Fifteen x1 full-stage recordings are complete (360.022s,10,800 decoded frames,66 actions,0errors); all66 midpoint samples were viewed in [video review](review/video/REVIEW.md). Three natural boss excerpts also pass (72.007s total, zero runtime errors, account unchanged); all24 evenly spaced samples viewed in [boss review](review/boss-battles/REVIEW.md). Crown/yarn shared silhouette and flat tabletop remain. The integrated matrix and continuous-play/listening review remain pending. All 18 standalone functional steps pass; successful evidence collection does not imply performance acceptance. Current source typecheck/demo-types/lint/build,1,702web/935rules tests (+2expected failures/11skips), and421E2E all pass. A complete unit rerun caps workers at2 after retaining unrelated5000ms timeout logs; source and test timeouts are unchanged. See validation/review-source-acceptance.json. Rebased integrated checkout also passes type/demo-types/lint/build,1,730web/1,020rules and421E2E; [fresh acceptance](validation/resume-source-acceptance.json) preserves sparse-fixture failures and verifies all successful log hashes. Opponent captures are complete. B3 sharpness passes only 2/10; all camera presets miss the 24–30% band, and A also misses 8% horizontal margin. Per-crop causes and numeric caveats are in [the image review](stage/SHARPNESS-REVIEW.md). B1 exhaustive opening and the current seven-case cold opening both miss 100 ms. Existing encounter duration/balance and card screens belong to Lane A. Rendered failures will be retained with fixes and reruns, never relabelled as passes.

| Complaint | Self-grade /10 |
|---|---|
| Effects / identity | 6.5 provisional: themed props/effects; pale masses and shared body families remain |
| Sharpness | 5: native targets correct, 8/10 metric targets still miss |
| Layout / scale / faces | 6: no clipping/face occlusion; size band still misses |
| Turn clarity + smoothness | 6 provisional: 42 action budgets pass; current opening183.4ms miss |
| Overall feel | 6.5 provisional: automatic flow is readable; full-stage samples reviewed; continuous-play review pending |
| Sparse stage | 6: richer props/ambient motion; shared flat tabletop remains |
| Auto-only battles | 9 provisional: B1 controls verified, current isolated lab/account checks pass |
| Mechanics lab | 7 provisional: four browser cases and sims pass; polish passes, integrated balance remains weak |

Integration hook details: [INTEGRATION-HOOKS.md](INTEGRATION-HOOKS.md). Lane A accepted the B chain and wrapper in integrated a106dfca (main HTML 9a5f6ebb); B reconciliation and integrated measurements are underway. Request left for Lane A: retain encounter-balance ownership and report final integrated visual/flow checks. The invitation `playEntrance(catId)` hook is now integrated by A, with eight viewport cases reported passing in A-OUTBOX. No request to promote `autoExtras` or merge/deploy.
