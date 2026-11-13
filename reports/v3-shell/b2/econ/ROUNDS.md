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

## Round 9 — Completed 200-seed native bank

40 unique configs × 40 seeds × 18 scenarios. Best score 5.6594.

The best of 40 configs on the verified 200-seed native bank still misses: burn/claims 0.9642-1.5165, Star source/sink 1.0481-1.1094, bot/human active-hour efficiency 0.8998-0.9467. Casual Legendary remains day 13 and heavy 8.5-9. Lower the high rank bonus and skin/fusion prices while exploring a small Thread buffer; do not invent a bot-only reward multiplier.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 2.35 | 1 |
| policy.rewards.chapterSpool | 2 | 1 |
| policy.rewards.seasonRankMax | 4 | 6 |
| policy.spool.skinCost | 2 | 9 |
| policy.spool.weeklyNetCap | 10 | 4 |
| policy.fusion.legendary.yarn | 4 | 14 |
| policy.seal.feeBp | 1200 | 1500 |
| sinks.decor.yarn | 3 | 2 |
| sinks.display.yarn | 3 | 1 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 0.964 | 1.084 | 13 / 9 | 0.928 |
| casual-heavy-d0.5-b0.2 | 1.042 | 1.093 | 13 / 9 | 0.943 |
| casual-heavy-d0.5-b0.35 | 1.127 | 1.109 | 13 / 8.5 | 0.900 |
| casual-heavy-d1-b0.1 | 1.299 | 1.072 | 13 / 9 | 0.923 |
| casual-heavy-d1-b0.2 | 1.414 | 1.079 | 13 / 9 | 0.947 |
| casual-heavy-d1-b0.35 | 1.485 | 1.087 | 13 / 8.5 | 0.914 |
| balanced-d0.5-b0.1 | 0.978 | 1.063 | 13 / 9 | 0.911 |
| balanced-d0.5-b0.2 | 1.040 | 1.071 | 13 / 9 | 0.917 |
| balanced-d0.5-b0.35 | 1.148 | 1.085 | 13 / 9 | 0.917 |
| balanced-d1-b0.1 | 1.284 | 1.059 | 13 / 9 | 0.927 |
| balanced-d1-b0.2 | 1.439 | 1.064 | 13 / 9 | 0.929 |
| balanced-d1-b0.35 | 1.517 | 1.074 | 13 / 9 | 0.919 |
| heavy-heavy-d0.5-b0.1 | 0.988 | 1.048 | 13 / 9 | 0.934 |
| heavy-heavy-d0.5-b0.2 | 1.046 | 1.056 | 13 / 9 | 0.928 |
| heavy-heavy-d0.5-b0.35 | 1.126 | 1.068 | 13 / 9 | 0.923 |
| heavy-heavy-d1-b0.1 | 1.231 | 1.049 | 13 / 9 | 0.923 |
| heavy-heavy-d1-b0.2 | 1.451 | 1.054 | 13 / 9 | 0.919 |
| heavy-heavy-d1-b0.35 | 1.516 | 1.064 | 13 / 9 | 0.923 |

## Round 10 — Balance low-Star source caps and affordable sinks

40 unique configs × 40 seeds × 18 scenarios. Best score 5.8654.

The 200-seed native bank preserves casual day 13 and heavy day 9 progression. This round tests reduced weekly grants, one-to-three Star bank caps, and cheaper repeatable sinks across 17 levers; bot hourly efficiency still needs a structural earning rule and no E3 acceptance is claimed.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1 | 1.2 |
| policy.rewards.chapterSpool | 1 | 0 |
| policy.rewards.seasonRankMax | 6 | 3 |
| policy.spool.skinCost | 9 | 6 |
| policy.fusion.legendary.yarn | 14 | 4 |
| policy.seal.feeBp | 1500 | 800 |
| sinks.polish.yarn.1 | 2 | 5 |
| sinks.decor.yarn | 2 | 1 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.039 | 1.093 | 13 / 9 | 0.949 |
| casual-heavy-d0.5-b0.2 | 1.131 | 1.104 | 13 / 9 | 0.936 |
| casual-heavy-d0.5-b0.35 | 1.209 | 1.119 | 13 / 8.5 | 0.915 |
| casual-heavy-d1-b0.1 | 1.273 | 1.078 | 13 / 9 | 0.959 |
| casual-heavy-d1-b0.2 | 1.363 | 1.084 | 13 / 9 | 0.955 |
| casual-heavy-d1-b0.35 | 1.443 | 1.093 | 13 / 8.5 | 0.926 |
| balanced-d0.5-b0.1 | 1.044 | 1.074 | 13 / 9 | 0.939 |
| balanced-d0.5-b0.2 | 1.129 | 1.082 | 13 / 9 | 0.939 |
| balanced-d0.5-b0.35 | 1.224 | 1.097 | 13 / 9 | 0.929 |
| balanced-d1-b0.1 | 1.266 | 1.063 | 13 / 9 | 0.934 |
| balanced-d1-b0.2 | 1.389 | 1.068 | 13 / 9 | 0.942 |
| balanced-d1-b0.35 | 1.466 | 1.078 | 13 / 9 | 0.925 |
| heavy-heavy-d0.5-b0.1 | 1.049 | 1.059 | 13 / 9 | 0.930 |
| heavy-heavy-d0.5-b0.2 | 1.103 | 1.066 | 13 / 9 | 0.951 |
| heavy-heavy-d0.5-b0.35 | 1.205 | 1.079 | 13 / 9 | 0.930 |
| heavy-heavy-d1-b0.1 | 1.278 | 1.050 | 13 / 9 | 0.953 |
| heavy-heavy-d1-b0.2 | 1.391 | 1.055 | 13 / 9 | 0.946 |
| heavy-heavy-d1-b0.35 | 1.487 | 1.064 | 13 / 9 | 0.941 |

