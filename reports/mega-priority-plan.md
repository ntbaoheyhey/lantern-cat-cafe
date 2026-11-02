# Contest priority plan — living draft
Authority: mega-resume-2026-11-01.md; original technical dependencies and gates remain unless explicitly superseded.
Prepared merge order: BASE0#246 -> FXRB#243 -> CXP1#240 -> CXL1#248 -> ART1#247 -> CXN3-FIX#250 (live-gate prerequisite) -> CXN3#244 -> CXU5#249 -> CXU4#251(publishedd408ada). Merge current main into each, no history rewrite; two grades; full main/live verification before next.
P0 target12Nov2026 UTC+7: BASE0, FXRB, CXU4, CXU3, CXU5, CXC2, CXN3, CXN3-FIX.
P1 target18Nov: CXR1,CXR2 over every merged screen, CXQ1 + recurring judge path, CXS1,CXS2 preparation only.
P2 target21Nov if green/defaultOFF: CXP2,CXLU1,ART2,CXN4,CXN5 (built CXP1/CXL1 prerequisites use explicit prepared order above).
P3 only afterP0-P2 merged/green: CXLU2,CXL2,CXG1,CXG2,ART3. After25Nov no new server behavior enabled. REGRESSION once everything mergeable merged or28Nov latest; DemoDay30Nov.
User resolved scheduling dependency conflict2026-11-01T17:57:12+07:00: P1 CXR1/CXR2/CXQ1/CXS1/CXS2 covers all actually merged P0/core screens and behavior. Update QA/security/submission evidence when P2/P3 later merge; they do not block the initial P1 milestone. Preserve technical implementation dependencies. This explicitly supersedes old CXR1/CXR2 waiting for optional CXLU2 and CXS2 waiting for all optional features.
Demo gate preparation will test whether the current baseline already supports every step. A future-only proof-panel dependency must be surfaced, never silently skipped or called PASS.

User resolved the recurring demo dependency: before CXU3 and CXC2 are both merged, verify every available merged step and explicitly record future steps as outside the current gate. Once both are merged, all nine steps are mandatory at both sizes; any failure stops merges. Preserve the initial full-path RED baseline as historical, not a PASS.

Coordinator dependency correction2026-11-02: insert CXN3-FIX before CXN3 because known v2 health failures would otherwise violate its strict postmerge live gate. Existing handlers are already on main; the read-only checker is tooling, not a runtime dependency. Relative order of all previously prepared items is preserved. No score/release/live gate is waived; see docs/decisions/cxn3-fix-live-prerequisite.md on the ledger branch.
