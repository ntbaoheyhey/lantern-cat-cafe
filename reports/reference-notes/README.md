# Reference observations, 2026-11-02

These notes describe system shapes and observed ranges, in our own words.
They are research inputs, not approved game rules or a complete database.
No source item names, skill names, descriptions, per-entity tables, images,
audio, or implementation code are included.

- [Items and reward distributions](items.md)
- [Stat families and bounds](stats.md)
- [Skills and account upgrades](skills-runes.md)
- [Companion collection](pets.md)
- [Information layout](ui-layout.md)

## Evidence and limits

The supplied crawl dates from 2026-10-31. The valid archive is
`/Users/bao/Downloads/TBH_Index_Research_2026-10-31-2.zip`;
its SHA-256 is
`e38f4222cd4cc248087030c14d9993622a45c7807b35e2e55364a9ab617199da`.
Its CRC check passed. Archive members were read in memory; media were not
extracted, viewed, or used as asset-generation input.

The source-location report was read from
`ai/codex-mega-ledger:reports/reference-usage-2026-11-01.md`.
The five earlier research proposals under
`docs/proposals/tbh-index-research/` were reviewed at Git revision
`fc62478`, because that directory is absent from the current main tree.
Their copied labels and tables were not carried forward. The additional
resume text named by GOAL.md was unavailable at its stated locations;
the worker request and GOAL.md supplied the applicable reference rules.

Read-only HTML checks on [the public reference site](https://tbhindex.com/)
covered the landing page and the gear, grades, chests, stats, stat-caps,
skills, runes, and pets pages. Requests were sequential, separated by
offline analysis, with at least two seconds between request starts.
The robots policy was read first. No login, save upload, simulator mutation,
site-script execution, image request, or linked asset request was made.

Each note identifies archive members and live pages supporting it. Numeric
bands combine multiple observations or round outwards; they do not reproduce
individual records or establish our balance. Samples with unlike units stay
separate. Captured display values and site-authored claims are not independent
measurements of the native game.

Several source inconsistencies matter: rune headings undercount the expanded
tree; resistance-cap claims changed; pet bonus units differ between rendered
and static pages; rounded loot percentages do not always sum exactly.
The individual notes retain these limitations.

## Use in this project

Future implementation must choose original labels, descriptions, art, and
independently balanced numbers in `packages/game-rules/src/config.ts` and
record decisions in `docs/design/decisions.md`. Existing project rules remain
authoritative. The account-upgrade and companion observations support the
default-off P2 work; these notes enable no feature.

No new assets were generated, so this task adds no asset-provenance entry.
Verification outputs and the scan procedure are recorded in the T011
orchestrator verification directory and linked from its handoff.

The name check covers source entity labels, while allowing ordinary shared
vocabulary such as equipment types, stat terms, and pre-existing generic
class identifiers. Text-overlap and archive-hash checks supplement it;
they cannot prove originality against material outside the reviewed sources.
