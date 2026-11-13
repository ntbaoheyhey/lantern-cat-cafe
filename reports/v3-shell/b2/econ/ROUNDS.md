# Economy tuning rounds

Each round is measured across all 18 scenarios with 40 token seeds. Native gear banks are separately hashed. Historical rounds retain their original model, source records and scores.

## Round 1 — prices alone

40 unique configs × 40 seeds × 18 scenarios. Best score recorded in source.

Price-only search cuts Star surplus to 1.41–2.23 but cannot meet 0.9–1.1. Low-demand/bot stockpiles dominate. Cosmetic costs high enough to absorb every grant risk blocking purchases. Next add a bounded Star bank that pauses new grants without deleting old stock, plus native progression diagnostics.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.5 | 2 |
| policy.rewards.seasonRankMax | 6 | 2 |
| policy.spool.weeklyNetCap | 12 | 8 |
| policy.spool.skinCost | 5 | 4 |
| policy.fusion.legendary.yarn | 20 | 23 |
| policy.seal.feeBp | 1000 | 500 |
| sinks.polish.yarn.0 | 4 | 8 |
| sinks.polish.yarn.1 | 8 | 13 |
| sinks.polish.starThread.0 | 1 | 2 |
| sinks.polish.starThread.1 | 2 | 4 |
| sinks.decor.yarn | 4 | 2 |
| sinks.decor.starThread | 2 | 7 |
| sinks.display.yarn | 3 | 2 |
| sinks.display.starThread | 1 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.117 | 1.850 | 15 / 11 | 0.969 |
| casual-heavy-d0.5-b0.2 | 1.113 | 2.010 | 15 / 11 | 0.955 |
| casual-heavy-d0.5-b0.35 | 1.129 | 2.231 | 15 / 11 | 0.929 |
| casual-heavy-d1-b0.1 | 1.218 | 1.761 | 15 / 11 | 0.959 |
| casual-heavy-d1-b0.2 | 1.253 | 1.855 | 15 / 11 | 0.976 |
| casual-heavy-d1-b0.35 | 1.308 | 1.987 | 15 / 11 | 0.950 |
| balanced-d0.5-b0.1 | 1.171 | 1.635 | 15 / 11 | 0.943 |
| balanced-d0.5-b0.2 | 1.156 | 1.784 | 15 / 11 | 0.939 |
| balanced-d0.5-b0.35 | 1.158 | 2.033 | 15 / 11 | 0.942 |
| balanced-d1-b0.1 | 1.264 | 1.556 | 15 / 11 | 0.945 |
| balanced-d1-b0.2 | 1.290 | 1.657 | 15 / 11 | 0.951 |
| balanced-d1-b0.35 | 1.325 | 1.803 | 15 / 11 | 0.958 |
| heavy-heavy-d0.5-b0.1 | 1.243 | 1.477 | 15.5 / 11 | 0.958 |
| heavy-heavy-d0.5-b0.2 | 1.218 | 1.602 | 15 / 11 | 0.947 |
| heavy-heavy-d0.5-b0.35 | 1.201 | 1.831 | 15 / 11 | 0.935 |
| heavy-heavy-d1-b0.1 | 1.323 | 1.409 | 15.5 / 11 | 0.953 |
| heavy-heavy-d1-b0.2 | 1.337 | 1.498 | 15 / 11 | 0.961 |
| heavy-heavy-d1-b0.35 | 1.352 | 1.636 | 15 / 11 | 0.970 |

## Round 2 — Bounded weekly grants

40 unique configs × 40 seeds × 18 scenarios. Best score 13.4537.

