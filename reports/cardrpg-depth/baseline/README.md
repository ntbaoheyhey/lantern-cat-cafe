# D0 measured baseline

Source is the fetched integration tip `7ff71ff69bd271c554ec4f407e1cb7fefbef8099`. The original offline artifact is 14,503,925 bytes. Playwright opened its file URL at 1024×600, 1280×720 and 1440×900. Each size has hub, collection, invitation, codex and battle captures. Page exceptions were zero.

REFERENCE: docs/cardrpg/index.html; tools/cardrpg-depth/baseline.mjs; reports/cardrpg-depth/baseline/audit.json; reports/cardrpg-depth/baseline/*-battle.png.

| Content | Before |
| --- | --- |
| Cats / mechanically distinct kits | 12 / 3 |
| Unique cat skill IDs / effect definitions | 12 / 12 |
| Enemy designs / implemented flags | 13 / 9 |
| Equipment templates / affix stats / sets | 48 / 3 / 3 |
| Playable chapters | 1 |
| Run node categories | fixed battle, loot, rest, boss |
| Main screens including detail/rewards | 12 |

The nine implemented flags include the practice cushion and binding thread. The fixed campaign encounters only seven primary enemy identities. Availability flags alone overstate repeatable campaign variety.

REFERENCE: packages/game-rules/src/cardrpg/catalog.ts; packages/game-rules/src/squad/turn/config.ts; reports/cardrpg-depth/baseline/audit.json.

Across 100 paired seeds the random policy won 0 campaigns, Auto 55, active 81. Mean party decisions were 66.90, 88.11, 82.54. Turns offering at least two legal actions were 64.01, 88.11, 82.54. These are upper bounds on meaningful choices. The active policy also chooses better between-wave loot, so the 26-point gap does not isolate in-battle decision quality. A first-time campaign estimate is 15–25 minutes using roughly 83 choices at 8–12 seconds plus setup and rest. This is a transparent estimate awaiting human timing.

REFERENCE: tools/cardrpg-depth/baseline.mjs; reports/cardrpg-depth/baseline/audit.json.

The five weakest parts from the player's view are shared cat kits, a single fixed chapter, fixed skill buttons without loadouts, weak build-changing gear, and lost progress on reload. The first three constrain immediate decisions. The latter two remove longer-term goals.

REFERENCE: packages/game-rules/src/cardrpg/catalog.ts; apps/web/src/game/cardrpg/model.ts; reports/cardrpg-depth/baseline/1280-collection.png.

The Brioche problem has two causes. Portrait generation passes `card.role` into a three-model renderer, then changes rank and angle. The unowned card CSS desaturates the result. Both the invitation banner and collection therefore display the guardian geometry. Depth mode will use each cat's real model identity and reserve a dark silhouette plus question mark for locked collection entries. The invitation reveal must use the owned portrait after the draw resolves.

REFERENCE: tools/cardrpg-demo/portraits.mjs; tools/cardrpg-demo/portrait.html; apps/web/src/game/cardrpg/shared.tsx; apps/web/src/game/cardrpg/Gacha.tsx; apps/web/src/game/cardrpg/cardrpg.css.
