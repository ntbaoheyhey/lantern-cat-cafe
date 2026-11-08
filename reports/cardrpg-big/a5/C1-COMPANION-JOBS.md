# A5 C1 — companion jobs and mode-correct tooltips

Status: source, OFF and targeted browser closure PASS. This is presentation work, not balance acceptance.

Collection details, Team automatic kits and the selected Prepare card now show a short job description. Selecting another cat changes the line. These descriptions explain existing kit capabilities; they do not claim measured best-team rankings or guarantee that automatic play always selects that skill.

|Cat|Displayed job|
|---|---|
|Mochi|Shielding the crew against front-row pressure.|
|Soot|Detonating stacked Crumb trails.|
|Clover|Cleansing Scald and healing over time.|
|Panko|Returning damage when enemies hit the front row.|
|Mallow|Burning several foes through their shields.|
|Sorrel|Weakening rear attackers and sharing spare shields.|
|Biscuit|Finishing wounded foes through row cover.|
|Inkcap|Quieting healers and tangling dangerous targets.|
|Cinnamon|Rescuing a hurt ally with healing and Cozy.|
|Brioche|Building shields and lending them to an ally.|
|Velvet|Marking rear targets so the whole crew can reach them.|
|Marigold|Keeping several allies healthy over long fights.|

Team set tooltips now use the existing V4 effect descriptions when V4 is ON. OFF retains the original descriptions and has no companion-job panel. Lantern's four-member line now includes both softened Drowsy attacks and actually stopped Hush utility, matching the correction in draft394.

The [registered method](c1-specialties/METHOD.json) predates adoption. All216 paired complete battle objects match after normalizing only the exact Lantern crew description in36 events;108 OFF objects need no normalization. No rule amount, AI, saved field, equipment effect, B-owned asset or runtime dependency changes.

Typecheck, lint,1,746 web tests and1,186 rules tests pass. The first full E2E run passes420 and fails one unchanged Squad storage/network case: its clock remains at0.1s. [Original evidence and retry policy](c1-specialties/gates/e2e-original-failure/RETRY.md) remain visible. That single case passed with one worker; build passed. The original run remains420PASS/1FAIL, not421PASS.

Separate ON/OFF offline builds pass all12 cat selections, all8 set tooltips, keyboard placement, two looks and1280/1440/1024 widths. Synthetic gear is explicitly a UI fixture, not an earned-route account. THC7 and THC12 imports check currencies, day and team. These targeted captures do not consume the full last-artifact screenshot pack reserved for Z.

Every existing balance, display-correlation, cadence and startup miss remains in [A5-REPORT.md](A5-REPORT.md). No fresh acceptance seeds or complete elapsed-session engagement claim; no merge or deploy.

[Source-bound audit](c1-specialties/audit.json) verifies all receipts, source hashes, the three-file manifest, OFF165cells/8250routes, baseline-v1 and13historical sims. Minimum scoped text contrast8.028:1; all42functional captures have zero horizontal overflow. Twelve supplemental Collection captures frame the previously cropped heading/job; original images and [all corrections](c1-specialties/CORRECTIONS.md) remain. These images use reviewer dev mode. Collection, Team and Prepare samples were personally inspected across all three widths. Baseline miniature canvases are blank in some capture frames despite the loading message clearing; this copy check does not certify model readiness or renderer quality.

ON artifact20,923,141bytes/SHA78c3fba75795fac516a90e2a5ecf9a9761795231426a38f601ad65f0ccfcfb52; OFF20,923,141bytes/SHA9ecb20d7b04fd3a8669451b9bf601305429d607dcd3bebb33dcd5812fb04a023. Build inputs archived under [builds](c1-specialties/builds/); local artifacts remain `/tmp/cardrpg-a5-specialties-{on,off}/index.html`. Public demo unchanged until Z.