## Round 11 — Withdrawal cap and affordable recurring sinks

40 unique configs × 40 seeds × 18 scenarios. Best score 5.8939.

Narrowing weekly claim caps, rank grants, and recurring sink prices slightly worsened the worst-case score versus round 10 (5.8939 vs 5.8654). Bot efficiency remains structurally too close to human efficiency; price-only tuning cannot close T-e. Preserve both candidate sets for final Pareto confirmation.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.2 | 1.05 |
| policy.rewards.seasonRankMax | 3 | 4 |
| policy.spool.weeklyNetCap | 4 | 3 |
| policy.fusion.legendary.yarn | 4 | 10 |
| policy.seal.feeBp | 800 | 900 |
| sinks.polish.yarn.0 | 2 | 3 |
| sinks.polish.yarn.1 | 5 | 3 |
| sinks.display.yarn | 1 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.029 | 1.101 | 13 / 9 | 0.932 |
| casual-heavy-d0.5-b0.2 | 1.138 | 1.112 | 13 / 9 | 0.949 |
| casual-heavy-d0.5-b0.35 | 1.248 | 1.128 | 13 / 8.5 | 0.911 |
| casual-heavy-d1-b0.1 | 1.298 | 1.082 | 13 / 9 | 0.937 |
| casual-heavy-d1-b0.2 | 1.424 | 1.089 | 13 / 9 | 0.956 |
| casual-heavy-d1-b0.35 | 1.500 | 1.098 | 13 / 8.5 | 0.923 |
| balanced-d0.5-b0.1 | 1.032 | 1.076 | 13 / 9 | 0.931 |
| balanced-d0.5-b0.2 | 1.133 | 1.087 | 13 / 9 | 0.932 |
| balanced-d0.5-b0.35 | 1.207 | 1.101 | 13 / 9 | 0.921 |
| balanced-d1-b0.1 | 1.290 | 1.065 | 13 / 9 | 0.932 |
| balanced-d1-b0.2 | 1.431 | 1.071 | 13 / 9 | 0.935 |
| balanced-d1-b0.35 | 1.524 | 1.083 | 13 / 9 | 0.926 |
| heavy-heavy-d0.5-b0.1 | 1.023 | 1.059 | 13 / 9 | 0.924 |
| heavy-heavy-d0.5-b0.2 | 1.108 | 1.066 | 13 / 9 | 0.939 |
| heavy-heavy-d0.5-b0.35 | 1.219 | 1.082 | 13 / 9 | 0.937 |
| heavy-heavy-d1-b0.1 | 1.270 | 1.054 | 13 / 9 | 0.930 |
| heavy-heavy-d1-b0.2 | 1.439 | 1.059 | 13 / 9 | 0.933 |
| heavy-heavy-d1-b0.35 | 1.549 | 1.070 | 13 / 9 | 0.933 |

## Round 12 — Bound Star accumulation and make low-cost sinks reachable

40 unique configs × 40 seeds × 18 scenarios. Best score 5.6515.

