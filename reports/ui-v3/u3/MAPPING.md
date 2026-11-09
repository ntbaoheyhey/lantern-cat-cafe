# Destination mapping

| Old destination | Home path | Clicks |
|---|---|---|
| Cafe | Already Home | 0 |
| Night route | Night Patrol → Route | 2 |
| Companions | Cats | 1 |
| Collection journal | Cats → Journal | 2 |
| Team & cards | Team | 1 |
| Equipment | Bag | 1 |
| Invitations | Recruit | 1 |
| Fuji Relics | Relic · Fuji | 1 |
| Field guide | Menu → Read Field guide | 2 |
| Save & settings | Menu → Open settings | 2 |
| Before / after | Menu → Before / after (dev=1 only) | 2 |

Model data survives navigation unchanged: cats, gear, Relics and invitation history. Route tab renders the original map against the existing run; during practice the original no-route state remains explicit. No run, reward or character rules are changed. Workshop, skill previews, saved shifts, pantry/consumables and cafe news remain reachable in sheet details.

Heads-up for demo-integrate: the wallet/Fuji component is reused unchanged, including its technical copy, as section4.2 explicitly requires. Its longer headings are an intentional exception to the four-word copy pass. V5 keyword definitions now use the same CORE_STATUS_RULES_V5 source as the Companions glossary, in both shells.

Axe WCAG2/2.1 AA:0serious/critical issues for20 tested screen/look pairs, at1280×720. This is not yet the final full-screen-size or Result/reveal audit.
