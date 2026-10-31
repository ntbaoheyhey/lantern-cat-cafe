# Licence and originality risk

This is a risk analysis, not legal advice. The user's permission claim ("the game allows data mining, many people do it, so owner concerns are small") is user-reported and NOT verified by anything in the zips.

## What the evidence actually says

- The data is a scrape of **tbhindex.com**, a third-party site. The pack itself says it is "an unofficial community reference", "not a verified extraction of the installed game build and not a licensed source-code release". No licence, EULA excerpt, modding policy or publisher statement for *Task Bar Hero* is included.
- The site's wording suggests it derives data from the game's files ("datamined straight from the game", "verified against the game's own `UI_Status.cs`", sprite paths such as `/assets/skills/30101.webp`). So the underlying data and art are the game publisher's work, and the presentation (text, tables, videos, screenshots, layout) is the site author's work. Two layers of rights.
- "Many people datamine it" and "the community site is public" do not equal permission. Tolerated community wikis are common; reuse of the assets in a different commercial or judged product is a separate question.
- No public repository was found for the site (`PUBLIC_CODE_SEARCH.md`), so there is no open-source licence to rely on either.

## Policy for this repo

| Category | Examples in the pack | Policy |
|---|---|---|
| Mechanics, formulas, structure | additive vs multiplicative stacking, cooldown formula, Cube unlock ladder, synthesis grade-up concept, pity-style counters | OK as inspiration. Ideas and general rules of play are not protected the same way as expression. |
| Exact numbers | stat tables, grade values, drop weights, offline reward table, rune costs | Use only as a reference to sanity-check our own tuning. Do not paste tables into `config.ts`. Our numbers must be our own. |
| Art | sprites, icons, SVG chests, thumbnails, frames, skill videos | Do NOT copy into the repo, the app, the pitch deck or the demo video. |
| Audio | none included | n/a |
| Names | hero names (Knight, Ranger, Sorcerer, Priest, Hunter, Slayer), skill names, item names, relic names | Do NOT reuse. Generic words are fine but use cat-themed names. |
| Flavour text and descriptions | site page text, skill descriptions | Do NOT copy or lightly paraphrase. |
| Code | `UI_Status.cs` mentions, site JS bundle names | Do NOT copy. Not acquired anyway. |
| Raw dumps | the two zips | Keep out of git. This proposal contains none. |

## Why this matters for the contest

- UniHack requires original content (see `unihack-rules` in team memory). A judge who knows the original will see similarity first in the loop, the stat names and the grade ladder. Our cat theme, 7 classes, 5 rarities and 4 on-chain Relic tiers already differentiate us; keep that gap.
- The online round scores only Technical and Avalanche Integration. Third-party assets add nothing there and only add risk. Creativity (15) is judged later and originality counts there.
- A disqualification or takedown on 30 Nov costs far more than any asset saves.

## What would change this

Written permission from the rights holder (the game publisher; and the site author for site text, videos and screenshots), covering use in a hackathon submission and a public demo. The user's statement alone is not enough. Even with permission, we recommend renaming and reskinning to the cat theme.

## Actions

1. Keep both zips out of the repo and out of any public artifact. Keep them only in the private project folder.
2. If the user wants more certainty: look for the publisher's modding/fan-content policy on the Steam page or the official Discord, and send the user the link or text; we can then update this file.
3. Never reference tbhindex.com assets in the submission kit. Crediting it as "inspiration" in the README is fine and honest, but not required.