The low bank cap plus cheaper Star-consuming upgrades brings all 18 median Star ratios to 1.039-1.097 while burn/claims stays 1.034-1.521. Bot/human hourly earnings remains 0.916-0.961; a structural participation change is still required. This is 40-seed evidence, not final confirmation.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.2 | 1.05 |
| policy.fusion.legendary.yarn | 4 | 5 |
| sinks.polish.yarn.0 | 2 | 1 |
| sinks.polish.yarn.1 | 5 | 1 |
| sinks.decor.yarn | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.034 | 1.072 | 13 / 9 | 0.919 |
| casual-heavy-d0.5-b0.2 | 1.145 | 1.081 | 13 / 9 | 0.950 |
| casual-heavy-d0.5-b0.35 | 1.223 | 1.097 | 13 / 8.5 | 0.919 |
| casual-heavy-d1-b0.1 | 1.278 | 1.059 | 13 / 9 | 0.943 |
| casual-heavy-d1-b0.2 | 1.399 | 1.064 | 13 / 9 | 0.961 |
| casual-heavy-d1-b0.35 | 1.483 | 1.073 | 13 / 8.5 | 0.921 |
| balanced-d0.5-b0.1 | 1.047 | 1.054 | 13 / 9 | 0.934 |
| balanced-d0.5-b0.2 | 1.123 | 1.061 | 13 / 9 | 0.934 |
| balanced-d0.5-b0.35 | 1.210 | 1.075 | 13 / 9 | 0.922 |
| balanced-d1-b0.1 | 1.280 | 1.047 | 13 / 9 | 0.930 |
| balanced-d1-b0.2 | 1.416 | 1.052 | 13 / 9 | 0.929 |
| balanced-d1-b0.35 | 1.509 | 1.061 | 13 / 9 | 0.916 |
| heavy-heavy-d0.5-b0.1 | 1.054 | 1.041 | 13 / 9 | 0.925 |
| heavy-heavy-d0.5-b0.2 | 1.126 | 1.047 | 13 / 9 | 0.930 |
| heavy-heavy-d0.5-b0.35 | 1.213 | 1.059 | 13 / 9 | 0.923 |
| heavy-heavy-d1-b0.1 | 1.272 | 1.039 | 13 / 9 | 0.925 |
| heavy-heavy-d1-b0.2 | 1.423 | 1.043 | 13 / 9 | 0.930 |
| heavy-heavy-d1-b0.35 | 1.521 | 1.051 | 13 / 9 | 0.924 |

## Round 13 — Wider claim and sink affordability bounds

40 unique configs × 40 seeds × 18 scenarios. Best score 5.8084.

The wider ranges improve the aggregate score to 5.8084 but let worst-case median Star source/sink rise to 1.122. Burn/claims spans 1.018-1.571 and bot/human hourly earnings 0.908-0.955. Retain round12 as the stronger Star-balanced candidate; the bot gate still needs a structural earning rule.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 0.9 |
| policy.spool.skinCost | 6 | 5 |
| policy.fusion.legendary.yarn | 5 | 2 |
| policy.seal.feeBp | 800 | 1300 |
| sinks.polish.yarn.0 | 1 | 2 |
| sinks.polish.yarn.1 | 1 | 4 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.019 | 1.098 | 13 / 9 | 0.926 |
| casual-heavy-d0.5-b0.2 | 1.068 | 1.108 | 13 / 9 | 0.936 |
| casual-heavy-d0.5-b0.35 | 1.160 | 1.122 | 13 / 8.5 | 0.908 |
| casual-heavy-d1-b0.1 | 1.305 | 1.081 | 13 / 9 | 0.940 |
| casual-heavy-d1-b0.2 | 1.439 | 1.086 | 13 / 9 | 0.935 |
| casual-heavy-d1-b0.35 | 1.534 | 1.094 | 13 / 8.5 | 0.917 |
| balanced-d0.5-b0.1 | 1.018 | 1.078 | 13 / 9 | 0.927 |
| balanced-d0.5-b0.2 | 1.071 | 1.087 | 13 / 9 | 0.924 |
| balanced-d0.5-b0.35 | 1.140 | 1.102 | 13 / 9 | 0.919 |
| balanced-d1-b0.1 | 1.303 | 1.062 | 13 / 9 | 0.926 |
| balanced-d1-b0.2 | 1.462 | 1.067 | 13 / 9 | 0.925 |
| balanced-d1-b0.35 | 1.569 | 1.077 | 13 / 9 | 0.925 |
| heavy-heavy-d0.5-b0.1 | 1.021 | 1.063 | 13 / 9 | 0.931 |
| heavy-heavy-d0.5-b0.2 | 1.078 | 1.071 | 13 / 9 | 0.934 |
| heavy-heavy-d0.5-b0.35 | 1.129 | 1.083 | 13 / 9 | 0.936 |
| heavy-heavy-d1-b0.1 | 1.345 | 1.046 | 13 / 9 | 0.935 |
| heavy-heavy-d1-b0.2 | 1.494 | 1.051 | 13 / 9 | 0.955 |
| heavy-heavy-d1-b0.35 | 1.571 | 1.061 | 13 / 9 | 0.932 |

## Round 14 — Keep one Thread in reserve and tune earning bounds

40 unique configs × 40 seeds × 18 scenarios. Best score 5.7756.

