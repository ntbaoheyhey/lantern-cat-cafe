# Fatal-choice32 — available actions before the survival cliff

All six previously selected current24 losing replays reproduce exactly. Exhaustive inspection of18party decisions and120legal actions in their first-fatal rounds finds:3/6examples can prevent the first death,4/6can win through a different action. These are overlapping but different groups; no population or new-policy benefit is claimed.

|Item / chapter / TRAIN seed|First death|Legal alternatives|Can survive that round|Can win with one change|
|---|---|---:|---|---|
|bellsteel-outfit-legendary / 2 / 1|mochi r6|20|yes|yes|
|crumbweave-weapon-legendary / 1 / 2|mochi r6|19|no|yes|
|emberfelt-weapon-epic / 1 / 8|mochi r6|19|no|yes|
|hearthloom-charm-legendary / 2 / 1|mochi r6|20|yes|no|
|moonwick-weapon-legendary / 3 / 1|mochi r10|22|no|no|
|velvetrim-weapon-legendary / 3 / 4|mochi r10|20|yes|yes|

Bellsteel outfit chapter2/seed1 is concrete: Mochi selects Door knock. Warm wall on itself, Defend, or a row swap with Clover instead survives and wins with unchanged future auto. Hearthloom charm chapter2/seed1 can survive through a row swap but still loses. Crumbweave/Emberfelt chapter1 can win through another choice despite Mochi still falling. The Moonwick chapter3 case has no rescue or win among that round's alternatives. Thus neither a universal AI mistake nor a universal boss-stat cure follows.

Every alternate full replay is deterministic; all selected-action arms match the original full battle hash; source snapshots and input immutability pass. Attempt1 stopped at initial saved-JSON parity because undefined optional fields are omitted by JSON; attempt2 compares normalized saved objects. Original script/method/log retained. No counterfactual was sampled in attempt1. No production, fixture, gate or acceptance change.

Code review shows auto scores the party action before queued enemy replies. The separately registered queued-reply33 tests that specific omission on all originalTRAIN fixtures and same-band earned inputs; it cannot choose from these known full future outcomes. [Raw alternatives and choices](results.json) · [Registration](REGISTERED-METHOD.md).
