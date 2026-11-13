# A2 self-review
Observed at 1280×720 in statuses-1280.png; 8 living units, each with an active status.
- HP: yes, green ally / red enemy bars directly over the matching unit; white recent-damage trail 400ms.
- Rage: yes, gold thin bar below each HP bar and each square portrait.
- Status family: burn, poison/Bitter, Daze stars, bleed, shield and buff/debuff arrows distinguish within 5 seconds.
- Exact uncommon status semantics: requires focusing or hovering its badge; the body effect intentionally groups them.
- Feet: visible; portraits stay below the battlefield.
- Desktop: 59.0 FPS first 10s run, 58.7 after phone fix, two >25ms frames. Metal headless Chromium on this Mac.
- Phone: 16:9 field preserves formation; letterboxed, functional rather than optimized.
- Typography: all computed HUD faces are Baloo 2 (OFL). Font lint passes.
- Auto: seeded full combat equality passes; manual ultimate waits for a legal turn.
- Limits: a poison effect represents Bitter (reduced recovery), not invented poison damage. The current rules have no freeze status; freeze is available to the presentation contract only.