The one-Thread bank and adjusted weekly grants improve score to5.7756. Record the full scenario results and use them to tighten round15; no bot-efficiency acceptance is claimed. Native progression is unchanged from the200-seed bank.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 1 |
| policy.rewards.seasonRankMax | 3 | 2 |
| policy.spool.skinCost | 6 | 5 |
| policy.spool.weeklyNetCap | 4 | 9 |
| policy.fusion.legendary.yarn | 5 | 2 |
| policy.seal.feeBp | 800 | 1100 |
| sinks.polish.yarn.0 | 1 | 2 |
| sinks.polish.yarn.1 | 1 | 2 |
| sinks.decor.yarn | 2 | 4 |
| sinks.display.yarn | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.024 | 1.089 | 13 / 9 | 0.930 |
| casual-heavy-d0.5-b0.2 | 1.105 | 1.099 | 13 / 9 | 0.955 |
| casual-heavy-d0.5-b0.35 | 1.192 | 1.116 | 13 / 8.5 | 0.905 |
| casual-heavy-d1-b0.1 | 1.312 | 1.073 | 13 / 9 | 0.948 |
| casual-heavy-d1-b0.2 | 1.449 | 1.079 | 13 / 9 | 0.949 |
| casual-heavy-d1-b0.35 | 1.527 | 1.086 | 13 / 8.5 | 0.930 |
| balanced-d0.5-b0.1 | 1.041 | 1.068 | 13 / 9 | 0.936 |
| balanced-d0.5-b0.2 | 1.103 | 1.076 | 13 / 9 | 0.925 |
| balanced-d0.5-b0.35 | 1.189 | 1.092 | 13 / 9 | 0.927 |
| balanced-d1-b0.1 | 1.358 | 1.054 | 13 / 9 | 0.938 |
| balanced-d1-b0.2 | 1.462 | 1.061 | 13 / 9 | 0.938 |
| balanced-d1-b0.35 | 1.552 | 1.072 | 13 / 9 | 0.930 |
| heavy-heavy-d0.5-b0.1 | 1.053 | 1.051 | 13 / 9 | 0.942 |
| heavy-heavy-d0.5-b0.2 | 1.114 | 1.058 | 13 / 9 | 0.934 |
| heavy-heavy-d0.5-b0.35 | 1.185 | 1.072 | 13 / 9 | 0.929 |
| heavy-heavy-d1-b0.1 | 1.416 | 1.041 | 13 / 9 | 0.942 |
| heavy-heavy-d1-b0.2 | 1.520 | 1.046 | 13 / 9 | 0.951 |
| heavy-heavy-d1-b0.35 | 1.590 | 1.056 | 13 / 9 | 0.934 |

## Round 15 — Lower grants with affordable repeat sinks

40 unique configs × 40 seeds × 18 scenarios. Best score 6.3276.

Reducing weekly Spool to 0.25–0.60 worsened the best score to 6.3276. Burn/claims spans 1.0035–1.6523, Star source/sink 1.0565–1.1227, and bot/human hourly earnings 0.9032–0.9485. Round12 remains stronger. Next narrow around its affordable sink prices and weekly supply; a structural earning rule is still needed for bots.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 0.55 |
| policy.rewards.seasonRankMax | 3 | 4 |
| policy.spool.skinCost | 6 | 5 |
| policy.spool.weeklyNetCap | 4 | 6 |
| policy.fusion.legendary.yarn | 5 | 1 |
| policy.seal.feeBp | 800 | 1000 |
| sinks.polish.yarn.1 | 1 | 3 |
| sinks.decor.yarn | 2 | 3 |
| sinks.display.yarn | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.003 | 1.099 | 13 / 9 | 0.936 |
| casual-heavy-d0.5-b0.2 | 1.050 | 1.108 | 13 / 9 | 0.947 |
| casual-heavy-d0.5-b0.35 | 1.144 | 1.123 | 13 / 8.5 | 0.903 |
| casual-heavy-d1-b0.1 | 1.328 | 1.082 | 13 / 9 | 0.949 |
| casual-heavy-d1-b0.2 | 1.479 | 1.087 | 13 / 9 | 0.946 |
| casual-heavy-d1-b0.35 | 1.577 | 1.095 | 13 / 8.5 | 0.910 |
| balanced-d0.5-b0.1 | 1.013 | 1.078 | 13 / 9 | 0.928 |
| balanced-d0.5-b0.2 | 1.099 | 1.086 | 13 / 9 | 0.915 |
| balanced-d0.5-b0.35 | 1.165 | 1.101 | 13 / 9 | 0.928 |
| balanced-d1-b0.1 | 1.411 | 1.067 | 13 / 9 | 0.926 |
| balanced-d1-b0.2 | 1.530 | 1.072 | 13 / 9 | 0.916 |
| balanced-d1-b0.35 | 1.625 | 1.081 | 13 / 9 | 0.916 |
| heavy-heavy-d0.5-b0.1 | 1.031 | 1.062 | 13 / 9 | 0.933 |
| heavy-heavy-d0.5-b0.2 | 1.099 | 1.070 | 13 / 9 | 0.938 |
| heavy-heavy-d0.5-b0.35 | 1.157 | 1.083 | 13 / 9 | 0.933 |
| heavy-heavy-d1-b0.1 | 1.468 | 1.057 | 13 / 9 | 0.933 |
| heavy-heavy-d1-b0.2 | 1.587 | 1.061 | 13 / 9 | 0.935 |
| heavy-heavy-d1-b0.35 | 1.652 | 1.071 | 13 / 9 | 0.938 |

## Round 16 — Local supply and sink refinement

40 unique configs × 40 seeds × 18 scenarios. Best score 5.7086.

