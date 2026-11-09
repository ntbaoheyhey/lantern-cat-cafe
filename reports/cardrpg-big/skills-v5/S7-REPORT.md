# S7 — skill and combo explanations

Runtime `5a709205e`, stacked on S4 draft #412. Combat rules are unchanged from S4.

Collection shows all 48 skill descriptions, target shapes and each companion’s combo role. Prepare shows partner hints; Result names the most frequent reaction. The eight plain-English keywords retain cafe subtitles. The fallback status strip clears the sidebar at all three desktop sizes.

Six source gates PASS: typecheck, lint, 1,785 web tests, 1,260 rules tests (+2 expected failures/11 skips), build; full E2E 420/421, then the one idle-clock failure passed in isolation on identical source. Original logs retained. Typecheck attempt 1 needed union narrowing; the targeted Prepare harness initially used an immutable replay and was corrected to a practice fixture.

Targeted UI PASS at 1280×720, 1440×900 and 1024×600: 12 cats/48 descriptions/eight keywords, keyboard glossary, preparation selection, named Result reaction and OFF hiding. No recorded overflow, uncaught errors or remote requests. Combo text contrast 10.3748:1; fallback contrast 14.2011:1. Existing representative captures were visually reviewed. Fallback captures verify the static shell only; renderer readiness and human comprehension are not claimed.

Artifact 20,958,952 bytes, SHA `bca56f23612de27ec61b463b72956b522d5edd6ccdcc9f09b238fbe45cc26235`; source manifest and receipt are in `s7/build/`. The once-only last-artifact pack remains S6 work.

Source-bound closure `s7/audit.json` PASS. Every production-rules byte equals S4, so its measured legacy 8,250-route digest and fallback 180-battle/45-route hashes are reused without repeating battles. Baseline-v1 and all 13 historical sims remain exact; no B-owned/protected edits. Finder .DS_Store external drift remains disclosed and uncommitted; both unrelated JSON leftovers remain unchanged.

S5 TRAIN baseline cohorts continue from saved checkpoints; all three isolated trial decisions remain REJECTED. Acceptance 20001–20500 is UNUSED. S5/S8/S6 gameplay, cadence, startup and human-readability gates remain open.
