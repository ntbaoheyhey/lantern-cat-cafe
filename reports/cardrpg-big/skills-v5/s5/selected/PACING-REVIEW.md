# Starter-crew pacing: exact saved TRAIN replays

The two predeclared seed-1 normal encounters reproduce the full saved battle hashes. [Registration](pacing-replay-registration.json), [complete action traces](pacing-replay.json), [full-500 cohort attribution](pacing-attribution.json). This diagnostic adds no sample, candidate or replacement denominator.

|Encounter|Rounds|Party actions|Support actions with offense available|Enemy healing|
|---|---:|---:|---:|---:|
|Button Guard + Sock Skipper|12|34|9: Mochi 3, Clover 6|0|
|Teacup Healer + Kettle Knight|25|74|25: Mochi 7, Clover 18|12 events, 606 HP|

Clover chooses Patient steep with the entire living party at full HP twice in the first encounter and six times in the second. Immediate healing is zero on those turns; Regen still has prospective value, so this is not proof that the choice is wrong. In the healer encounter, later Last light shelter casts repeatedly add zero shield to Mochi and Soot while adding 130 to Clover. The team remains alive and wins both replays.

These traces narrow the pacing investigation toward prevention/healing horizon and enemy sustain. They do not show that replacing support with damage would preserve survival, shorten the whole fight, or improve the full cohort. Soot's setup and detonation choices remain part of the recorded sequence; no isolated causal coefficient is claimed.

The original full-500 normal mean remains **13.238 rounds, MISS** against 8–12. All three registered S5 design packages remain retained; the broad cooldown regression and Mark-strike stay rejected. No fourth package or held-out observation is introduced. Current production rules retain the selected OFF8250, fallback180/45 and six-gate closure in [audit](../../s5-selected/audit.json).
