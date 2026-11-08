# A5 P1 — lossless size reduction; cold performance still partial

Bản đóng gói còn 20,82 MB, giảm 5,40 MB so với A4.
Toàn bộ 198 tài nguyên khôi phục đúng từng byte.
Luồng chơi và công cụ đánh giá hoạt động ở ba kích thước màn hình.
Kiểm tra mã đạt; nhịp khựng và một số phép đo CPU vẫn chưa đạt.
Chưa thay bản demo công khai, chưa gộp hay triển khai.

Source: 509c88fbfe16eec2768e528cdf67904b093cf714. Offline SHA-256: 9d9335f3a92bbb9f63a98306277ded6b889b591ff054b646c296c75a2634de7d; 20,816,833 bytes.
The A-owned loader defers screens and reviewer panels, packs existing pixel rows, and deduplicates identical model byte ranges. It restores all original assets without changing artwork, combat rules, dependencies or B-owned source. The original layout effect remains.

| Default configuration | Main task ms median / max | Candidate task ms median / max | Requested JS delta | CPU observation |
|---|---:|---:|---:|---|
| 1280, CPU1 | 295.7 / 368.1 | 298.0 / 532.6 | +149416 | MISS |
| 1280, CPU4 | 1047.3 / 1114.4 | 1006.3 / 1046.8 | +149416 | PASS |
| 1440, CPU1 | 285.4 / 293.4 | 303.4 / 329.2 | +149416 | MISS |

Baseline is registered main 340f88b92405ceb6b5421b207307fdbb283b2ca3. Each row contains three fixed, alternating, fresh profiles per build: real onboarding and five seconds of runtime; all individual task/script/layout/frame values remain in [audit.json](p1/adoption/audit.json). No observations are dropped. All requested JavaScript chunks match their build inventory; zero Three/V4/model modules requested on this default path.

| Offline CPU4 run | Through Hub maximum ms | Full opening + battle maximum ms | Full interval <=120 ms |
|---|---:|---:|---|
| 1 | 116.7 | 266.6 | MISS |
| 2 | 116.6 | 249.9 | MISS |
| 3 | 133.3 | 183.3 | MISS |

The full maximum is 266.6 ms: MISS. The smaller Hub numbers do not replace the original cold gate. The offline artifact meets 24 MB and the default requested-JS delta meets +150,000 bytes; neither establishes a CPU improvement.

Validation: typecheck (original failure retained, declaration correction passed), lint, 1,737 web tests, 1,106 rules tests (+2 expected failures/11 skipped), 421 E2E checks and build PASS. Three widths each retain ten targeted captures, zero overflow and scoped contrast >=4.5. Deferred player navigation, reviewer panels and resize behavior pass. The original layout-effect ablation was rejected.

OFF reuses the completed 165-cell/8,250-route digest with all 63 rule input hashes unchanged. Frozen baseline-v1 and all 13 historical sim hashes match; protected/B scope and author checks pass. Six native transport tests and three independent receipt tests pass. Full screenshot pack is reserved for Z. Closure assembly attempts1/2 stopped on the still-pending1024 receipt; original logs remain and the browser was not rerun.

All rejected experiments remain in p1/pilot-01 through pilot-07 and b1; none of their balance code is adopted. Runtime combat stays A4. Public docs/cardrpg3/index.html remains unchanged until Z; the exact measured artifact is archived at [p1/artifact/index.html](p1/artifact/index.html). Remaining A5 balance, day-7 victory, forecast, discoveries, engagement and fresh acceptance are not closed.
