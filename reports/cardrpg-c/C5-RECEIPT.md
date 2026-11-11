# C5 gameplay receipt — PARTIAL numeric acceptance

Three disjoint blocks consumed once:70001–70100,70101–70250,70251–70500. The ledger records every compiled rules hash and reserves seeds before simulation. No fourth tuning round. Keep round3 as the simplest fixed-budget fallback: improves normal survival tension while retaining88% of accounts with1–3losses and83.67% recovery.

Final250accounts: normal median34.50s; boss median69.16s/p9082.16s; first loss11.61min among233accounts that lose;17never lose;88%have1–3losses;398hint retries/83.67%win; normal-winHP94%. Full measurements and limitations:C5-NUMBERS.md/c5-round3.json. These are authored x1 timelines and rule-bot outcomes, not browser wall time or human play.

PASS: normal/boss duration, loss count, hint recovery. PARTIAL: first loss0.39min early; normal-winHP above55–80%; each cat has1median ultimate in fixed normal fixtures but only74.19–96.36% of fights hit1–2casts. Thirty of32tested teams are within5points with40%maximum top20cat presence; highly tied level6fixtures cannot prove the absence of a dominant team among all220possible squads.

Changes: fixed campaign enemy attack budgets independent of player upgrades; starter ultimates available immediately with35opening rage; bounded1.7sults/1.2sboss signatures; smaller later-boss endurance; advisor evaluates full-health retries. Legacy OFF behavior and deterministic replay retained. The resolved enemy action identity now drives browser and sim, including rage filled after the intent was prepared. Rounds1/2 used the older third-round approximation and are retained unchanged; their timing is not directly comparable.

Verification:40distinct touched tests plus70additional combat/status/event checks PASS; workspace typecheck/lint PASS; git diff check PASS. Integer-power assertion tolerance accounts for two attack rounding stages; same-band upgrade invariance and replay equality remain asserted. Deterministic Playwright normal/boss at1280x720 and1440x900:16–22draws,0errors,0HUD overlap; cats26–27%/boss47%canvas. All four screenshots inspected in shots/c5: faces/HP clear and boss stays right. No frame-time claim. PSD heavy processes absent during this run.

C5 is finished within its three-round limit with explicit misses. C7 first-ten-minutes work and final real-click30minute run remain queued. Designer inbox empty; only Mochi PSD pilot available.
