# Audio lab 2

From the repository root, run `node scripts/audio/build-lab.mjs` after changing the production audio engine, then start `python3 -m http.server 5995 --bind 127.0.0.1`. Open `/docs/audio-lab/index.html`. The checked-in bundle works without Vite, a backend, an account or any paid speech service. Keep the repository-relative paths intact when serving it.

The cue library and screen table read the current sound-map evidence. Playback uses the production layered engine, variant pools, priorities and ducking. The listening level is saved only at the lab's origin. Stop all stops loops and batches. Randomise 10× leaves the production voice cadence intact, so voice batches take longer than SFX batches.

The editable cat previews concatenate licensed mouth and cat grains locally. They are source-profile auditions, not new mastered callouts. Shipped lines, processing measurements and limits remain documented in the B2 reports. Licence links and hashes are available per cue and in the full source ledger.

`node scripts/audio/check-lab.mjs` checks the static server, complete map coverage, 20 seeded random cues, layered variant changes and all 12 editable voices.
