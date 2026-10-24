Proposal only. V2_CONFIG unchanged. Needs the user's sign-off.

# V6 balance simulation

Branch: `ai/codex-v6-balance`, based on fetched `origin/main` at `2a5825afae6ea650684468e489b983293e86f94c`.

The final eight-path proposal passes all six targets across seven classes and twenty seeds and the three-seed regression. Current numbers fail first-boss, chapter-growth, class-spread and chapter-bounds. Full 140 current + 140 proposed run: 64.801 seconds (62.960 current; 1.841 proposed). The nine simulator regression tests pass in 2.61 seconds.

The proposal has substantial gameplay tradeoffs: starting health 6,000, level stat growth 0.8%, six-second walking and a twenty-minute boss timeout. The requested active-minute metric excludes boss animations. Nothing is applied without sign-off. Final verification transcripts follow in the report commit.
