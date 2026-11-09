# Contextual forecast: separate TRAIN combat seeds

This post-hoc analysis reconstructs the original 384 cases without running new battles. It first reproduces every chapter correlation from diagnostic40. For each case, it then compares the existing forecasts on combat seeds1–20 with the actual paired outcomes on seeds21–50, using the same30 gear rolls. No case or negative pair is dropped.

|Chapter|Original overlapping Spearman|Separate combat-seed Spearman|Mean absolute error pp|Opposite signs|
|---|---:|---:|---:|---:|
|1|0.738|0.439|7.61|19|
|2|0.754|0.620|4.15|17|
|3|0.729|0.688|3.22|7|

|Chapter|Forecast band|Won / entries|Observed frequency|
|---|---|---:|---:|
|1|Risky|1928/6720|28.7%|
|1|Even|557/896|62.2%|
|1|Favoured|54/64|84.4%|
|2|Risky|99/858|11.5%|
|2|Even|2598/4548|57.1%|
|2|Favoured|1860/2274|81.8%|
|3|Even|288/399|72.2%|
|3|Favoured|6998/7281|96.1%|

The band counts pool dependent build/seed entries and are not player probabilities. The split was chosen after the original analysis; all samples remain previously inspected TRAIN data. It supplies no fresh acceptance evidence and does not close the static utility display gate. Fresh20001–20500 remains unused. Source, fixture, score and UI are unchanged.

[Full cases, limitations and input hashes](audit.json) · [Original overlapping analysis](../display-context-40/RESULTS.md).
