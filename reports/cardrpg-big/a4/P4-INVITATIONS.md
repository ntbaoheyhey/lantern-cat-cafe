# A4 P4 — earned choice and local edition supply
REFERENCE: GAMEPLAY-V4.md sections5/6/9; NFT-VALUE-SPEC.md. Draft checkpoint, not a live or on-chain launch.

Paid earned invitations grant one permanent selector mark; the free welcome grants none. Sixty marks choose a companion or eligible equipment without changing pity. ON basket draws use all128 templates; the odds drawer uses the same conditional pool. Reservations enforce effort receipts, expected revisions, per-account/day/season limits and monotonic production caps. Burns do not reopen supply; two owned Moon records from different seasons can become one cosmetic badge. THC11 preserves ledger/reveal receipts. Existing Fuji/Relic code remains untouched.

|Banner|Independent accounts|First Legendary median / p90 / max pulls|Largest conditional CDF deviation|≤1pp gate|
|---|---:|---:|---:|---|
|standard|10000|44 / 50 / 60|0.6403 pp|PASS|
|featured|10000|44 / 50 / 60|0.6403 pp|PASS|
|equipment|10000|44 / 50 / 60|0.6403 pp|PASS|

All three cohorts use fixed seeds1–10000 and60 actual paid draws, followed by actual chosen-reward redemption. Selector median/p90/max is60 pulls, zero censored. A controlled9000-stamp balance isolates probabilities; a day rollover after30 draws tests the cap, **not** earned-day progression. Casual/heavy first/chosen day distributions remain NOT VERIFIED until the P5/P6 run-bot. Featured miss→guarantee checks and pity-conditioned rarity buckets are retained in `p4/sim/gacha.json`; no fixed-base1% comparison to pity-inflated totals.

500 deterministic orderings compete for the final3 lifetime/season slots: exactly3 accepted and5 capped every time, with revision retry and exact event replay.1,500 paired seeds across three chapters compare baseline, Moon, both editions and fused badge:6,000 encounters, identical stats/outcomes,0pp gain (≤3pp PASS). Unit cases cover burns, duplicate IDs, rollover, stale revision, effort reuse and malformed saves. This is a save-local authority preview, not global security across copied saves, identity enforcement or minted supply.

Validation: final typecheck/lint/build PASS;1,087rules (+2expected failures/11skips),1,735web and421E2E PASS. Thirty targeted captures across1280/1440/1024 and Classic/Look have zero page errors/overflow, minimum measured contrast8.599:1. Initial browser failed an ambiguous native-select label; explicit aria labels fixed it and disabled controls now retain readable opacity. Original failing receipt preserved; retry1 replaces it. Full204 pack remains P7-only.

OFF165cells/8,250routes exactly preserve47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3; baseline-v1 and13historic simulation files remain exact. Source manifests are checked before report generation. No B-owned/protected changes or checkpoint adoption. P1/P3 battle presentation requests remain open; ceremony receipt fixture accompanies the checkpoint.

Artifact docs/cardrpg3/index.html: 26,208,954bytes; SHA-256 cd0f055c70453ac87d53448f4d9c6225b5db0d4b9252f664612e17de84c13818. Startup artifact bytes increased8,640vsP3: MISS, within disclosed32MB exception. Cold CPU unmeasured. Detail `p4/acceptance.json`; raw five-gate receipts `validation/a4-p4-final.json`. P5–P7, full balance, earned-day invitation distributions and final demo/report remain.
