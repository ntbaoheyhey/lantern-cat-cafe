# B2 source library

593 distinct usable clips; 22 original cat recordings from 18 authors; 76 non-overlapping consonant/mouth grains; 11 ambience sources; 12 music pieces; 18 stings.

All 989 source and shipped files have a source URL, licence, author, date and verified SHA-256. The catalogue excludes duplicate output hashes. 8 original mouth sessions supply the counted grains. Audit errors: 0.

## Production use

| Role | Source |
|---|---|
| Landing / home | Existing MintoDog CC0 themes, preserved as normalized FLAC |
| Map | MintoDog Forest / Snow stage-select themes |
| Normal / elite battles | Hard Battle 2 / Fairy Battles; legacy pmiller battle remains available |
| Boss | Heavy Boss Battle 1 / Hard Boss Battle 1 / existing Hard Battle 1 |
| Victory / defeat | Two original 16-bar scores from synthesize-result-music.py; no sampled or reference melody |
| Stings | 18 Kenney HIT / SAX / STEEL recordings |
| Quiet cafe | Empty Ice Cafe and quiet cafe room tone (choose chatter-free section for shipping) |
| Cups / kettle | Kettle-cup foley and two kettle recordings |
| Rain / night / hearth | Two rain-on-window recordings, night street, two hearth recordings |

## Preparation and limits

Every new clip is mono 48 kHz FLAC. Source preparation uses RMS gain, a -3 dBFS sample-peak ceiling, a maximum +18 dB lift, and 3 ms edge fades. Cuts retain the original time range. Very short useful clicks down to 5 ms are retained. This is not final LUFS normalization or a perceptual listening result; S3/S4/S5 verify the shipped mix.

Downloaded ZIPs and decoded WAVs are never retained. The original source encodings remain licensed for the reproducible first-run build. New source clips are in assets/audio-sources/b2; none of this library is automatically shipped. The current shipped audio is still the first-run bundle pending S3.

The interface importer initially rejected an 11.6 ms click and discarded that pack’s returned metadata. The repaired run accepts valid short transients, rejects individual invalid outputs, and completed with zero failures. Three identical normalized outputs were excluded from the unique catalogue.

Reproduce: python3 scripts/audio/build-source-library.py; python3 scripts/audio/synthesize-result-music.py; node scripts/audio/verify-sources.mjs; node scripts/v3b2/check-gates.mjs --card S2. Use --only kenney / remote / legacy to reprocess just one group.

Evidence: SOURCE-QUALITY.json, SOURCE-VERIFICATION.json, assets/audio-sources/CATALOG.json, apps/web/public/audio/LICENSES.json, tests/s2-source-verify.log, tests/s2-python.log.
