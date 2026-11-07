Bản thử nghiệm có đội hình, chiến thuật trước trận, trang bị và vật phẩm dùng giữa các trận.
Cafe, nhiệm vụ, bộ sưu tập và đổi thưởng bằng dấu mời đã thành các vòng chơi có phần thưởng.
P6 đã đo train/heldout tách biệt; các mục cân bằng chưa đạt vẫn ghi MISS, không coi kiểm thử chức năng là cân bằng đạt.
Demo chạy offline; kết quả browser và bảng số liệu bên dưới gắn với đúng SHA của bản thử nghiệm.
Đây là bản nháp để đánh giá; còn lệch cân bằng, chi phí tải trang và yêu cầu trình diễn cho Lane B.

# A4 gameplay delivery
REFERENCE: [Gameplay v4](../../docs/design/cardrpg/GAMEPLAY-V4.md); [research](../../docs/design/cardrpg/RESEARCH-GAMEPLAY-V4.md); [NFT boundary](../../docs/design/cardrpg/NFT-VALUE-SPEC.md).

| Brief | What the player sees | Before → after / 10 |
|---|---|---|
| Gameplay before battle | Prepare: rows, counted crew jobs, standing plan, opponent signatures; Result: observed causes | 5–6 → 7 |
| Complete equipment/items | 128 templates, 8 sets, utility compare, exact 3 shifts, pantry, 240 shelf, capacity-safe transactions | 6–8 → 8 |
| Balance and rarity | Explicit rarity effects and source odds; heldout outliers remain visible | 6.5 → 6.5 |
| Invitations and choice | Earned banners, conditional odds, pity, duplicate shards, 60-mark choice | 8–9 → 9 |
| Scarcity and future NFT value | Replayable local issuance, effort consumption, cap races, zero combat power; scope labelled local | 4 → 7 |
| Features beyond battle | Elapsed cafe service, daily board, persistent journal and one lesson at a time | 5–7 → 8 |
| Pacing and bosses | Gear-independent bands, half-HP phase and linked-add retirement; actual x1 outcomes reported | 6.5 → 7 |
Scores are this agent’s sequential design assessment, not a human playtest or measured retention. Existing G0 surface scores supply the before ranges; no higher balance score is claimed.

## Measured targets
| Target | Before | After | Gate |
|---|---|---|---|
| Adjacent tiers ≥44/48, zero reversals | 26 positive / 22 ties / 0 reversals (50 seeds/cell) | 46/48 gain≥2pp; 0 reversals | PASS |
| Intended bands: ≥15pp spread; no saturation | Level6 saturation; max50 dominated | 33/33 bands; minimum spread 16.80pp | PASS |
| One piece ≤12pp; utility-aware share ≤10% | +34pp heldout; old displayed score omitted utility | Worst 93.40pp (hearthloom-charm-legendary, mochi, chapter3); share≤4.80% | MISS |
| Every set 35–75% and leads a common situation | 8–92% heldout | 67.03–79.60% | MISS |
| Every cat 55–75% and a top pick | 49.15–83.76% heldout | 31.38–64.66% | MISS |
| Coherent crew +10–25pp at matched power | Not measured under v4 protocol | 47.73pp | MISS |
| Matched-power tolerance ±2% | Not measured under v4 protocol | 0.99438–1.00569 ratio | PASS |
| Wall time ordinary, chapter1 | 52.477–63.705s | 21.340s / party | PASS |
| Wall time elite, chapter2 | Not measured at G0 | 33.785s / party | PASS |
| Wall time boss, chapter1 | 177.346s (different earned day7 fixture) | 57.546s / enemy | PASS |
| Wall time boss, chapter2 | Not measured at G0 | 64.807s / enemy | PASS |
| Wall time boss, chapter3 | Not measured at G0 | 58.680s / enemy | PASS |
| 45day heavy/casual ≤3×: every currency and paid draws | Max2.1948×; 90 accounts | paidPulls 1.0000×; fish 1.2069×; threads 1.4098×; stamps 1.0000×; essence 2.7260× | PASS |
| Invitations: conditional CDF deviation ≤1pp | P4 max0.640337pp | 30,000accounts /1.8Mdraws; max0.640337pp | PASS |
| Collectible paired win gain ≤3pp | Local counters; no enforcement layer | 500 races; 6000 encounters; 0pp | PASS |
| OFF behavior exact | Frozen G0 digest47477251 | 8,250 routes exact47477251 | PASS |
| Source gates | G0 passed | Type/lint/build PASS; 1,106 rules (+2 expected failures/11 skipped), 1,735 web, 421 E2E; numeric tests separate | PASS |
| Offline artifact and startup | G0 A3 26,120,329 bytes | 26,215,694 bytes; +95,365 vs G0; P7 default JS +552,596 bytes vs main; offline CPU4 max 166.6 ms | MISS |

