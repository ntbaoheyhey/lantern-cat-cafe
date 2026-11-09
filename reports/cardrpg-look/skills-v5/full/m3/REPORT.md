# M3 — live Skills V5 integration preview
18 trận tự động đã chạy xong, 1.687 lượt trình diễn; mọi hàm băm khớp với luật gốc.
Đã ghi được đủ bốn phản ứng, nhưng mới xác nhận 38/45 ô trong phạm vi bộ đo.
15/17 ảnh dùng lượt thật; Row ba địch và Crumb Burst ba địch vẫn ghi rõ fixture.
Đã sửa nhãn trạng thái cũ và dải chữ che sân; bộ đo mới kiểm tra cả lớp phủ từ lane A.
Bản này là bản tích hợp thử, chưa để hợp nhất; tiếp tục gói demo và các giới hạn hình ảnh.

A runtime `6772eb343` (S5, draft #417) merged with B MX. No B edits to rules, A-owned screens, flag defaults or manifests. Offline demo explicitly enables gameplayV4/skillsV5/lookV2 through the existing demo configuration. Malformed/unknown event versions retain the legacy fallback.

| Check | Measured result | Evidence |
|---|---|---|
| Native automatic battles | 18/18 exact hashes; 1687 presentation plans; 0 browser errors | [coverage](coverage/COVERAGE.md) |
| Structural adapter/parity | 18 registered seeds,1421 actions,1687plans;0 missing/extra v2 events;0 action overruns | [adapter](fix2/adapter/adapter.json.gz) |
| Natural coverage | 38/45 requested cells observed;4/4reactions,7/7signature snapshots,3/3enemy Burn/Bleed/Bitter on cats | [matrix](coverage/coverage-summary.json.gz) |
| Coverage limits | Bitter/Mark/Shred/Daze/Warm non-periodic trigger verification missing;single/pierce probe missing | [matrix](coverage/COVERAGE.md) |
| Cue cleanup | Night/Tea8natural endings clear;earlier10narrow-probe endings NOT VERIFIED;Oven1focused hidden/suspended/zero labels | [focused ending](end-state/end-state.json) |
| Live fixed shots | 15/17 live rule replays;P5three-targetRow/P6tripleCrumbBurst remain explicitly FIXTURE | [cases](live-cases/index.json) |
| Source checks | Typecheck/lint pass;1856web unit tests pass aftercontactpool fix;root unit StageLayout flake2/2isolated ineach tree | Source receipts |
| Layout/faces/contrast | Fix2:51shots+1095cue frames at3widths;0overlap/outside/unplaced;98facemasks0offenders;contrast4.618 | Fixed delivery receipts |
| Cast/cold/resource |18crowdedwindows:native16.8/CPU466.6ms;6coldmax183.4ms;ready≤10294.3ms;147draws/163043tris|[casts](fix2/crowded-casts/casts.json.gz),[cold](fix2/cold/summary.json.gz)|
| E2E/startup | 421/421 E2E;11OFFscripts;0Three/model. Cross-path byte counts differ3B;fixed-path attribution pending. | Fixed delivery receipts |

Coverage is exact target/layer/nonzero-alpha renderer submission plus saved canvas frames. Four representative reaction canvases were inspected; these do not prove overlaid words or every pixel in every cell. Full-page fixed shots and collider check the DOM words separately. No human playtest or universal live coverage is claimed.
The original offline packaging failure,one unplaced legacy label,incomplete sibling-strip collision check and152draw crowded Yarn frame remain in the failure receipts. Fixes use a matching B-owned IIFE loader,plain status aliases,in-flow reaction ticker and pooled ground-contact quads. The conditional150draw ceiling is justified only for Yarn plus four summoned threads;130remains the primary target and any miss is reported.
The design feedback to A already cites S5's measured Mochi2/Panko2 shares of0.38%/0.29%;no rules change by B. Latest A evidence34375615b keeps runtime6772eb343;refresh on published runtime/phase changes untilS6DONEor19Nov18UTC.

| Self-score | Weight | Score | Evidence / limit |
|---|---|---|---|
| Skill VFX beauty |22%|6.2|MX after audit6.233;repeatedpassivefootglows.|
| Status readability |15%|8|Fixed shots andface masks;no humanreader test.|
| Combo legibility |12%|7.5|All4naturalreaction captures;Rupture/Spread small.|
| Multi-target clarity |8%|8|Row/splash/multi-hit/bounce natural captures.|
| Monster readability |8%|6|Uniform pink shading andbosshierarchy remain.|
| Performance |15%|7.5|Casts/coldpass;zero-allocationgoal misses.|
| Live correctness |15%|8|18exact hashes;38/45observed cells.|
| Size/startup/compatibility |5%|8|Offline28.1MB;OFFbytes differ3B;attribution pending.|
Weighted self-score **7.31/10**, provisional untilOFFbyte attribution;monsterdepth andskillidentity leadM4. Integration remains PARTIAL.

### Additive M4 follow-up, 2026-11-09
The original M3 measurements above remain unchanged. Five trigger-repair replays add404plans: the combined23samples/18unique seeds now observe45/45cells,exacthashes,0browsererrors. [Updated matrix](../m4/coverage/COVERAGE.md) preserves both artifact hashes and every original sample;ten original narrow ending probes remainNOTVERIFIED.
Paired same-directory OFFstartup confirms the same11loadedmembers and0Three/model/errors,with literal entry28182→28185B duepreloadmetadata;bytegate remainsPARTIAL. M4 nativecasts16.8ms/CPU466.7ms,coldCPU4max183.3ms. Guide/package/film verification is recorded in[the M4 report](../m4/REPORT.md),not substituted for original M3 samples. Published A evidenceb21a91c35 leaves runtime6772eb343 unchanged.

### Published S8 refresh, 2026-11-09
Merged A draft#422 head1d7c6f68e as9a50068af. All218 changed files are A reports/diagnostics;9production/B-build trees are byte-exact against publishedS5. [Delta receipt](../refresh/s8.json) retains tree hashes. M4 coverage/parity/layout/cast/cold receipts apply unchanged; no repeated browser sample or acceptance seed. A234draw/120mscold gates and pacing misses remain separate from Bpreview evidence. Await S6 publication.
