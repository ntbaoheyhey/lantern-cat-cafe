# F5 measurement plan
REFERENCE: ../memory/PROMPT.md lines110–118, ../../../apps/web/src/game/cardrpg/depth/battle-presentation.ts

The rules resolve an action once. A presentation snapshot keeps visible HP, KO, round and order at their prior values until the impact beat. The existing action marker separates action results from grouped round ticks. One300ms round beat plays before the next actor. The80ms inter-action delay scales with playback speed.

The shared impact-label aggregator supplies per-target damage, healing and shield totals with hit-count marks. Results use the reserved caption row. The skill banner lasts600ms of playback time, freezes on Pause and scales at2×/4×. The camera uses a continuous sine envelope for card auto battles. Kill settle uses the inherited reaction extension. A saving heal adds90ms within the action budget. Low-HP tint, result entrance and short page transitions provide the other F5 cues.

## Checks and thresholds
REFERENCE: ../../../tools/cardrpg-big/flow-measure.mjs, ../../../tools/cardrpg-big/flow-screens.mjs, ../../../tools/cardrpg-big/layout-measure.mjs

- Every first action keeps prior HP through anticipation/travel. DOM HP must equal the visible snapshot in natural battle screenshots.
- Basic1200ms, skill1800ms, ultimate2800ms, enemy1400ms maximum. Authored maxima reserve25ms for display-frame quantization. All hit-stop and reaction time counts.
- Inter-action gap250ms maximum and round-to-round400ms maximum.
- Fight/Pause/Skip pointer-down to first RAF with matching visible UI100ms maximum, including a cold Fight.
- Five first-encounter seeds across three desktop sizes, DPR1/2 and CPU1/4. Full natural1× replay must match the skipped result byte for byte.
- First-encounter target45–90s. Retain shorter or longer results and the action count. PhaseI owns balance changes.
- All-pose layout, five-gate validation, cold7, full720-case cast matrix and five offender traces follow. No timing runs overlap CPU-heavy validation, captures or git packing.

## Pilot
REFERENCE: pilot/summary.json, ../validation/f5-pilot.json

The first1280×720 seed11 replay takes9.408s across7 actions. This misses45–90s. Fight33.9ms, Pause10.2ms, Resume16.1ms and Skip10.3ms pass the100ms response budget. Action gapMAX83.4ms, round gapMAX383.3ms, zero premature HP samples. Banner583.3–583.4ms between sampled visible frames. One basic interval is1200.000000000001ms before25ms authored headroom was added. Raw values are retained. Validation passes1669 web tests,903 rules tests and421 E2E cases.