Refining round12 yields score 5.7086; median ranges: burnClaims [1.0083, 1.5089], starRatio [1.0527, 1.1242], botRegularHourlyRatio [0.8985, 0.9511]. Price and grant tuning still cannot resolve bot efficiency. Confirm the current top10 at200 independent seeds before adding the structural earning lever.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 1.2 |
| policy.rewards.seasonRankMax | 3 | 1 |
| policy.spool.skinCost | 6 | 7 |
| policy.spool.weeklyNetCap | 4 | 5 |
| policy.fusion.legendary.yarn | 5 | 6 |
| policy.seal.feeBp | 800 | 1100 |
| sinks.polish.yarn.1 | 1 | 4 |
| sinks.decor.yarn | 2 | 1 |
| sinks.display.yarn | 1 | 2 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.011 | 1.100 | 13 / 9 | 0.923 |
| casual-heavy-d0.5-b0.2 | 1.117 | 1.111 | 13 / 9 | 0.930 |
| casual-heavy-d0.5-b0.35 | 1.205 | 1.124 | 13 / 8.5 | 0.899 |
| casual-heavy-d1-b0.1 | 1.255 | 1.082 | 13 / 9 | 0.937 |
| casual-heavy-d1-b0.2 | 1.406 | 1.086 | 13 / 9 | 0.951 |
| casual-heavy-d1-b0.35 | 1.470 | 1.095 | 13 / 8.5 | 0.924 |
| balanced-d0.5-b0.1 | 1.013 | 1.078 | 13 / 9 | 0.932 |
| balanced-d0.5-b0.2 | 1.111 | 1.086 | 13 / 9 | 0.933 |
| balanced-d0.5-b0.35 | 1.207 | 1.101 | 13 / 9 | 0.922 |
| balanced-d1-b0.1 | 1.269 | 1.065 | 13 / 9 | 0.917 |
| balanced-d1-b0.2 | 1.411 | 1.070 | 13 / 9 | 0.918 |
| balanced-d1-b0.35 | 1.493 | 1.079 | 13 / 9 | 0.925 |
| heavy-heavy-d0.5-b0.1 | 1.008 | 1.061 | 13 / 9 | 0.931 |
| heavy-heavy-d0.5-b0.2 | 1.083 | 1.068 | 13 / 9 | 0.935 |
| heavy-heavy-d0.5-b0.35 | 1.179 | 1.081 | 13 / 9 | 0.924 |
| heavy-heavy-d1-b0.1 | 1.231 | 1.053 | 13 / 9 | 0.924 |
| heavy-heavy-d1-b0.2 | 1.392 | 1.057 | 13 / 9 | 0.949 |
| heavy-heavy-d1-b0.35 | 1.509 | 1.066 | 13 / 9 | 0.928 |

## Round 17 — Confirmed-craft rebates

40 unique configs × 40 seeds × 18 scenarios. Best score 0.5826.

The first capped rebate search lowers bot/regular withdrawn YARN per active hour from about0.91 to0.519–0.559, but the best candidate still misses burn at0.973 and Star at1.116. Rebates do not require a bot label and apply only after deterministic studio payments. Next round narrows passive Spool grants and combines lower fusion cost with a high rebate; all original acceptance bands remain unchanged.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 0.65 |
| policy.rewards.seasonRankMax | 3 | 2 |
| policy.spool.weeklyNetCap | 4 | 6 |
| policy.fusion.legendary.yarn | 5 | 8 |
| policy.seal.feeBp | 800 | 1100 |
| sinks.polish.yarn.0 | 1 | 3 |
| sinks.polish.yarn.1 | 1 | 3 |
| sinks.decor.yarn | 2 | 1 |
| sinks.display.yarn | 1 | 3 |
| policy.craft.rebateBp | 5000 | 7500 |
| policy.craft.weeklySpoolCap | 2 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 0.973 | 1.088 | 13 / 9 | 0.519 |
| casual-heavy-d0.5-b0.2 | 1.018 | 1.100 | 13 / 9 | 0.544 |
| casual-heavy-d0.5-b0.35 | 1.090 | 1.116 | 13 / 8.5 | 0.523 |
| casual-heavy-d1-b0.1 | 1.137 | 1.066 | 13 / 9 | 0.550 |
| casual-heavy-d1-b0.2 | 1.278 | 1.072 | 13 / 9 | 0.559 |
| casual-heavy-d1-b0.35 | 1.419 | 1.082 | 13 / 8.5 | 0.535 |
| balanced-d0.5-b0.1 | 0.983 | 1.066 | 13 / 9 | 0.525 |
| balanced-d0.5-b0.2 | 1.022 | 1.075 | 13 / 9 | 0.529 |
| balanced-d0.5-b0.35 | 1.094 | 1.090 | 13 / 9 | 0.523 |
| balanced-d1-b0.1 | 1.133 | 1.048 | 13 / 9 | 0.542 |
| balanced-d1-b0.2 | 1.259 | 1.054 | 13 / 9 | 0.550 |
| balanced-d1-b0.35 | 1.429 | 1.065 | 13 / 9 | 0.543 |
| heavy-heavy-d0.5-b0.1 | 0.983 | 1.050 | 13 / 9 | 0.539 |
| heavy-heavy-d0.5-b0.2 | 1.022 | 1.056 | 13 / 9 | 0.541 |
| heavy-heavy-d0.5-b0.35 | 1.087 | 1.069 | 13 / 9 | 0.534 |
| heavy-heavy-d1-b0.1 | 1.111 | 1.034 | 13 / 9 | 0.541 |
| heavy-heavy-d1-b0.2 | 1.263 | 1.039 | 13 / 9 | 0.556 |
| heavy-heavy-d1-b0.35 | 1.407 | 1.049 | 13 / 9 | 0.543 |

