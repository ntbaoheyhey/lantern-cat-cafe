# A5 E1 — an owned companion who can actually retry

Gợi ý đổi mèo giờ chỉ chọn mèo đủ cấp cho độ khó đang chơi.
Mallow cấp 5 đã thay Soot bằng một nút bấm, giữ nguyên độ khó và trang bị.
Ca kiểm tra nâng Mallow dùng 250 cá và 8 chỉ đã kiếm được, không thêm tài nguyên.
90 save so sánh ở cùng độ khó không đổi kết quả; kết luận tăng sáu tài khoản thắng đã được rút lại.
Sáu bước kiểm tra mã và kiểm tra giao diện đều đạt; nghiệm thu cân bằng A5 vẫn còn mở.

Source `e14d320ed38137e2325b784ea5cc325e1ad007f2`. [Source-bound closure](e1-crew-advice-band/audit.json).

The Result worker evaluates a reserve companion at its own earned level with its existing gear. Applying keeps the outgoing companion's equipment and uses the same row. Reserves below the selected challenge band are excluded. Rules reject an invalid result swap atomically before settling the old route. No new save fields, combat tuning or in-fight input.

## What was corrected

Advice28's real-click check found a level-1 Mallow suggested for challenge band5. All17 selected reserves in its old cohort were under-level. Its retry harness omitted `challengeLevel`, silently lowering difficulty, so the apparent six-account improvement is **withdrawn as same-difficulty evidence**. Original source gates, failed browser attempts and raw cohort receipts remain in [advice28](e1/crew-advice-28/UI-REJECTION.md).

Advice29 registers both source snapshots with the same corrected retry policy before sampling. All90 account records are identical between arms: zero improved, zero worsened, all90 original first attempts exact. Casual/regular first-two wins are27/30 and28/30; heavy first wins28/30. All24 losses have an available suggestion. Both heavy advised retries lose while both without-advice retries win; the forecast is not a guarantee. These are previously earned saves, not a fresh45-day cohort. None selects an eligible reserve, so this cohort does not measure the reserve feature's population benefit. [Paired audit](e1/crew-advice-29/audit.json).

## Actual interface checks

The original under-level loss now receives the legal `Stop their support · Protect` fallback. A separate fixture trains Mallow1→5 through four affordable public level commands (300→50fish,312→304threads), preserving the original first battle and route choices. Its Result offers `Replace Soot with Mallow in Back`. A single click applies that swap, keeps challenge band5, preserves gear/currencies, and opens Prepare with zero battle actions. [Earned fixture](e1/crew-advice-29/browser-fixture.json).

Both flows pass at1280×720,1440×900 and1024×600 in both existing looks:24 captures, zero horizontal overflow, no page errors or remote requests, scoped text contrast≥6.726. The1024 screenshot is scrolled within Prepare and includes a skippable discovery card; this is a targeted functional capture, not a full layout/renderer review. Player developer controls stay hidden unless `?dev=1`. Three representative result/preparation captures were personally inspected.

Typecheck/lint/web1746/rules1192(+2expectedfail/11skipped)/E2E421/build pass on the unchanged source. The six focused eligibility cases pass; original one failure/five passes retained. OFF165cells/8250routes exactly matches `47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3`; baseline-v1 and13historical sims unchanged.

Measured offline artifact20,923,417bytes, SHA-256 `4b15da6dbe4701c1383bf296decd30800f582c61e318447fd8f74b952493a665`; [build manifest](e1-crew-advice-band/build/manifest.json). Public game/guide remain A4. No fresh acceptance, elapsed engagement, cold-start or full screenshot pack is claimed. No B/protected edits, merge or deploy.
