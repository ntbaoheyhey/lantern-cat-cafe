# V3 battle audio choreography

Source: d2def5b5e. Only the battle scheduler emits C2 beat cues. No audio engine, sound file, economy or combat-rule changes.

| Fixture | Cue events/s (required 4.776) | Active voices | Ultimate phases | Bark interval | Peak impacts/100 ms | Parity |
|---|---:|---:|---:|---:|---:|---|
| Wave 1 | 8.194 | 6/6 | 6/6 | 7.5 s | 3 | PASS |
| Crowded wave | 8.793 | 8/8 | 4/4 | 7.5 s | 3 | PASS |
| Boss | 7.297 | 5/5 | 8/8 | 7.5 s | 3 | PASS |

All 764 events reached the bridge exactly once; zero unknown contract IDs. All 112 B callout timing rows are available. Every cat active/ultimate and all thirteen enemy signatures have a row; no missing callout wording is required. Per-skill whooshes and tails, staggered recipient impacts, status changes, periodic ticks and death voices share the same scheduler. Gallery seeks and paused redraws are silent; late multi-target events queue under the six-per-100-ms cap.

Read-only B manifest check at a1353ff10 resolves 84/88 cue/element pairs directly. The four buff/debuff on/off IDs currently use B's generic status fallback; requested explicit designs in REQUESTS-TO-B.md. B's newer engine and real mix have not been merged early. This card measures fired cues; audible quality and file coverage will be rechecked at the scheduled sync.

Focused validation: eleven sequence/audio/parity tests and eleven checker tests passed. Full suite results are in suite.json; no blocked shared case is skipped.

Self-score: 7.6/10 pending the shared E2E repair and integrated listening review. Event density is measured, but does not establish final voice recognition, mixing quality or musical contrast. The strongest remaining risk is how the one-voice policy prioritizes rapid skills once B's latest engine is integrated.
