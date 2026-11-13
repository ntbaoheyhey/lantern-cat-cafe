# B2 research — 13 November 2026

## Reference sound (15-line summary)

1. Six 30-second x3 battle windows and four 30-second menu windows were measured.
2. The battle footage is a squad duel; a separate boss encounter was not verified.
3. Battle spectral-flux onset median is 4.07/s; this includes musical attacks.
4. Mean simultaneous rising bands per onset is 0.61; a band must rise more than 6 dB within 30 ms.
5. That strict band-rise proxy is not a literal count of recorded samples; sustained music often masks a rise.
6. Battle integrated-loudness median is -14.25 LUFS; median loudness range is 5.25 LU.
7. The sustained-tonal music-bed proxy is present 96.24% of battle time.
8. Contoured harmonic events in 150–1,200 Hz have a median rate of 5.0/minute.
9. These events can include pitched instruments; they are not recognised words or a voice-separation result.
10. Battle 2–8 kHz transients shorter than 40 ms occur at a median 0.65/s.
11. Battle frames below −50 dBFS occupy a median 3.78%, consistent with short cuts.
12. Menu onsets are 5.40–5.97/s; narrator/music and UI events are mixed together in the recording.
13. Menu loudness is −22.6 to −33.1 LUFS; our requested menu target stays −20 to −16 LUFS.
14. Build continuous beds, multi-layer impacts, short sweeteners and priority-controlled callouts; compare with this same algorithm.
15. No reference audio was written to disk, copied into an asset, used for synthesis, or provided to a generator.

Measurement: `scripts/audio/analyse-reference.mjs` invokes NumPy + ffmpeg. Exact windows and selections are in `REFERENCE-WINDOWS.json`; every metric, onset, band count and contour is in `REFERENCE-AUDIO.json`. Private contact sheets remain outside Git. Five original analysis/licence-scope tests passed; a sixth regression now also covers Drupal’s _0 alternate-encoding suffix. S5 must use the same algorithm hash; changing the detector requires remeasuring both sides.

## Free-source decisions

Official candidate catalogue: **755 distinct candidate rows**, including **22 original cat recordings from 18 authors**. Candidates are research, not yet trimmed/accepted source clips. Each has a licence URL and evidence URL. `assets/audio-sources/license-evidence/` stores the official licence evidence and response hashes.

- Kenney: RPG, Impact, Interface, Music Jingles, UI, Digital, Casino, Voiceover, Fighter and Sci-fi. Signed links work with a cookie jar and page Referer; ZIPs are inspected in memory, never retained. Foley’s standalone public URL returns 404; existing RPG/Impact/Casino cover those roles.
- Freesound: meows, purrs, hisses, trills and chirps; tongue/click/mouth sessions; empty café room tone, kitchen, kettle/cup, rain, street and hearth. Only official CC0 pages and their official high-quality previews are candidates. Reuploads of the same cat recording do not count separately.
- OpenGameArt: MintoDog Hard Battle 2, Fairy Battles, Heavy Boss Battle 1, 8bit Action Stage Select and Hard Boss Battle 1. Main-work attachments only; alternate encodings deduplicated. Pixabay Cartoon Battle is a reviewed reserve, not downloaded.
- Sonniss 2024 archive/current licence reviewed: finished games are allowed, standalone source redistribution is restricted; choose CC0 for this public source repository. No Sonniss downloads or AI use. Reject ken788/386737 because the page flags possible earlier CC-BY provenance.

