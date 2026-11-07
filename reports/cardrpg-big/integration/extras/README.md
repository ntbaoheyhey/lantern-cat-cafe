# Experimental automatic-battle comparison
REFERENCE: ../../memory/PROMPT.md ADDENDUM LANES, comparison.json, ../../sim/gear-extras-*.json, ../../sim/economy-extras-*.json

The comparison uses source ff3010eb53b7621bd4528fabfc68b28af98f233f, recorded in source.txt. Each raw receipt carries rules source hashes. The reporter checks identical hashes, fixtures, paired seeds and exact option values before producing comparison.json. All four experimental options are toggled together. Default gameplay uses OFF. The user decides promotion.

## train gear outcomes
REFERENCE: comparison.json

| Level | Chapter | Tier | OFF wins | ON wins | New wins / losses |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | none | 4/50 | 4/50 | 0/0 |
| 1 | 1 | common | 38/50 | 38/50 | 0/0 |
| 1 | 1 | rare | 45/50 | 45/50 | 0/0 |
| 1 | 1 | epic | 47/50 | 47/50 | 0/0 |
| 1 | 1 | legendary | 50/50 | 50/50 | 0/0 |
| 1 | 2 | none | 2/50 | 2/50 | 0/0 |
| 1 | 2 | common | 17/50 | 17/50 | 0/0 |
| 1 | 2 | rare | 32/50 | 32/50 | 0/0 |
| 1 | 2 | epic | 36/50 | 36/50 | 0/0 |
| 1 | 2 | legendary | 50/50 | 50/50 | 0/0 |
| 1 | 3 | none | 1/50 | 1/50 | 0/0 |
| 1 | 3 | common | 10/50 | 10/50 | 0/0 |
| 1 | 3 | rare | 15/50 | 15/50 | 0/0 |
| 1 | 3 | epic | 37/50 | 37/50 | 0/0 |
| 1 | 3 | legendary | 50/50 | 50/50 | 0/0 |
| 6 | 1 | none | 50/50 | 50/50 | 0/0 |
| 6 | 1 | common | 50/50 | 50/50 | 0/0 |
| 6 | 1 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 1 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 1 | legendary | 50/50 | 50/50 | 0/0 |
| 6 | 2 | none | 29/50 | 32/50 | 9/6 |
| 6 | 2 | common | 50/50 | 50/50 | 0/0 |
| 6 | 2 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 2 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 2 | legendary | 50/50 | 50/50 | 0/0 |
| 6 | 3 | none | 50/50 | 48/50 | 0/2 |
| 6 | 3 | common | 50/50 | 50/50 | 0/0 |
| 6 | 3 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 3 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 3 | legendary | 50/50 | 50/50 | 0/0 |

13/24 positive tier steps OFF, 14/24 ON. 0 steps lose a positive gain or acquire a reversal.
OFF/native full-array parity PASS.
Largest ON single-piece boss gain 26.00 percentage points. Maximum displayed share 9.6306%.

## heldout gear outcomes
REFERENCE: comparison.json

| Level | Chapter | Tier | OFF wins | ON wins | New wins / losses |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | none | 0/50 | 0/50 | 0/0 |
| 1 | 1 | common | 33/50 | 33/50 | 0/0 |
| 1 | 1 | rare | 40/50 | 40/50 | 0/0 |
| 1 | 1 | epic | 48/50 | 48/50 | 0/0 |
| 1 | 1 | legendary | 50/50 | 50/50 | 0/0 |
| 1 | 2 | none | 0/50 | 0/50 | 0/0 |
| 1 | 2 | common | 16/50 | 16/50 | 0/0 |
| 1 | 2 | rare | 29/50 | 29/50 | 0/0 |
| 1 | 2 | epic | 41/50 | 41/50 | 0/0 |
| 1 | 2 | legendary | 50/50 | 50/50 | 0/0 |
| 1 | 3 | none | 0/50 | 0/50 | 0/0 |
| 1 | 3 | common | 4/50 | 4/50 | 0/0 |
| 1 | 3 | rare | 11/50 | 11/50 | 0/0 |
| 1 | 3 | epic | 33/50 | 33/50 | 0/0 |
| 1 | 3 | legendary | 49/50 | 49/50 | 0/0 |
| 6 | 1 | none | 50/50 | 50/50 | 0/0 |
| 6 | 1 | common | 50/50 | 50/50 | 0/0 |
| 6 | 1 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 1 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 1 | legendary | 50/50 | 50/50 | 0/0 |
| 6 | 2 | none | 29/50 | 36/50 | 11/4 |
| 6 | 2 | common | 50/50 | 50/50 | 0/0 |
| 6 | 2 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 2 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 2 | legendary | 50/50 | 50/50 | 0/0 |
| 6 | 3 | none | 50/50 | 50/50 | 0/0 |
| 6 | 3 | common | 50/50 | 50/50 | 0/0 |
| 6 | 3 | rare | 50/50 | 50/50 | 0/0 |
| 6 | 3 | epic | 50/50 | 50/50 | 0/0 |
| 6 | 3 | legendary | 50/50 | 50/50 | 0/0 |

13/24 positive tier steps OFF, 13/24 ON. 0 steps lose a positive gain or acquire a reversal.
OFF/native full-array parity PASS.
Largest ON single-piece boss gain 24.00 percentage points. Maximum displayed share 9.6306%.

## Earned economy
REFERENCE: comparison.json

| Earned measure | OFF heavy/casual | ON heavy/casual | ON ≤3× |
| --- | --- | --- | --- |
| pulls | 1.000000× | 1.000000× | PASS |
| fish | 1.808266× | 1.806883× | PASS |
| threads | 1.917789× | 1.916335× | PASS |
| stamps | 1.000000× | 1.000000× | PASS |
| essence | 2.194776× | 2.189802× | PASS |

Economy OFF/native parity PASS.

All four options are toggled together. Any lost tier gain belongs to that combination. Identifying an individual cause requires an additional isolated-option run.
