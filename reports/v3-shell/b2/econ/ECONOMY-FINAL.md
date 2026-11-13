# Economy final evidence

Measured candidate: `497ba9738ee175c0efc7b21864fcdc44af611abac366f07e87150676eb995bd3`. These are simulations and disposable local transactions, not observed player behaviour or public-chain deployment.

Search: 24 rounds, 1273 distinct configurations. Final confirmation: 18 scenarios, 200 seeds per scenario. Sensitivity coverage: 9 / 85 assumptions. Incomplete cases remain failed evidence.

## Targets

| Target | Required behaviour | Checker |
|---|---|---|
| T-a | Burn / claims ≥ 1; full-demand maximum 1.6 | PASS |
| T-b | Star Thread source / sink 0.9–1.1 | PASS |
| T-c | Heavy / casual hourly YARN ≤ 3 in either direction | PASS |
| T-d | Casual Legendary day 10–16; heavy 5–9, strictly sooner | PASS |
| T-e | Bot / regular hourly YARN ≤ 0.5 in the largest bot mix | PASS |
| T-f | Top-percent account share ≤ 0.08 | PASS |
| T-g | Upper-tail half-demand burn ≥ 0.95; Star 0.8–1.2 | PASS |
| T-h | Each behaviour assumption ± 0.2: burn ≥ 0.95; Star 0.8–1.2 | FAIL |

## Published changes

Weekly completed-route Spool is 1.05; chapter Spool is 0. New bound Thread grants pause at a bank of 1; existing stock is preserved. Seasonal rank maximum is 2.

The weekly net withdrawal cap is 6 YARN, with 1500 basis points retained in the reward pool. Retention is never counted as a burn. Guaranteed studio payments earn up to 9500 basis points of Spool, capped at 5 per week. The returned amount stays below the cost, including after withdrawal retention.

Legendary fusion consumes 3 matching Epics, 1 bound Thread, and burns 18 YARN. Guaranteed quality polish, permanent scene decor, and permanent showcase shelves provide visible deterministic benefits. YARN does not buy random outcomes.

## Baseline and final distributions

Every cell is median [lower decile, upper decile]. The baseline and final retain their own native progression records and hashed model snapshots. Scenario identifiers encode the measured player mix, demand, and bot share.

### Burn / all claims

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.133 [1.094, 1.173] | 1.01 [0.975, 1.049] |
| casual-heavy-d0.5-b0.2 | 1.161 [1.126, 1.207] | 1.064 [1.018, 1.105] |
| casual-heavy-d0.5-b0.35 | 1.205 [1.175, 1.247] | 1.14 [1.095, 1.177] |
| casual-heavy-d1-b0.1 | 1.247 [1.212, 1.285] | 1.129 [1.103, 1.152] |
| casual-heavy-d1-b0.2 | 1.29 [1.257, 1.329] | 1.178 [1.153, 1.204] |
| casual-heavy-d1-b0.35 | 1.35 [1.308, 1.382] | 1.244 [1.216, 1.272] |
| balanced-d0.5-b0.1 | 1.204 [1.176, 1.243] | 1.032 [0.999, 1.065] |
| balanced-d0.5-b0.2 | 1.223 [1.19, 1.256] | 1.07 [1.036, 1.112] |
| balanced-d0.5-b0.35 | 1.246 [1.205, 1.278] | 1.139 [1.095, 1.172] |
| balanced-d1-b0.1 | 1.301 [1.267, 1.338] | 1.149 [1.129, 1.17] |
| balanced-d1-b0.2 | 1.329 [1.296, 1.367] | 1.187 [1.165, 1.211] |
| balanced-d1-b0.35 | 1.376 [1.338, 1.407] | 1.245 [1.221, 1.268] |
| heavy-heavy-d0.5-b0.1 | 1.281 [1.247, 1.314] | 1.055 [1.025, 1.084] |
| heavy-heavy-d0.5-b0.2 | 1.281 [1.245, 1.308] | 1.087 [1.051, 1.124] |
| heavy-heavy-d0.5-b0.35 | 1.287 [1.257, 1.318] | 1.144 [1.108, 1.176] |
| heavy-heavy-d1-b0.1 | 1.357 [1.325, 1.386] | 1.173 [1.156, 1.194] |
| heavy-heavy-d1-b0.2 | 1.376 [1.345, 1.406] | 1.201 [1.179, 1.221] |
| heavy-heavy-d1-b0.35 | 1.403 [1.372, 1.432] | 1.252 [1.23, 1.272] |