Sources: [Kenney](https://kenney.nl/assets/ui-audio), [Freesound example](https://freesound.org/people/d.n.audio.uk/sounds/264507/), [OpenGameArt](https://opengameart.org/content/hard-battle-2), [Sonniss licence](https://sonniss.com/gdc-bundle-license/), [Pixabay reserve](https://pixabay.com/music/adventure-cartoon-battle-445629/).

## Economy method and levers

`ECONOMY-LEVER-INVENTORY.json` lists **271** existing policy leaves/implementation sites with exact file:line: v3 faucets, withdrawal gates/fees, pity/odds, shards, enhancement, fusion, sealing, quality, drops, season/allocation/market; inherited C2 invitation/tailoring/quest/daily/idle progression; server enforcement and simulation assumptions. `scripts/v3b2/inventory-economy.mjs` regenerates it without touching combat rules.

| Proposed lever (not implemented) | File:line | Payer; benefit; main risk |
|---|---|---|
| Deterministic quality polish | economy-v3.ts:14 | Regular/heavy collectors. Choose Fine or Perfect quality; consumes Star Thread and burns YARN. Tradable power: cap progression benefit and retain free bound route. |
| Seasonal cafe decor | economy-v3.ts:6 | All collectors. Permanent backdrop/pedestal unlock for Star Thread and YARN; no random reward. Low power risk; avoid forced collection or paid Bell rewards. |
| Collection archive pages | economy-v3.ts:6 | Casual/regular. Spend Stars and a small YARN fee for a named lore page, badge and trophy. Cosmetic utility must be desirable; demand uncertain, do not assume all buy. |
| Guaranteed masterwork enhancement | economy-v3.ts:11 | Heavy endgame. Deterministic +8..+10 alternative consuming Stars; no transferable payment for a roll. Power purchase risk; bound earned Stars and daily limits, test no YARN-to-random route. |
| Deed display expansion | economy-v3.ts:6 | Deed owners. More cosmetic display slots; burns YARN and consumes Star Thread. Do not increase yields or require it for ordinary play. |
| Named seasonal relic craft | economy-v3.ts:5 | Regular/heavy collectors. Fixed named non-power relic with Star Thread recipe and disclosed YARN burn. Supply must be issuer-reserved and finite; no mystery output. |
| Bound material refinement | economy-v3.ts:4 | Casual/regular. Deterministic Star Thread to useful bound crafting materials with weekly conversion cap. Must not convert transferable assets into Bells or another random-payment route. |
| Daily tower progression budget | economy-v3.ts:15 | Heavy time-rich players. Activity-sensitive daily floor budget separates calendar progression from unlimited hours. Time gates may feel arbitrary; casual catch-up credit and visible limits. |
| Diminishing daily Spool by verified activity | economy-v3.ts:4 | Heavy and automated farms. Front-load legitimate sessions, taper repeated identical rewards and limit bot-hour advantage. Avoid declaring accounts bots by fiat; model observable flags, false positives and evasion. |
| Deterministic set focus | economy-v3.ts:12 | Heavy crafters. Choose a fixed same-tier set conversion for Stars; player sees exact output. No affix reroll or random outcome paid by YARN/Stars. |

All table locations resolve to `packages/game-rules/src/cardrpg/economy-v3.ts`; server authority belongs in `supabase/functions/_shared/economy-v3.ts`. `RESEARCH-LEVERS.json` retains the complete paths. Prefer decor, deterministic quality polish and archive/display progression for the first three real sinks; measure demand, do not assume purchases.

Model corrections before tuning: unify shared config across token and C2 progression; remove copied 6/18/50% drop and 3-Epic/2-Star server constants; retain real age, Deed, controller and pool limits. Model five player profiles, correlated activity/churn, funded buyers and declining participation. Bot earnings must follow observable friction with evasion/false-positive sensitivity, not a fictional “bot” discount.

Conservation: the old model counts every initial player token as a claim. Then burn + treasury + residual balances = all claims, so burn/claims cannot exceed 1 while balances remain. Separate finite pre-existing circulating YARN from new reward claims, disclose its source and demand, and retain a zero-external-demand stress case. Never invent unfunded buyers, omit tester grants from claims, count retained withdrawal fees as burns, or count unimplemented sinks. No redeploy: rewards seasons remain 13 weeks, content seasons four weeks, and Relic IDs are issuer-reserved.

Randomness audit includes enhancement and indirect conversion paths: transferable YARN/Spool/Star Thread cannot pay for a roll or be converted to Bells. New paid progression has exact deterministic outputs. The current Fish-based enhancement path must be reconciled with the user’s stricter Bells-only rule during E2.
