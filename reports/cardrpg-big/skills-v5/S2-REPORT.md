# S2 shapes and reactions
Runtime8412383c2 adds new modules behind skillsV5 with small battle hooks.
Shapes resolve explicit Single/Pierce/Row/Splash/Bounce/All/Multi-hit and ally One/Weakest/Row/Team.
Splash uses100/40, Row/All60, Bounce100/70/50, Multi-hit3×40; existing unreshaped kits remain for S3.
Seeded random hits select each landing from currently living foes; repeated-hit statuses follow their own hit.
Self/weakest/team side effects execute once per cast. Dead sources stop subsequent landings.
Crumb Burst requires Crumb and detonate; Wildfire requires3Burn and a wide hit; Rupture consumes Bleed when Shred is present; Spread copies half debuff stacks after a marked defeat.
A shared per-target/round cap covers every reaction. Nested reaction damage never triggers another reaction.
Lethal marked hits offer Spread first; lethal unmarked wide hits may still trigger Wildfire.
Resolver decisions and adjacency/tie rules are recorded in S2-DECISIONS.md.
12 focused tests PASS; replay, exact shapes, caps, trigger negatives and no chaining covered.
Six first-attempt gates PASS: typecheck/lint/web1783/rules1235 (+2expected failures/11skips)/E2E421/build.
V4 fallback180battles/45routes exact to runtime0e1e15180; baseline-v1/historical13/scope/author PASS.
Legacy8250 OFF digest exact. Read-only source-bound audit PASS; no completed suites repeated.
No balance, performance or human readability claim. Fresh20001–20500 remains UNUSED.
S3 kits/enemies/policy and S4 event contract are staged separately and not included in this phase.