### Star Thread source / sink

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 16.304 [15.574, 17.466] | 1.076 [1.07, 1.082] |
| casual-heavy-d0.5-b0.2 | 18.925 [17.97, 20.189] | 1.084 [1.079, 1.09] |
| casual-heavy-d0.5-b0.35 | 23.299 [21.855, 25.346] | 1.1 [1.093, 1.108] |
| casual-heavy-d1-b0.1 | 16.439 [15.488, 17.455] | 1.059 [1.056, 1.063] |
| casual-heavy-d1-b0.2 | 18.833 [17.756, 20.493] | 1.065 [1.061, 1.07] |
| casual-heavy-d1-b0.35 | 23.043 [21.57, 24.84] | 1.075 [1.07, 1.08] |
| balanced-d0.5-b0.1 | 14.775 [14.108, 15.847] | 1.056 [1.053, 1.059] |
| balanced-d0.5-b0.2 | 17.226 [16.083, 18.317] | 1.063 [1.059, 1.067] |
| balanced-d0.5-b0.35 | 21.387 [20.228, 23.141] | 1.076 [1.073, 1.081] |
| balanced-d1-b0.1 | 15.415 [14.536, 16.199] | 1.05 [1.047, 1.053] |
| balanced-d1-b0.2 | 17.773 [16.784, 18.822] | 1.055 [1.052, 1.058] |
| balanced-d1-b0.35 | 21.793 [20.568, 23.447] | 1.064 [1.061, 1.067] |
| heavy-heavy-d0.5-b0.1 | 13.998 [13.452, 14.715] | 1.042 [1.04, 1.044] |
| heavy-heavy-d0.5-b0.2 | 16.242 [15.289, 17.157] | 1.048 [1.045, 1.05] |
| heavy-heavy-d0.5-b0.35 | 20.076 [18.782, 21.614] | 1.059 [1.056, 1.063] |
| heavy-heavy-d1-b0.1 | 14.609 [13.841, 15.497] | 1.043 [1.041, 1.045] |
| heavy-heavy-d1-b0.2 | 16.81 [15.83, 18.174] | 1.047 [1.045, 1.049] |
| heavy-heavy-d1-b0.35 | 21.015 [19.574, 22.337] | 1.055 [1.053, 1.058] |

### Heavy / casual withdrawn YARN per active hour

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.146 [1.007, 1.275] | 1.392 [1.243, 1.562] |
| casual-heavy-d0.5-b0.2 | 1.172 [1.018, 1.305] | 1.375 [1.188, 1.561] |
| casual-heavy-d0.5-b0.35 | 1.145 [1.001, 1.322] | 1.402 [1.201, 1.612] |
| casual-heavy-d1-b0.1 | 1.158 [1.017, 1.292] | 1.208 [1.081, 1.351] |
| casual-heavy-d1-b0.2 | 1.165 [1.021, 1.304] | 1.188 [1.047, 1.392] |
| casual-heavy-d1-b0.35 | 1.142 [1.006, 1.324] | 1.216 [1.045, 1.405] |
| balanced-d0.5-b0.1 | 1.157 [1.013, 1.291] | 1.382 [1.258, 1.566] |
| balanced-d0.5-b0.2 | 1.149 [1.025, 1.284] | 1.385 [1.208, 1.621] |
| balanced-d0.5-b0.35 | 1.127 [0.997, 1.3] | 1.389 [1.202, 1.581] |
| balanced-d1-b0.1 | 1.152 [1.031, 1.302] | 1.203 [1.073, 1.369] |
| balanced-d1-b0.2 | 1.154 [1.032, 1.293] | 1.201 [1.057, 1.405] |
| balanced-d1-b0.35 | 1.151 [1, 1.312] | 1.21 [1.058, 1.376] |
| heavy-heavy-d0.5-b0.1 | 1.141 [0.989, 1.341] | 1.374 [1.148, 1.624] |
| heavy-heavy-d0.5-b0.2 | 1.144 [0.964, 1.413] | 1.364 [1.176, 1.694] |
| heavy-heavy-d0.5-b0.35 | 1.121 [0.942, 1.371] | 1.382 [1.141, 1.706] |
| heavy-heavy-d1-b0.1 | 1.123 [0.977, 1.392] | 1.197 [1.027, 1.442] |
| heavy-heavy-d1-b0.2 | 1.134 [0.961, 1.39] | 1.192 [1.009, 1.451] |
| heavy-heavy-d1-b0.35 | 1.137 [0.937, 1.384] | 1.189 [0.986, 1.487] |

