# A4 P3 — challenge bands and boss finishing
REFERENCE: GAMEPLAY-V4.md sections8/9; memory/PROMPT-A4-v2.md. Functional checkpoint; ordinary timing residual and full balance remain open.

Gameplay v4 snapshots gear-independent challenge bands when a route begins. Prepare shows the chosen band and enemy signature. Bosses enter a single closing phase below half health. Defeating the leader retires linked helpers at the same action boundary; simultaneous crew defeat remains a loss. No nominal x1 playback speed or B renderer was changed. THC10 preserves old encounter snapshots.

|Controlled benchmark, seed23|Real x1 seconds|Actions|Timing gate|
|---|---:|---:|---|
|ordinary ch1|14.487|6|MISS|
|elite ch2|33.579|19|PASS|
|boss ch1|57.892|36|PASS|
|boss ch2|74.574|47|PASS|
|boss ch3|81.808|52|PASS|

Targets: ordinary15–30s, elite25–45s, bosses45–90s. These are controlled level1/6 and unlocked-chapter fixtures traversing prior nodes through public commands, then imported through the UI. They are not earned-progression or across-seed timing acceptance. G0's legal day7 boss177.346s is a different fixture, so no like-for-like percentage reduction is claimed. The ordinary sample is0.513s below its lower bound and remains MISS; retain both initial67.553s and later receipts. No further retry in this phase.

After visible boss death, 1.18–1.48s remains for the existing result transition; there are no adds-only follow-up actions. The boss event fixture is `p3/boss-events-fixture.json`; B's optional cues must fit existing400ms phase/800ms finish budgets.

Validation: typecheck/lint/build PASS; post-tuning1,067rules (+2expected failures/11skips),1,735web and421E2E PASS.13focused lifecycle tests include exact-half thresholds, repeated crossing, reflected simultaneous defeat, DOT kills and deterministic replay. Train-only1,800encounters across levels1/6/10/50 and all3chapters pass replay/lifecycle; fixed starter matchups still saturate, so full gear/cat/set/crew gates are NOT VERIFIED.

25 targeted headless captures at1280×720/1440×900/1024×600 show zero page errors/overflow; minimum measured pacing-panel contrast14.358:1. First ordinary receipt predates the contrast probe; later three-size coverage is explicit. Personally reviewed1024 Look Prepare. Five-gate receipts: validation/a4-p3.json and p3/unit-pacing-confirm.log; original failures retained.

OFF165cells/8,250routes exactly preserve47477251b3d20ab602bee5c55a56cdd661e111b1386e298e0c9bc67737fecfa3. Baseline-v1 bytes and13historic sim files unchanged. No B-owned/protected changes or checkpoint adoption. P1 presentation REQUEST remains open; full204pack reserved for P7.

Artifact: docs/cardrpg3/index.html, 26,200,314bytes; SHA-256 266d71ac3109698a93cddf6ad2caa016c567b0e5d98cedfb9f053e290a2ecef6. Startup bytes increased1,908vsP2 and79,985vsA3: MISS, within the disclosed32MB exception. ColdCPU unmeasured this phase. Detail: p3/acceptance.json. Next P4 integrates earned selectors and local edition enforcement; P5–P7 remain.