Residual item map: [31fourth-slot outliers](a4/P6-RESIDUALS.md). Full protocol, per-seed outcomes, Wilson intervals, floor cells, utility-score residuals, earned-day censoring and retained failures: [P6 balance](a4/P6-BALANCE.md). 3,625 cells × 500 seeds for each of train1–500 and heldout10001–10500; source fixed before heldout. G0 uses a different historical fixture, not a paired causal comparison.

## Demo and validation
- [Offline game](../../docs/cardrpg3/index.html): 26,215,694 bytes; SHA-256 `067d2062f6836a6d0bb9f6753ece1b2f3ca923688f241866a7f42806c8f7b6a1`.
- [Offline guide](../../docs/cardrpg3/gameplay-v4.html): 1,314,680 bytes; SHA-256 `9dca8fe648d6e101de89ffa02099249327615648989b1207f7e7183c6c0d0482`.
- P7 source gates / full 204 pack: PASS; 204 captures in ten groups plus 120 new-screen captures at three sizes/two themes, exact source and artifact hashes; [audit](a4/p7/audit.json).
- [Real-click journey](a4/p7/journey/checks.json): 16 captures; fresh save, compressed first hour, public-command day7 import, boss, invitations, equipment, local ledger and save round-trip. [Contact sheet](a4/p7/journey/contact.png).
- Guide readability: three desktop widths, keyboard entry and embedded image decode PASS; minimum sampled contrast 7.211:1.
- Research adds 46 source records, 9 games, 6 papers and 3 talk abstracts. Sources remain in research files; no reference art is imported. No independent human playtest is claimed.
- [Startup comparison](a4/p7/performance/summary.json): default app vs main340f88b9; JS byte deltas 1280/CPU1: +552596, 1280/CPU4: +552596, 1440/CPU1: +552596. CPU observations 1280/CPU1: 0.475→0.476s (MISS), 1280/CPU4: 0.651→0.677s (MISS), 1440/CPU1: 0.485→0.490s (MISS). One cold observation/configuration; no statistical guarantee.
- Offline cold separately: native MAX 33.4ms; CPU4 MAX 166.6ms. Current main has no equivalent offline cardrpg artifact; the default app is a separate comparison. File size above24MB uses the documented32MB preview exception, not a startup PASS.
- Earned day7 boss 55.151s at x1, outcome enemy. Fixed P6 benchmarks separately report victories or defeats; defeat duration does not prove victorious finishing time.

## Open work and delivery boundaries
- Numeric MISS rows above remain blockers to promotion. Max-enhancement +12 combat balance is unverified; +12 checks cover displayed share only. Historical timing/functional receipts are never relabelled as this build’s evidence.
- Lane B requests remain open: P1 fixed-delay/cooldown + crew/row/plan cues, P3 phase ≤400ms / finish ≤800ms within existing action budgets, P4 earned-reveal receipts. Schema: events-v4.ts; published P1/P3/P4 fixtures. A provides readable fallback; no B checkpoint adopted.
- Native/headless, one agent, shared timing lock and handoffs. No protected/B file changes; baseline-v1 and 13 historical sim files exact. Gameplay flag OFF retains 8,250-route digest47477251. No merge, deployment or on-chain issuance.
- Decisions for the user: review residual balance and preview; promotion to live and any future authoritative/on-chain issuance remain separate decisions.
- Earlier A3 delivery: [historical report](a4/REPORT-BEFORE-A4.md).
- Draft stack: [G0 #364](https://github.com/ntbaoheyhey/taskbar-hero/pull/364), [R #365](https://github.com/ntbaoheyhey/taskbar-hero/pull/365), [D #366](https://github.com/ntbaoheyhey/taskbar-hero/pull/366), [P1 #367](https://github.com/ntbaoheyhey/taskbar-hero/pull/367), [P2 #369](https://github.com/ntbaoheyhey/taskbar-hero/pull/369), [P3 #370](https://github.com/ntbaoheyhey/taskbar-hero/pull/370), [P4 #372](https://github.com/ntbaoheyhey/taskbar-hero/pull/372), [P5 #373](https://github.com/ntbaoheyhey/taskbar-hero/pull/373), [P6 #375](https://github.com/ntbaoheyhey/taskbar-hero/pull/375), [P7 #376](https://github.com/ntbaoheyhey/taskbar-hero/pull/376).