The bank cap reduces Star accumulation substantially, but a capped bank must still afford every recipe. Escalating showcase Thread costs force the bank too high; next test a fixed Thread fitting cost, low-cap sampling, and native recorded item quality. Bot efficiency and late guaranteed tailoring remain separate misses.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.5 | 1.65 |
| policy.rewards.seasonRankMax | 6 | 3 |
| policy.rewards.starThreadBankCap | 6 | 9 |
| policy.fusion.legendary.yarn | 20 | 12 |
| sinks.polish.yarn.0 | 4 | 3 |
| sinks.polish.starThread.0 | 1 | 3 |
| sinks.polish.starThread.1 | 2 | 5 |
| sinks.decor.starThread | 2 | 5 |
| sinks.display.yarn | 3 | 2 |
| sinks.display.starThread | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.062 | 1.266 | 15 / 11 | 0.946 |
| casual-heavy-d0.5-b0.2 | 1.146 | 1.304 | 15 / 11 | 0.967 |
| casual-heavy-d0.5-b0.35 | 1.207 | 1.364 | 15 / 11 | 0.917 |
| casual-heavy-d1-b0.1 | 1.239 | 1.226 | 15 / 11 | 0.945 |
| casual-heavy-d1-b0.2 | 1.299 | 1.247 | 15 / 11 | 0.972 |
| casual-heavy-d1-b0.35 | 1.341 | 1.283 | 15 / 11 | 0.936 |
| balanced-d0.5-b0.1 | 1.074 | 1.203 | 15 / 11 | 0.943 |
| balanced-d0.5-b0.2 | 1.160 | 1.234 | 15 / 11 | 0.939 |
| balanced-d0.5-b0.35 | 1.218 | 1.292 | 15 / 11 | 0.948 |
| balanced-d1-b0.1 | 1.275 | 1.169 | 15 / 11 | 0.948 |
| balanced-d1-b0.2 | 1.332 | 1.194 | 15 / 11 | 0.951 |
| balanced-d1-b0.35 | 1.371 | 1.234 | 15 / 11 | 0.957 |
| heavy-heavy-d0.5-b0.1 | 1.087 | 1.153 | 15.5 / 11 | 0.948 |
| heavy-heavy-d0.5-b0.2 | 1.157 | 1.180 | 15 / 11 | 0.954 |
| heavy-heavy-d0.5-b0.35 | 1.227 | 1.230 | 15 / 11 | 0.953 |
| heavy-heavy-d1-b0.1 | 1.316 | 1.128 | 15.5 / 11 | 0.969 |
| heavy-heavy-d1-b0.2 | 1.362 | 1.149 | 15 / 11 | 0.956 |
| heavy-heavy-d1-b0.35 | 1.394 | 1.187 | 15 / 11 | 0.951 |

## Round 3 — Recorded quality and valid low banks

40 unique configs × 40 seeds × 18 scenarios. Best score 9.2572.

Use actual native item rolls and completed-route rewards; eliminate historical quality reconstruction for this bank. Fixed Thread cost per showcase shelf permits smaller banks. Guaranteed tailoring remains the progression bottleneck in this bank. Next use the separately measured faster v3 recipe and allow one-Thread recipes so the lowest bank can afford every action.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.65 | 1.55 |
| policy.rewards.chapterSpool | 1 | 2 |
| policy.rewards.seasonRankMax | 3 | 5 |
| policy.rewards.starThreadBankCap | 9 | 2 |
| policy.spool.skinCost | 5 | 2 |
| policy.fusion.legendary.yarn | 12 | 15 |
| policy.seal.feeBp | 1000 | 1200 |
| sinks.polish.yarn.0 | 3 | 2 |
| sinks.polish.yarn.1 | 8 | 3 |
| sinks.polish.starThread.0 | 3 | 1 |
| sinks.polish.starThread.1 | 5 | 2 |
| sinks.decor.yarn | 4 | 8 |
| sinks.decor.starThread | 5 | 2 |
| sinks.display.yarn | 2 | 4 |
| sinks.display.starThread | 2 | 1 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.019 | 1.141 | 15 / 11 | 0.914 |
| casual-heavy-d0.5-b0.2 | 1.114 | 1.155 | 15 / 11 | 0.935 |
| casual-heavy-d0.5-b0.35 | 1.208 | 1.179 | 15 / 11 | 0.907 |
| casual-heavy-d1-b0.1 | 1.251 | 1.104 | 15 / 11 | 0.933 |
| casual-heavy-d1-b0.2 | 1.303 | 1.112 | 15 / 11 | 0.933 |
| casual-heavy-d1-b0.35 | 1.352 | 1.131 | 15 / 11 | 0.926 |
| balanced-d0.5-b0.1 | 1.019 | 1.101 | 15 / 11 | 0.917 |
| balanced-d0.5-b0.2 | 1.106 | 1.114 | 15 / 11 | 0.927 |
| balanced-d0.5-b0.35 | 1.203 | 1.138 | 15 / 11 | 0.910 |
| balanced-d1-b0.1 | 1.262 | 1.081 | 15 / 11 | 0.918 |
| balanced-d1-b0.2 | 1.332 | 1.090 | 15 / 11 | 0.926 |
| balanced-d1-b0.35 | 1.372 | 1.105 | 15 / 11 | 0.919 |
| heavy-heavy-d0.5-b0.1 | 1.015 | 1.076 | 15 / 11 | 0.907 |
| heavy-heavy-d0.5-b0.2 | 1.092 | 1.086 | 15 / 11 | 0.923 |
| heavy-heavy-d0.5-b0.35 | 1.191 | 1.106 | 15 / 11 | 0.915 |
| heavy-heavy-d1-b0.1 | 1.259 | 1.066 | 15 / 11 | 0.921 |
| heavy-heavy-d1-b0.2 | 1.353 | 1.075 | 15 / 11 | 0.924 |
| heavy-heavy-d1-b0.35 | 1.388 | 1.088 | 15 / 11 | 0.916 |

