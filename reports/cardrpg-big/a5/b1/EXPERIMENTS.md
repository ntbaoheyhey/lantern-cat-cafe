# B1 TRAIN experiment ledger

All experiments use TRAIN1–50; the31 original residuals were chosen from the already-contaminated A4 map. No experiment here is fresh acceptance. Production combat remains A4; none of these candidates is adopted.

| Attempt / candidate | Cells | Worst paired gain pp | Cells above12pp | Before / after saturation | Status |
|---|---:|---:|---:|---:|---|
| [candidates-01](candidates-01/results.json) / baseline | 31 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-01](candidates-01/results.json) / smooth | 31 | 88 | 29 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-01](candidates-01/results.json) / distributed | 31 | 90 | 27 | 0 / 2 | DIAGNOSTIC; not adopted |
| [candidates-01](candidates-01/results.json) / combined | 31 | 90 | 27 | 0 / 2 | DIAGNOSTIC; not adopted |
| [candidates-02](candidates-02/results.json) / baseline | 31 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-02](candidates-02/results.json) / latched | 31 | 88 | 30 | 0 / 5 | DIAGNOSTIC; not adopted |
| [candidates-02](candidates-02/results.json) / partial-closing | 31 | 46 | 15 | 0 / 18 | DIAGNOSTIC; not adopted |
| [candidates-02](candidates-02/results.json) / latched-partial | 31 | 50 | 31 | 0 / 5 | DIAGNOSTIC; not adopted |
| [candidates-03](candidates-03/results.json) / baseline | 31 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-03](candidates-03/results.json) / reply-half | 31 | 10 | 0 | 25 / 30 | DIAGNOSTIC; not adopted |
| [candidates-03](candidates-03/results.json) / reply-full | 31 | 8 | 0 | 30 / 31 | DIAGNOSTIC; not adopted |
| [candidates-03](candidates-03/results.json) / reply-partial | 31 | 4 | 0 | 31 / 31 | DIAGNOSTIC; not adopted |
| [candidates-04](candidates-04/results.json) / baseline | 31 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-04](candidates-04/results.json) / reply-015 | 31 | 40 | 2 | 20 / 20 | DIAGNOSTIC; not adopted |
| [candidates-04](candidates-04/results.json) / reply-030 | 31 | 8 | 0 | 20 / 24 | DIAGNOSTIC; not adopted |
| [candidates-04](candidates-04/results.json) / reply-half-pressure115 | 31 | 22 | 4 | 4 / 18 | DIAGNOSTIC; not adopted |
| [candidates-04](candidates-04/results.json) / reply-half-pressure130 | 31 | 52 | 18 | 0 / 0 | DIAGNOSTIC; not adopted |
| [candidates-05](candidates-05/results.json) / baseline | 31 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-05](candidates-05/results.json) / aware-distributed | 31 | 6 | 0 | 24 / 24 | DIAGNOSTIC; not adopted |
| [candidates-05](candidates-05/results.json) / aware-distributed-110 | 31 | 40 | 15 | 0 / 4 | DIAGNOSTIC; not adopted |
| [candidates-05](candidates-05/results.json) / aware-distributed-115 | 31 | 34 | 4 | 0 / 11 | DIAGNOSTIC; not adopted |
| [targeting-01](targeting-01/results.json) / latched-control | 33 | 88 | 30 | 0 / 5 | DIAGNOSTIC; not adopted |
| [targeting-01](targeting-01/results.json) / front-weight4 | 33 | 32 | 22 | 0 / 11 | DIAGNOSTIC; not adopted |
| [targeting-01](targeting-01/results.json) / front-weight2 | 33 | 40 | 7 | 4 / 18 | DIAGNOSTIC; not adopted |
| [targeting-01](targeting-01/results.json) / A4-reused | 33 | 88 | 30 | 0 / 4 | DIAGNOSTIC; not adopted |

Saturation above means>=95%wins in that arm; a tiny paired gain caused by both arms always winning does not close balance. Original failed transform/observer harness attempts remain beside each result. The original train500 component ablation stays in [B1-ROOT-CAUSE](../B1-ROOT-CAUSE.md).

