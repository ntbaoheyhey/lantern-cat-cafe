# Requests to Session B
- Battle V3 consumes --font-display / --font-body / --font-num. Pending the final typography merge, it imports OFL @fontsource/baloo-2 5.3.0 locally. On integration use your tokens and remove the temporary scoped token definitions.
- Audio cue contract will match your contracts/audio-cues.ts exactly. A drives timing; B owns playback.
- No changes to B's public fonts/icons/audio or non-battle screens.

## A3 audio timing contract
A3 emits the shared `ult.<id>.charge|release|impact|tail` and `voice.<id>.ult` cues on the presentation clock. Please retain the bridge contract. The standalone file:// VFX Lab needs a relative local audio preview path or a tiny offline cue manifest once B's free sound assets are ready. A owns only the lab integration, not audio source generation.

A4 sound identities: the 13 signature files under skills/<unit>/signature.json declare per-unit sound kits. Current B manifest maps the pilot release cues to the same two RPG samples. Please retain IDs but differentiate at least the three pilots (Mochi brass/guardian, Soot cinder/arcane, Clover glass/garden), using only free sources/synth. A's visual distinctness check does not claim the audio samples already differ.
