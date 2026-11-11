# C11 — story-event and treasure decisions

All nine story choices show exact run-point outcomes, per-cat HP changes and charm stack/effect before committing. Eligibility and the displayed result use the existing public resolveNode command; activation recomputes against current state. Insufficient funds and capped charms disable the action with a reason. Treasure shows its exact charm effect and still offers the70-point gift when every charm is capped, preventing the former undefined-name crash.

Three regression cases proved HP-cost choices revived a fallen cat from0 to1HP. Costs now preserve fallen cats at0 while retaining the living one-HP floor, percentages and rounding. Positive recovery still revives and caps at maximum HP. Full-health healing choices can still resolve the story and continue. This is a correctness fix, not another tuning round; all balance seeds and recorded accounts remain untouched.

Verification:56 browser checks across30 states at1280×720/1440×900, including26 exact keyboard transactions. Previews leave the whole save unchanged; accepted results equal the public command, and the decision closes. All buttons/rows/panels fit their host with no horizontal overflow, broken images or browser errors. Inspected all30 captures using six contact sheets and two full-size images; two representative images retained. Raw captures remain in /tmp/cardrpg-c-events-final. Initial contact-sheet helpers lacked Pillow/default font; ImageMagick with the installed Menlo font produced the inspected sheets without rerunning browser checks.

24 rules tests (including three formerly failing fallen-cat cases),16 component tests, workspace typecheck and lint pass. Tests cover exact nine choices, caps, shortages, stale funds, healing continuation and exhausted treasure. The session harness recognizes the new story controls. Saved passing logs were preserved across the continuation; no full-suite or new recovery-rate claim.

Static demo29,226,665bytes and weighted score7.79 unchanged; evidence remains below120MB. Designer inbox contains only its README. Continue C8/C11 with post-battle reward rank/stack clarity.
