# C2 decisions

## Start
- Preserve Lane C e55b8c085 and all C0–C11 work; no reset or salvage commit needed: tracked/untracked status was clean before STOP-C.
- Local STOP-C remains as the handover signal. Ignore local stop/approval controls in git.
- Existing Lane C Vite on 5970 is the only listener in C2's range; stop only that verified owned server before full E2E.
- Four-unit rules, art and economy changes will be measured separately from this baseline.
- No approval for V3 inferred from this task. Continue independent queued cards while the user reviews pilots.

## B1
- A6 defaults to four slots; encounter snapshots retain a formation version for deterministic legacy replay. All new modes enable C2.
- Front/rear capacity is two each. Existing row bonuses remain at rear cover 0.90, row/area damage 0.60, splash 0.40 in FORMATION_C2; no unmeasured balance tuning in B1.
- PNG/PSD source art stays outside git. Only review derivatives and compact runtime atlases belong in the repository.

## V0–V2
- Map authored clip time to existing rules contact; do not alter gameplay for VFX.
- Prewarm texture atlas and mask faces/health once per frame.
- Original tool output resolution is disclosed; 2048px keys are archival resamples.
- Ship only three pilots before approval; 86 other presentation identities are audited, not all painted.

## B3 — what made the old comparisons disagree
- Lane C's `C11-SESSION-NOTES.md` records that its real driver did not auto-equip earned gear; its simulator did. The UI also sometimes followed an affordable fallback before the advisor finished; the simulator always used completed advice. Those runs were different policies, not a controlled timing comparison.
- The old simulator used a separate action-log duration estimator, a fixed welcome-draw seed, its own claim sweeps and route-start overhead. C2 replaces those approximations with one seeded policy and the actual `DepthModel` presentation timelines. Four-unit C2 balance is a new cohort; do not attribute its improvement to clock repair alone.
- Compare exact setups, action choices, HP/results and currency/XP at common actions, plus wall-time aggregate differences. Record a missing first loss as censored at 30 minutes. Do not average it as zero or claim the 12–20-minute target passes.

## B4b research before economy changes — 12 November
This is preparation during the read-only B3 baseline; no economy values are changed yet. Treat published odds as examples of clear disclosure, not proof that commercial monetization rates suit this game. Sources were accessed 12 November 2026.

| Source | Evidence and consequence for C2 |
|---|---|
| [HoYoverse, Genshin Wish guarantee](https://support.hoyoverse.com/hc/en-us/articles/50333940684953-How-does-the-Wish-guarantee-system-work) | Distinguishes a 90-wish rarity guarantee from the featured-character guarantee. Display those separately; never label a rarity pity as a specific-item promise. |
| [HoYoverse, Honkai Star Rail Warp odds](https://support.hoyoverse.com/hc/en-us/articles/50913710696217-How-does-the-pity-system-work-for-different-banners-and-reruns) | Publishes 0.600% base versus 1.600% consolidated for character banners, 90 hard pity; Light Cones differ. C2 needs current next-draw odds, banner-specific counters and hard cap. |
| [Japan CESA, 2016 operating guideline announcement](https://www.cesa.or.jp/information/info6/000993/release20160427.html) | Industry self-regulation calls for listing items and their probabilities. Keep this distinct from a universal statutory odds-disclosure law. |
| [Japan Consumer Affairs Agency, card-combination Q&A](https://www.caa.go.jp/policies/policy/representation/fair_labeling/faq/card) | Explains the prohibited paid complete-gacha/card-combination mechanism and misleading-representation framework. C2 collection bonuses must not be described as a random paid completion prize. |
| [China Ministry of Culture notice, 2016 No.32, official repost](https://www.cac.gov.cn/2016-12/06/c_1120060575.htm) | Historical notice requires names/content and draw/synthesis probabilities, public results and records. Use explicit per-source rates and deterministic logs; this reference is not a certification of current market launch compliance. |
| [Korea MCST, probability disclosure effective 22 March 2024](https://www.mcst.go.kr/site/s_notice/press/pressView.jsp?pSeq=20938) | Official announcement of mandatory probability-item disclosure. Show an accessible Odds control beside every source, including crafting if any outcome is random. |
| [Xiao et al., Gaming the system (2021)](https://www.cambridge.org/core/journals/behavioural-public-policy/article/gaming-the-system-suboptimal-compliance-with-loot-box-probability-disclosure-regulations-in-china/B2642E2F8B7164236E5477D58D2B26DE) | Observed disclosures could be difficult to find or understand. One local, keyboard-accessible popover should use the exact live rule table; avoid a remote legal page as the only disclosure. |
| [Xiao et al., Opening Pandora’s Loot Box (2022/2023)](https://link.springer.com/article/10.1007/s10899-022-10148-0) | Examines player views of disclosure and pity; reported behavior does not establish that disclosure alone prevents harm. Retain bounded guarantees and useful duplicate conversion, and avoid spending prompts. |
| [Xiao et al., What are the odds? (2023)](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0286681) | Audits weak compliance with voluntary disclosure. Test the displayed probabilities against actual transitions, including soft/hard pity and collection protection. |

Acceptance targets remain the coordinator's: casual30min/day median first Epic gear day1–2, median first Legendary gear day10–16; heavy per-hour progress ≤3× casual; no tested individual item >12 percentage-point win-rate effect; soft-currency out/in0.8–1.1; visible recruit hard cap; useful duplicates. Measure 30days × casual30min/regular60min/heavy180min ×200seeds. Report currency ratios separately, gross creation before salvage, and actual net inventory. CHAIN's cosmetic treasures stay combat-neutral; no client inventory is authority to mint tradable assets.

Research verification: the nine linked publisher/government/association pages were opened directly on 12 November. The two journal DOI redirects failed in the browser tool; the publisher article pages succeeded and are linked above. The historical China notice and Japan industry guidance are described as such. Commercial published odds inform disclosure design; the day-to-rarity targets remain C2 design choices.

B3 metric definition before tuning: normal-win HP includes only played ordinary battles, excluding elite encounters, tutorial battles and earned skips. Skipped encounters still count as progression wins. Comparison recomputes statistics from the retained encounter traces; raw runs are not overwritten. In-progress browser traces do not count as completed seeds.
