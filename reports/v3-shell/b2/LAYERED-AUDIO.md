# Layered sound design

The B2 library now drives 489 mapped SFX/UI bindings through 139 reusable sound designs. Every hit and skill/ultimate impact uses four roles, six distinct samples per role: a short attack, a low body, a room/foley tail, and a quiet high-frequency accent. Roles arrive at 0, 7, 18 and 23 ms; each gets independent pitch (±6%) and gain (±1.5 dB). UI pitch variation is ±3%.

Blunt hits combine punch and wood with a soft tail and cloth. Slashes use light attacks, plank bodies, knife/cloth tails and glass accents. Magic uses glass and quiet digital resonance. Heavy hits use metal, punch, bell/plate resonance and wood accents. Charge/release/tail designs add soft cloth for movement. Final loudness/density tuning remains card S5.

Five frequent UI families (click, hover, tab, scroll, turn/count) are pre-mixed in a single composite sprite. Other layers share four sprites, keeping requests low while retaining live EQ and independent variation. The build adds 1,680,471 encoded bytes including MP3 fallbacks. All new sources are CC0 Kenney recordings, with input and output hashes in LICENSES.json.

Playback admission counts every scheduled and audible Web Audio source. Four-layer hits are admitted atomically; the maximum is 14 SFX sources plus one voice. Full lower-priority groups are evicted when necessary. Each cue/role cycles its pool and advances only on an admitted play, so decode races and dropped requests cannot produce consecutive repetitions. Pending decodes are invalidated by stop; failed loads can retry. All filters and gains disconnect when their source ends.

The owned frame adapter previously treated travel, recoil and residue as additional skill impacts. It now emits one cast, one travel whoosh with cloth, and one impact. Ultimate tails fire once, at recoil. Session A's battle view is unchanged.

Verification: engine tests exercise asynchronous cancellation, voice priority, bounded source count, pitch retention at speed changes, pool cycling, and stored mixer settings. The browser harness runs the real stage-1 auto battle and its recorded replays, warm-loads the same packs, and records paired 180-second Chrome traces with the actual mute setting. AUDIO-PERFORMANCE.json reports relative main-thread time and wall-time overhead separately. AUDIO-BATTLE.json verifies all layered SFX/UI choices; legacy unlayered voice production remains S4/V work.

Rebuild with `python3 scripts/audio/build-layered.py`, then `node scripts/audio/verify-sources.mjs`. The B1-only build.mjs deliberately refuses to overwrite a B2 manifest/provenance ledger. `node scripts/audio/measure-battle.mjs` requires the local Vite server on 5994.

The first real battle found two repeated samples when Soot's skill resolved to overlapping element pools. Round-robin now keeps the last sample identity as well as the index, skips it across pool changes, and wraps indices when a pool shrinks. The failing trace and an overlapping-pool unit regression are retained. Current PASS evidence must use the repaired trace, not the initial CPU-only result.

Final repaired run: 180.028 seconds, 1,260 admitted plays, 3,530 layer choices, zero identical consecutive SFX/UI choices, 14 maximum SFX sources, one voice, zero errors. Added main-thread time: 2.1909% (target <8%); encoded audio including MP3 fallbacks: 5,618,061 bytes. All local types and tests pass, with existing expected failures/skips disclosed in the queue.