### Casual first Legendary day

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 15 [15, 16] | 13 [13, 13] |
| casual-heavy-d0.5-b0.2 | 15 [15, 16] | 13 [13, 13.5] |
| casual-heavy-d0.5-b0.35 | 15 [15, 16] | 13 [13, 14] |
| casual-heavy-d1-b0.1 | 15 [15, 16] | 13 [13, 13] |
| casual-heavy-d1-b0.2 | 15 [15, 16] | 13 [13, 13.5] |
| casual-heavy-d1-b0.35 | 15 [15, 16] | 13 [13, 14] |
| balanced-d0.5-b0.1 | 15 [15, 16] | 13 [12.95, 14] |
| balanced-d0.5-b0.2 | 15 [15, 16] | 13 [12.45, 14] |
| balanced-d0.5-b0.35 | 15 [15, 16] | 13 [12, 14] |
| balanced-d1-b0.1 | 15 [15, 16] | 13 [12.95, 14] |
| balanced-d1-b0.2 | 15 [15, 16] | 13 [12.45, 14] |
| balanced-d1-b0.35 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d0.5-b0.1 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d0.5-b0.2 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d0.5-b0.35 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d1-b0.1 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d1-b0.2 | 15 [15, 16] | 13 [12, 14] |
| heavy-heavy-d1-b0.35 | 15 [15, 16] | 13 [12, 14] |

### Heavy first Legendary day

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 11 [11, 11.55] | 9 [8, 9] |
| casual-heavy-d0.5-b0.2 | 11 [11, 11.5] | 8.5 [8, 9] |
| casual-heavy-d0.5-b0.35 | 11 [11, 11.5] | 8.5 [8, 9] |
| casual-heavy-d1-b0.1 | 11 [11, 11.55] | 9 [8, 9] |
| casual-heavy-d1-b0.2 | 11 [11, 11.5] | 8.5 [8, 9] |
| casual-heavy-d1-b0.35 | 11 [11, 11.5] | 8.5 [8, 9] |
| balanced-d0.5-b0.1 | 11 [11, 11] | 9 [8, 9] |
| balanced-d0.5-b0.2 | 11 [11, 11] | 9 [8, 9] |
| balanced-d0.5-b0.35 | 11 [11, 11] | 9 [8, 9] |
| balanced-d1-b0.1 | 11 [11, 11] | 9 [8, 9] |
| balanced-d1-b0.2 | 11 [11, 11] | 9 [8, 9] |
| balanced-d1-b0.35 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d0.5-b0.1 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d0.5-b0.2 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d0.5-b0.35 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d1-b0.1 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d1-b0.2 | 11 [11, 11] | 9 [8, 9] |
| heavy-heavy-d1-b0.35 | 11 [11, 11] | 9 [8, 9] |

