# S8 — cadence, startup and static display

One prospective V5 Home run completed 60.04 active minutes; [registration](s8/home/REGISTERED-METHOD.md) binds its fixed public-click policy and artifact. The justification was the already implemented V5 combat change. No second hour, runtime tuning, or acceptance sampling occurred in this phase.

|Gate|Earlier evidence|This observation|Status|
|---|---|---|---|
|30min reward gap ≤300s|Home03 723s|929.86s|MISS|
|Combat dead-time reduction ≥40%|Home03 2.0%|-10.44% against H0|MISS|
|≥5 meaningful offers at30min|Home03 73|80|PASS|
|No player-visible developer controls|C1 functional pass|0 controls / 0 seed labels|PASS|
|First fight won ≤25s|A5 13.067–13.139s|14.34s, party|PASS|
|Earned day7 boss wins in45–90s|A5 paired fixture64.921s|130.13s party|MISS|
|Native cast max≤16.8ms|B fixture-only16.8ms, separate renderer|16.80ms|PASS|
|Peak draws≤130|B fixture-only126|234|MISS|
|Offline CPU4 opening max≤120ms|A4 166.6ms|183.30ms|MISS|
|Offline≤24MB; V5 adds≤1.5MB|A5 20,929,841bytes|20,961,816bytes; +31,975|PASS|
|Static display Spearman≥.6/chapter|Before .442/.228/.139|0.43/0.37/0.15 on selected full TRAIN; 320 earlier fits rejected|MISS|

Default app startup uses current main 340f88b92405ceb6b5421b207307fdbb283b2ca3, with three observations in each of three configurations. No outlier is dropped. Task CPU is CDP TaskDuration across the registered opening, not RAF frame duration.

|Config|Loaded JS delta|Main task median/max ms|Candidate median/max ms|Bytes / median / max|
|---|---:|---:|---:|---|
|1280/CPU1|149485|309.29/311.40|301.29/318.32|PASS / PASS / MISS|
|1280/CPU4|149485|1051.76/1234.36|1090.32/1090.85|PASS / MISS / PASS|
|1440/CPU1|149485|303.12/305.74|303.65/306.99|PASS / MISS / MISS|

All nine observations per build retain their raw requested chunks, module hashes and CPU samples in [startup](s8/startup/summary.json). No Three/model modules loaded on the default path. These small samples do not prove statistical equivalence or a causal improvement.

[Elapsed engagement](S8-ENGAGEMENT.md) · [all observation gates](s8/observations.json) · [earned day7](s8/day7/checks.json) · [phase source closure](s8/audit.json). Numeric misses remain separate from source/receipt integrity. Human recognition and enjoyment are NOT VERIFIED.

Artifact SHA256: 4e310b07f9dfb005abdff830d498e8d0f6615553e1710a2ce12eeedad3a3638e. The inherited A renderer is measured as shipped; B V3 presentation remains a separate draft. Main A4 demo remains unchanged.

## Retained natural fixture durations

Every registered fixture is shown below, including losses and CPU4. These are measured wall times from Fight to Result, not estimates from rounds. The earned day7 gate above remains distinct. The original general boss pacing target45–90s is also compared against every sampled boss, without replacing the registered fixtures or self-score method.

|Fixture|CPU|Enemies|Seconds|Result|
|---|---:|---|---:|---|
|opening-cpu4|4|practice-cushion|16.77|party|
|crumb-burst-native|1|button-guard, spool-ram, teacup-healer|174.17|party|
|wildfire-native|1|button-guard, sock-skipper, teacup-healer|74.36|party|
|rupture-native|1|button-guard, kettle-knight, sock-skipper|79.60|party|
|spread-native|1|button-guard, teacup-healer, needle-moth|70.75|party|
|boss-native|1|yarn-giant|280.04|party|

Fixed boss observations: boss-native 280.04s MISS. Home boss observations: 17, 16 within45–90s; all results and times remain in [observations](s8/observations.json). These small fixed samples do not establish every earned account or device.
