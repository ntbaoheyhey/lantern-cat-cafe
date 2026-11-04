# Gameplay evidence index
Open `docs/gameplay/index.html` from the repository root, with its adjacent `img/` directory. `GAMEPLAY-REPORT.md` is the human-readable assessment; `RESEARCH.md`, the design note and numeric decision table explain the changes. `HANDOFF.md` records current delivery state.

The final real-clock comparison uses `before-corrected-run.json` and `after-run.json`. `before-run.json` is exploratory evidence from an earlier harness with an incorrect boss gate, not the baseline for final metrics. All three retain their exact actions, samples and events. Large JSON is compact but lossless: inspect it with `python3 -m json.tool <file>` or any JSON viewer. Still captures and fabricated review saves do not count as first-session evidence.

`timeline-metrics.json` contains the measured timeline and limits. `performance.json` contains the production five-minute soak and full application payload accounting; `effects/fps.json` contains the isolated effect benchmark. `accessibility.json`, capture receipts and `gallery-check.json` record desktop/offline checks. `scores.json` is a single-author nine-axis review, not player research. `gallery-manifest.json` hashes the 72 delivered gallery images.

`asset-provenance.md` records every original asset and exact generator inputs. Machine-generated art manifests are under `tools/art/`. No reference-game artwork was downloaded or used. Logs include initial failures and final passes; see `logs/README.md` for compressed receipts.

`delivery.json` binds the four review layers to their branches and the verified runtime. The isolated runtime is byte-identical to the pre-split source used for the full suite and production soak. Gallery labels use that stable runtime SHA; documentation-only commits can follow it.
