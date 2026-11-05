# Event choreography · T3

Primary-session implementation after helper shutdown; the effects helpers wrote no code.

1. Each ability has five authored timing beats and a color/shape/motif recipe.
2. The presenter accepts only resolved events, never a Battle or rules engine reference.
3. HP/status snapshots apply at impact, with strict sequence IDs and no duplicate application.
4. Passive and KO follow-ups are event-derived visual-only plans; rules effects apply once.
5. Pause/skip/fast/speed/reduced motion preserve ordering; the real-core gallery tests every action.

39 focused web cases pass (31 gallery fixtures plus 8 sequencing/boundary checks).
Web typecheck passes. A test-only source inspection initially used a URL remapped by
jsdom; corrected to the actual repository path, with the same boundary assertion.

Routine anticipation 250–400ms. Ultimates use 850–1000ms anticipation and about 1.9–2.1s
for their main chain, plus any passive/KO follow-ups. Dangerous enemy casts use a longer
telegraph. `soundCue` is a data slot only: no sound is claimed. No audio assets were added.
The scene interprets colors/shapes/motifs; screenshots and visual quality belong to later
running-build proof. Status counters and committed intents remain DOM-readable in calm mode.
