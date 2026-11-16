# S2b implementation checkpoint

Every12cat and13enemy catalog row and runtime actor has a melee/ranged/healer class. Clover, Cinnamon, Marigold and Teacup restore/protect allies only. The selected wounded-front/basic35 method and Yarn Giant HP1292 follow LEARN/S2b.md; other offensive values and action clocks are unchanged. Saved active actors recover catalog class identity. Labels appear on cards, detail and team screens; all three Guide descriptions stay under25words. CLASS-MAP.md lists every unit.

## Validation

- Rules:1409passed,2expected failures,11skips. Server:733passed. Typecheck and production build passed. Economy tooling:20passed.
- Full web:2633passed,7failed in two ART-owned spine files. The remaining expectations assume damaging healers; REQUESTS-TO-ART.md requests compatible routing fixtures. No ART-owned file was edited. G-REG is not passed.
- Six measured screen/viewport combinations at1280×720 and1440×900: class labels present, minimum badge contrast11.132:1, zero badge/text overflow detected, zero page errors. Numeric checks are scoped to the class surfaces, not the entire demo path. The prior name-chip CSS overrode badge background; a specific badge selector fixes it. Rear-row sword decorations were removed because they implied healer attacks. Rows remain accessible and in tooltips.
- Two updated1024px screenshots inspected: team labels read clearly; Guide text is fully opaque inside a deliberately dimmed backdrop. No generator was used. Six evidence screenshots retained in ui/.
- Final browser scheduler probe matches rules state for3/3fixtures, with durations271.133/618.433/92.167s. This is not the new F6 baseline; the original is untouched.
- Independent production holdout:300/300fixture wins, zero healer damage, modeled first-loss median19.65391min and boss median95.0167s/p90108.9s. These are simulation/scheduler results, not measured human onboarding.

## Open gates

Fresh1000-account/42-day economy cohort CLASS-FINAL-200 is running. Historical E3–E5 integrity passed24/24, but cannot certify post-class rewards. Fixed-policy token scenarios and sensitivity follow the new bank. Final baseline waits for this evidence and ART compatibility. REV2 requires25%Spool retention while the frozen published policy uses15%; this conflict is explicit in DECISIONS-SHIP.md and NEEDS-USER-VI.md. No economy constant was changed. G-CLASS remains open; provisional score6/10.