### Bot / regular withdrawn YARN per active hour

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 0.933 [0.809, 1.044] | 0.484 [0.429, 0.548] |
| casual-heavy-d0.5-b0.2 | 0.933 [0.829, 1.022] | 0.487 [0.433, 0.541] |
| casual-heavy-d0.5-b0.35 | 0.926 [0.838, 1.044] | 0.483 [0.434, 0.537] |
| casual-heavy-d1-b0.1 | 0.951 [0.821, 1.072] | 0.472 [0.412, 0.542] |
| casual-heavy-d1-b0.2 | 0.936 [0.853, 1.042] | 0.474 [0.423, 0.516] |
| casual-heavy-d1-b0.35 | 0.935 [0.848, 1.043] | 0.468 [0.427, 0.524] |
| balanced-d0.5-b0.1 | 0.931 [0.841, 1.025] | 0.483 [0.43, 0.538] |
| balanced-d0.5-b0.2 | 0.929 [0.856, 1.015] | 0.484 [0.445, 0.525] |
| balanced-d0.5-b0.35 | 0.931 [0.862, 1.037] | 0.485 [0.442, 0.532] |
| balanced-d1-b0.1 | 0.945 [0.85, 1.035] | 0.474 [0.42, 0.532] |
| balanced-d1-b0.2 | 0.94 [0.869, 1.033] | 0.47 [0.426, 0.511] |
| balanced-d1-b0.35 | 0.942 [0.877, 1.038] | 0.464 [0.428, 0.517] |
| heavy-heavy-d0.5-b0.1 | 0.932 [0.845, 1.05] | 0.481 [0.43, 0.55] |
| heavy-heavy-d0.5-b0.2 | 0.927 [0.845, 1.038] | 0.484 [0.436, 0.536] |
| heavy-heavy-d0.5-b0.35 | 0.932 [0.855, 1.023] | 0.48 [0.437, 0.529] |
| heavy-heavy-d1-b0.1 | 0.942 [0.852, 1.06] | 0.47 [0.42, 0.53] |
| heavy-heavy-d1-b0.2 | 0.949 [0.857, 1.041] | 0.467 [0.426, 0.521] |
| heavy-heavy-d1-b0.35 | 0.945 [0.867, 1.042] | 0.465 [0.424, 0.515] |

### Top-percent share of withdrawals

| Scenario | Baseline | Final |
|---|---:|---:|
| casual-heavy-d0.5-b0.1 | 0.022 [0.021, 0.023] | 0.029 [0.027, 0.03] |
| casual-heavy-d0.5-b0.2 | 0.02 [0.02, 0.022] | 0.029 [0.027, 0.03] |
| casual-heavy-d0.5-b0.35 | 0.018 [0.018, 0.019] | 0.028 [0.027, 0.03] |
| casual-heavy-d1-b0.1 | 0.022 [0.021, 0.024] | 0.026 [0.025, 0.028] |
| casual-heavy-d1-b0.2 | 0.021 [0.02, 0.022] | 0.026 [0.025, 0.028] |
| casual-heavy-d1-b0.35 | 0.019 [0.018, 0.019] | 0.026 [0.025, 0.028] |
| balanced-d0.5-b0.1 | 0.019 [0.018, 0.02] | 0.023 [0.022, 0.025] |
| balanced-d0.5-b0.2 | 0.018 [0.017, 0.019] | 0.024 [0.023, 0.025] |
| balanced-d0.5-b0.35 | 0.017 [0.016, 0.017] | 0.025 [0.024, 0.026] |
| balanced-d1-b0.1 | 0.019 [0.018, 0.02] | 0.022 [0.021, 0.023] |
| balanced-d1-b0.2 | 0.018 [0.017, 0.019] | 0.022 [0.021, 0.023] |
| balanced-d1-b0.35 | 0.017 [0.016, 0.017] | 0.023 [0.022, 0.024] |
| heavy-heavy-d0.5-b0.1 | 0.016 [0.015, 0.017] | 0.019 [0.019, 0.02] |
| heavy-heavy-d0.5-b0.2 | 0.016 [0.015, 0.016] | 0.02 [0.019, 0.021] |
| heavy-heavy-d0.5-b0.35 | 0.015 [0.014, 0.015] | 0.021 [0.02, 0.022] |
| heavy-heavy-d1-b0.1 | 0.016 [0.015, 0.017] | 0.018 [0.018, 0.019] |
| heavy-heavy-d1-b0.2 | 0.016 [0.015, 0.016] | 0.019 [0.018, 0.02] |
| heavy-heavy-d1-b0.35 | 0.015 [0.015, 0.016] | 0.02 [0.019, 0.021] |

## Pareto trade-offs

The review contains the best comparable candidates and marks genuine nondominated membership. Dominated entries are retained for review and are not presented as part of the frontier. Historical scores from different model versions are not mixed.

