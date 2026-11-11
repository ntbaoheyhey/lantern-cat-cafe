# Unit size standard — D2

Authoritative registry: `assets/cardrpg-look/v3-real/manifest.json`. Rules roster: `packages/game-rules/src/cardrpg/depth/catalog.ts`. Boss classification is copied from `tier`, never inferred from role, rig metadata, or encounter size.

## Measurement and coordinates

The rest body extends from soles to skull/ear tips. Exclude raised props, hat feathers, antennae and decorative crowns; include ears. Real GLBs designate body mesh nodes and are measured after decoding and applying node world transforms. All cat bodies are 1.00 ±3% model units. Tank width may grow by at most6%; body height never responds to rarity.

**Explicit D2a unit refinement:** model/export units map to the existing cafe using one global factor of2.00 (one model unit = two legacy stage units). Thus actual cafe targets are cats2.00,small1.60–2.00,standard2.20–2.60,boss3.40–3.90; boss width<=4.40. This is a shared coordinate conversion, never actor/rarity/slot compensation. It preserves authored room and VFX coordinates. Tests report both the factor and canonical model-unit heights. No arbitrary per-slot correction is used.

Temporary puppets use measured body UV extents of the original source, including its transparent margins, and normalize by feet-minus-head rather than total image height. Their semantic sole is placed on the floor; wide temporary boss silhouettes are constrained to2.2 model units. These measurements do not constitute 3D acceptance. New accepted GLBs must supply their own real body bounds and cannot use fallback UV measurements.

## Tiers and archetypes

| Unit ID | Rules tier | Size tier | Target | Range | Archetype |
|---|---|---|---:|---|---|
| mochi | cat | cat | 1.00 | 0.97–1.03 | cat |
| soot | cat | cat | 1.00 | 0.97–1.03 | cat |
| clover | cat | cat | 1.00 | 0.97–1.03 | cat |
| panko | cat | cat | 1.00 | 0.97–1.03 | cat |
| mallow | cat | cat | 1.00 | 0.97–1.03 | cat |
| sorrel | cat | cat | 1.00 | 0.97–1.03 | cat |
| biscuit | cat | cat | 1.00 | 0.97–1.03 | cat |
| inkcap | cat | cat | 1.00 | 0.97–1.03 | cat |
| cinnamon | cat | cat | 1.00 | 0.97–1.03 | cat |
| brioche | cat | cat | 1.00 | 0.97–1.03 | cat |
| velvet | cat | cat | 1.00 | 0.97–1.03 | cat |
| marigold | cat | cat | 1.00 | 0.97–1.03 | cat |
| button-guard | regular | standard | 1.20 | 1.10–1.30 | construct |
| sock-skipper | regular | small | 0.90 | 0.80–1.00 | soft-biped |
| spool-ram | elite | standard | 1.20 | 1.10–1.30 | quadruped |
| needle-moth | regular | small | 0.90 | 0.80–1.00 | winged |
| teacup-healer | regular | standard | 1.20 | 1.10–1.30 | construct |
| kettle-knight | elite | standard | 1.20 | 1.10–1.30 | construct |
| yarn-giant | boss | boss | 1.80 | 1.70–1.95 | yarn-giant |
| binding-thread | regular | small | 0.90 | 0.80–1.00 | soft-biped |
| practice-cushion | regular | small | 0.90 | 0.80–1.00 | soft-biped |
| pollen-scout | elite | small | 0.90 | 0.80–1.00 | winged |
| rain-spool | boss | boss | 1.80 | 1.70–1.95 | quadruped |
| crumb-sentinel | elite | standard | 1.20 | 1.10–1.30 | construct |
| pantry-crown | boss | boss | 1.80 | 1.70–1.95 | construct |

Small is a visual subcategory of regular/elite: hopper, flyer, minion and summoned thread. Pollen Scout remains an elite in gameplay while using the small flyer silhouette. Kettle Knight is standard/elite even in a solo showcase. Only Yarn Giant, Rain Spool and Pantry Crown are bosses.

## Screen gates

At both1440×900 and1280×720 in the current A6 shell, compare the projected semantic rest-body box against the actual canvas (not the whole page). Every cat>=22% canvas height; party height differs from the party mean by<=8%; every boss<=55%. Boss body cannot cover party face centers; existing HP/face collision checks must also pass. Three party slots share depth regardless of gameplay row; rules and targeting remain unchanged. Measure reduced-motion rest first so a breathing phase cannot disguise a scale defect.

Commands: `node --test tools/cardrpg-look/art-rebuild/real3d/scale-check.test.mjs`; `node tools/cardrpg-look/art-rebuild/real3d/scale-check.mjs [--strict]`; web `look-scale.test.ts`; browser `real3d/scale-screen.mjs` with ART_ARTIFACT/ART_OUT pointing to a measured A6+B artifact.

`--strict` rejects all pending/unaccepted units. The initial D2 checker passes its deliberately malformed GLB fixtures but reports0/25 accepted models; no missing asset is counted as a pass. The transition lineup uses originals at calibrated heights and is explicitly labeled temporary. Replace its entries with real models as they pass D3/D5/D6.