| Expanded attempt / candidate | Fourth-slot cells | Worst gain pp | Above12pp | Tier steps>=2pp /24 | Reversals | Cat range | Crew advantage pp |
|---|---:|---:|---:|---:|---:|---:|---:|
| [expanded-01](expanded-01/summary.json) / aware-latched | 384 | 48.00 | 47 | 21 | 0 | 53.21–87.52% | 31.333333333333332 |
| [expanded-01](expanded-01/summary.json) / aware-distributed | 384 | 38.00 | 29 | 14 | 1 | 67.47–95.50% | 20.0 |
| [expanded-02](expanded-02/summary.json) / smooth-aware-latched | 384 | 56.00 | 61 | 19 | 1 | 55.60–88.44% | 28.0 |
| [expanded-02](expanded-02/summary.json) / smooth-aware-distributed | 384 | 32.00 | 30 | 17 | 1 | 68.48–96.08% | 21.333333333333332 |

The expanded matrix exposed failures outside the original31cells. Complete tiers/bands/farming/fourth-slot/set/team receipts are retained; these are50seed diagnostics, not the required500seed gates. Elite diversity and bare2304cases remain pending.

Expanded02 worst cell: Bellsteel Legendary outfit/Mochi/chapter2,21/50→49/50. Main-only+42pp, affixes+6pp, unique+2pp, set4+0pp; full+56pp. First changed action is round6 attack→Defend; the losing Mochi takes316HP damage with238HP. Before that action Soot/Clover have558/458HP. See [paired replay](expanded-02/worst-trace/replay.json).

Targeting01 tests whether hard front-only basic attacks concentrate survival responsibility on one cat. It preserves the original automatic policy, gear, boss stats and draws; only basic target tickets change, with already-tested phase latching. Weights4/2 reduce worst gains to32/40pp but still miss22/7cells; the2-ticket candidate also saturates18after arms. Neither is a solution.

Pressure01 is registered separately before sampling. It preserves the reference1front/2rear three-round attack budget while redistributing the signature into basic turns. It is an isolated causal test, not a difficulty or gate change. Results will be appended after the registered run, including every miss.

Pressure01 complete: weight2/sig125 worst32pp,8/33misses; weight2/sig100 worst26pp,5/33misses; weight4/sig125 worst26pp,12/33misses. Neither weight2candidate has a>=95% arm. Source/stats/fixtures remain unchanged. [Pressure500](pressure-500/REGISTERED-METHOD.md) advances the same two weight2candidates toTRAIN1–500, preserving every original50sample prefix before further tuning; not fresh acceptance.

Pressure500 complete: unchanged weight2/sig125 7/33misses,worst23.2pp; weight2/sig100 2/33misses,worst15.6pp. Full500 component traces retained. Expanded03 reuses weight2/sig100 exactly: 50/384fourth-slot misses,worst38pp,24/24route-tier steps>=2pp/0reversals,33/33bands. Cats45.25–78.40%,oldsetaggregate82–90.75%,selectedcrewadvantage37.33pp. REJECTED for adoption; the original33cells did not cover the new failures. Fresh acceptance remains unused. See [expanded03](expanded-03/summary.json).

Graded01/02 complete: basic46/384piece misses/worst32pp, wide9/worst18pp with119afterarms>=95%, conservedbudget59/worst28pp. Original AI/gear preserved. Cats43.70–76.25% /54.17–86.62% /34.74–75.41%; selectedcrew38/33.33/54pp. All rejected; all33band spreads preserved and tier24/23/23of24, zero reversals. [Graded01](graded-01/summary.json) / [graded02](graded-02/summary.json) retain exact original matched cells and chapter display correlations (none >=.6). The pure damage-distribution hypothesis does not close balance.

[Response03](response-03/REGISTERED-METHOD.md) is registered before sampling: same conserved-budget combat plus existing bounded enemy-response preview weights.30/.50, full unchanged TRAINmatrix. StatusPENDING; no production adoption/fresh acceptance.