| Configuration | Score | On frontier | Misses | Interpretation |
|---|---:|---|---|---|
| `497ba9738ee175c0efc7b21864fcdc44af611abac366f07e87150676eb995bd3` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `3bf2a9a4696c63ba0cf29e0ee43c2de470739274b21f69ceaf60ce71bedc0955` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `3da442e27c22bfb1d9a796e5f1c9b815553fc67943fe4be9939e2840b8ecc69d` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `99e3bda69647c42c650a36a41cca09741232ab10f86035daaf4f23e3e1e7c418` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `b256345af3a9b22a2adf1f8022e5c90d3addca90d4c35aa839a44204f85ae460` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `ea5f065365e3a05123ad8ec30621f0d96a40fd9c90f7ef1467bb5639f180ffdb` | 0 | yes | none in pilot | All pilot objectives fit these seeds; sensitivity and independent confirmation remain separate checks. |
| `056c1fdc96399a8c6e91be5193cd1e6bf2335e8b35fb214c151f97549341d8a8` | 0.0002 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `2fc1281a7220327ee209802d5d6a5e778707803836dc48b56c80c423e5950948` | 0.0017 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `ff74191d6b334eb5490e50f8d45d0796f9306154c6509391665f9ac6d01e63b1` | 0.0019 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `4505216b73b3f0ecdb920ba9b98a3de8f6294f189ed6446de3a1912d6fb9c640` | 0.0023 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `7026376c5ed0413b5ef8d994952b61ee6c1d657f34008030a35589a0adcb5684` | 0.0033 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `71acbcf6a7d7359c6f467f033565ea2923ad7c743a69c9a0d008849bc1cbbefe` | 0.0038 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `977eab13de0dfd1c10208a1fdf4d5117fe7c0eceb4d984df7887e082807eadc1` | 0.0041 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `2969b4ac05657dabd3c11c2c53bac63decb9ef6e0e8eed924d2c335cacc65234` | 0.0043 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `2050198ef6120970427ff2d10eee451f829ac51dc088dd123b87f2a5f089c700` | 0.0058 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `85fa8dba397430b9e6f1e7e07887ba0bc93950ef7d48f44fe9a50c0600080bd0` | 0.006 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `c814fd183361bda5fef8350e3b787a083b12c4c3fd3c2f097b0374851d36232c` | 0.0066 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `10da5331da8299d2676d07670eb0acff2c396919d95576d900375a97e89fa3e7` | 0.0067 | no | T-e | The same public rewards and paid craft rebates are available to automated accounts. The modeled spending mix still misses the bot ratio; finite collections, available YARN, and Thread constrain higher prices. |
| `6749ee4f0fa122cc992e7f47e8bc6eca23345fd58532f9c28bdf4cc393620ebe` | 0.0073 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |
| `b0f98fab76b271b49f50e450630c6cf35443de0466c1abb2a77f5949246b4187` | 0.0077 | no | T-b | The bot objective fits these pilot seeds, but the listed balance or tail objectives still miss. Reducing passive grants, craft affordability, and finite desired collections trade off against one another. |

## Risks and launch monitoring

The bot objective is conditional on the stated spending and play profiles. The earning rule is public and identical for every account; it does not identify bots. An adaptive automated account can copy human purchases. Gross withdrawals are not profit: burned YARN and purchased benefits must also be inspected.

Opening outside-market stock is finite: 40 YARN per modeled market participant. Tester grants are 20 YARN to 100 recipients. Neither is invented ongoing income. Without outside stock, conservation prevents sustained burns exceeding all claims while balances remain.

Monitor actual burn against all issued claims, late-season burn, banked and inactive Thread, withdrawals by cohort and account, gross rebates versus paid burns, market float depletion, and observed Legendary progression. Refit demand and retention from observed behaviour before enabling issuance. Keep reward budgets finite and display unavailable chain data as unavailable.

The original immutable contract season and routine cap are unchanged. The UI explains the content season separately. Local Anvil receipts prove the transaction flow and deterministic sink benefits; they are not public Fuji receipts. Source-linked reports, captured UI odds, and receipt hashes are under this directory.

The final policy hash matches 16 confirmed local receipts and 18 desktop screenshots. Displayed recipe costs, withdrawal fees, grants, caps, and odds were compared directly with that policy.
