# UI audit r2 (desktop only: 1600x900, 1280x720, 1024x600)

Method: Vite dev server in demo mode, `fresh` and `midGame` fixtures, home + every tab at 3 desktop sizes. No page scrollbars at any size. Mobile not audited (user request); mobile layouts untouched.
Reference site https://tbhindex.com could not be opened from this environment (403 bot protection), so no ideas are attributed to it yet.

## Ranked issues
1. **Landing (fixed here):** first screen was a bare class grid, no hook, a dead right column with one gray sentence. Now: poster with backdrop + cat, one-line hook, one primary CTA, 3 steps. (landing-before/after-*.png)
2. **Stage has dead bands** above and below the scene at 1280x720 and 1024x600 (about 90 px each); the scene is not scaled to fill the column. (home-1280.png, forge-1024.png) Stage file, not touched.
3. **Top bar is overloaded for a new player**: Lv/XP/Chapter/fish/key/Power all show 0 before any class is chosen, and the NEXT hint is cut off ("Explore the chapter ar…"). Hide stats until a class exists; let the hint wrap or shorten.
4. **Demo/Live pill is confusing**: "Demo · saved in this browser" next to a gray "Live" dot with no meaning.
5. **Market tab is nearly empty** when no wallet: one gray line, no preview of what Relics/market are. Add an explainer and a sign-in-later note.
6. **Bag empty state**: big dashed box plus a second box ("Select an item…") that is meaningless with zero items; hide the second box when empty.
7. **Tab icons/labels are tiny** (about 10 px) at 1280; tab hit area is fine but text is hard to read.
8. **Class cards (picker)**: 7 tall cards force scrolling at 1280x720; the Attack Speed row and stat bars could be tighter so 6 fit. Cat-color badge top-right has no label.
9. **Boss panel / stage** (other thread owns these): nested scroll and boss-1600.png show the panel cut at the bottom edge; not changed.
10. Mobile: not checked per request.

## Ideas to adopt (proposals only, no rules/numbers touched)
Reference not readable yet, so these come from general index/wiki structure, to be re-checked against tbhindex.com once the user shares what it shows:
- An in-game "Codex" tab: indexed list of items, monsters, chapters with filters, built from existing data in game-rules.
- Per-chapter page: monsters, drops, recommended Power.
- Item detail card with stat comparison (partly exists in Bag).
- Progress overview page: stats and unlocks at a glance.