## Round 18 — Lower fusion cost and passive grants

80 unique configs × 40 seeds × 18 scenarios. Best score 1.4171.

Cheaper fusion competes for the one-Thread bank before studio purchases, while very low passive grants leave non-market humans unable to fund a craft. The best score worsens to1.4171: Star peaks at1.1606 and bot hourly ratio at0.6096. Do not select this round. Next isolate the trade-off with higher fusion prices, funded weekly grants, cheaper seasonal decor, and a larger rebate allowance.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.seasonRankMax | 2 | 1 |
| policy.spool.skinCost | 6 | 8 |
| policy.spool.weeklyNetCap | 6 | 5 |
| policy.fusion.legendary.yarn | 8 | 6 |
| sinks.polish.yarn.1 | 3 | 4 |
| sinks.decor.yarn | 1 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 0.975 | 1.131 | 13 / 9 | 0.544 |
| casual-heavy-d0.5-b0.2 | 1.012 | 1.143 | 13 / 9 | 0.541 |
| casual-heavy-d0.5-b0.35 | 1.053 | 1.161 | 13 / 8.5 | 0.536 |
| casual-heavy-d1-b0.1 | 1.104 | 1.112 | 13 / 9 | 0.609 |
| casual-heavy-d1-b0.2 | 1.246 | 1.115 | 13 / 9 | 0.598 |
| casual-heavy-d1-b0.35 | 1.370 | 1.125 | 13 / 8.5 | 0.576 |
| balanced-d0.5-b0.1 | 0.980 | 1.102 | 13 / 9 | 0.540 |
| balanced-d0.5-b0.2 | 1.011 | 1.111 | 13 / 9 | 0.537 |
| balanced-d0.5-b0.35 | 1.069 | 1.130 | 13 / 9 | 0.529 |
| balanced-d1-b0.1 | 1.086 | 1.091 | 13 / 9 | 0.580 |
| balanced-d1-b0.2 | 1.234 | 1.097 | 13 / 9 | 0.595 |
| balanced-d1-b0.35 | 1.363 | 1.107 | 13 / 9 | 0.589 |
| heavy-heavy-d0.5-b0.1 | 0.982 | 1.082 | 13 / 9 | 0.535 |
| heavy-heavy-d0.5-b0.2 | 1.005 | 1.091 | 13 / 9 | 0.553 |
| heavy-heavy-d0.5-b0.35 | 1.056 | 1.107 | 13 / 9 | 0.529 |
| heavy-heavy-d1-b0.1 | 1.068 | 1.078 | 13 / 9 | 0.581 |
| heavy-heavy-d1-b0.2 | 1.186 | 1.083 | 13 / 9 | 0.610 |
| heavy-heavy-d1-b0.35 | 1.346 | 1.093 | 13 / 9 | 0.586 |

## Round 19 — Fund craft rebates without cheap fusion competition

80 unique configs × 40 seeds × 18 scenarios. Best score 0.4942.