## Round 4 — One-Thread reserve and faster tailoring

40 unique configs × 40 seeds × 18 scenarios. Best score 6.6147.

The native progression pilot now meets casual/heavy median day targets, and burn medians pass. A one-Thread bank still has up to 16.5% surplus because expensive polish competes for limited wallets. Next lower guaranteed-polish and decor YARN ranges. The config key-order recovery is verified against every original worker hash; this round had two global passes, with no local refinement claimed.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.55 | 1.8 |
| policy.rewards.starThreadBankCap | 2 | 1 |
| policy.spool.skinCost | 2 | 5 |
| policy.spool.weeklyNetCap | 12 | 7 |
| policy.fusion.legendary.yarn | 15 | 21 |
| policy.fusion.legendary.starThread | 2 | 1 |
| policy.seal.feeBp | 1200 | 1000 |
| sinks.polish.yarn.0 | 2 | 6 |
| sinks.polish.yarn.1 | 3 | 10 |
| sinks.polish.starThread.1 | 2 | 1 |
| sinks.decor.yarn | 8 | 3 |
| sinks.decor.starThread | 2 | 1 |
| sinks.display.yarn | 4 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.056 | 1.133 | 13 / 8.5 | 0.933 |
| casual-heavy-d0.5-b0.2 | 1.135 | 1.145 | 12.5 / 9 | 0.931 |
| casual-heavy-d0.5-b0.35 | 1.194 | 1.165 | 12 / 8.5 | 0.923 |
| casual-heavy-d1-b0.1 | 1.221 | 1.110 | 13 / 8.5 | 0.936 |
| casual-heavy-d1-b0.2 | 1.278 | 1.120 | 12.5 / 9 | 0.926 |
| casual-heavy-d1-b0.35 | 1.312 | 1.134 | 12 / 8.5 | 0.932 |
| balanced-d0.5-b0.1 | 1.068 | 1.105 | 12.5 / 8.5 | 0.933 |
| balanced-d0.5-b0.2 | 1.145 | 1.115 | 12.5 / 9 | 0.929 |
| balanced-d0.5-b0.35 | 1.199 | 1.135 | 12.25 / 8 | 0.925 |
| balanced-d1-b0.1 | 1.238 | 1.089 | 12.5 / 8.5 | 0.940 |
| balanced-d1-b0.2 | 1.299 | 1.097 | 12.5 / 9 | 0.945 |
| balanced-d1-b0.35 | 1.336 | 1.110 | 12.25 / 8 | 0.929 |
| heavy-heavy-d0.5-b0.1 | 1.067 | 1.084 | 12 / 9 | 0.934 |
| heavy-heavy-d0.5-b0.2 | 1.137 | 1.092 | 12 / 8.25 | 0.925 |
| heavy-heavy-d0.5-b0.35 | 1.200 | 1.110 | 12 / 8 | 0.930 |
| heavy-heavy-d1-b0.1 | 1.240 | 1.071 | 12 / 9 | 0.939 |
| heavy-heavy-d1-b0.2 | 1.320 | 1.077 | 12 / 8.25 | 0.948 |
| heavy-heavy-d1-b0.35 | 1.356 | 1.091 | 12 / 8 | 0.945 |

