# S10 preparation — 6/10, G-SUBMIT open

The file-open mock review now works at both desktop sizes. No HTTP calls, missing original assets, page errors or CSP violations were observed in the passing full journeys. All1,614restored asset hashes matched per profile; workshop reload and complete reset passed. Eight screenshots total are retained locally, including the initial and corrected overlay layouts.

- [Learning](../LEARN/S10.md): seven sources, one formal/five web, two quantified codec methods.
- [Offline build4](offline-build-4.json), [full checks](offline-check-2.json), [CSS-only final check](offline-layout-1.json) and [reproduction](../../../docs/v4/OFFLINE-REVIEW.md).
- [First failed check](offline-check-1.json): inline-script syntax error retained; fixed and guarded by build-time syntax validation. [Initial comparison failure](offline-layout-preflight-1.json) retained; canonical key ordering resolves metadata order only, not changed bytes.
- [Regression](regression-1/check.json): server742/rules1409/web2663pass; seven known ART failures. Typecheck, three-fixture probe and build exit0. Official class baseline remains unapproved.
- [Film plan](../../../docs/v4/VIDEO-SCRIPT.md), [eleven slide contents](../../../docs/v4/SLIDES-CONTENT.md) and [codec comparison](codec-comparison-1.json) are preparation. Fresh production capture is in progress; no finished V4 film is claimed.
- [Explorer preflight](explorer-capture-preflight-1.json): the web reader cannot access the receipt; clean Chromium returns403/verification. No false Snowtrace footage was substituted. [S11 followup](../S11/submission-open.json).

Score rationale: offline execution, asset fidelity, recovery and preparation documents are evidenced. Scheduled R2/final integration, real edited film, synchronized English/Vietnamese captions, public explorer footage and final duration/size/readability/audio remain open. Offline mock footage cannot satisfy the real-film gate.