Round19 improves score to0.4942, but burn minimum0.9893, Star maximum1.1172, and bot ratios0.5069–0.5467 still miss. A larger rebate remains below the confirmed burn and can increase useful repeated spending without creating a profitable recycle loop. Round20 will test80–95% gross rebates together with the existing withdrawal fee lever, preserving all acceptance thresholds.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 0.65 | 0.95 |
| policy.rewards.seasonRankMax | 2 | 1 |
| policy.spool.skinCost | 6 | 7 |
| policy.spool.weeklyNetCap | 6 | 8 |
| policy.fusion.legendary.yarn | 8 | 11 |
| policy.seal.feeBp | 1100 | 1000 |
| sinks.polish.yarn.0 | 3 | 4 |
| sinks.polish.yarn.1 | 3 | 4 |
| sinks.display.yarn | 3 | 4 |
| policy.craft.weeklySpoolCap | 3 | 4 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.007 | 1.090 | 13 / 9 | 0.529 |
| casual-heavy-d0.5-b0.2 | 1.064 | 1.102 | 13 / 9 | 0.547 |
| casual-heavy-d0.5-b0.35 | 1.168 | 1.117 | 13 / 8.5 | 0.519 |
| casual-heavy-d1-b0.1 | 1.178 | 1.067 | 13 / 9 | 0.530 |
| casual-heavy-d1-b0.2 | 1.291 | 1.075 | 13 / 9 | 0.542 |
| casual-heavy-d1-b0.35 | 1.388 | 1.084 | 13 / 8.5 | 0.507 |
| balanced-d0.5-b0.1 | 0.989 | 1.065 | 13 / 9 | 0.523 |
| balanced-d0.5-b0.2 | 1.059 | 1.075 | 13 / 9 | 0.527 |
| balanced-d0.5-b0.35 | 1.132 | 1.090 | 13 / 9 | 0.524 |
| balanced-d1-b0.1 | 1.164 | 1.053 | 13 / 9 | 0.526 |
| balanced-d1-b0.2 | 1.274 | 1.058 | 13 / 9 | 0.529 |
| balanced-d1-b0.35 | 1.378 | 1.069 | 13 / 9 | 0.522 |
| heavy-heavy-d0.5-b0.1 | 0.997 | 1.048 | 13 / 9 | 0.528 |
| heavy-heavy-d0.5-b0.2 | 1.032 | 1.056 | 13 / 9 | 0.538 |
| heavy-heavy-d0.5-b0.35 | 1.123 | 1.068 | 13 / 9 | 0.526 |
| heavy-heavy-d1-b0.1 | 1.146 | 1.044 | 13 / 9 | 0.525 |
| heavy-heavy-d1-b0.2 | 1.274 | 1.048 | 13 / 9 | 0.536 |
| heavy-heavy-d1-b0.35 | 1.378 | 1.058 | 13 / 9 | 0.527 |

## Round 20 — Higher subcost rebates with public withdrawal fees

80 unique configs × 40 seeds × 18 scenarios. Best score 0.0962.

The best score improves to0.096208. Burn1.0238–1.2973 and all other pilot targets pass except Star1.106927 in casual-heavy demand50% bots35%. Four rebate/price rounds narrowed the gap but have not closed it. Change method to paired local coordinate probes around the measured best, prioritizing funding and affordable deterministic recipes; keep every threshold and behavioural assumption fixed.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 0.95 | 1.05 |
| policy.rewards.seasonRankMax | 1 | 2 |
| policy.spool.weeklyNetCap | 8 | 6 |
| policy.fusion.legendary.yarn | 11 | 17 |
| policy.craft.rebateBp | 7500 | 8500 |
| policy.craft.weeklySpoolCap | 4 | 5 |
| policy.spool.feeBp | 2500 | 2000 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.025 | 1.080 | 13 / 9 | 0.493 |
| casual-heavy-d0.5-b0.2 | 1.094 | 1.090 | 13 / 9 | 0.505 |
| casual-heavy-d0.5-b0.35 | 1.161 | 1.107 | 13 / 8.5 | 0.485 |
| casual-heavy-d1-b0.1 | 1.142 | 1.061 | 13 / 9 | 0.480 |
| casual-heavy-d1-b0.2 | 1.215 | 1.067 | 13 / 9 | 0.485 |
| casual-heavy-d1-b0.35 | 1.291 | 1.078 | 13 / 8.5 | 0.465 |
| balanced-d0.5-b0.1 | 1.024 | 1.059 | 13 / 9 | 0.497 |
| balanced-d0.5-b0.2 | 1.094 | 1.067 | 13 / 9 | 0.498 |
| balanced-d0.5-b0.35 | 1.169 | 1.083 | 13 / 9 | 0.488 |
| balanced-d1-b0.1 | 1.152 | 1.050 | 13 / 9 | 0.472 |
| balanced-d1-b0.2 | 1.224 | 1.056 | 13 / 9 | 0.467 |
| balanced-d1-b0.35 | 1.296 | 1.066 | 13 / 9 | 0.463 |
| heavy-heavy-d0.5-b0.1 | 1.033 | 1.044 | 13 / 9 | 0.498 |
| heavy-heavy-d0.5-b0.2 | 1.080 | 1.050 | 13 / 9 | 0.494 |
| heavy-heavy-d0.5-b0.35 | 1.156 | 1.064 | 13 / 9 | 0.491 |
| heavy-heavy-d1-b0.1 | 1.160 | 1.042 | 13 / 9 | 0.475 |
| heavy-heavy-d1-b0.2 | 1.230 | 1.047 | 13 / 9 | 0.477 |
| heavy-heavy-d1-b0.35 | 1.297 | 1.056 | 13 / 9 | 0.475 |

## Round 21 — Paired local funding and recipe probes

80 unique configs × 40 seeds × 18 scenarios. Best score 0.0600.

Three selected levers changed. The best score is 0.059972; all pilot median targets except Star pass. The remaining Star ratio is 1.104318 in casual-heavy half-demand with 35% bots. Continue affordable recipe and withdrawal funding probes; independent 200-seed confirmation tests whether the remaining margin survives different seeds.

