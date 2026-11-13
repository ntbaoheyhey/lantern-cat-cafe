# Economy v3 acceptance — 13 November 2026

**PARTIAL: chain correctness passes; economic acceptance does not.** Three tuning candidates have been evaluated. These scenarios do not support a launch or sustainability claim.

## 52-week token model

Three mixes of 1,000 accounts, each with 20% bots; full and half demand, fixed seeds 43113–43115. Casual/regular/heavy/bot shares: 60/15/5/20%, 35/30/15/20%, 10/25/45/20%. Active time: 3.5/7/21/60 hours/week. All accounts hold a Deed in this withdrawal-pressure scenario. Market transfers require a funded buyer; YARN is conserved. No future passes, Mythic, hosting or Deed-upgrade demand is counted.

Emission includes the initial 20,000-YARN tester grants plus net Spool withdrawals. The routine-only ratio excludes initial grants and is not the acceptance result. Retained fees are not burned. Future controller auto-cuts are not simulated: this is an uncapped demand sensitivity, not payable-voucher forecasting. Same-set Epic availability, player behavior and demand are assumptions; the separate C2 cohort does not calibrate them.

| Mix | Demand | Burn / all claims | Burn / routine claims | Last 13 weeks | Star source / sink | Heavy / casual YARN per hour | Top 1% Spool |
|---|---:|---:|---:|---:|---:|---:|---:|
| casual-heavy | 100% | 0.901 | 1.223 | 0.936 | 36.18 | 0.383 | 1.59% |
| casual-heavy | 50% | 0.846 | 1.147 | 0.881 | 25.93 | 0.379 | 1.58% |
| balanced | 100% | 0.918 | 1.214 | 1.050 | 47.09 | 0.369 | 1.35% |
| balanced | 50% | 0.880 | 1.163 | 1.039 | 28.62 | 0.372 | 1.35% |
| heavy-heavy | 100% | 0.932 | 1.207 | 1.068 | 65.67 | 0.337 | 1.11% |
| heavy-heavy | 50% | 0.897 | 1.162 | 1.022 | 36.04 | 0.339 | 1.11% |

At half demand:
- Burn/emission >=1.0: **FAIL**, 0.846 / 0.880 / 0.897. The casual-heavy tail also fails at 0.881.
- Star Thread source/sink 0.9–1.1: **FAIL**, 25.93–36.04, substantial material surplus.
- Casual vs heavy YARN/hour <=3x: **PASS within this model**, largest symmetric ratio 2.95x; heavy earns less per hour.
- Top-1% Spool share: 1.11–1.58%, no invented target. This measures accounts, not distinct humans.

Tuning tried weekly Spool 1.5, 8, 16. Higher faucets reduce Star Thread surplus but still miss its target and lower burn/emission further. Keep 1.5. Recomputing these same candidates with the corrected denominator is not another tuning round. Data: `ECONOMY-SIM.json`, `ECONOMY-TUNING.json`. A future balance pass needs useful material sinks and activity-sensitive progression, then measured player demand.

## C2 gear progression

120 accounts, 40 per profile; seeds 90001–90040, 30 days, 20 evenly stratified start dates from 13 November. Matched profiles share dates and daily routes are correlated. The driver executes real rules/battle timelines under a modeled collecting policy, prioritizing gear invitations and useful Legendary tailoring. It does not simulate cash purchases or on-chain fusion and is not human telemetry.

| Profile | Minutes/day | Accounts | First Legendary median | Range | Censored at day 30 |
|---|---:|---:|---:|---:|---:|
| casual | 30 | 40 | Day 11 | 1–12 | 0 |
| regular | 60 | 40 | Day 11 | 1–11 | 0 |
| heavy | 180 | 40 | Day 11 | 1–11 | 0 |

Casual day 10–16: **PASS**. Heavy day 5–9 and faster per calendar day: **FAIL**. Both medians are day 11; no censored players were dropped. Summary/histograms: `COHORT-SUMMARY.json`; full records/frozen runtime: `evidence/cohort-final.jsonl.gz` and `evidence/cohort-runtime.mjs.gz`. The runtime fingerprint identifies the uncommitted v3 snapshot above B5 HEAD, not B5 alone.

Reproduce from B6 source (C2 takes about 30 minutes here):

```sh
node tools/chain/token-sim.mjs --v3
node tools/cardrpg-c2/loot-sim.mjs --economy-v3 --count=40 --days=30 --first-seed=90001 --start-date=2026-11-13 --calendar-span=20 --workers=3 --out=work/v3-shell/cohort-reproduce
```

## Chain correctness

`tests/b6-anvil.json`: 13 confirmed local receipts, guest SIWE -> Judge boss quest -> Deed -> withdrawal (16 gross, 4 retained, 12 net) -> Epic seal -> Legendary fusion with dead-address transfer -> list -> second-wallet buy. This also verifies Deed/quality-gear discovery and guest-wallet moves. `tests/b6-browser.json` covers visible guest, mint and withdrawal controls. `tests/economy-postgres.log` verifies atomic finite reservations, retry idempotency, unique Deeds and denied client writes with PostgreSQL 17.

Public Fuji v3 smoke is **not run**: migration, flags, budget, functions and hosting are user-only. Four-week game seasons do not change the 13-week rewards contract. Deed supply is issuer-enforced, not enforced by the existing ERC-1155. Dead-address transfers make inputs inaccessible without reducing ERC-1155 supply accounting.
