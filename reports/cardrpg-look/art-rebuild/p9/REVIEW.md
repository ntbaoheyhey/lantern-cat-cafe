# P9 A6 delivery and size budget

Measured the actual standalone current-A6 + B P7 artifact; reused its saved receipt and category audit. Total **38,140,486bytes**, limit40,000,000bytes, headroom1,859,514bytes. This is the gzip/base64-packed offline HTML including selected assets, code, loader and CSS, not a sum of source file sizes.

| Embedded asset category | Files | Bytes |
| --- | ---: | ---: |
| A6 selected illustrations | 50 | 5,146,352 |
| B retained classic and diagnostic assets | 130 | 12,115,080 |
| B cafe stage | 2 | 1,998,112 |
| B current puppet atlases | 25 | 7,385,800 |
| B current VFX | 1 | 2,046,876 |
| Other shared assets | 189 | 7,947,504 |

B's embedded asset share is23,545,868bytes, of which the current puppet/stage/VFX set is11,430,788bytes. Rig JSON is bundled with runtime code. Remaining HTML/code is1,500,762bytes. Large masters and evidence videos are not shipped in the game.

Published portrait catalog v4 supplies25units/60skills with multiple resolutions. The403unique linked files total9,550,158rawbytes and overlap already-counted puppets; do not add this catalog total again. A6 selects formats it needs. The actual artifact includes50A6illustrations; adding unused portrait variants would require a fresh size check.

Integration: existing lookV2 + lookArt=v3; all25rigs and atlases in assets/cardrpg-look/v3-puppets; unified assets/cardrpg-look/v3-portraits/manifest.json. Canvas owns visible numbers; DOM keeps accessible labels, portraits, bars and cut-ins. No new event contract. Source branch stays B-only, defaultOFF, draft#427. Current-A6 preview provenance is p7/a6-preview-source.json. Native-era assets are preserved; no unreviewed GLBs are published.

Known: restrained shared motion and Rain Spool proximity remain P12/P13. Initial P10films lack ultimates and are not accepted. Saved speed audit is separate and valid. This size measurement is specific to the inspected A6 shell; it is not a guarantee for later A6 changes. delivery-budget.mjs exits nonzero above40MB.
