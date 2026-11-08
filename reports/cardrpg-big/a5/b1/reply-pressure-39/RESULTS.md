# Reply-aware boss pressure39: all three arms rejected

The three prospectively registered arms completed all 384 fourth-slot cells at TRAIN seeds 1–50. This audit reuses the original outcomes; it runs no new battles. Production source `994d84056` remains unchanged.

|Arm|Worst gain (pp)|Cells >12 pp|Mean before / after wins|Before / after ≥95% wins|Expansion screen|
|---|---:|---:|---|---|---|
|pressure115|32|63|87.15% / 93.34%|132 / 171|REJECT|
|pressure130|50|99|41.94% / 48.97%|4 / 4|REJECT|
|pressure145|44|57|16.65% / 21.90%|0 / 0|REJECT|

The 1.15 arm remains too easy and retains a 32 pp equipment cliff. The 1.30 arm brings average difficulty into the registered screening range but increases the worst cliff to 50 pp. The 1.45 arm makes the three-piece builds win only 16.65% on average while retaining a 44 pp cliff. Increasing fixed boss attack does not solve the sensitivity to one item. No arm qualifies for the registered wider or 500-seed expansion.

Each arm passes six complete automatic replays with deterministic legal choices and immutable previews, 45 exact OFF battle hashes, 24 boss-only scaling checks, and the no-round-transition observer with serialized whole-battle parity. The original undefined-versus-serialized observer assertion failure is retained. These are diagnostic checks, not the phase-end source suite.

|Arm vs current22|Improved build/seed results|Worsened|Unchanged|
|---|---:|---:|---:|
|pressure115|12696|1503|24201|
|pressure130|4023|10029|24348|
|pressure145|420|16480|21500|

The before and after sides total 38,400 paired build/seed results per arm, including reused bare-kit contexts. These are not independent accounts. All negative pairs, exact source/script hashes, outcome strings and Wilson intervals remain in the receipts. No fresh earned cohort, human playtest, acceptance, fixture change or numeric gate revision is claimed. Seeds 20001–20500 remain unused.

[Prospective method](REGISTERED-METHOD.md) · [independent audit](audit.json) · [all regressions](negative-pairs.json).