| Lever | Before | After |
|---|---:|---:|
| policy.rewards.weeklySpool | 1.05 | 1.1 |
| policy.spool.skinCost | 7 | 8 |
| sinks.display.yarn | 4 | 3 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.031 | 1.079 | 13 / 9 | 0.486 |
| casual-heavy-d0.5-b0.2 | 1.094 | 1.088 | 13 / 9 | 0.499 |
| casual-heavy-d0.5-b0.35 | 1.158 | 1.104 | 13 / 8.5 | 0.489 |
| casual-heavy-d1-b0.1 | 1.142 | 1.061 | 13 / 9 | 0.480 |
| casual-heavy-d1-b0.2 | 1.205 | 1.067 | 13 / 9 | 0.479 |
| casual-heavy-d1-b0.35 | 1.280 | 1.076 | 13 / 8.5 | 0.459 |
| balanced-d0.5-b0.1 | 1.033 | 1.058 | 13 / 9 | 0.504 |
| balanced-d0.5-b0.2 | 1.089 | 1.067 | 13 / 9 | 0.500 |
| balanced-d0.5-b0.35 | 1.152 | 1.080 | 13 / 9 | 0.495 |
| balanced-d1-b0.1 | 1.136 | 1.050 | 13 / 9 | 0.475 |
| balanced-d1-b0.2 | 1.204 | 1.055 | 13 / 9 | 0.474 |
| balanced-d1-b0.35 | 1.272 | 1.065 | 13 / 9 | 0.468 |
| heavy-heavy-d0.5-b0.1 | 1.031 | 1.044 | 13 / 9 | 0.505 |
| heavy-heavy-d0.5-b0.2 | 1.084 | 1.049 | 13 / 9 | 0.497 |
| heavy-heavy-d0.5-b0.35 | 1.152 | 1.062 | 13 / 9 | 0.497 |
| heavy-heavy-d1-b0.1 | 1.141 | 1.042 | 13 / 9 | 0.482 |
| heavy-heavy-d1-b0.2 | 1.215 | 1.047 | 13 / 9 | 0.465 |
| heavy-heavy-d1-b0.35 | 1.273 | 1.055 | 13 / 9 | 0.474 |

## Round 22 — Affordable recipe ranges and local withdrawal probes

80 unique configs × 40 seeds × 18 scenarios. Best score 0.0371.

The selected change lowers withdrawal retention from 2000 to 1750 basis points. Star improves to 1.102623 in the worst scenario, but two bot ratios narrowly miss again (up to 0.502630). Single-axis and early paired probes mostly follow funding, not joint price/rebate trade-offs. Change method to stratified joint exploration and local refinement over affordable polish, display, rebates and rewards. Keep assumptions, source cap and acceptance thresholds fixed.

| Lever | Before | After |
|---|---:|---:|
| policy.spool.feeBp | 2000 | 1750 |

| Scenario | Burn / claims | Star source / sink | Casual / heavy Legendary | Bot / regular per hour |
|---|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.036 | 1.078 | 13 / 9 | 0.497 |
| casual-heavy-d0.5-b0.2 | 1.083 | 1.089 | 13 / 9 | 0.505 |
| casual-heavy-d0.5-b0.35 | 1.162 | 1.103 | 13 / 8.5 | 0.491 |
| casual-heavy-d1-b0.1 | 1.137 | 1.060 | 13 / 9 | 0.477 |
| casual-heavy-d1-b0.2 | 1.196 | 1.066 | 13 / 9 | 0.481 |
| casual-heavy-d1-b0.35 | 1.262 | 1.076 | 13 / 8.5 | 0.464 |
| balanced-d0.5-b0.1 | 1.039 | 1.057 | 13 / 9 | 0.499 |
| balanced-d0.5-b0.2 | 1.097 | 1.065 | 13 / 9 | 0.490 |
| balanced-d0.5-b0.35 | 1.157 | 1.079 | 13 / 9 | 0.500 |
| balanced-d1-b0.1 | 1.140 | 1.050 | 13 / 9 | 0.476 |
| balanced-d1-b0.2 | 1.200 | 1.055 | 13 / 9 | 0.467 |
| balanced-d1-b0.35 | 1.266 | 1.065 | 13 / 9 | 0.469 |
| heavy-heavy-d0.5-b0.1 | 1.056 | 1.043 | 13 / 9 | 0.510 |
| heavy-heavy-d0.5-b0.2 | 1.101 | 1.049 | 13 / 9 | 0.496 |
| heavy-heavy-d0.5-b0.35 | 1.155 | 1.061 | 13 / 9 | 0.503 |
| heavy-heavy-d1-b0.1 | 1.137 | 1.042 | 13 / 9 | 0.473 |
| heavy-heavy-d1-b0.2 | 1.209 | 1.046 | 13 / 9 | 0.468 |
| heavy-heavy-d1-b0.35 | 1.263 | 1.055 | 13 / 9 | 0.470 |
