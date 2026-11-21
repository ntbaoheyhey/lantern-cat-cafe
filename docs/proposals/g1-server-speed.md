# G1 server speed proposals — owner decisions only

None of these changes is applied. Authentication/CORS code, functions, RPCs, schemas,
config numbers, live database and deployment are untouched by G1.

Timing context: the supplied 27 October audit against origin/main `3b82d52` reported
140–1,130ms for a v2 request that only rejected a token (about 800ms median), and
about 860ms for a repeated preflight. These are **owner-supplied measurements from
another machine**, not fresh authenticated measurements from this checkout. G1's
local demo/CDP metrics are in [reports/g1-speed/metrics.json](https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/d89b61ab3ddd73659f45158d1abe5835b9445b81/reports/g1-speed/metrics.json); they do not measure
Edge Function or database latency. Estimates below distinguish request overhead
from unmeasured DB work and are not additive guarantees.

## A. Cache preflight permission

Propose `Access-Control-Max-Age: 7200` on the existing v2 CORS preflight response in
`supabase/functions/_shared/auth.ts`, subject to owner approval and a function deploy.
Retain the current allow-origin/method/header validation and origin-specific cache
semantics; verify authorization, apikey and content-type preflights in Chrome.
Browsers may clamp the requested lifetime, and cache keys include origin, URL,
method and headers. A different endpoint may still need its own preflight.

Expected saving per cache hit: **about 860ms using the supplied audit sample**;
zero on the initial request/cache miss. The present default is roughly five seconds,
so interactions spaced beyond that interval can currently pay the preflight again.
No auth/CORS source edit or deploy was made.

## B. Ordered `v2-equip-many`

Propose a v2 endpoint accepting at most ten `{ itemId, slot }` pairs. Authenticate
once, validate the body and ownership through the existing rules, load the initial
snapshot once, call the existing `v2_equip` RPC sequentially for each pair, then load
once and return one authoritative state. No schema change is needed for this
initial endpoint. Preserve class/weapon/slot constraints for every pair; never
parallelize equips against the same player. The nine-slot current UI fits under
the proposed ten-entry bound.

Owner must choose partial-failure semantics: sequential independent RPCs are **not
one transaction**. Recommended response on a refusal includes the confirmed final
snapshot and the applied/refused entries, so the client never pretends that earlier
successes rolled back. Do not claim atomicity without a separate approved RPC design.
Define behavior if a concurrent choose-class changes the assumptions mid-batch.

Current N equips require N client round trips and 3N DB calls (load/equip/load).
The proposal requires one client round trip and N+2 DB calls. For two upgrades that
is 2 → 1 round trips and 6 → 4 DB calls. Estimated client-overhead saving:
**140–1,130ms (about 800ms at the supplied median)**, plus two removed snapshot
calls. Ten equips save nine client round trips: **1,260–10,170ms**, about **7,200ms**
at the supplied median, plus eighteen snapshot calls. These ranges extrapolate a
rejection path; real authenticated equip measurements are required before approval.
For a transparent DB assumption of 20–100ms per snapshot, two removed snapshots
would save another **40–200ms**; this is an illustrative estimate, not measured DB
latency, and may overlap the end-to-end timing above.

The client-only G1 queue already prevents a second Equip best click from multiplying
requests, but distinct upgrades still make one request each until this proposal ships.

## C. Return the mutation RPC's row

`equipV2` currently calls load → equip RPC → load. `chooseClassV2` calls load →
chooseClass RPC → load. The current V2Store return contracts for both mutations
contain status/error, **not** a complete public snapshot. Returning the RPC's own
row is therefore not a safe handler-only edit today: a status row lacks stacks,
items, boss clears, forge status and the view's other dependencies.

Propose measuring both snapshots and the RPC separately first. An approved RPC
contract that returns the complete post-mutation snapshot could reduce three DB
round trips to two, with the client HTTP round trip unchanged. Illustrative saving
per action: **20–100ms for one eliminated snapshot** under the explicit DB assumption
above; no measured authenticated saving is claimed. If providing that snapshot
requires an RPC/schema migration, it needs a separate owner-approved proposal.
Do not return pre-mutation `before` state or fabricate unchanged inventory fields.

## D-G1. Hidden-tab cadence changes the economy

Keep the current policy until the owner decides: rendering pauses while hidden,
no hidden claim timer runs, and visibility return requests one claim. The first
`CONFIG.idle.onlineWindowSeconds` (currently 300s) in each elapsed claim window count
in full, the remainder at `CONFIG.idle.offlineEfficiency` (currently 0.5), up to
`CONFIG.idle.offlineCapSeconds` (currently 28,800s). Visibility itself is not an input
to the earnings curve. No values are changed.

For elapsed T seconds (within the cap), the rate-weighted time is
`min(T, W) + max(0, T - W) * E`. A hidden cadence at 30 seconds resets the full-rate
window each time, so it can pay full rate throughout rather than half after five
minutes. Under constant power, no gate/cap/rounding and identical kill timing:

| Away | One return claim: weighted seconds | 30s hidden claims | Relative change |
| --- | ---: | ---: | ---: |
| 10 min | 450 | 600 | +33.3% |
| 1 h | 1,950 | 3,600 | +84.6% |
| 8 h | 14,550 | 28,800 | +97.9% |

After eight hours, repeated hidden claims would also avoid the single-claim cap.
Real XP, loot, gating, bag salvage, keys and RNG are nonlinear, so these are time
weighting examples, not promised reward counts. Timers in hidden tabs are also
throttled by browsers and are not reliable background execution.

At a 30s cadence, one hour hidden makes up to 120 requests instead of one. Each may
have the supplied **140–1,130ms** request overhead (about **16.8–135.6 seconds** summed
request time per hour, not foreground blocking time); a return claim itself is not
made faster by changing the economy. Owner options are to preserve current gains,
explicitly approve a higher hidden-tab rate, or design a visibility-independent
server economy. G1 implements none of those changes.