## Round 5 — Lower priced one-Thread crafts

40 unique configs × 40 seeds × 18 scenarios. Best score 5.6797.

Cheaper polish reduces unspent Thread, but finite collections and churn still leave reserves above the target in some scenarios. Progression remains in range. Next inspect actual reward eligibility and voluntary spending timing; lowering prices alone cannot fix repetitive farming efficiency.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.chapterSpool | 2 | 1 |
| policy.rewards.seasonRankMax | 5 | 1 |
| policy.rewards.starThreadBankCap | 1 | 2 |
| policy.spool.skinCost | 5 | 2 |
| policy.spool.weeklyNetCap | 7 | 10 |
| policy.fusion.legendary.yarn | 21 | 7 |
| policy.fusion.legendary.starThread | 1 | 2 |
| policy.seal.feeBp | 1000 | 1100 |
| sinks.polish.yarn.0 | 6 | 3 |
| sinks.polish.yarn.1 | 10 | 3 |
| sinks.polish.starThread.1 | 1 | 2 |
| sinks.decor.yarn | 3 | 2 |
| sinks.decor.starThread | 1 | 2 |
| sinks.display.starThread | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.032 | 1.094 | 13 / 8.5 | 0.925 |
| casual-heavy-d0.5-b0.2 | 1.113 | 1.104 | 12.5 / 9 | 0.950 |
| casual-heavy-d0.5-b0.35 | 1.184 | 1.122 | 12 / 8.5 | 0.901 |
| casual-heavy-d1-b0.1 | 1.256 | 1.072 | 13 / 8.5 | 0.920 |
| casual-heavy-d1-b0.2 | 1.303 | 1.079 | 12.5 / 9 | 0.923 |
| casual-heavy-d1-b0.35 | 1.334 | 1.091 | 12 / 8.5 | 0.917 |
| balanced-d0.5-b0.1 | 1.042 | 1.069 | 12.5 / 8.5 | 0.927 |
| balanced-d0.5-b0.2 | 1.122 | 1.078 | 12.5 / 9 | 0.927 |
| balanced-d0.5-b0.35 | 1.195 | 1.095 | 12.25 / 8 | 0.917 |
| balanced-d1-b0.1 | 1.272 | 1.054 | 12.5 / 8.5 | 0.905 |
| balanced-d1-b0.2 | 1.331 | 1.061 | 12.5 / 9 | 0.936 |
| balanced-d1-b0.35 | 1.363 | 1.072 | 12.25 / 8 | 0.927 |
| heavy-heavy-d0.5-b0.1 | 1.040 | 1.051 | 12 / 9 | 0.929 |
| heavy-heavy-d0.5-b0.2 | 1.106 | 1.058 | 12 / 8.25 | 0.921 |
| heavy-heavy-d0.5-b0.35 | 1.184 | 1.073 | 12 / 8 | 0.906 |
| heavy-heavy-d1-b0.1 | 1.304 | 1.040 | 12 / 9 | 0.927 |
| heavy-heavy-d1-b0.2 | 1.361 | 1.046 | 12 / 8.25 | 0.934 |
| heavy-heavy-d1-b0.35 | 1.385 | 1.057 | 12 / 8 | 0.919 |

## Round 6 — Affordable one-Thread reserve

40 unique configs × 40 seeds × 18 scenarios. Best score 5.5896.

