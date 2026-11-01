# CXN3-FIX must precede the CXN3 live gate

Decision by Codex under the user-granted mission authority, 2026-11-02. This is a scheduling correction, not permission to deploy or waive a gate.

CXN3 enables v2 health checks. Its historical run has ten failures, and a fresh targeted sample still fails oversized-request checks. Merging it before the repair would knowingly enter a red postmerge live gate. The repair targets handlers already present on main; it does not need CXN3 documentation or production code. The prepared checker remains usable as verification tooling without merging it first.

Insert CXN3-FIX between ART1 and CXN3, retaining the relative order of all previously prepared items. This follows the resumed mission's rule that dependencies still apply. Correct the earlier coordinator-authored card that listed CXN3 as a prerequisite for its own repair. Every item still needs current-main integration, full verification, independent grades and serial main/live checks. A backend release additionally requires the authorized local proof, migration ordering where applicable, existing credentials and documented rollback.

The alternative of merging known failing live checks and immediately reverting would not satisfy the requested green pipeline. Weakening the checker or silently accepting401 for an oversized request is also excluded. No source behavior or live state changes with this decision.

Evidence: reports/cards/CXN3-FIX/DIAGNOSIS.md and diagnosis-2026-11-02/ on the ledger branch. Full deployed-source identity and timeout cause remain unverified; neither is inferred from ACTIVE metadata or a partial source export.
