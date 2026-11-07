# CXU5 reference comparison — builder observations

References read: reports/ui-redesign/{index.html,BRIEF.md,PLAN.md,README.md}, REF-SHELL registry/theme/layout, original #226 compact panel. Saved same-size reference and built captures at1280×720 and1600×900. No art files changed.

| Aspect | Reference | Implementation | Disposition |
| --- | --- | --- | --- |
| Structure | Path left; fight, rewards and past runs stacked right | Same two-column hierarchy,400px right to fit real data | Explained: source data requires numeric ranges/chances and refusal text |
| Path | Five placeholder diamond nodes, winding curve | Five existing chapter/backdrop cards, winding stepped route, boss markers, current/clear/locked states | Explained: original names/art and visible accessible lock reasons replace placeholders |
| Boss | Mock Vacuum | Selected real boss portrait/name | Required original content |
| Power | Invented1,700 | Expected-normal-attack analytic estimate for selected boss/current build, labelled advice | No gate or balance changes; seeded boss attacks can differ |
| Daily attempts | Mock2/3 | Actual daily key grant, held keys, win cost and loss cooldown | API has no daily attempt quota; decision records this |
| Rewards | Three placeholder icons | All selected first/repeat chest reward lines, exact amounts and independent chances | No fabricated prizes; ART2 may add original reward icons |
| Past runs | Invented dated wins/losses | Last3 acknowledged session outcomes for selected chapter; true lifetime wins separately | No server history exists; no persistence, no invented dates |
| Shell/HUD | Redesigned mock HUD | Existing shell and HUD, including known BASE0 guidance/XP issues | OPEN outside CXU5; shared shell not redesigned here |
| Compact map | Prior #226 selected-card mode | Retained default compact API and existing desktopCSS; path opt-in only | Preserved |
| Motion | Highlighted current node | Static map with explicit focus/selection; reduced motion removes hover movement | No moving path elements needed |

Keyboard: browser coverage uses focused chapter nodes with Enter/Space, locks cannot select; pointer selection after completed fight changes card/rewards/history. Native buttons retain normal tab order and focus token. Keyboard-only Home-to-Map rail, path and shortcut walks pass6/6 in keyboard-capture.json and logs/keyboard-capture.log; no claim that mock placeholders are copied.

New colors use existing theme tokens. Existing full-unit contrast tests exercise token pairs; no new font, token, dependency, remote asset or global primitive. UI audit is heuristic; dedicated geometry assertions additionally cover no-key and chapter5 content. Full G2 remains pending BASE0 and exact-head integration.
