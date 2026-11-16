# S11 resumable history evidence

Read16November2026 before changing the history harness. The earlier whole-history and supplemental processes disappeared without final reports; cause and termination time remain unknown. Preserve that failure and every frozen scope. No clean-history claim follows from an absent process.

1. [NIST SP800-218 SSDF](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf), formal publication: retain integrity and provenance evidence for release artifacts.
2. [Gitleaks documentation](https://github.com/gitleaks/gitleaks): the git scanner examines git-log patches; log-opts controls commit selection. Keep default detector rules and100%redaction.
3. [Git rev-list](https://git-scm.com/docs/git-rev-list): freeze the reachable commit set; no-walk processes explicitly supplied commits without ancestors. Later ref changes require separate coverage.
4. [Git log](https://git-scm.com/docs/git-log): exact commit lists allow bounded batches; root and per-parent merge patches extend inspection without changing detector thresholds.
5. [Git show](https://git-scm.com/docs/git-show): exact objects support subsequent contextual review without relying on a moving working tree.
6. [GitHub secret scanning](https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning): history across branches is a separate exposure surface; detected values require remediation, not merely deletion from the latest tree.
7. [Own eight-commit comparison](../S11/history-batch-comparison-1.json): one batch took0.795s; two four-commit batches0.762s. Both scanned the identical8commit IDs and produced the same2location/type findings. This small sample demonstrates scope/result equivalence, not a general speed guarantee.

Choose fixed25commit batches over a single final-only result. After each completed batch atomically persist only commit/file/line/rule metadata in a compressed checkpoint. Validate the frozen set and each batch before scanning; resume skips only fully recorded batches. A scanner error or interrupted batch remains incomplete and must rerun. Preserve the scanner version and harness hash; do not use a baseline, size skip or disabled rules. Include root changes and per-parent merge diffs.

This covers Gitleaks textual history patches. It does not claim binary payload scanning, historical gzip expansion, contextual triage, a clean working tree, or full G-REPO acceptance. Report these scope limits explicitly and extend coverage separately where required.