All median and p90 targets except bot efficiency pass in the 40-seed search. The worst Thread ratio is 1.0966, very close to 1.10, so next broaden the reward split and test lower fusion costs without raising the bank. Bots stop at the reward cap: no unused AFK hours are counted. No final acceptance is claimed from this pilot.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.8 | 1.7 |
| policy.rewards.chapterSpool | 1 | 0 |
| policy.rewards.seasonRankMax | 1 | 4 |
| policy.rewards.starThreadBankCap | 2 | 1 |
| policy.spool.skinCost | 2 | 7 |
| policy.spool.weeklyNetCap | 10 | 8 |
| policy.fusion.legendary.yarn | 7 | 9 |
| policy.fusion.legendary.starThread | 2 | 1 |
| policy.seal.feeBp | 1100 | 500 |
| sinks.polish.yarn.0 | 3 | 1 |
| sinks.polish.yarn.1 | 3 | 2 |
| sinks.polish.starThread.1 | 2 | 1 |
| sinks.decor.yarn | 2 | 1 |
| sinks.decor.starThread | 2 | 1 |
| sinks.display.starThread | 2 | 1 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.072 | 1.070 | 13 / 8.5 | 0.912 |
| casual-heavy-d0.5-b0.2 | 1.077 | 1.080 | 12.5 / 9 | 0.929 |
| casual-heavy-d0.5-b0.35 | 1.093 | 1.097 | 12 / 8.5 | 0.913 |
| casual-heavy-d1-b0.1 | 1.203 | 1.056 | 13 / 8.5 | 0.930 |
| casual-heavy-d1-b0.2 | 1.258 | 1.062 | 12.5 / 9 | 0.936 |
| casual-heavy-d1-b0.35 | 1.310 | 1.072 | 12 / 8.5 | 0.911 |
| balanced-d0.5-b0.1 | 1.114 | 1.053 | 12.5 / 8.5 | 0.920 |
| balanced-d0.5-b0.2 | 1.115 | 1.060 | 12.5 / 9 | 0.923 |
| balanced-d0.5-b0.35 | 1.111 | 1.073 | 12.25 / 8 | 0.909 |
| balanced-d1-b0.1 | 1.215 | 1.047 | 12.5 / 8.5 | 0.926 |
| balanced-d1-b0.2 | 1.266 | 1.053 | 12.5 / 9 | 0.921 |
| balanced-d1-b0.35 | 1.329 | 1.061 | 12.25 / 8 | 0.919 |
| heavy-heavy-d0.5-b0.1 | 1.171 | 1.039 | 12 / 9 | 0.919 |
| heavy-heavy-d0.5-b0.2 | 1.156 | 1.045 | 12 / 8.25 | 0.930 |
| heavy-heavy-d0.5-b0.35 | 1.139 | 1.056 | 12 / 8 | 0.916 |
| heavy-heavy-d1-b0.1 | 1.215 | 1.040 | 12 / 9 | 0.923 |
| heavy-heavy-d1-b0.2 | 1.282 | 1.044 | 12 / 8.25 | 0.933 |
| heavy-heavy-d1-b0.35 | 1.332 | 1.052 | 12 / 8 | 0.920 |

## Round 7 — Reward split and cheaper quality steps

40 unique configs × 40 seeds × 18 scenarios. Best score 5.6667.

29 of 40 candidates satisfy burn, Thread and progression targets in the pilot. The best has Thread 1.0392–1.0935 but last-quarter burn can fall to 0.9861 even while annual burn passes. Next stress seal/fusion prices and low withdrawal caps; retain annual and last-quarter results separately. Higher weekly rewards did not solve bot efficiency.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.7 | 2.3 |
| policy.rewards.chapterSpool | 0 | 1 |
| policy.rewards.seasonRankMax | 4 | 3 |
| policy.spool.skinCost | 7 | 3 |
| policy.spool.weeklyNetCap | 8 | 7 |
| policy.fusion.legendary.yarn | 9 | 14 |
| policy.seal.feeBp | 500 | 1200 |
| sinks.polish.yarn.1 | 2 | 1 |
| sinks.decor.yarn | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.055 | 1.071 | 13 / 8.5 | 0.917 |
| casual-heavy-d0.5-b0.2 | 1.109 | 1.079 | 12.5 / 9 | 0.949 |
| casual-heavy-d0.5-b0.35 | 1.146 | 1.094 | 12 / 8.5 | 0.921 |
| casual-heavy-d1-b0.1 | 1.184 | 1.055 | 13 / 8.5 | 0.922 |
| casual-heavy-d1-b0.2 | 1.210 | 1.061 | 12.5 / 9 | 0.918 |
| casual-heavy-d1-b0.35 | 1.239 | 1.070 | 12 / 8.5 | 0.916 |
| balanced-d0.5-b0.1 | 1.079 | 1.052 | 12.5 / 8.5 | 0.930 |
| balanced-d0.5-b0.2 | 1.125 | 1.060 | 12.5 / 9 | 0.945 |
| balanced-d0.5-b0.35 | 1.161 | 1.072 | 12.25 / 8 | 0.920 |
| balanced-d1-b0.1 | 1.221 | 1.046 | 12.5 / 8.5 | 0.926 |
| balanced-d1-b0.2 | 1.239 | 1.051 | 12.5 / 9 | 0.936 |
| balanced-d1-b0.35 | 1.260 | 1.060 | 12.25 / 8 | 0.925 |
| heavy-heavy-d0.5-b0.1 | 1.114 | 1.039 | 12 / 9 | 0.919 |
| heavy-heavy-d0.5-b0.2 | 1.148 | 1.045 | 12 / 8.25 | 0.937 |
| heavy-heavy-d0.5-b0.35 | 1.178 | 1.057 | 12 / 8 | 0.926 |
| heavy-heavy-d1-b0.1 | 1.256 | 1.039 | 12 / 9 | 0.923 |
| heavy-heavy-d1-b0.2 | 1.265 | 1.044 | 12 / 8.25 | 0.937 |
| heavy-heavy-d1-b0.35 | 1.279 | 1.052 | 12 / 8 | 0.912 |

