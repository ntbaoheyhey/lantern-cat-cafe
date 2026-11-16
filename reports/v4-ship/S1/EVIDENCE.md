# S1 research and repository safety

Research answers RS1, RS4 and RS6 are in `../LEARN/S1.md`; public-facing conclusions are in `../../../docs/v4/AVALANCHE-ADVANTAGES.md` and `../CONTEST-FACTS.md`.

- Fuji fixed-block probe: five contracts have bytecode. Twenty observed block gaps had a 900 ms median. Ten serial gas-price reads took 4,247.83 ms; one batch of ten took 497.00 ms. These measure chain observations and RPC latency, not sponsored confirmation time. See `fuji-readonly.json`.
- Mainnet probe: twenty gaps had a 701 ms median; the gas-price quote is a point-in-time observation. See `mainnet-readonly.json`.
- No locally configured sponsor credentials were found in presence-only checks. Ten sponsored Fuji transactions remain unmeasured; no public transaction was sent.
- Organizer deadline, submission link, video duration, slides platform and repository access rule were verified. Conflicting Builder Hub dates and the unverified screening subset are explicitly recorded for owner confirmation.
- G-REG: typecheck, 2,640 web tests, 733 server tests, three exact F6 fixtures and production build passed. `regression.json`, `parity.json` and ignored check logs hold evidence. The initial test command included a nonexistent server filter, so the successful server suite is a separate invocation, not part of that command.
- Current-file secret scan completed over 93,884 regular files in 782.383 seconds. It returned 34,392 generic-key candidates, mostly simulation identifiers and source digests. Exact-match contextual triage completed: all34,392 candidates resolved as non-secrets, zero unresolved,294.68seconds across641flagged files. Public Anvil examples were compared in memory against account zero derived from its public default mnemonic. Full-history scan remains running; no clean-history claim. See secrets-working-triage.json.

Method correction: line-level metadata cannot distinguish multiple matches on a minified JSON line. Candidate triage therefore re-scans all 641 flagged files and classifies the exact match in process memory. Only file/line/type/reason metadata is persisted. An initial inefficient line-only classifier was discarded; it did not establish a gate result.

S1 remains open until security triage and history metadata are reviewed. G-LEARN passes; G-REPO and sponsored timing remain open. Current self-score: 7/10, with sourced network/contest answers and passing regressions, but incomplete security review and no sponsored measurement.

Incremental review through04770cb5c plus changed/new files (including the class lab): two scanner matches in classifier comparison literals, both verified non-secrets. Zero unresolved. S1/secrets-incremental.json records scope and adjudication; this does not cover future edits.

Classifier tightened after review: simulation exclusions now require an actual JSON scenario key ending in a numeric seed, rather than slash/digit shape alone. The full641file exact scan was repeated:30,582 validated scenario matches and0unresolved. No blanket report-directory exclusion.
