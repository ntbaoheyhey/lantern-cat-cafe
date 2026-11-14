# E1 baseline methodology

Run `pnpm econ:lab --scenario all --seeds 200` from the worktree root. `--resume` only accepts cached accounts whose config and compiled runtime hashes match; the acceptance run used no cached accounts.

The one `ECONOMY_LAB` object references production v3 and C2 rule tables. Native C2 auto battles resolve all reward, invitation, tailoring, selector, and spending transitions. Five policies differ in hours, session length, active days and equipment attention. The token model bootstraps the paired account records into three human mixes, two demand levels and three independently varied bot shares. Each scenario has 200 token seeds, with median, p10 and p90.

The cold run completed in 1737.339 seconds using 6 local CPU workers, with 1,000 native accounts and 42 calendar days per account. These are worker threads running local JavaScript, not model agents.

The final measured fortnight supplies mature-week yields for weeks 7–52. This is a scenario projection, not a claim of 52 weeks of combat telemetry. Active hours count modeled action time; unused or AFK bot hours cannot improve the bot-efficiency result. Daily caps explain why play time is much lower than planned hours for high-hour profiles.

The YARN ledger tracks every account balance, withdrawal, retained fee, funded trade, treasury fee and burn. Tester grants count in all claims. Opening market float is pre-existing circulation, finite, separately conserved, and not a new claim. With zero external float, the additional stress test never burns more than all claims. Burning retained withdrawal fees, unfunded trades, or hidden controller emission changes is forbidden.

## Baseline medians

| Scenario | Burn / claims | Star source / sink | Casual Legendary day | Heavy Legendary day | Bot / regular YARN-hour |
|---|---:|---:|---:|---:|---:|
| casual-heavy-d0.5-b0.1 | 1.133 | 16.304 | 15.0 | 11.0 | 0.933 |
| casual-heavy-d0.5-b0.2 | 1.161 | 18.925 | 15.0 | 11.0 | 0.933 |
| casual-heavy-d0.5-b0.35 | 1.205 | 23.299 | 15.0 | 11.0 | 0.926 |
| casual-heavy-d1-b0.1 | 1.247 | 16.439 | 15.0 | 11.0 | 0.951 |
| casual-heavy-d1-b0.2 | 1.290 | 18.833 | 15.0 | 11.0 | 0.936 |
| casual-heavy-d1-b0.35 | 1.350 | 23.043 | 15.0 | 11.0 | 0.935 |
| balanced-d0.5-b0.1 | 1.204 | 14.775 | 15.0 | 11.0 | 0.931 |
| balanced-d0.5-b0.2 | 1.223 | 17.226 | 15.0 | 11.0 | 0.929 |
| balanced-d0.5-b0.35 | 1.246 | 21.387 | 15.0 | 11.0 | 0.931 |
| balanced-d1-b0.1 | 1.301 | 15.415 | 15.0 | 11.0 | 0.945 |
| balanced-d1-b0.2 | 1.329 | 17.773 | 15.0 | 11.0 | 0.940 |
| balanced-d1-b0.35 | 1.376 | 21.793 | 15.0 | 11.0 | 0.942 |
| heavy-heavy-d0.5-b0.1 | 1.281 | 13.998 | 15.0 | 11.0 | 0.932 |
| heavy-heavy-d0.5-b0.2 | 1.281 | 16.242 | 15.0 | 11.0 | 0.927 |
| heavy-heavy-d0.5-b0.35 | 1.287 | 20.076 | 15.0 | 11.0 | 0.932 |
| heavy-heavy-d1-b0.1 | 1.357 | 14.609 | 15.0 | 11.0 | 0.942 |
| heavy-heavy-d1-b0.2 | 1.376 | 16.810 | 15.0 | 11.0 | 0.949 |
| heavy-heavy-d1-b0.35 | 1.403 | 21.015 | 15.0 | 11.0 | 0.945 |

## Limits and tuning work

- Observed player behaviour is not available. Desire, withdrawal, churn, Deed and market participation are explicit assumptions and need sensitivity testing.
- Native progression spends earned Bells only on invitations. Daily supplies can fill from idle rewards before daily gifts are claimed; baseline retains this production behavior.
- Star Thread surplus and bot reward efficiency fail the requested targets. Heavy Legendary timing also misses. E1 establishes measurements; it does not claim E3 acceptance.
- Raw cohort and token records are compressed and hashed in BASELINE.json. No public deployment or transaction was performed.