## Round 8 — Seal prices and withdrawal caps

40 unique configs × 40 seeds × 18 scenarios. Best score 5.5679.

With 40 native seeds, the best candidate passes T-a/b/c/d/f/g and puts Thread at 1.0285–1.0807. Annual burn reaches only 1.026 at the low end, and last-quarter burn falls to 0.9732. Bot efficiency remains 0.91–0.93; withdrawal caps do not identify automation. Next use the completed 200-seed native bank and emphasize a lower payout range with affordable real sinks.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 2.3 | 2.35 |
| policy.rewards.chapterSpool | 1 | 2 |
| policy.rewards.seasonRankMax | 3 | 4 |
| policy.spool.skinCost | 3 | 2 |
| policy.spool.weeklyNetCap | 7 | 10 |
| policy.fusion.legendary.yarn | 14 | 4 |
| sinks.polish.yarn.0 | 1 | 2 |
| sinks.polish.yarn.1 | 1 | 2 |
| sinks.decor.yarn | 2 | 3 |
| sinks.display.yarn | 2 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.026 | 1.059 | 13 / 8.5 | 0.926 |
| casual-heavy-d0.5-b0.2 | 1.087 | 1.066 | 12.5 / 9 | 0.934 |
| casual-heavy-d0.5-b0.35 | 1.134 | 1.081 | 12 / 8.5 | 0.917 |
| casual-heavy-d1-b0.1 | 1.194 | 1.047 | 13 / 8.5 | 0.924 |
| casual-heavy-d1-b0.2 | 1.222 | 1.053 | 12.5 / 9 | 0.912 |
| casual-heavy-d1-b0.35 | 1.243 | 1.062 | 12 / 8.5 | 0.905 |
| balanced-d0.5-b0.1 | 1.037 | 1.044 | 12.5 / 8.5 | 0.919 |
| balanced-d0.5-b0.2 | 1.098 | 1.050 | 12.5 / 9 | 0.917 |
| balanced-d0.5-b0.35 | 1.149 | 1.061 | 12.25 / 8 | 0.916 |
| balanced-d1-b0.1 | 1.225 | 1.037 | 12.5 / 8.5 | 0.909 |
| balanced-d1-b0.2 | 1.244 | 1.041 | 12.5 / 9 | 0.931 |
| balanced-d1-b0.35 | 1.261 | 1.049 | 12.25 / 8 | 0.917 |
| heavy-heavy-d0.5-b0.1 | 1.047 | 1.031 | 12 / 9 | 0.918 |
| heavy-heavy-d0.5-b0.2 | 1.103 | 1.037 | 12 / 8.25 | 0.923 |
| heavy-heavy-d0.5-b0.35 | 1.158 | 1.047 | 12 / 8 | 0.917 |
| heavy-heavy-d1-b0.1 | 1.243 | 1.028 | 12 / 9 | 0.917 |
| heavy-heavy-d1-b0.2 | 1.270 | 1.033 | 12 / 8.25 | 0.923 |
| heavy-heavy-d1-b0.35 | 1.279 | 1.041 | 12 / 8 | 0.918 |
